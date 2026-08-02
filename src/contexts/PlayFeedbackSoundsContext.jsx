import { createContext, useContext, useState } from 'react'

const STORAGE_KEY = 'obiski_play_feedback_sounds'

const PlayFeedbackSoundsContext = createContext(null)

export function PlayFeedbackSoundsProvider({ children }) {
  const [playFeedbackSounds, setPlayFeedbackSoundsState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === null ? true : stored === 'true'
  })

  function setPlayFeedbackSounds(v) {
    localStorage.setItem(STORAGE_KEY, String(v))
    setPlayFeedbackSoundsState(v)
  }

  return (
    <PlayFeedbackSoundsContext.Provider value={{ playFeedbackSounds, setPlayFeedbackSounds }}>
      {children}
    </PlayFeedbackSoundsContext.Provider>
  )
}

export function usePlayFeedbackSounds() {
  return useContext(PlayFeedbackSoundsContext)
}
