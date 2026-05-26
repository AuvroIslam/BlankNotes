import React, { useEffect, useState } from 'react'
import { useDocumentStore } from './stores/document.store'
import { useWorkspaceStore } from './stores/workspace.store'
import { useNoteStore } from './stores/note.store'
import { useAnnotationStore } from './stores/annotation.store'
import { useToast } from './components/common/Toast'
import { WelcomeScreen } from './components/screens/WelcomeScreen'
import { WorkspaceScreen } from './components/screens/WorkspaceScreen'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { Modal } from './components/common/Modal'

export default function App(): React.ReactElement {
  const { activeDocument, loadDocuments, openDocument, importFile, setImportError, importError } = useDocumentStore()
  const workspaceReset = useWorkspaceStore((s) => s.reset)
  const noteReset = useNoteStore((s) => s.reset)
  const annotationReset = useAnnotationStore((s) => s.reset)
  const { showToast } = useToast()
  const [showLibreOfficeDialog, setShowLibreOfficeDialog] = useState(false)

  // On startup, restore last opened document
  useEffect(() => {
    const init = async (): Promise<void> => {
      await loadDocuments()
      const settings = await window.api.getSettings()
      if (settings.lastOpenedDocumentId) {
        const doc = await openDocument(settings.lastOpenedDocumentId)
        if (!doc) {
          // File missing or document deleted — clear last-opened so welcome screen shows
          await window.api.updateSettings({ lastOpenedDocumentId: null })
        }
      }
    }
    init()
  }, [])

  // Global menu open-file listener — works from any screen
  useEffect(() => {
    const unsub = window.api.onMenuOpenFile(() => handleOpenFile())
    return unsub
  }, [])

  const handleOpenFile = async (): Promise<void> => {
    const { filePath } = await window.api.openFileDialog()
    if (!filePath) return
    workspaceReset()
    noteReset()
    annotationReset()
    await importFile(filePath)
  }

  // Show LibreOffice error dialog when triggered from any screen
  useEffect(() => {
    if (importError === 'LIBRE_OFFICE_NOT_FOUND') {
      setShowLibreOfficeDialog(true)
      setImportError(null)
    } else if (importError) {
      showToast(`Import failed: ${importError}`, 'error')
      setImportError(null)
    }
  }, [importError, showToast, setImportError])

  const handleClose = (): void => {
    workspaceReset()
    noteReset()
    annotationReset()
    useDocumentStore.setState({ activeDocument: null })
    window.api.updateSettings({ lastOpenedDocumentId: null })
  }

  return (
    <ErrorBoundary>
      {activeDocument ? (
        <WorkspaceScreen document={activeDocument} onClose={handleClose} />
      ) : (
        <WelcomeScreen />
      )}

      {showLibreOfficeDialog && (
        <Modal
          title="LibreOffice Required for PPTX"
          onClose={() => setShowLibreOfficeDialog(false)}
          footer={
            <button
              onClick={() => setShowLibreOfficeDialog(false)}
              style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', borderRadius: 6, fontSize: 13 }}
            >
              OK
            </button>
          }
        >
          <p style={{ fontSize: 14, color: '#495057', marginBottom: 12 }}>
            Opening PPTX files requires LibreOffice to be installed on your computer.
          </p>
          <p style={{ fontSize: 14, color: '#495057', marginBottom: 16 }}>
            LibreOffice is free and open-source. Download it from:
          </p>
          <div style={{ padding: '10px 14px', background: '#f1f3f5', borderRadius: 6, fontSize: 13, color: '#2563eb', fontFamily: 'monospace' }}>
            https://www.libreoffice.org/download/
          </div>
          <p style={{ fontSize: 12, color: '#868e96', marginTop: 12 }}>
            After installing, restart BlankNotes and try again. PDF files work without any extra software.
          </p>
        </Modal>
      )}
    </ErrorBoundary>
  )
}
