import { app } from 'electron'
import fs from 'fs'
import path from 'path'
import type { Database } from 'sql.js'

let _db: Database | null = null
let _dbPath: string = ''

// Helper: run a SELECT and return first row as an object, or null
export function dbGet(sql: string, params: unknown[] = []): Record<string, unknown> | null {
  const db = getDb()
  const stmt = db.prepare(sql)
  stmt.bind(params as (string | number | null | Uint8Array)[])
  if (stmt.step()) {
    const result = stmt.getAsObject() as Record<string, unknown>
    stmt.free()
    return result
  }
  stmt.free()
  return null
}

// Helper: run a SELECT and return all rows as objects
export function dbAll(sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const db = getDb()
  const stmt = db.prepare(sql)
  if (params.length) stmt.bind(params as (string | number | null | Uint8Array)[])
  const results: Record<string, unknown>[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject() as Record<string, unknown>)
  }
  stmt.free()
  return results
}

// Helper: run an INSERT/UPDATE/DELETE
export function dbRun(sql: string, params: unknown[] = []): void {
  const db = getDb()
  db.run(sql, params as (string | number | null | Uint8Array)[])
  saveDb()
}

// Helper: run raw SQL (for migrations with multiple statements)
export function dbExec(sql: string): void {
  const db = getDb()
  db.run(sql)
  saveDb()
}

export function getDb(): Database {
  if (!_db) throw new Error('Database not initialized. Call initDb() first.')
  return _db
}

export function saveDb(): void {
  if (!_db || !_dbPath) return
  const data = _db.export()
  fs.writeFileSync(_dbPath, Buffer.from(data))
}

export async function initDb(): Promise<void> {
  const initSqlJs = require('sql.js')

  // Point sql.js to its own WASM file using require.resolve
  const sqlJsDir = path.dirname(require.resolve('sql.js'))
  const SQL = await initSqlJs({
    locateFile: (file: string) => path.join(sqlJsDir, file)
  })

  _dbPath = path.join(app.getPath('userData'), 'blanknotes.db')

  if (fs.existsSync(_dbPath)) {
    const fileBuffer = fs.readFileSync(_dbPath)
    _db = new SQL.Database(fileBuffer)
  } else {
    _db = new SQL.Database()
  }

  const { runMigrations } = await import('./migrations')
  runMigrations()
}

export function closeDb(): void {
  if (_db) {
    saveDb()
    _db.close()
    _db = null
  }
}
