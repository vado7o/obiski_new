import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getMe } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getMe()
      .then((d) => {
        setUser(d && d.authenticated ? d.user : null)
        setIsOwner(!!(d && d.isOwner))
      })
      .catch(() => {
        setUser(null)
        setIsOwner(false)
      })
      .finally(() => setReady(true))
  }, [])

  const login = useCallback(() => {
    window.location.href = '/api/login'
  }, [])

  const logout = useCallback(() => {
    window.location.href = '/api/logout'
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, isOwner, isAdmin: isOwner, ready, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
