import { dbGet, dbAll, dbRun } from './index'
import type { BNDocument } from '../../shared/types'

function rowToDocument(row: Record<string, unknown>): BNDocument {
  return {
    id: row.id as string,
    title: row.title as string,
    originalPath: row.original_path as string,
    storedPdfPath: row.stored_pdf_path as string,
    originalFormat: row.original_format as 'pdf' | 'pptx',
    pageCount: row.page_count as number,
    lastOpenedAt: row.last_opened_at as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export function insertDocument(doc: BNDocument): BNDocument {
  dbRun(
    `INSERT INTO documents (id, title, original_path, stored_pdf_path, original_format,
      page_count, last_opened_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [doc.id, doc.title, doc.originalPath, doc.storedPdfPath, doc.originalFormat,
     doc.pageCount, doc.lastOpenedAt, doc.createdAt, doc.updatedAt]
  )
  return doc
}

export function getDocument(id: string): BNDocument | null {
  const row = dbGet('SELECT * FROM documents WHERE id = ?', [id])
  return row ? rowToDocument(row) : null
}

export function listDocuments(): BNDocument[] {
  const rows = dbAll('SELECT * FROM documents ORDER BY last_opened_at DESC')
  return rows.map(rowToDocument)
}

export function updateDocumentLastOpened(id: string): void {
  const now = new Date().toISOString()
  dbRun('UPDATE documents SET last_opened_at = ?, updated_at = ? WHERE id = ?', [now, now, id])
}

export function updateDocumentTitle(id: string, title: string): BNDocument | null {
  const now = new Date().toISOString()
  dbRun('UPDATE documents SET title = ?, updated_at = ? WHERE id = ?', [title, now, id])
  return getDocument(id)
}

export function deleteDocument(id: string): void {
  dbRun('DELETE FROM documents WHERE id = ?', [id])
}
