import { ipcMain } from 'electron'
import { dbGet, dbRun } from '../db/index'
import type { AppSettings } from '../../shared/types'

function rowToSettings(row: Record<string, unknown>): AppSettings {
  return {
    id: 1,
    theme: row.theme as 'light' | 'dark',
    defaultFont: row.default_font as AppSettings['defaultFont'],
    splitRatio: row.split_ratio as number,
    lastOpenedDocumentId: row.last_opened_document_id as string | null,
    libreOfficePath: row.libre_office_path as string | null
  }
}

export function registerSettingsHandlers(): void {
  ipcMain.handle('blanknotes:settings:get', async () => {
    const row = dbGet('SELECT * FROM app_settings WHERE id = 1')
    if (!row) return null
    return rowToSettings(row)
  })

  ipcMain.handle('blanknotes:settings:update', async (_, updates: Partial<Omit<AppSettings, 'id'>>) => {
    const fields: string[] = []
    const values: unknown[] = []

    if (updates.theme !== undefined) { fields.push('theme = ?'); values.push(updates.theme) }
    if (updates.defaultFont !== undefined) { fields.push('default_font = ?'); values.push(updates.defaultFont) }
    if (updates.splitRatio !== undefined) { fields.push('split_ratio = ?'); values.push(updates.splitRatio) }
    if (updates.lastOpenedDocumentId !== undefined) {
      fields.push('last_opened_document_id = ?')
      values.push(updates.lastOpenedDocumentId)
    }
    if (updates.libreOfficePath !== undefined) { fields.push('libre_office_path = ?'); values.push(updates.libreOfficePath) }

    if (fields.length > 0) {
      values.push(1)
      dbRun(`UPDATE app_settings SET ${fields.join(', ')} WHERE id = ?`, values)
    }

    const row = dbGet('SELECT * FROM app_settings WHERE id = 1')!
    return rowToSettings(row)
  })
}
