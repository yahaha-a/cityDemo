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
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950 text-white">
          <div className="max-w-md text-center p-6">
            <h2 className="text-xl font-bold text-red-400 mb-2">
              游戏发生错误
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              {this.state.error?.message ?? '未知错误'}
            </p>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors"
              onClick={this.handleRetry}
              type="button"
            >
              {this.errorCount >= 3 ? '重新加载页面' : '重试'}
            </button>
            {this.errorCount >= 2 && (
              <p className="text-xs text-gray-500 mt-2">
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
