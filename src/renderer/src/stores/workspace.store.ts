import { create } from 'zustand'
import type { ExportProgress } from '@shared/types'

export type AnnotationTool = 'pointer' | 'highlight' | 'text-note'

interface WorkspaceStore {
  currentPage: number
  totalPages: number
  zoomScale: number
  splitRatio: number
  sidebarOpen: boolean
  activeTool: AnnotationTool
  activeHighlightColor: string
  isExporting: boolean
  exportProgress: ExportProgress | null
  exportError: string | null

  setCurrentPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setTotalPages: (n: number) => void
  setZoom: (scale: number) => void
  setSplitRatio: (ratio: number) => void
  toggleSidebar: () => void
  setActiveTool: (tool: AnnotationTool) => void
  setActiveHighlightColor: (color: string) => void
  setExporting: (exporting: boolean) => void
  setExportProgress: (progress: ExportProgress | null) => void
  setExportError: (err: string | null) => void
  reset: () => void
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  currentPage: 1,
  totalPages: 0,
  zoomScale: 1.0,
  splitRatio: 0.5,
  sidebarOpen: true,
  activeTool: 'pointer',
  activeHighlightColor: 'rgba(254, 240, 138, 0.5)',
  isExporting: false,
  exportProgress: null,
  exportError: null,

  setCurrentPage: (page) => {
    const { totalPages } = get()
    const clamped = Math.max(1, Math.min(page, totalPages || 1))
    set({ currentPage: clamped })
  },
  nextPage: () => {
    const { currentPage, totalPages } = get()
    if (currentPage < totalPages) set({ currentPage: currentPage + 1 })
  },
  prevPage: () => {
    const { currentPage } = get()
    if (currentPage > 1) set({ currentPage: currentPage - 1 })
  },
  setTotalPages: (n) => set({ totalPages: n }),
  setZoom: (scale) => set({ zoomScale: Math.max(0.5, Math.min(scale, 3.0)) }),
  setSplitRatio: (ratio) => set({ splitRatio: Math.max(0.3, Math.min(ratio, 0.7)) }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveHighlightColor: (color) => set({ activeHighlightColor: color }),
  setExporting: (exporting) => set({ isExporting: exporting }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setExportError: (err) => set({ exportError: err }),
  reset: () =>
    set({
      currentPage: 1,
      totalPages: 0,
      zoomScale: 1.0,
      activeTool: 'pointer',
      isExporting: false,
      exportProgress: null,
      exportError: null
    })
}))
