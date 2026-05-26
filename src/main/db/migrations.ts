import { getDb, saveDb } from './index'

export function runMigrations(): void {
  const db = getDb()

  const tables = [
    `CREATE TABLE IF NOT EXISTS documents (
      id              TEXT PRIMARY KEY,
      title           TEXT NOT NULL,
      original_path   TEXT NOT NULL,
      stored_pdf_path TEXT NOT NULL,
      original_format TEXT NOT NULL,
      page_count      INTEGER NOT NULL DEFAULT 0,
      last_opened_at  TEXT NOT NULL,
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS page_notes (
      id           TEXT PRIMARY KEY,
      document_id  TEXT NOT NULL,
      page_number  INTEGER NOT NULL,
      content_json TEXT NOT NULL DEFAULT '{}',
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      UNIQUE(document_id, page_number)
    )`,
    `CREATE TABLE IF NOT EXISTS annotations (
      id           TEXT PRIMARY KEY,
      document_id  TEXT NOT NULL,
      page_number  INTEGER NOT NULL,
      type         TEXT NOT NULL,
      fabric_json  TEXT NOT NULL,
      norm_x       REAL NOT NULL,
      norm_y       REAL NOT NULL,
      norm_width   REAL NOT NULL,
      norm_height  REAL NOT NULL,
      color        TEXT NOT NULL,
      text         TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS image_attachments (
      id              TEXT PRIMARY KEY,
      note_id         TEXT NOT NULL,
      document_id     TEXT NOT NULL,
      page_number     INTEGER NOT NULL,
      file_name       TEXT NOT NULL,
      stored_path     TEXT NOT NULL,
      mime_type       TEXT NOT NULL,
      file_size_bytes INTEGER NOT NULL,
      created_at      TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS app_settings (
      id                      INTEGER PRIMARY KEY,
      theme                   TEXT NOT NULL DEFAULT 'light',
      default_font            TEXT NOT NULL DEFAULT 'inter',
      split_ratio             REAL NOT NULL DEFAULT 0.5,
      last_opened_document_id TEXT,
      libre_office_path       TEXT
    )`,
    `INSERT OR IGNORE INTO app_settings (id) VALUES (1)`,
    `CREATE INDEX IF NOT EXISTS idx_notes_doc ON page_notes(document_id, page_number)`,
    `CREATE INDEX IF NOT EXISTS idx_annotations_doc ON annotations(document_id, page_number)`,
    `CREATE INDEX IF NOT EXISTS idx_attachments_note ON image_attachments(note_id)`
  ]

  for (const sql of tables) {
    db.run(sql)
  }

  saveDb()
}
