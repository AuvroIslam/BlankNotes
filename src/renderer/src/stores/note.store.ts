import { create } from 'zustand'
import type { PageNote, ImageAttachment } from '@shared/types'

// Pending content lives outside Zustand to avoid re-render noise
const pendingContent: Record<number, string> = {}

interface NoteStore {
  notes: Record<number, PageNote | null>
  attachments: Record<number, ImageAttachment[]>
  pendingSaves: Record<number, ReturnType<typeof setTimeout>>

  loadNote: (documentId: string, pageNumber: number) => Promise<void>
  saveNote: (documentId: string, pageNumber: number, contentJson: string) => void
  flushNote: (documentId: string, pageNumber: number) => Promise<void>
  loadAttachments: (noteId: string, pageNumber: number) => Promise<void>
  addAttachment: (
    noteId: string,
    documentId: string,
    pageNumber: number,
    sourcePath: string
  ) => Promise<void>
  addAttachmentBytes: (
    noteId: string,
    documentId: string,
    pageNumber: number,
    bytes: Uint8Array,
    fileName: string,
    mimeType: string
  ) => Promise<void>
  removeAttachment: (id: string, pageNumber: number) => Promise<void>
  reset: () => void
}

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: {},
  attachments: {},
  pendingSaves: {},

  loadNote: async (documentId, pageNumber) => {
    const note = await window.api.getNote(documentId, pageNumber)
    set((s) => ({ notes: { ...s.notes, [pageNumber]: note } }))
    if (note) {
      await get().loadAttachments(note.id, pageNumber)
    }
  },

  saveNote: (documentId, pageNumber, contentJson) => {
    // Track pending content outside store to avoid triggering re-renders
    pendingContent[pageNumber] = contentJson

    const { pendingSaves } = get()
    if (pendingSaves[pageNumber]) clearTimeout(pendingSaves[pageNumber])

    const timer = setTimeout(async () => {
      await get().flushNote(documentId, pageNumber)
    }, 1000)

    set((s) => ({ pendingSaves: { ...s.pendingSaves, [pageNumber]: timer } }))
  },

  flushNote: async (documentId, pageNumber) => {
    const contentJson = pendingContent[pageNumber] ?? get().notes[pageNumber]?.contentJson ?? '{}'
    const note = await window.api.upsertNote(documentId, pageNumber, contentJson)
    set((s) => ({ notes: { ...s.notes, [pageNumber]: note } }))
  },

  loadAttachments: async (noteId, pageNumber) => {
    const atts = await window.api.listAttachments(noteId)
    set((s) => ({ attachments: { ...s.attachments, [pageNumber]: atts } }))
  },

  addAttachment: async (noteId, documentId, pageNumber, sourcePath) => {
    const att = await window.api.addAttachment(noteId, documentId, pageNumber, sourcePath)
    set((s) => ({
      attachments: {
        ...s.attachments,
        [pageNumber]: [...(s.attachments[pageNumber] || []), att]
      }
    }))
  },

  addAttachmentBytes: async (noteId, documentId, pageNumber, bytes, fileName, mimeType) => {
    const att = await window.api.addAttachmentBytes(
      noteId,
      documentId,
      pageNumber,
      bytes,
      fileName,
      mimeType
    )
    set((s) => ({
      attachments: {
        ...s.attachments,
        [pageNumber]: [...(s.attachments[pageNumber] || []), att]
      }
    }))
  },

  removeAttachment: async (id, pageNumber) => {
    await window.api.deleteAttachment(id)
    set((s) => ({
      attachments: {
        ...s.attachments,
        [pageNumber]: (s.attachments[pageNumber] || []).filter((a) => a.id !== id)
      }
    }))
  },

  reset: () => {
    const { pendingSaves } = get()
    Object.values(pendingSaves).forEach(clearTimeout)
    // Clear pending content map
    Object.keys(pendingContent).forEach((k) => delete pendingContent[Number(k)])
    set({ notes: {}, attachments: {}, pendingSaves: {} })
  }
}))
