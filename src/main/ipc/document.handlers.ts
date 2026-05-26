import { ipcMain, dialog, app } from 'electron'
import path from 'path'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import {
  insertDocument,
  getDocument,
  listDocuments,
  updateDocumentLastOpened,
  updateDocumentTitle,
  deleteDocument
} from '../db/document.repo'
import { listAttachments as listAttachmentsRepo } from '../db/attachment.repo'
import { getAllNotesForDocument } from '../db/note.repo'
import { convertPptxToPdf, copyPdfToStorage, LibreOfficeNotFoundError } from '../services/conversion.service'
import { deleteFile } from '../services/file.service'
import { probeLibreOffice } from '../services/libreoffice.probe'
import type { BNDocument, ImportFileResult } from '../../shared/types'

// Dynamically import pdfjs-dist (ESM) to get page count
async function getPdfPageCount(pdfPath: string): Promise<number> {
  try {
    // Use pdf-lib for page count — simpler in CommonJS context
    const { PDFDocument } = await import('pdf-lib')
    const bytes = fs.readFileSync(pdfPath)
    const doc = await PDFDocument.load(bytes)
    return doc.getPageCount()
  } catch {
    return 0
  }
}

export function registerDocumentHandlers(): void {
  ipcMain.handle('blanknotes:document:open-dialog', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Open Study Document',
      filters: [
        { name: 'Study Documents', extensions: ['pdf', 'pptx'] },
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'PowerPoint Files', extensions: ['pptx'] }
      ],
      properties: ['openFile']
    })
    return { filePath: result.filePaths[0] ?? null }
  })

  ipcMain.handle('blanknotes:document:import', async (_, filePath: string) => {
    const ext = path.extname(filePath).toLowerCase()
    const uuid = uuidv4()
    const now = new Date().toISOString()
    const title = path.basename(filePath, ext)

    let storedPdfPath: string
    let conversionWarning: string | undefined

    if (ext === '.pptx') {
      try {
        storedPdfPath = await convertPptxToPdf(filePath, uuid)
      } catch (err) {
        if (err instanceof LibreOfficeNotFoundError) {
          throw new Error('LIBRE_OFFICE_NOT_FOUND')
        }
        throw err
      }
    } else {
      storedPdfPath = await copyPdfToStorage(filePath, uuid)
    }

    const pageCount = await getPdfPageCount(storedPdfPath)

    const doc: BNDocument = {
      id: uuid,
      title,
      originalPath: filePath,
      storedPdfPath,
      originalFormat: ext === '.pptx' ? 'pptx' : 'pdf',
      pageCount,
      lastOpenedAt: now,
      createdAt: now,
      updatedAt: now
    }

    insertDocument(doc)

    // Update settings to track last opened
    try {
      const { dbRun } = await import('../db/index')
      dbRun('UPDATE app_settings SET last_opened_document_id = ? WHERE id = 1', [uuid])
    } catch { /* non-fatal */ }

    const result: ImportFileResult = { document: doc }
    if (conversionWarning) result.conversionWarning = conversionWarning
    return result
  })

  ipcMain.handle('blanknotes:document:list', async () => {
    const docs = listDocuments()
    return docs.map((doc) => ({
      ...doc,
      fileMissing: !fs.existsSync(doc.storedPdfPath)
    }))
  })

  ipcMain.handle('blanknotes:document:get', async (_, id: string) => {
    const doc = getDocument(id)
    if (!doc) return null
    if (!fs.existsSync(doc.storedPdfPath)) return null
    updateDocumentLastOpened(id)
    return doc
  })

  ipcMain.handle('blanknotes:document:delete', async (_, id: string) => {
    const doc = getDocument(id)
    if (!doc) return { success: false }

    // Delete all attachments for this document
    const notes = getAllNotesForDocument(id)
    for (const note of notes) {
      const attachments = listAttachmentsRepo(note.id)
      for (const att of attachments) {
        deleteFile(att.storedPath)
      }
    }

    // Delete the stored PDF
    deleteFile(doc.storedPdfPath)

    deleteDocument(id)
    return { success: true }
  })

  ipcMain.handle('blanknotes:document:update-title', async (_, id: string, title: string) => {
    return updateDocumentTitle(id, title)
  })

  ipcMain.handle('blanknotes:system:probe-libreoffice', async () => {
    return await probeLibreOffice()
  })

  ipcMain.handle('blanknotes:system:get-app-version', async () => {
    return { version: app.getVersion() }
  })
}
