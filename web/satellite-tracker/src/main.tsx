import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch(error: Error) {
    console.error('App crashed:', error)
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            color: '#e8eaf3',
            fontFamily: 'ui-sans-serif, system-ui',
            background: 'radial-gradient(circle at 50% 0%, #2a0a18 0%, #04050d 60%)',
          }}
        >
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ marginTop: 0 }}>Something went wrong rendering the sky.</h2>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                background: 'rgba(0,0,0,0.4)',
                padding: 12,
                borderRadius: 8,
                fontSize: 12,
                opacity: 0.85,
              }}
            >
              {String(this.state.error?.stack ?? this.state.error)}
            </pre>
            <button
              onClick={() => location.reload()}
              style={{
                marginTop: 16,
                background: 'linear-gradient(90deg,#7ecbff,#a78bfa)',
                color: '#08081a',
                border: 0,
                borderRadius: 999,
                padding: '10px 22px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
