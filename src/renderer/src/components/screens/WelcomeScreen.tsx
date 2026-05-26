import React, { useEffect } from 'react'
import { useDocumentStore } from '../../stores/document.store'
import { useWorkspaceStore } from '../../stores/workspace.store'
import { useNoteStore } from '../../stores/note.store'
import { useAnnotationStore } from '../../stores/annotation.store'
import { LoadingSpinner } from '../common/LoadingSpinner'
import type { BNDocument } from '@shared/types'

export function WelcomeScreen(): React.ReactElement {
  const { documents, loadDocuments, importFile, openDocument, deleteDocument, isImporting } = useDocumentStore()
  const workspaceReset = useWorkspaceStore((s) => s.reset)
  const noteReset = useNoteStore((s) => s.reset)
  const annotationReset = useAnnotationStore((s) => s.reset)

  useEffect(() => {
    loadDocuments()
  }, [loadDocuments])

  const handleOpenFile = async (): Promise<void> => {
    const { filePath } = await window.api.openFileDialog()
    if (!filePath) return
    workspaceReset()
    noteReset()
    annotationReset()
    await importFile(filePath)
  }

  const handleOpenRecent = async (doc: BNDocument): Promise<void> => {
    workspaceReset()
    noteReset()
    annotationReset()
    await openDocument(doc.id)
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8f9fa',
      padding: 40
    }}>
      {/* Logo / Title */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{
          width: 56,
          height: 56,
          background: '#2563eb',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: 28
        }}>
          📖
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>
          BlankNotes
        </h1>
        <p style={{ fontSize: 14, color: '#868e96' }}>
          Your study workspace — PDF + notes, side by side
        </p>
      </div>

      {/* Open button */}
      <button
        onClick={handleOpenFile}
        disabled={isImporting}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 24px',
          background: '#2563eb',
          color: '#fff',
          borderRadius: 8,
          fontSize: 14,
          fontWeight: 600,
          cursor: isImporting ? 'not-allowed' : 'pointer',
          opacity: isImporting ? 0.7 : 1,
          marginBottom: 40
        }}
      >
        {isImporting ? (
          <LoadingSpinner size={16} />
        ) : (
          <span style={{ fontSize: 16 }}>+</span>
        )}
        {isImporting ? 'Opening...' : 'Open Document'}
      </button>

      {/* Recent files */}
      {documents.length > 0 && (
        <div style={{ width: '100%', maxWidth: 560 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#868e96',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: 12
          }}>
            Recent
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 12px',
                  background: doc.fileMissing ? '#fff8f8' : '#fff',
                  border: `1px solid ${doc.fileMissing ? '#fecaca' : '#e9ecef'}`,
                  borderRadius: 6,
                  cursor: doc.fileMissing ? 'default' : 'pointer',
                  gap: 12,
                  opacity: doc.fileMissing ? 0.7 : 1
                }}
                onClick={() => !doc.fileMissing && handleOpenRecent(doc)}
              >
                <span style={{ fontSize: 18 }}>
                  {doc.fileMissing ? '⚠' : doc.originalFormat === 'pptx' ? '📊' : '📄'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: doc.fileMissing ? '#9ca3af' : '#1a1a2e',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {doc.title}
                  </div>
                  <div style={{ fontSize: 11, color: doc.fileMissing ? '#dc2626' : '#868e96' }}>
                    {doc.fileMissing
                      ? 'File missing — remove and re-import'
                      : `${doc.pageCount} pages · ${new Date(doc.lastOpenedAt).toLocaleDateString()}`}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteDocument(doc.id)
                  }}
                  style={{
                    padding: '2px 6px',
                    borderRadius: 4,
                    color: '#868e96',
                    fontSize: 16,
                    opacity: 0.5
                  }}
                  title="Remove from list"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
