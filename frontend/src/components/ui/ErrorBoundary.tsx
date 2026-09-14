import { Component } from 'react'
import { ErrorState } from './ErrorState.tsx'

export class ErrorBoundary extends Component<any, any> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError)
      return <ErrorState onRetry={() => this.setState({ hasError: false })} />
    return this.props.children
  }
}
