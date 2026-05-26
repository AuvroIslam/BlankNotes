export type DocumentFormat = 'pdf' | 'pptx'

export interface BNDocument {
  id: string
  title: string
  originalPath: string
  storedPdfPath: string
  originalFormat: DocumentFormat
  pageCount: number
  lastOpenedAt: string
  createdAt: string
  updatedAt: string
  fileMissing?: boolean
}

export interface PageNote {
  id: string
  documentId: string
  pageNumber: number
  contentJson: string
  updatedAt: string
  createdAt: string
}

export type AnnotationType = 'highlight' | 'text-note'

export interface Annotation {
  id: string
  documentId: string
  pageNumber: number
  type: AnnotationType
  fabricJson: string
  normX: number
  normY: number
  normWidth: number
  normHeight: number
  color: string
  text: string | null
  createdAt: string
  updatedAt: string
}

export interface ImageAttachment {
  id: string
  noteId: string
  documentId: string
  pageNumber: number
  fileName: string
  storedPath: string
  mimeType: string
  fileSizeBytes: number
  createdAt: string
}

export interface AppSettings {
  id: 1
  theme: 'light' | 'dark'
  defaultFont: 'inter' | 'ibm-plex-sans' | 'source-sans-3'
  splitRatio: number
  lastOpenedDocumentId: string | null
  libreOfficePath: string | null
}

export interface ImportFileResult {
  document: BNDocument
  conversionWarning?: string
}

export interface ExportProgress {
  phase: 'rasterizing' | 'composing' | 'writing'
  pagesDone: number
  pagesTotal: number
}

export interface LibreOfficeProbeResult {
  found: boolean
  path: string | null
  version: string | null
}

export interface IpcApi {
  // Documents
  openFileDialog: () => Promise<{ filePath: string | null }>
  importFile: (filePath: string) => Promise<ImportFileResult>
  listDocuments: () => Promise<BNDocument[]>
  getDocument: (id: string) => Promise<BNDocument | null>
  deleteDocument: (id: string) => Promise<{ success: boolean }>
  updateDocumentTitle: (id: string, title: string) => Promise<BNDocument>

  // Notes
  getNote: (documentId: string, pageNumber: number) => Promise<PageNote | null>
  upsertNote: (documentId: string, pageNumber: number, contentJson: string) => Promise<PageNote>
  getAllNotesForDocument: (documentId: string) => Promise<PageNote[]>

  // Annotations
  listAnnotations: (documentId: string, pageNumber: number) => Promise<Annotation[]>
  upsertAnnotation: (
    annotation: Omit<Annotation, 'createdAt' | 'updatedAt'>
  ) => Promise<Annotation>
  deleteAnnotation: (id: string) => Promise<{ success: boolean }>
  listAllAnnotationsForDocument: (documentId: string) => Promise<Annotation[]>

  // Attachments
  addAttachment: (
    noteId: string,
    documentId: string,
    pageNumber: number,
    sourcePath: string
  ) => Promise<ImageAttachment>
  addAttachmentBytes: (
    noteId: string,
    documentId: string,
    pageNumber: number,
    bytes: Uint8Array,
    fileName: string,
    mimeType: string
  ) => Promise<ImageAttachment>
  chooseAndSaveAttachment: (
    noteId: string,
    documentId: string,
    pageNumber: number
  ) => Promise<ImageAttachment[]>
  listAttachments: (noteId: string) => Promise<ImageAttachment[]>
  deleteAttachment: (id: string) => Promise<{ success: boolean }>

  // Export
  chooseExportPath: (suggestedName: string) => Promise<{ filePath: string | null }>
  startExport: (
    documentId: string,
    outputPath: string
  ) => Promise<{ success: boolean; outputPath: string }>

  // Settings
  getSettings: () => Promise<AppSettings>
  updateSettings: (settings: Partial<Omit<AppSettings, 'id'>>) => Promise<AppSettings>

  // System
  probeLibreOffice: () => Promise<LibreOfficeProbeResult>
  getAppVersion: () => Promise<{ version: string }>

  // Event listeners (main → renderer)
  onExportProgress: (cb: (progress: ExportProgress) => void) => () => void
  onExportComplete: (
    cb: (result: { success: boolean; outputPath?: string; error?: string }) => void
  ) => () => void
  onMenuOpenFile: (cb: () => void) => () => void
  onMenuExport: (cb: () => void) => () => void
}
