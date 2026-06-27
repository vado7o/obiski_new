import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getMe, login as apiLogin, logout as apiLogout } from '../api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    getMe()
      .then((d) => setIsAdmin(!!(d && d.authenticated)))
      .catch(() => setIsAdmin(false))
      .finally(() => setReady(true))
  }, [])

  const login = useCallback(async (password) => {
    const d = await apiLogin(password)
    setIsAdmin(!!(d && d.authenticated))
    return d
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setIsAdmin(false)
  }, [])

  return (
    <AuthContext.Provider value={{ isAdmin, ready, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
