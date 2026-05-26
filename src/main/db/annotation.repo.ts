import { dbGet, dbAll, dbRun } from './index'
import type { Annotation } from '../../shared/types'

function rowToAnnotation(row: Record<string, unknown>): Annotation {
  return {
    id: row.id as string,
    documentId: row.document_id as string,
    pageNumber: row.page_number as number,
    type: row.type as 'highlight' | 'text-note',
    fabricJson: row.fabric_json as string,
    normX: row.norm_x as number,
    normY: row.norm_y as number,
    normWidth: row.norm_width as number,
    normHeight: row.norm_height as number,
    color: row.color as string,
    text: row.text as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  }
}

export function listAnnotations(documentId: string, pageNumber: number): Annotation[] {
  const rows = dbAll(
    'SELECT * FROM annotations WHERE document_id = ? AND page_number = ?',
    [documentId, pageNumber]
  )
  return rows.map(rowToAnnotation)
}

export function listAllAnnotationsForDocument(documentId: string): Annotation[] {
  const rows = dbAll(
    'SELECT * FROM annotations WHERE document_id = ? ORDER BY page_number',
    [documentId]
  )
  return rows.map(rowToAnnotation)
}

export function upsertAnnotation(ann: Omit<Annotation, 'createdAt' | 'updatedAt'>): Annotation {
  const now = new Date().toISOString()
  const existing = dbGet('SELECT id FROM annotations WHERE id = ?', [ann.id])

  if (existing) {
    dbRun(
      `UPDATE annotations SET fabric_json=?, norm_x=?, norm_y=?, norm_width=?, norm_height=?,
       color=?, text=?, updated_at=? WHERE id=?`,
      [ann.fabricJson, ann.normX, ann.normY, ann.normWidth, ann.normHeight,
       ann.color, ann.text, now, ann.id]
    )
  } else {
    dbRun(
      `INSERT INTO annotations (id, document_id, page_number, type, fabric_json,
       norm_x, norm_y, norm_width, norm_height, color, text, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ann.id, ann.documentId, ann.pageNumber, ann.type, ann.fabricJson,
       ann.normX, ann.normY, ann.normWidth, ann.normHeight, ann.color, ann.text, now, now]
    )
  }

  const row = dbGet('SELECT * FROM annotations WHERE id = ?', [ann.id])!
  return rowToAnnotation(row)
}

export function deleteAnnotation(id: string): void {
  dbRun('DELETE FROM annotations WHERE id = ?', [id])
}
