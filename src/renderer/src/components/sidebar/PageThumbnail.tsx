import React from 'react'
import { Page } from 'react-pdf'
import { useWorkspaceStore } from '../../stores/workspace.store'

interface Props {
  pageNumber: number
}

export function PageThumbnail({ pageNumber }: Props): React.ReactElement {
  const currentPage = useWorkspaceStore((s) => s.currentPage)
  const setCurrentPage = useWorkspaceStore((s) => s.setCurrentPage)
  const isActive = currentPage === pageNumber

  return (
    <div
      onClick={() => setCurrentPage(pageNumber)}
      style={{
        cursor: 'pointer',
        padding: '6px 8px',
        borderRadius: 4,
        background: isActive ? '#eff6ff' : 'transparent',
        border: `1px solid ${isActive ? '#2563eb' : 'transparent'}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4
      }}
    >
      <div style={{
        width: 96,
        pointerEvents: 'none',
        overflow: 'hidden',
        borderRadius: 2,
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
        background: '#fff'
      }}>
        <Page
          pageNumber={pageNumber}
          width={96}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={
            <div style={{ width: 96, height: 72, background: '#f1f3f5' }} />
          }
        />
      </div>
      <span style={{
        fontSize: 10,
        color: isActive ? '#2563eb' : '#868e96',
        fontWeight: isActive ? 600 : 400
      }}>
        {pageNumber}
      </span>
    </div>
  )
}
