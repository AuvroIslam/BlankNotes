import { dbGet, dbAll, dbRun } from './index'
import type { ImageAttachment } from '../../shared/types'

function rowToAttachment(row: Record<string, unknown>): ImageAttachment {
  return {
    id: row.id as string,
    noteId: row.note_id as string,
    documentId: row.document_id as string,
    pageNumber: row.page_number as number,
    fileName: row.file_name as string,
    storedPath: row.stored_path as string,
    mimeType: row.mime_type as string,
    fileSizeBytes: row.file_size_bytes as number,
    createdAt: row.created_at as string
  }
}

export function insertAttachment(att: ImageAttachment): ImageAttachment {
  dbRun(
    `INSERT INTO image_attachments (id, note_id, document_id, page_number,
     file_name, stored_path, mime_type, file_size_bytes, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [att.id, att.noteId, att.documentId, att.pageNumber,
     att.fileName, att.storedPath, att.mimeType, att.fileSizeBytes, att.createdAt]
  )
  return att
}

export function listAttachments(noteId: string): ImageAttachment[] {
  const rows = dbAll(
    'SELECT * FROM image_attachments WHERE note_id = ? ORDER BY created_at',
    [noteId]
  )
  return rows.map(rowToAttachment)
}

export function getAttachment(id: string): ImageAttachment | null {
  const row = dbGet('SELECT * FROM image_attachments WHERE id = ?', [id])
  return row ? rowToAttachment(row) : null
}

export function deleteAttachment(id: string): void {
  dbRun('DELETE FROM image_attachments WHERE id = ?', [id])
}
