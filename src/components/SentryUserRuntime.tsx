import { useEffect } from 'react'

import { useAuth } from '../context/AuthContext'
import { setSentryUser } from '../observability/sentry'

export default function SentryUserRuntime() {
  const { user } = useAuth()

  useEffect(() => {
    setSentryUser(user?.id ?? null)
    return () => setSentryUser(null)
  }, [user?.id])

  return null
}
