import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import type { LibreOfficeProbeResult } from '../../shared/types'

const WINDOWS_PATHS = [
  'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
  'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
]

const MAC_PATHS = [
  '/Applications/LibreOffice.app/Contents/MacOS/soffice',
  '/usr/local/bin/soffice'
]

function tryExec(cmd: string): string | null {
  try {
    return execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'], timeout: 5000 }).toString().trim()
  } catch {
    return null
  }
}

function getVersion(binaryPath: string): string | null {
  return tryExec(`"${binaryPath}" --version`)
}

export async function probeLibreOffice(): Promise<LibreOfficeProbeResult> {
  // 1. Check DB user override
  try {
    const { dbGet } = await import('../db/index')
    const row = dbGet('SELECT libre_office_path FROM app_settings WHERE id = 1')
    const dbPath = row?.libre_office_path as string | null
    if (dbPath && fs.existsSync(dbPath)) {
      return { found: true, path: dbPath, version: getVersion(dbPath) }
    }
  } catch {
    // DB not yet initialized — continue
  }

  // 2. Env var override
  const envPath = process.env.LIBREOFFICE_PATH
  if (envPath && fs.existsSync(envPath)) {
    return { found: true, path: envPath, version: getVersion(envPath) }
  }

  // 3. Platform-specific default paths
  const platform = process.platform
  if (platform === 'win32') {
    for (const p of WINDOWS_PATHS) {
      if (fs.existsSync(p)) {
        return { found: true, path: p, version: getVersion(p) }
      }
    }
    const pathDirs = (process.env.PATH || '').split(path.delimiter)
    for (const dir of pathDirs) {
      const candidate = path.join(dir, 'soffice.exe')
      if (fs.existsSync(candidate)) {
        return { found: true, path: candidate, version: getVersion(candidate) }
      }
    }
  } else if (platform === 'darwin') {
    for (const p of MAC_PATHS) {
      if (fs.existsSync(p)) {
        return { found: true, path: p, version: getVersion(p) }
      }
    }
  } else {
    const which = tryExec('which soffice') || tryExec('which libreoffice')
    if (which) {
      return { found: true, path: which, version: getVersion(which) }
    }
  }

  return { found: false, path: null, version: null }
}
