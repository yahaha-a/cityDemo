import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class GameErrorBoundary extends Component<Props, State> {
  private errorCount = 0

  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.errorCount++
    console.error(
      `[GameErrorBoundary] 错误 #${this.errorCount}`,
      error,
      info.componentStack
    )
  }

  private handleRetry = () => {
    if (this.errorCount >= 3) {
      window.location.reload()
      return
    }
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--game-parchment-dark)]">
          <div className="max-w-md text-center p-6 game-parchment-bg game-wood-frame rounded-[var(--game-radius-lg)]">
            <h2 className="text-xl font-bold font-[family-name:var(--font-heading)] text-[var(--game-red)] mb-2">
              游戏发生错误
            </h2>
            <p className="text-sm text-[var(--game-text-muted)] mb-4">
              {this.state.error?.message ?? '未知错误'}
            </p>
            <button
              className="px-4 py-2 bg-[var(--game-green)] text-white rounded-[var(--game-radius-md)] border border-[var(--game-green)] hover:brightness-110 transition-all cursor-pointer shadow-[var(--game-shadow-button)] active:translate-y-[1px] active:shadow-none"
              onClick={this.handleRetry}
              type="button"
            >
              {this.errorCount >= 3 ? '重新加载页面' : '重试'}
            </button>
            {this.errorCount >= 2 && (
              <p className="text-xs text-[var(--game-text-muted)] mt-2">
                已连续发生 {this.errorCount} 次错误
              </p>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
