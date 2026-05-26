import { ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { insertAttachment, listAttachments, getAttachment, deleteAttachment } from '../db/attachment.repo'
import { copyFileToAttachments, deleteFile, getMimeType, getAttachmentsDir } from '../services/file.service'
import type { ImageAttachment } from '../../shared/types'

function extFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg'
  }
  return map[mimeType.toLowerCase()] || '.png'
}

export function registerAttachmentHandlers(): void {
  ipcMain.handle(
    'blanknotes:attachment:add',
    async (
      _,
      noteId: string,
      documentId: string,
      pageNumber: number,
      sourcePath: string
    ) => {
      const id = uuidv4()
      const ext = path.extname(sourcePath)
      const destName = `${id}${ext}`
      const storedPath = copyFileToAttachments(sourcePath, destName)
      const stats = fs.statSync(storedPath)
      const mimeType = getMimeType(sourcePath)
      const fileName = path.basename(sourcePath)

      const attachment: ImageAttachment = {
        id,
        noteId,
        documentId,
        pageNumber,
        fileName,
        storedPath,
        mimeType,
        fileSizeBytes: stats.size,
        createdAt: new Date().toISOString()
      }

      return insertAttachment(attachment)
    }
  )

  ipcMain.handle(
    'blanknotes:attachment:add-bytes',
    async (
      _,
      noteId: string,
      documentId: string,
      pageNumber: number,
      bytes: Uint8Array,
      fileName: string,
      mimeType: string
    ) => {
      const id = uuidv4()
      const ext = path.extname(fileName) || extFromMime(mimeType)
      const destName = `${id}${ext}`
      const dir = getAttachmentsDir()
      const storedPath = path.join(dir, destName)
      fs.writeFileSync(storedPath, Buffer.from(bytes))
      const stats = fs.statSync(storedPath)

      const attachment: ImageAttachment = {
        id,
        noteId,
        documentId,
        pageNumber,
        fileName: fileName || `image${ext}`,
        storedPath,
        mimeType: mimeType || 'image/png',
        fileSizeBytes: stats.size,
        createdAt: new Date().toISOString()
      }

      return insertAttachment(attachment)
    }
  )

  ipcMain.handle(
    'blanknotes:attachment:choose-and-save',
    async (_, noteId: string, documentId: string, pageNumber: number) => {
      const result = await dialog.showOpenDialog({
        title: 'Insert Image',
        filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] }],
        properties: ['openFile', 'multiSelections']
      })
      if (result.canceled || result.filePaths.length === 0) return []

      const attachments: ImageAttachment[] = []
      for (const filePath of result.filePaths) {
        const id = uuidv4()
        const ext = path.extname(filePath)
        const destName = `${id}${ext}`
        const storedPath = copyFileToAttachments(filePath, destName)
        const stats = fs.statSync(storedPath)

        const attachment: ImageAttachment = {
          id,
          noteId,
          documentId,
          pageNumber,
          fileName: path.basename(filePath),
          storedPath,
          mimeType: getMimeType(filePath),
          fileSizeBytes: stats.size,
          createdAt: new Date().toISOString()
        }
        attachments.push(insertAttachment(attachment))
      }
      return attachments
    }
  )

  ipcMain.handle('blanknotes:attachment:list', async (_, noteId: string) => {
    return listAttachments(noteId)
  })

  ipcMain.handle('blanknotes:attachment:delete', async (_, id: string) => {
    const att = getAttachment(id)
    if (att) {
      deleteFile(att.storedPath)
      deleteAttachment(id)
    }
    return { success: true }
  })
}
