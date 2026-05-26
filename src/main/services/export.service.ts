import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { getDocument } from '../db/document.repo'
import { getAllNotesForDocument } from '../db/note.repo'
import { listAllAnnotationsForDocument } from '../db/annotation.repo'
import { listAttachments } from '../db/attachment.repo'
import type { ExportProgress, Annotation, PageNote } from '../../shared/types'

type ProgressCallback = (progress: ExportProgress) => void

interface TiptapNode {
  type: string
  content?: TiptapNode[]
  text?: string
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
  attrs?: Record<string, unknown>
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255
  }
}

async function renderNotesToPage(
  pdfDoc: PDFDocument,
  note: PageNote | undefined,
  pageWidth: number,
  pageHeight: number
): Promise<void> {
  const notesPage = pdfDoc.addPage([pageWidth, pageHeight])
  const margin = 50
  const contentWidth = pageWidth - margin * 2

  // Header bar
  notesPage.drawRectangle({
    x: 0,
    y: pageHeight - 40,
    width: pageWidth,
    height: 40,
    color: rgb(0.96, 0.97, 0.98)
  })

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  notesPage.drawText('Notes', {
    x: margin,
    y: pageHeight - 28,
    size: 14,
    font: boldFont,
    color: rgb(0.2, 0.2, 0.2)
  })

  if (!note || note.contentJson === '{}' || note.contentJson === '') {
    notesPage.drawText('No notes for this page.', {
      x: margin,
      y: pageHeight - 80,
      size: 12,
      font,
      color: rgb(0.7, 0.7, 0.7)
    })
    return
  }

  let parsed: TiptapNode
  try {
    parsed = JSON.parse(note.contentJson) as TiptapNode
  } catch {
    return
  }

  // Collect attachments for this note
  const attachments = listAttachments(note.id)
  const attachmentMap = new Map(attachments.map((a) => [a.storedPath, a]))

  let y = pageHeight - 65
  const lineHeight = 20
  const fontSize = 13

  function drawText(
    text: string,
    isBold: boolean,
    color: { r: number; g: number; b: number },
    highlightColor?: { r: number; g: number; b: number }
  ): void {
    if (y < margin) return
    const usedFont = isBold ? boldFont : font
    const textWidth = usedFont.widthOfTextAtSize(text, fontSize)

    if (highlightColor) {
      notesPage.drawRectangle({
        x: margin,
        y: y - 3,
        width: Math.min(textWidth, contentWidth),
        height: fontSize + 4,
        color: rgb(highlightColor.r, highlightColor.g, highlightColor.b),
        opacity: 0.5
      })
    }

    // Simple word-wrap for long text
    const words = text.split(' ')
    let line = ''
    let lineX = margin

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word
      const testWidth = usedFont.widthOfTextAtSize(testLine, fontSize)
      if (testWidth > contentWidth && line) {
        if (y < margin) return
        notesPage.drawText(line, {
          x: lineX,
          y,
          size: fontSize,
          font: usedFont,
          color: rgb(color.r, color.g, color.b)
        })
        y -= lineHeight
        line = word
      } else {
        line = testLine
      }
    }
    if (line && y >= margin) {
      notesPage.drawText(line, {
        x: lineX,
        y,
        size: fontSize,
        font: usedFont,
        color: rgb(color.r, color.g, color.b)
      })
    }
  }

  async function renderNode(node: TiptapNode): Promise<void> {
    if (!node.content) return

    for (const child of node.content) {
      if (child.type === 'paragraph') {
        y -= lineHeight * 0.3
        if (child.content) {
          for (const inline of child.content) {
            if (inline.type === 'text') {
              const marks = inline.marks || []
              const isBold = marks.some((m) => m.type === 'bold')
              const colorMark = marks.find((m) => m.type === 'textStyle')
              const highlightMark = marks.find((m) => m.type === 'highlight')

              let textColor = { r: 0.1, g: 0.1, b: 0.1 }
              if (colorMark?.attrs?.color) {
                const c = colorMark.attrs.color as string
                if (c === '#1a56db') textColor = { r: 0.1, g: 0.34, b: 0.86 }
                else if (c === '#057a55') textColor = { r: 0.02, g: 0.48, b: 0.33 }
              }

              let highlightColor: { r: number; g: number; b: number } | undefined
              if (highlightMark?.attrs?.color) {
                const h = highlightMark.attrs.color as string
                if (h === '#fef08a') highlightColor = { r: 0.99, g: 0.94, b: 0.54 }
                else if (h === '#fbb6ce') highlightColor = { r: 0.98, g: 0.71, b: 0.81 }
              }

              drawText(inline.text || '', isBold, textColor, highlightColor)
            }
          }
        }
        y -= lineHeight
      } else if (child.type === 'bulletList' && child.content) {
        for (const item of child.content) {
          if (item.type === 'listItem' && item.content) {
            for (const p of item.content) {
              if (p.type === 'paragraph' && p.content) {
                if (y >= margin) {
                  notesPage.drawText('•', {
                    x: margin,
                    y,
                    size: fontSize,
                    font,
                    color: rgb(0.1, 0.1, 0.1)
                  })
                }
                const textParts = p.content.filter((n) => n.type === 'text')
                const fullText = textParts.map((n) => n.text || '').join('')
                if (y >= margin) {
                  notesPage.drawText(fullText, {
                    x: margin + 15,
                    y,
                    size: fontSize,
                    font,
                    color: rgb(0.1, 0.1, 0.1)
                  })
                }
                y -= lineHeight
              }
            }
          }
        }
      } else if (child.type === 'image') {
        const src = child.attrs?.src as string | undefined
        if (src && y >= margin) {
          try {
            const imgPath = src.startsWith('file://') ? src.replace('file://', '') : src
            if (fs.existsSync(imgPath)) {
              const imgBytes = fs.readFileSync(imgPath)
              const imgExt = path.extname(imgPath).toLowerCase()
              let embeddedImage
              if (imgExt === '.png') {
                embeddedImage = await pdfDoc.embedPng(imgBytes)
              } else {
                embeddedImage = await pdfDoc.embedJpg(imgBytes)
              }
              const maxW = contentWidth
              const maxH = 150
              const scale = Math.min(maxW / embeddedImage.width, maxH / embeddedImage.height, 1)
              const imgW = embeddedImage.width * scale
              const imgH = embeddedImage.height * scale
              if (y - imgH >= margin) {
                notesPage.drawImage(embeddedImage, {
                  x: margin,
                  y: y - imgH,
                  width: imgW,
                  height: imgH
                })
                y -= imgH + lineHeight
              }
            }
          } catch {
            // Skip image if it can't be embedded
          }
        }
      } else if (child.content) {
        await renderNode(child)
      }
    }
  }

  await renderNode(parsed)
}

