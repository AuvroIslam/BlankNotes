import React from 'react'

interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 12,
          color: '#dc2626',
          padding: 40
        }}>
          <div style={{ fontSize: 32 }}>⚠</div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Something went wrong</div>
          <div style={{ fontSize: 13, color: '#868e96', maxWidth: 400, textAlign: 'center' }}>
            {this.state.error?.message}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: 8,
              padding: '8px 16px',
              background: '#2563eb',
              color: '#fff',
              borderRadius: 6,
              fontSize: 13
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
