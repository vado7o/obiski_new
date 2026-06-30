import { createContext, useContext, useState } from 'react'

const DIFFICULTY_OPTIONS = [3, 4, 8, 10]
const STORAGE_KEY = 'obiski_difficulty'
const DEFAULT_DIFFICULTY = 4

const DifficultyContext = createContext(null)

export function DifficultyProvider({ children }) {
  const [difficulty, setDifficultyState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    const n = parseInt(stored, 10)
    return DIFFICULTY_OPTIONS.includes(n) ? n : DEFAULT_DIFFICULTY
  })

  function setDifficulty(n) {
    localStorage.setItem(STORAGE_KEY, String(n))
    setDifficultyState(n)
  }

  return (
    <DifficultyContext.Provider value={{ difficulty, setDifficulty, DIFFICULTY_OPTIONS }}>
      {children}
    </DifficultyContext.Provider>
  )
}

export function useDifficulty() {
  return useContext(DifficultyContext)
}
