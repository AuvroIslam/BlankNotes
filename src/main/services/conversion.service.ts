import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import { probeLibreOffice } from './libreoffice.probe'
import { getDocumentsDir } from './file.service'

// libreoffice-convert uses callbacks
// eslint-disable-next-line @typescript-eslint/no-require-imports
const libre = require('libreoffice-convert')
const libreConvertWithOptions = promisify(libre.convertWithOptions)

export class LibreOfficeNotFoundError extends Error {
  constructor() {
    super('LibreOffice not found')
    this.name = 'LibreOfficeNotFoundError'
  }
}

export async function convertPptxToPdf(sourcePath: string, destUuid: string): Promise<string> {
  const probe = await probeLibreOffice()
  if (!probe.found || !probe.path) {
    throw new LibreOfficeNotFoundError()
  }

  const inputBuffer = fs.readFileSync(sourcePath)

  let pdfBuffer: Buffer
  try {
    pdfBuffer = await libreConvertWithOptions(inputBuffer, '.pdf', undefined, {
      sofficeBinaryPaths: [probe.path]
    })
  } catch (err) {
    throw new Error(`PPTX conversion failed: ${(err as Error).message}`)
  }

  const destPath = path.join(getDocumentsDir(), `${destUuid}.pdf`)
  fs.writeFileSync(destPath, pdfBuffer)
  return destPath
}

export async function copyPdfToStorage(sourcePath: string, destUuid: string): Promise<string> {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Source PDF does not exist: ${sourcePath}`)
  }
  const destPath = path.join(getDocumentsDir(), `${destUuid}.pdf`)
  fs.copyFileSync(sourcePath, destPath)
  if (!fs.existsSync(destPath)) {
    throw new Error(`PDF copy failed — file not present at ${destPath}`)
  }
  return destPath
}
