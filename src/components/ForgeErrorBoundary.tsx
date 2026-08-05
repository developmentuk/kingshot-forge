import * as Sentry from '@sentry/react'
import type { ReactNode } from 'react'

type ForgeErrorBoundaryProps = {
  children: ReactNode
}

export default function ForgeErrorBoundary({ children }: ForgeErrorBoundaryProps) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <main className="forge-error-boundary" role="alert">
          <section className="forge-error-boundary__panel">
            <p className="forge-error-boundary__eyebrow">Kingshot Forge</p>
            <h1>Something went wrong</h1>
            <p>
              The problem has been recorded safely. Reload Forge to continue.
            </p>
            <div className="forge-error-boundary__actions">
              <button type="button" onClick={() => window.location.reload()}>
                Reload Forge
              </button>
              <button type="button" className="secondary" onClick={resetError}>
                Try again
              </button>
            </div>
          </section>
        </main>
      )}
      beforeCapture={(scope) => {
        scope.setTag('forge.error_boundary', 'root')
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}
