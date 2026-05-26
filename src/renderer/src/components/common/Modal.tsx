import React from 'react'

interface Props {
  title: string
  children: React.ReactNode
  onClose?: () => void
  footer?: React.ReactNode
}

export function Modal({ title, children, onClose, footer }: Props): React.ReactElement {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 8,
        width: 440,
        maxWidth: '90vw',
        boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                color: '#868e96',
                fontSize: 18,
                lineHeight: 1,
                padding: '2px 6px',
                borderRadius: 4
              }}
            >
              ×
            </button>
          )}
        </div>
        <div style={{ padding: 20 }}>{children}</div>
        {footer && (
          <div style={{
            padding: '12px 20px',
            borderTop: '1px solid #dee2e6',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
