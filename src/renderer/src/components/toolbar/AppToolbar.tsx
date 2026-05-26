import React from 'react'
import { useWorkspaceStore } from '../../stores/workspace.store'
import { useDocumentStore } from '../../stores/document.store'
import { useToast } from '../common/Toast'

interface Props {
  onExport: () => void
  onClose: () => void
}

function NavBtn({
  onClick,
  disabled,
  children,
  title
}: {
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
  title?: string
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 28,
        height: 28,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        color: disabled ? '#ced4da' : '#495057',
        fontSize: 16,
        border: '1px solid transparent',
        cursor: disabled ? 'default' : 'pointer'
      }}
    >
      {children}
    </button>
  )
}

export function AppToolbar({ onExport, onClose }: Props): React.ReactElement {
  const {
    currentPage, totalPages, nextPage, prevPage, setCurrentPage,
    zoomScale, setZoom,
    activeTool, setActiveTool,
    activeHighlightColor, setActiveHighlightColor,
    sidebarOpen, toggleSidebar
  } = useWorkspaceStore()

  const activeDocument = useDocumentStore((s) => s.activeDocument)

  const handlePageInput = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      const val = parseInt((e.target as HTMLInputElement).value)
      if (!isNaN(val)) setCurrentPage(val)
    }
  }

  return (
    <div style={{
      height: 48,
      background: '#fff',
      borderBottom: '1px solid #dee2e6',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: 8,
      flexShrink: 0,
      userSelect: 'none'
    }}>
      {/* Sidebar toggle */}
      <NavBtn onClick={toggleSidebar} title="Toggle sidebar">
        {sidebarOpen ? '◧' : '▣'}
      </NavBtn>

      <div style={{ width: 1, height: 20, background: '#dee2e6' }} />

      {/* Document title */}
      <span style={{
        fontSize: 13,
        fontWeight: 600,
        color: '#1a1a2e',
        maxWidth: 200,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {activeDocument?.title}
      </span>

      <div style={{ flex: 1 }} />

      {/* Navigation */}
      <NavBtn onClick={prevPage} disabled={currentPage <= 1} title="Previous page (←)">‹</NavBtn>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
        <input
          type="number"
          defaultValue={currentPage}
          key={currentPage}
          onKeyDown={handlePageInput}
          style={{
            width: 40,
            textAlign: 'center',
            border: '1px solid #dee2e6',
            borderRadius: 4,
            padding: '2px 4px',
            fontSize: 13,
            color: '#1a1a2e'
          }}
        />
        <span style={{ color: '#868e96' }}>/ {totalPages}</span>
      </div>
      <NavBtn onClick={nextPage} disabled={currentPage >= totalPages} title="Next page (→)">›</NavBtn>

      <div style={{ width: 1, height: 20, background: '#dee2e6' }} />

      {/* Zoom */}
      <NavBtn onClick={() => setZoom(zoomScale - 0.1)} disabled={zoomScale <= 0.5} title="Zoom out">−</NavBtn>
      <span style={{ fontSize: 12, color: '#495057', minWidth: 36, textAlign: 'center' }}>
        {Math.round(zoomScale * 100)}%
      </span>
      <NavBtn onClick={() => setZoom(zoomScale + 0.1)} disabled={zoomScale >= 3.0} title="Zoom in">+</NavBtn>

      <div style={{ width: 1, height: 20, background: '#dee2e6' }} />

      {/* Annotation tools */}
      {(['pointer', 'highlight', 'text-note'] as const).map((tool) => {
        const isActive = activeTool === tool
        return (
          <button
            key={tool}
            onClick={() => setActiveTool(tool)}
            title={
              tool === 'pointer'
                ? 'Select / move (Esc)'
                : tool === 'highlight'
                  ? 'Highlight — drag on the PDF (H)'
                  : 'Sticky note — click on the PDF (T)'
            }
            style={{
              width: 30,
              height: 28,
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isActive ? '#eff6ff' : 'transparent',
              border: isActive ? '1px solid #bfdbfe' : '1px solid transparent',
              color: isActive ? '#2563eb' : '#495057',
              cursor: 'pointer'
            }}
          >
            {tool === 'pointer' && (
              <span style={{ fontSize: 14, lineHeight: 1 }}>↖</span>
            )}
            {tool === 'highlight' && (
              <span
                style={{
                  display: 'inline-block',
                  width: 16,
                  height: 8,
                  background: activeHighlightColor.replace(/[\d.]+\)$/, '0.9)'),
                  borderRadius: 1
                }}
              />
            )}
            {tool === 'text-note' && (
              <span style={{ fontSize: 12, fontWeight: 700, lineHeight: 1 }}>T</span>
            )}
          </button>
        )
      })}

      {/* Highlight color picker */}
      {activeTool === 'highlight' && (
        <>
          {[
            { color: 'rgba(254, 240, 138, 0.6)', label: 'Yellow' },
            { color: 'rgba(251, 182, 206, 0.6)', label: 'Pink' }
          ].map((c) => (
            <button
              key={c.color}
              onClick={() => setActiveHighlightColor(c.color)}
              title={c.label}
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: c.color.replace('0.6', '1'),
                border: activeHighlightColor === c.color ? '2px solid #2563eb' : '2px solid transparent',
                cursor: 'pointer'
              }}
            />
          ))}
        </>
      )}

      <div style={{ width: 1, height: 20, background: '#dee2e6' }} />

      {/* Export */}
      <button
        onClick={onExport}
        title="Export as PDF (Ctrl+E)"
        style={{
          padding: '5px 12px',
          background: '#2563eb',
          color: '#fff',
          borderRadius: 5,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        Export PDF
      </button>

      {/* Close document */}
      <NavBtn onClick={onClose} title="Close document">✕</NavBtn>
    </div>
  )
}
