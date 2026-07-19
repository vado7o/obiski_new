import { createContext, useContext, useState } from 'react'

const STORAGE_KEY = 'obiski_show_text'

const ShowTextContext = createContext(null)

export function ShowTextProvider({ children }) {
  const [showText, setShowTextState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === null ? true : stored === 'true'
  })

  function setShowText(v) {
    localStorage.setItem(STORAGE_KEY, String(v))
    setShowTextState(v)
  }

  return (
    <ShowTextContext.Provider value={{ showText, setShowText }}>
      {children}
    </ShowTextContext.Provider>
  )
}

export function useShowText() {
  return useContext(ShowTextContext)
}
