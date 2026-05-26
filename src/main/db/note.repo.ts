import { dbGet, dbAll, dbRun } from './index'
import type { PageNote } from '../../shared/types'

function rowToNote(row: Record<string, unknown>): PageNote {
  return {
    id: row.id as string,
    documentId: row.document_id as string,
    pageNumber: row.page_number as number,
    contentJson: row.content_json as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export function getNote(documentId: string, pageNumber: number): PageNote | null {
  const row = dbGet(
    'SELECT * FROM page_notes WHERE document_id = ? AND page_number = ?',
    [documentId, pageNumber]
  )
  return row ? rowToNote(row) : null
}

export function upsertNote(
  id: string,
  documentId: string,
  pageNumber: number,
  contentJson: string
): PageNote {
  const now = new Date().toISOString()
  // sql.js doesn't support ON CONFLICT DO UPDATE with all databases, use INSERT OR REPLACE
  const existing = getNote(documentId, pageNumber)
  if (existing) {
    dbRun(
      'UPDATE page_notes SET content_json = ?, updated_at = ? WHERE document_id = ? AND page_number = ?',
      [contentJson, now, documentId, pageNumber]
    )
  } else {
    dbRun(
      'INSERT INTO page_notes (id, document_id, page_number, content_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, documentId, pageNumber, contentJson, now, now]
    )
  }
  return getNote(documentId, pageNumber)!
}

export function getAllNotesForDocument(documentId: string): PageNote[] {
  const rows = dbAll(
    'SELECT * FROM page_notes WHERE document_id = ? ORDER BY page_number',
    [documentId]
  )
  return rows.map(rowToNote)
}
