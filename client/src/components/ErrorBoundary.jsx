import { Component } from 'react'
import { RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Fitcheck crashed:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="grid min-h-screen place-items-center bg-bone px-6 text-center">
        <div className="max-w-md">
          <p className="font-display text-[6rem] leading-none font-black text-lime-2">!</p>
          <h1 className="mt-4 font-display text-2xl font-black uppercase tracking-tight">Something broke on this page</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {String(this.state.error?.message || this.state.error)}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => this.setState({ error: null })}
              className="btn-press inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-xs font-black uppercase tracking-[0.15em] text-bone hover:bg-lime hover:text-ink"
            >
              <RefreshCw size={14} /> Try again
            </button>
            <a
              href="/"
              className="btn-press inline-flex items-center gap-2 rounded-full border border-ink/20 px-7 py-3.5 text-xs font-black uppercase tracking-[0.15em] text-ink hover:bg-ink hover:text-bone"
            >
              Back to home
            </a>
          </div>
        </div>
      </div>
    )
  }
}
