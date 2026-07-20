import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetch('/api/auth/user', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => setIsAdmin(!!(d && d.isAdmin)))
      .catch(() => setIsAdmin(false))
      .finally(() => setReady(true))
  }, [])

  const adminLogin = useCallback(async (password) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setIsAdmin(true)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  const adminLogout = useCallback(async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {})
    setIsAdmin(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAdmin, isOwner: isAdmin, ready, adminLogin, adminLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
