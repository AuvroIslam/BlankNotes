import React, { useEffect, useRef, useState } from 'react'
import { useNoteStore } from '../../stores/note.store'
import { AttachmentItem } from './AttachmentItem'

interface Props {
  noteId: string | undefined
  documentId: string
  pageNumber: number
}

export function AttachmentZone({ noteId, documentId, pageNumber }: Props): React.ReactElement {
  const { attachments, addAttachmentBytes } = useNoteStore()
  const pageAttachments = attachments[pageNumber] || []
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const attachImageFile = async (file: File): Promise<void> => {
    let resolvedNoteId = noteId
    if (!resolvedNoteId) {
      const note = await window.api.upsertNote(documentId, pageNumber, '{}')
      resolvedNoteId = note.id
    }
    const buffer = await file.arrayBuffer()
    await addAttachmentBytes(
      resolvedNoteId,
      documentId,
      pageNumber,
      new Uint8Array(buffer),
      file.name || `pasted-image-${Date.now()}.png`,
      file.type || 'image/png'
    )
  }

  const handleFiles = async (files: FileList | null): Promise<void> => {
    if (!files) return
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
    for (const file of imageFiles) {
      await attachImageFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent): void => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (): void => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent): Promise<void> => {
    e.preventDefault()
    setIsDragging(false)
    await handleFiles(e.dataTransfer.files)
  }

  // Global paste handler: if clipboard contains an image, attach it to this page
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent): Promise<void> => {
      const items = e.clipboardData?.items
      if (!items) return
      const imageFiles: File[] = []
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) imageFiles.push(file)
        }
      }
      if (imageFiles.length === 0) return
      // Intercept so the editor doesn't try to embed it as base64
      e.preventDefault()
      e.stopPropagation()
      for (const file of imageFiles) {
        await attachImageFile(file)
      }
    }

    document.addEventListener('paste', handlePaste, true)
    return () => document.removeEventListener('paste', handlePaste, true)
  }, [noteId, documentId, pageNumber])

  return (
    <div style={{ borderTop: '1px solid #e9ecef', padding: '8px 12px' }}>
      {/* Existing attachments */}
      {pageAttachments.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {pageAttachments.map((att) => (
            <AttachmentItem key={att.id} attachment={att} pageNumber={pageNumber} />
          ))}
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `1px dashed ${isDragging ? '#2563eb' : '#dee2e6'}`,
          borderRadius: 6,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          cursor: 'pointer',
          background: isDragging ? '#eff6ff' : 'transparent',
          fontSize: 12,
          color: '#868e96'
        }}
      >
        <span>🖼</span>
        <span>Drop, paste (Ctrl+V), or click to attach an image</span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}
