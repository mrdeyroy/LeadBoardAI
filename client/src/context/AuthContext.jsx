import { createContext, useContext, useEffect, useState } from 'react'

import { api, getToken, setToken } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(() => Boolean(getToken()))

  useEffect(() => {
    if (!getToken()) {
      setInitializing(false)
      return
    }
    let cancelled = false
    api('/auth/me')
      .then((data) => {
        if (!cancelled) setUser(data.user)
      })
      .catch(() => {
        setToken(null)
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setInitializing(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password } })
    setToken(data.token)
    setUser(data.user)
  }

  const register = async (name, email, password) => {
    const data = await api('/auth/register', { method: 'POST', body: { name, email, password } })
    setToken(data.token)
    setUser(data.user)
  }

  const logout = async () => {
    setToken(null)
    setUser(null)
    try {
      await api('/auth/logout', { method: 'POST' })
    } catch {
      /* token is already cleared locally */
    }
  }

  return (
    <AuthContext.Provider value={{ user, initializing, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}