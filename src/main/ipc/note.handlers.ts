import { ipcMain } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { getNote, upsertNote, getAllNotesForDocument } from '../db/note.repo'

export function registerNoteHandlers(): void {
  ipcMain.handle(
    'blanknotes:note:get',
    async (_, documentId: string, pageNumber: number) => {
      return getNote(documentId, pageNumber)
    }
  )

  ipcMain.handle(
    'blanknotes:note:upsert',
    async (_, documentId: string, pageNumber: number, contentJson: string) => {
      const existing = getNote(documentId, pageNumber)
      const id = existing?.id ?? uuidv4()
      return upsertNote(id, documentId, pageNumber, contentJson)
    }
  )

  ipcMain.handle('blanknotes:note:get-all-for-document', async (_, documentId: string) => {
    return getAllNotesForDocument(documentId)
  })
}
