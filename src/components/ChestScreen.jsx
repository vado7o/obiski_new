import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../contexts/LanguageContext.jsx'
import { useStickers } from '../contexts/StickerContext.jsx'
import './ChestScreen.css'

const ROOMS = [
  { id: 'island',   icon: '🌴', color: '#4CAF50' },
  { id: 'myroom',   icon: '🏠', color: '#9C27B0' },
  { id: 'worldmap', icon: '🌍', color: '#2196F3' },
  { id: 'garage',   icon: '🔧', color: '#FF5722' },
]

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  angle: (i / 20) * 360,
  distance: 100 + (i % 3) * 40,
  color: ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8','#FF69B4','#7CFC00'][i % 8],
}))

// phase: locked → shaking → open → choosing → done
export default function ChestScreen({ word, onOpenStickerbook, onSkip }) {
  const { t } = useLang()
  const { unlockSticker } = useStickers()
  const [phase, setPhase] = useState('locked')
  const [chosenRoom, setChosenRoom] = useState(null)

  const slug = word ? word.name.trim().toLowerCase().replace(/ /g, '_') : ''

  const handleChestTap = () => {
    if (phase !== 'locked') return
    setPhase('shaking')
    setTimeout(() => setPhase('open'), 500)
    setTimeout(() => setPhase('choosing'), 1400)
  }

  const handleRoomChosen = (roomId) => {
    if (chosenRoom) return
    setChosenRoom(roomId)
    if (word) unlockSticker(word.name, roomId)
    setPhase('done')
    // Auto-open stickerbook to chosen room after brief celebration
    setTimeout(() => {
      onOpenStickerbook(roomId)
    }, 1500)
  }

  const isOpen = phase === 'open' || phase === 'choosing' || phase === 'done'

  if (!word) return null

  return (
    <div className="chest-overlay">
      <div className="chest-backdrop" />

      {/* Particles */}
      <AnimatePresence>
        {isOpen && PARTICLES.map(p => (
          <motion.div
            key={p.id}
            className="chest-particle"
            style={{ background: p.color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
              y: Math.sin((p.angle * Math.PI) / 180) * p.distance - 100,
              opacity: 0,
              scale: 0.3,
            }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      <div className="chest-center">
        {/* 3D Chest image */}
        <motion.div
          className="chest-wrap"
          /* Idle wiggle when locked */
          animate={
            phase === 'locked'
              ? { rotate: [-2, 2, -2, 2, -1.5, 1.5, -1, 1, 0], y: [0, -4, 0, -3, 0] }
              : phase === 'shaking'
              ? { x: [-10, 10, -10, 10, -6, 6, 0], rotate: [-4, 4, -4, 4, -2, 2, 0] }
              : {}
          }
          transition={
            phase === 'locked'
              ? { duration: 3.5, repeat: Infinity, repeatDelay: 1.5, ease: 'easeInOut' }
              : { duration: 0.5 }
          }
          onClick={handleChestTap}
          style={{ cursor: phase === 'locked' ? 'pointer' : 'default' }}
        >
          <motion.img
            src="/chest-closed.png"
            alt="chest"
            className="chest-img"
            draggable={false}
            animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0.85 : 1 }}
            transition={{ duration: 0.35 }}
          />
          <motion.img
            src="/chest-open.png"
            alt="chest open"
            className="chest-img chest-img-open"
            draggable={false}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 0.85 }}
            transition={{ duration: 0.35 }}
          />
        </motion.div>

        {/* Tap hint — only visible when locked */}
        <motion.p
          className="chest-hint"
          animate={{ opacity: phase === 'locked' ? 1 : 0, y: phase === 'locked' ? [0, -5, 0] : 0 }}
          transition={
            phase === 'locked'
              ? { duration: 1.8, repeat: Infinity, repeatType: 'loop' }
              : { duration: 0.25 }
          }
          style={{ pointerEvents: 'none' }}
        >
          {t.chest}
        </motion.p>

        {/* Sticker flying out */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="chest-sticker-fly"
              initial={{ y: 60, scale: 0, opacity: 0 }}
              animate={{ y: -180, scale: 1.1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.25 }}
            >
              <img
                src={`/stickers/${slug}.png`}
                alt={word.name}
                className="chest-sticker-img"
                draggable={false}
                onError={e => {
                  e.target.style.display = 'none'
                  const fb = e.target.nextElementSibling
                  if (fb) fb.style.display = 'block'
                }}
              />
              <span className="chest-sticker-emoji" style={{ display: 'none' }}>
                {word.emoji || '🎁'}
              </span>
              <p className="chest-sticker-name">{word.name}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Room selection */}
      <AnimatePresence>
        {(phase === 'choosing' || phase === 'done') && (
          <motion.div
            className="chest-room-section"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          >
            <p className="chest-room-title">{t.chestChooseRoom}</p>
            <div className="chest-rooms">
              {ROOMS.map((room, i) => (
                <motion.button
                  key={room.id}
                  className={`chest-room-btn ${chosenRoom === room.id ? 'chosen' : ''}`}
                  style={{ '--room-color': room.color }}
                  onClick={() => handleRoomChosen(room.id)}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  whileTap={{ scale: 0.92 }}
                  disabled={!!chosenRoom}
                >
                  <span className="chest-room-icon">{room.icon}</span>
                  <span className="chest-room-label">{t.rooms[room.id]}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Done — brief auto-navigate message */}
      <AnimatePresence>
        {phase === 'done' && chosenRoom && (
          <motion.div
            className="chest-done-message"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.2 }}
          >
            ✨ {t.chestOpening || 'Открываем стикербук…'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip button — only before chest opens */}
      <AnimatePresence>
        {phase === 'locked' && (
          <motion.button
            className="chest-skip-btn"
            onClick={onSkip}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            whileTap={{ scale: 0.95 }}
          >
            {t.chestSkip}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
