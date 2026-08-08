import { createContext, useContext, useState, useCallback } from 'react'

const StickerContext = createContext(null)

const UNLOCKED_KEY = 'obiski_unlocked_stickers'
const POSITIONS_KEY = 'obiski_sticker_positions'

function loadUnlocked() {
  try { return JSON.parse(localStorage.getItem(UNLOCKED_KEY) || '[]') } catch { return [] }
}
function loadPositions() {
  try { return JSON.parse(localStorage.getItem(POSITIONS_KEY) || '{}') } catch { return {} }
}

export function StickerProvider({ children }) {
  const [unlocked, setUnlocked] = useState(loadUnlocked)
  const [positions, setPositions] = useState(loadPositions)

  const unlockSticker = useCallback((wordName, room) => {
    const slug = wordName.replace(/ /g, '_')
    setUnlocked(prev => {
      if (prev.includes(slug)) return prev
      const next = [...prev, slug]
      localStorage.setItem(UNLOCKED_KEY, JSON.stringify(next))
      return next
    })
    setPositions(prev => {
      if (prev[slug]) return prev
      const next = {
        ...prev,
        [slug]: { room, xPct: 25 + Math.random() * 50, yPct: 15 + Math.random() * 55 },
      }
      localStorage.setItem(POSITIONS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const moveStickerToRoom = useCallback((wordName, room) => {
    const slug = wordName.replace(/ /g, '_')
    setPositions(prev => {
      const next = {
        ...prev,
        [slug]: { room, xPct: 25 + Math.random() * 50, yPct: 15 + Math.random() * 55 },
      }
      localStorage.setItem(POSITIONS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const updateStickerPosition = useCallback((wordName, xPct, yPct) => {
    const slug = wordName.replace(/ /g, '_')
    setPositions(prev => {
      const existing = prev[slug] || { room: 'island' }
      const next = { ...prev, [slug]: { ...existing, xPct, yPct } }
      localStorage.setItem(POSITIONS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <StickerContext.Provider value={{ unlocked, positions, unlockSticker, moveStickerToRoom, updateStickerPosition }}>
      {children}
    </StickerContext.Provider>
  )
}

export function useStickers() {
  return useContext(StickerContext)
}
