import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Document } from 'react-pdf'
import { pdfjs } from 'react-pdf'
import { useWorkspaceStore } from '../../stores/workspace.store'
import { useDocumentStore } from '../../stores/document.store'
import { useNoteStore } from '../../stores/note.store'
import { useAnnotationStore } from '../../stores/annotation.store'
import { useToast } from '../common/Toast'
import { AppToolbar } from '../toolbar/AppToolbar'
import { Sidebar } from '../sidebar/Sidebar'
import { PdfViewer } from '../pdf/PdfViewer'
import { NotesPanel } from '../notes/NotesPanel'
import { Modal } from '../common/Modal'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { toAssetUrl } from '../../lib/api'
import type { BNDocument } from '@shared/types'

// Worker is set globally in PdfViewer — but also needed here for thumbnails context
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString()

interface Props {
  document: BNDocument
  onClose: () => void
}

export function WorkspaceScreen({ document, onClose }: Props): React.ReactElement {
  const {
    currentPage, sidebarOpen, splitRatio, setSplitRatio,
    isExporting, exportProgress, exportError,
    setExporting, setExportProgress, setExportError
  } = useWorkspaceStore()
  const { loadNote } = useNoteStore()
  const { loadAnnotations } = useAnnotationStore()
  const { showToast } = useToast()
  const setActiveTool = useWorkspaceStore((s) => s.setActiveTool)
  const nextPage = useWorkspaceStore((s) => s.nextPage)
  const prevPage = useWorkspaceStore((s) => s.prevPage)

  const dividerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const fileUrl = toAssetUrl(document.storedPdfPath)

  // Load note and annotations whenever page changes
  useEffect(() => {
    loadNote(document.id, currentPage)
    loadAnnotations(document.id, currentPage)
  }, [document.id, currentPage, loadNote, loadAnnotations])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if ((e.target as Element)?.closest?.('.ProseMirror')) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextPage()
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevPage()
      else if (e.key === 'h' || e.key === 'H') setActiveTool('highlight')
      else if (e.key === 't' || e.key === 'T') setActiveTool('text-note')
      else if (e.key === 'Escape') setActiveTool('pointer')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextPage, prevPage, setActiveTool])

  // Export progress/complete listeners
  useEffect(() => {
    const unsubProgress = window.api.onExportProgress((progress) => {
      setExportProgress(progress)
    })
    const unsubComplete = window.api.onExportComplete((result) => {
      setExporting(false)
      if (result.success) {
        showToast(`Exported to ${result.outputPath}`, 'success')
        setExportProgress(null)
      } else {
        setExportError(result.error || 'Export failed')
      }
    })
    return () => { unsubProgress(); unsubComplete() }
  }, [setExporting, setExportProgress, setExportError, showToast])

  // Divider drag for split ratio
  const handleDividerMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault()
    isDragging.current = true

    const handleMouseMove = (ev: MouseEvent): void => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const ratio = (ev.clientX - rect.left) / rect.width
      setSplitRatio(ratio)
    }

    const handleMouseUp = (): void => {
      isDragging.current = false
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.api.updateSettings({ splitRatio: useWorkspaceStore.getState().splitRatio })
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleExport = useCallback(async (): Promise<void> => {
    const { filePath } = await window.api.chooseExportPath(`${document.title}_notes.pdf`)
    if (!filePath) return
    setExporting(true)
    setExportError(null)
    setExportProgress({ phase: 'rasterizing', pagesDone: 0, pagesTotal: document.pageCount })
    await window.api.startExport(document.id, filePath)
  }, [document, setExporting, setExportError, setExportProgress])

  // Menu export listener (after handleExport declaration to avoid TDZ)
  useEffect(() => {
    const unsub = window.api.onMenuExport(() => handleExport())
    return unsub
  }, [handleExport])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppToolbar onExport={handleExport} onClose={onClose} />

      <div ref={containerRef} style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <Document
            file={fileUrl}
            loading={<div style={{ width: 128 }} />}
            error={<div style={{ width: 128 }} />}
          >
            <Sidebar title={document.title} />
          </Document>
        )}

        {/* PDF pane */}
        <div style={{
          flex: `0 0 ${splitRatio * 100}%`,
          overflow: 'auto',
          background: '#e9ecef',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: 20
        }}>
          <PdfViewer pdfPath={document.storedPdfPath} documentId={document.id} />
        </div>

        {/* Resize divider */}
        <div
          ref={dividerRef}
          onMouseDown={handleDividerMouseDown}
          style={{
            width: 4,
            background: '#dee2e6',
            cursor: 'col-resize',
            flexShrink: 0,
            position: 'relative',
            zIndex: 1
          }}
        />

        {/* Notes pane */}
        <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
          <NotesPanel documentId={document.id} pageNumber={currentPage} />
        </div>
      </div>

      {/* Export progress modal */}
      {isExporting && (
        <Modal title="Exporting...">
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            padding: '8px 0'
          }}>
            <LoadingSpinner size={32} />
            {exportProgress && (
              <>
                <div style={{ fontSize: 13, color: '#495057' }}>
                  {exportProgress.phase === 'rasterizing' && 'Processing pages...'}
                  {exportProgress.phase === 'composing' && 'Composing document...'}
                  {exportProgress.phase === 'writing' && 'Writing file...'}
                </div>
                <div style={{
                  width: '100%',
                  height: 6,
                  background: '#e9ecef',
                  borderRadius: 3,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    background: '#2563eb',
                    borderRadius: 3,
                    width: `${exportProgress.pagesTotal > 0
                      ? (exportProgress.pagesDone / exportProgress.pagesTotal) * 100
                      : 0}%`,
                    transition: 'width 0.2s'
                  }} />
                </div>
                <div style={{ fontSize: 12, color: '#868e96' }}>
                  Page {exportProgress.pagesDone} of {exportProgress.pagesTotal}
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Export error modal */}
      {exportError && (
        <Modal
          title="Export Failed"
          onClose={() => setExportError(null)}
          footer={
            <button
              onClick={() => setExportError(null)}
              style={{
                padding: '7px 14px',
                background: '#2563eb',
                color: '#fff',
                borderRadius: 5,
                fontSize: 13
              }}
            >
              OK
            </button>
          }
        >
          <p style={{ fontSize: 14, color: '#495057' }}>{exportError}</p>
        </Modal>
      )}
    </div>
  )
}
