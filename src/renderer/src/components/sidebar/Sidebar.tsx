import React from 'react'
import { useWorkspaceStore } from '../../stores/workspace.store'
import { PageThumbnail } from './PageThumbnail'

interface Props {
  title: string
}

export function Sidebar({ title }: Props): React.ReactElement {
  const totalPages = useWorkspaceStore((s) => s.totalPages)

  return (
    <div style={{
      width: 128,
      background: '#f1f3f5',
      borderRight: '1px solid #dee2e6',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0
    }}>
      <div style={{
        padding: '10px 8px',
        borderBottom: '1px solid #dee2e6',
        fontSize: 11,
        fontWeight: 600,
        color: '#868e96',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {title}
      </div>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 4px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
          <PageThumbnail key={n} pageNumber={n} />
        ))}
      </div>
    </div>
  )
}
