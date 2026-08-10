import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'

import { setSessionTokenProvider } from '@/lib/api'

export function ClerkTokenBridge() {
  const { getToken } = useAuth()

  useEffect(() => {
    setSessionTokenProvider(() => getToken())
    return () => setSessionTokenProvider(null)
  }, [getToken])

  return null
}