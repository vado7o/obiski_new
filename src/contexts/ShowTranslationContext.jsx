import { createContext, useContext, useState } from 'react'

const STORAGE_KEY = 'obiski_show_translation'

const ShowTranslationContext = createContext(null)

export function ShowTranslationProvider({ children }) {
  const [showTranslation, setShowTranslationState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === null ? true : stored === 'true'
  })

  function setShowTranslation(v) {
    localStorage.setItem(STORAGE_KEY, String(v))
    setShowTranslationState(v)
  }

  return (
    <ShowTranslationContext.Provider value={{ showTranslation, setShowTranslation }}>
      {children}
    </ShowTranslationContext.Provider>
  )
}

export function useShowTranslation() {
  return useContext(ShowTranslationContext)
}
