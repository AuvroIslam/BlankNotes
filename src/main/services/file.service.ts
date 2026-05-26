import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export function getDocumentsDir(): string {
  const dir = path.join(app.getPath('userData'), 'documents')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function getAttachmentsDir(): string {
  const dir = path.join(app.getPath('userData'), 'attachments')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function copyFileToDocuments(sourcePath: string, destName: string): string {
  const dir = getDocumentsDir()
  const dest = path.join(dir, destName)
  fs.copyFileSync(sourcePath, dest)
  return dest
}

export function copyFileToAttachments(sourcePath: string, destName: string): string {
  const dir = getAttachmentsDir()
  const dest = path.join(dir, destName)
  fs.copyFileSync(sourcePath, dest)
  return dest
}

export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
  } catch {
    // Ignore file deletion errors — file may already be gone
  }
}

export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const map: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml'
  }
  return map[ext] || 'application/octet-stream'
}
