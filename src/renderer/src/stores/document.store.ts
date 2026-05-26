import { create } from 'zustand'
import type { BNDocument } from '@shared/types'

interface DocumentStore {
  documents: BNDocument[]
  activeDocument: BNDocument | null
  isImporting: boolean
  importError: string | null

  loadDocuments: () => Promise<void>
  importFile: (filePath: string) => Promise<BNDocument | null>
  openDocument: (id: string) => Promise<BNDocument | null>
  deleteDocument: (id: string) => Promise<void>
  updateTitle: (id: string, title: string) => Promise<void>
  setImportError: (error: string | null) => void
}

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  activeDocument: null,
  isImporting: false,
  importError: null,

  loadDocuments: async () => {
    const docs = await window.api.listDocuments()
    set({ documents: docs })
  },

  importFile: async (filePath: string) => {
    set({ isImporting: true, importError: null })
    try {
      const result = await window.api.importFile(filePath)
      const docs = await window.api.listDocuments()
      set({ documents: docs, activeDocument: result.document, isImporting: false })
      return result.document
    } catch (err) {
      const message = (err as Error).message
      if (message === 'LIBRE_OFFICE_NOT_FOUND') {
        set({ importError: 'LIBRE_OFFICE_NOT_FOUND', isImporting: false })
      } else {
        set({ importError: message, isImporting: false })
      }
      return null
    }
  },

  openDocument: async (id: string) => {
    const doc = await window.api.getDocument(id)
    if (doc) {
      set({ activeDocument: doc })
      await window.api.updateSettings({ lastOpenedDocumentId: id })
    }
    return doc
  },

  deleteDocument: async (id: string) => {
    await window.api.deleteDocument(id)
    const { activeDocument } = get()
    if (activeDocument?.id === id) {
      set({ activeDocument: null })
    }
    const docs = await window.api.listDocuments()
    set({ documents: docs })
  },

  updateTitle: async (id: string, title: string) => {
    const updated = await window.api.updateDocumentTitle(id, title)
    const { activeDocument, documents } = get()
    set({
      documents: documents.map((d) => (d.id === id ? updated : d)),
      activeDocument: activeDocument?.id === id ? updated : activeDocument
    })
  },

  setImportError: (error) => set({ importError: error })
}))
