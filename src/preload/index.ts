import { contextBridge, ipcRenderer } from 'electron'
import type { IpcApi, Annotation, ExportProgress } from '../shared/types'

const api: IpcApi = {
  // Documents
  openFileDialog: () => ipcRenderer.invoke('blanknotes:document:open-dialog'),
  importFile: (filePath) => ipcRenderer.invoke('blanknotes:document:import', filePath),
  listDocuments: () => ipcRenderer.invoke('blanknotes:document:list'),
  getDocument: (id) => ipcRenderer.invoke('blanknotes:document:get', id),
  deleteDocument: (id) => ipcRenderer.invoke('blanknotes:document:delete', id),
  updateDocumentTitle: (id, title) =>
    ipcRenderer.invoke('blanknotes:document:update-title', id, title),

  // Notes
  getNote: (documentId, pageNumber) =>
    ipcRenderer.invoke('blanknotes:note:get', documentId, pageNumber),
  upsertNote: (documentId, pageNumber, contentJson) =>
    ipcRenderer.invoke('blanknotes:note:upsert', documentId, pageNumber, contentJson),
  getAllNotesForDocument: (documentId) =>
    ipcRenderer.invoke('blanknotes:note:get-all-for-document', documentId),

  // Annotations
  listAnnotations: (documentId, pageNumber) =>
    ipcRenderer.invoke('blanknotes:annotation:list', documentId, pageNumber),
  upsertAnnotation: (annotation: Omit<Annotation, 'createdAt' | 'updatedAt'>) =>
    ipcRenderer.invoke('blanknotes:annotation:upsert', annotation),
  deleteAnnotation: (id) => ipcRenderer.invoke('blanknotes:annotation:delete', id),
  listAllAnnotationsForDocument: (documentId) =>
    ipcRenderer.invoke('blanknotes:annotation:list-all', documentId),

  // Attachments
  addAttachment: (noteId, documentId, pageNumber, sourcePath) =>
    ipcRenderer.invoke('blanknotes:attachment:add', noteId, documentId, pageNumber, sourcePath),
  addAttachmentBytes: (noteId, documentId, pageNumber, bytes, fileName, mimeType) =>
    ipcRenderer.invoke(
      'blanknotes:attachment:add-bytes',
      noteId,
      documentId,
      pageNumber,
      bytes,
      fileName,
      mimeType
    ),
  chooseAndSaveAttachment: (noteId, documentId, pageNumber) =>
    ipcRenderer.invoke(
      'blanknotes:attachment:choose-and-save',
      noteId,
      documentId,
      pageNumber
    ),
  listAttachments: (noteId) => ipcRenderer.invoke('blanknotes:attachment:list', noteId),
  deleteAttachment: (id) => ipcRenderer.invoke('blanknotes:attachment:delete', id),

  // Export
  chooseExportPath: (suggestedName) =>
    ipcRenderer.invoke('blanknotes:export:choose-path', suggestedName),
  startExport: (documentId, outputPath) =>
    ipcRenderer.invoke('blanknotes:export:start', documentId, outputPath),

  // Settings
  getSettings: () => ipcRenderer.invoke('blanknotes:settings:get'),
  updateSettings: (settings) => ipcRenderer.invoke('blanknotes:settings:update', settings),

  // System
  probeLibreOffice: () => ipcRenderer.invoke('blanknotes:system:probe-libreoffice'),
  getAppVersion: () => ipcRenderer.invoke('blanknotes:system:get-app-version'),

  // Event listeners
  onExportProgress: (cb) => {
    const handler = (_: Electron.IpcRendererEvent, progress: ExportProgress) => cb(progress)
    ipcRenderer.on('blanknotes:export:progress', handler)
    return () => ipcRenderer.removeListener('blanknotes:export:progress', handler)
  },
  onExportComplete: (cb) => {
    const handler = (
      _: Electron.IpcRendererEvent,
      result: { success: boolean; outputPath?: string; error?: string }
    ) => cb(result)
    ipcRenderer.on('blanknotes:export:complete', handler)
    return () => ipcRenderer.removeListener('blanknotes:export:complete', handler)
  },
  onMenuOpenFile: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('blanknotes:menu:open-file', handler)
    return () => ipcRenderer.removeListener('blanknotes:menu:open-file', handler)
  },
  onMenuExport: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('blanknotes:menu:export', handler)
    return () => ipcRenderer.removeListener('blanknotes:menu:export', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)
