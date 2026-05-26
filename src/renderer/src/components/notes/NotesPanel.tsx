import React from 'react'
import { NoteEditor } from './NoteEditor'

interface Props {
  documentId: string
  pageNumber: number
}

export function NotesPanel({ documentId, pageNumber }: Props): React.ReactElement {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#fff',
      borderLeft: '1px solid #e9ecef'
    }}>
      {/* Header */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #e9ecef',
        fontSize: 12,
        fontWeight: 600,
        color: '#868e96',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: '#f8f9fa',
        flexShrink: 0
      }}>
        Notes — Page {pageNumber}
      </div>

      {/* Editor fills remaining space */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <NoteEditor documentId={documentId} pageNumber={pageNumber} />
      </div>
    </div>
  )
}
