import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  label?: string
}

interface State {
  hasError: boolean
}

/** Soft-fail a section so one widget crash cannot white-screen the app. */
export class SoftErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn(this.props.label ?? 'SoftErrorBoundary', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}