function drawAnnotationsOnPage(
  page: ReturnType<PDFDocument['getPage']>,
  annotations: Annotation[],
  pageWidth: number,
  pageHeight: number
): void {
  for (const ann of annotations) {
    const x = ann.normX * pageWidth
    // pdf-lib origin is bottom-left; convert from top-left coords
    const y = pageHeight - (ann.normY + ann.normHeight) * pageHeight
    const w = ann.normWidth * pageWidth
    const h = ann.normHeight * pageHeight

    if (ann.type === 'highlight') {
      // Parse color from CSS rgba string or hex
      let r = 1, g = 0.92, b = 0.23, a = 0.35
      const rgbaMatch = ann.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
      if (rgbaMatch) {
        r = parseInt(rgbaMatch[1]) / 255
        g = parseInt(rgbaMatch[2]) / 255
        b = parseInt(rgbaMatch[3]) / 255
        a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 0.35
      }
      page.drawRectangle({ x, y, width: w, height: h, color: rgb(r, g, b), opacity: a })
    }
  }
}

export async function runExport(
  documentId: string,
  outputPath: string,
  onProgress: ProgressCallback
): Promise<void> {
  const doc = getDocument(documentId)
  if (!doc) throw new Error('Document not found')

  const sourceBytes = fs.readFileSync(doc.storedPdfPath)
  const sourceDoc = await PDFDocument.load(sourceBytes)
  const outputDoc = await PDFDocument.create()

  const allAnnotations = listAllAnnotationsForDocument(documentId)
  const allNotes = getAllNotesForDocument(documentId)

  const notesByPage = new Map(allNotes.map((n) => [n.pageNumber, n]))
  const annotsByPage = new Map<number, Annotation[]>()
  for (const ann of allAnnotations) {
    if (!annotsByPage.has(ann.pageNumber)) annotsByPage.set(ann.pageNumber, [])
    annotsByPage.get(ann.pageNumber)!.push(ann)
  }

  const totalPages = doc.pageCount || sourceDoc.getPageCount()

  onProgress({ phase: 'rasterizing', pagesDone: 0, pagesTotal: totalPages })

  for (let i = 1; i <= totalPages; i++) {
    // Copy original page
    const [copiedPage] = await outputDoc.copyPages(sourceDoc, [i - 1])
    outputDoc.addPage(copiedPage)

    const { width: pageWidth, height: pageHeight } = copiedPage.getSize()

    // Draw annotations on copied page
    const pageAnnotations = annotsByPage.get(i) || []
    drawAnnotationsOnPage(copiedPage, pageAnnotations, pageWidth, pageHeight)

    // Add notes page
    await renderNotesToPage(outputDoc, notesByPage.get(i), pageWidth, pageHeight)

    onProgress({ phase: 'composing', pagesDone: i, pagesTotal: totalPages })
  }

  onProgress({ phase: 'writing', pagesDone: totalPages, pagesTotal: totalPages })

  const pdfBytes = await outputDoc.save()
  fs.writeFileSync(outputPath, pdfBytes)
}
