import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getContent } from '../api.js'

const ContentContext = createContext(null)

export function ContentProvider({ children }) {
  const [themes, setThemes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getContent()
      setThemes(data.themes || [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <ContentContext.Provider value={{ themes, loading, error, refresh }}>
      {children}
    </ContentContext.Provider>
  )
}

export function useContent() {
  return useContext(ContentContext)
}
