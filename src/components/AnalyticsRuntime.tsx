import { useEffect } from 'react'
import { track } from '../platform/analytics/analytics'

export default function AnalyticsRuntime() {
  useEffect(() => {
    const onError = () => track('javascript_error', { error_code: 'window_error' })
    const onRejection = () => track('javascript_error', { error_code: 'unhandled_rejection' })
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => { window.removeEventListener('error', onError); window.removeEventListener('unhandledrejection', onRejection) }
  }, [])
  return null
}
