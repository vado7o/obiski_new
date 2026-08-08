import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../contexts/LanguageContext.jsx'
import { useContent } from '../contexts/ContentContext.jsx'
import { useStickers } from '../contexts/StickerContext.jsx'
import './StickerBook.css'

const ROOMS = [
  { id: 'island',   icon: '🌴', label: 'island',   bg: '/rooms/island.jpg' },
  { id: 'myroom',   icon: '🏠', label: 'myroom',   bg: '/rooms/myroom.jpg' },
  { id: 'worldmap', icon: '🌍', label: 'worldmap', bg: '/rooms/worldmap.jpg' },
  { id: 'garage',   icon: '🔧', label: 'garage',   bg: '/rooms/garage.jpg' },
]

function DraggableSticker({ word, xPct, yPct, onPositionChange, onTap }) {
  const ref = useRef()
  const dragState = useRef(null)
  const [localPos, setLocalPos] = useState({ xPct, yPct })
  const [bouncing, setBouncing] = useState(false)

  const handlePointerDown = (e) => {
    e.preventDefault()
    if (ref.current) ref.current.setPointerCapture(e.pointerId)
    const container = ref.current?.parentElement
    if (!container) return
    const rect = container.getBoundingClientRect()
    dragState.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startXPct: localPos.xPct,
      startYPct: localPos.yPct,
      containerW: rect.width,
      containerH: rect.height,
    }
  }

  const handlePointerMove = (e) => {
    if (!dragState.current) return
    const { startClientX, startClientY, startXPct, startYPct, containerW, containerH } = dragState.current
    const dx = ((e.clientX - startClientX) / containerW) * 100
    const dy = ((e.clientY - startClientY) / containerH) * 100
    setLocalPos({
      xPct: Math.max(0, Math.min(88, startXPct + dx)),
      yPct: Math.max(0, Math.min(82, startYPct + dy)),
    })
  }

  const handlePointerUp = (e) => {
    if (!dragState.current) return
    const moved =
      Math.abs(e.clientX - dragState.current.startClientX) > 6 ||
      Math.abs(e.clientY - dragState.current.startClientY) > 6
    if (!moved) {
      setBouncing(true)
      setTimeout(() => setBouncing(false), 600)
      onTap(word)
    } else {
      onPositionChange(word.name, localPos.xPct, localPos.yPct)
    }
    dragState.current = null
  }

  return (
    <motion.div
      ref={ref}
      className="sticker-item"
      style={{ left: `${localPos.xPct}%`, top: `${localPos.yPct}%` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      animate={bouncing ? { y: [-12, 0, -6, 0], scale: [1, 1.15, 1.05, 1] } : {}}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      <img
        src={`/stickers/${word.name.trim().toLowerCase().replace(/ /g, '_')}.png`}
        alt={word.name}
        className="sticker-img"
        draggable={false}
        onError={e => {
          e.target.style.display = 'none'
          const fb = e.target.parentElement.querySelector('.sticker-emoji-fb')
          if (fb) fb.style.display = 'flex'
        }}
      />
      <span className="sticker-emoji-fb" style={{ display: 'none' }}>
        {word.emoji || '🎁'}
      </span>
    </motion.div>
  )
}

function RoomCanvas({ roomId, stickersInRoom, allWords, onPositionChange, onTap }) {
  const room = ROOMS.find(r => r.id === roomId)
  if (!room) return null

  return (
    <div className="room-canvas">
      <img src={room.bg} alt="" className="room-bg" draggable={false} />
      {stickersInRoom.map(({ slug, xPct, yPct }) => {
        const word = allWords.find(w => w.name.replace(/ /g, '_') === slug)
        if (!word) return null
        return (
          <DraggableSticker
            key={slug}
            word={word}
            xPct={xPct}
            yPct={yPct}
            onPositionChange={onPositionChange}
            onTap={onTap}
          />
        )
      })}
      {stickersInRoom.length === 0 && (
        <div className="room-empty">
          <span>{room.icon}</span>
        </div>
      )}
    </div>
  )
}

export default function StickerBook({ onClose }) {
  const { t } = useLang()
  const { themes } = useContent()
  const { unlocked, positions, updateStickerPosition } = useStickers()
  const [activeRoom, setActiveRoom] = useState('island')

  const allWords = themes.flatMap(th => th.words)

  const stickersInRoom = unlocked
    .map(slug => ({ slug, ...(positions[slug] || { room: 'island', xPct: 30, yPct: 30 }) }))
    .filter(s => (s.room || 'island') === activeRoom)

  const handleTap = useCallback((word) => {
    const audioUrl = word.audioUrl
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.play().catch(() => {})
    } else if (window.speechSynthesis) {
      const utt = new SpeechSynthesisUtterance(word.name)
      utt.lang = 'en-US'
      speechSynthesis.cancel()
      speechSynthesis.speak(utt)
    }
  }, [])

  const handlePositionChange = useCallback((wordName, xPct, yPct) => {
    updateStickerPosition(wordName, xPct, yPct)
  }, [updateStickerPosition])

  return (
    <div className="stickerbook-overlay">
      {/* Header */}
      <div className="stickerbook-header">
        <h2 className="stickerbook-title">{t.stickerbookTitle}</h2>
        <button className="stickerbook-close" onClick={onClose} aria-label="close">✕</button>
      </div>

      {/* Room canvas */}
      <div className="stickerbook-canvas-wrap">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRoom}
            className="stickerbook-canvas-inner"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
          >
            <RoomCanvas
              roomId={activeRoom}
              stickersInRoom={stickersInRoom}
              allWords={allWords}
              onPositionChange={handlePositionChange}
              onTap={handleTap}
            />
          </motion.div>
        </AnimatePresence>

        {/* Sticker count badge */}
        <div className="stickerbook-count">
          🏆 {unlocked.length}
        </div>
      </div>

      {/* Tab bar */}
      <div className="stickerbook-tabs">
        {ROOMS.map(room => {
          const count = unlocked.filter(s => (positions[s]?.room || 'island') === room.id).length
          return (
            <button
              key={room.id}
              className={`stickerbook-tab ${activeRoom === room.id ? 'active' : ''}`}
              onClick={() => setActiveRoom(room.id)}
            >
              <span className="tab-icon">{room.icon}</span>
              <span className="tab-label">{t.rooms[room.id]}</span>
              {count > 0 && <span className="tab-badge">{count}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
