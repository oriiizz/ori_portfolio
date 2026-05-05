import { Component } from 'react'

/** 首屏任意子树抛错时避免整页空白；开发时能看到文案而非空 #root */
export default class RootErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[RootErrorBoundary]', error, info?.componentStack)
  }

  render() {
    const { error } = this.state
    if (error) {
      return (
        <div
          style={{
            minHeight: '100dvh',
            padding: '2rem',
            fontFamily: 'system-ui, sans-serif',
            background: '#0a0908',
            color: '#f4f0e8',
          }}
        >
          <h1 style={{ fontSize: '1.25rem', marginTop: 0 }}>Something went wrong</h1>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.875rem' }}>
            {String(error?.message ?? error)}
          </pre>
          <p style={{ fontSize: '0.875rem', color: '#a8a29e' }}>
            Open the browser console (F12) for the full stack. If you only need the static build, open{' '}
            <code>welcome_new.html</code> instead of the dev server.
          </p>
        </div>
      )
    }
    return this.props.children
  }
}
