import React from 'react'

interface Props {
  size?: number
  message?: string
}

export function LoadingSpinner({ size = 24, message }: Props): React.ReactElement {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      color: '#868e96'
    }}>
      <div style={{
        width: size,
        height: size,
        border: `2px solid #dee2e6`,
        borderTopColor: '#2563eb',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
      {message && <span style={{ fontSize: 13 }}>{message}</span>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
