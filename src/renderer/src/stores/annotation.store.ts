import { create } from 'zustand'
import type { Annotation } from '@shared/types'

interface AnnotationStore {
  annotations: Record<number, Annotation[]>

  loadAnnotations: (documentId: string, pageNumber: number) => Promise<void>
  upsertAnnotation: (annotation: Omit<Annotation, 'createdAt' | 'updatedAt'>) => Promise<void>
  deleteAnnotation: (id: string, pageNumber: number) => Promise<void>
  reset: () => void
}

export const useAnnotationStore = create<AnnotationStore>((set) => ({
  annotations: {},

  loadAnnotations: async (documentId, pageNumber) => {
    const anns = await window.api.listAnnotations(documentId, pageNumber)
    set((s) => ({ annotations: { ...s.annotations, [pageNumber]: anns } }))
  },

  upsertAnnotation: async (annotation) => {
    const saved = await window.api.upsertAnnotation(annotation)
    set((s) => {
      const page = annotation.pageNumber
      const existing = s.annotations[page] || []
      const idx = existing.findIndex((a) => a.id === saved.id)
      const updated = idx >= 0
        ? existing.map((a) => (a.id === saved.id ? saved : a))
        : [...existing, saved]
      return { annotations: { ...s.annotations, [page]: updated } }
    })
  },

  deleteAnnotation: async (id, pageNumber) => {
    await window.api.deleteAnnotation(id)
    set((s) => ({
      annotations: {
        ...s.annotations,
        [pageNumber]: (s.annotations[pageNumber] || []).filter((a) => a.id !== id)
      }
    }))
  },

  reset: () => set({ annotations: {} })
}))
