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

const PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  angle: (i / 16) * 360,
  distance: 90 + Math.random() * 60,
  color: ['#FFD700','#FF6B6B','#4ECDC4','#45B7D1','#FFA07A','#98D8C8'][i % 6],
}))

// phase: locked → shaking → open → choosing → done
export default function ChestScreen({ word, onRoomChosen, onOpenStickerbook, onSkip }) {
  const { t } = useLang()
  const { unlockSticker } = useStickers()
  const [phase, setPhase] = useState('locked')
  const [chosenRoom, setChosenRoom] = useState(null)

  const slug = word ? word.name.replace(/ /g, '_') : ''

  const handleChestTap = () => {
    if (phase !== 'locked') return
    setPhase('shaking')
    setTimeout(() => setPhase('open'), 500)
    setTimeout(() => setPhase('choosing'), 1400)
  }

  const handleRoomChosen = (roomId) => {
    if (chosenRoom) return
    setChosenRoom(roomId)
    unlockSticker(word.name, roomId)
    setPhase('done')
  }

  if (!word) return null

  return (
    <div className="chest-overlay">
      <div className="chest-backdrop" />

      {/* Particles */}
      <AnimatePresence>
        {(phase === 'open' || phase === 'choosing' || phase === 'done') && PARTICLES.map(p => (
          <motion.div
            key={p.id}
            className="chest-particle"
            style={{ background: p.color }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
              y: Math.sin((p.angle * Math.PI) / 180) * p.distance - 80,
              opacity: 0,
              scale: 0.3,
            }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>

      <div className="chest-center">
        {/* Chest visual */}
        <motion.div
          className="chest-wrap"
          animate={phase === 'shaking' ? {
            x: [-8, 8, -8, 8, -5, 5, 0],
            rotate: [-3, 3, -3, 3, -2, 2, 0],
          } : {}}
          transition={{ duration: 0.5 }}
          onClick={handleChestTap}
          style={{ cursor: phase === 'locked' ? 'pointer' : 'default' }}
        >
          {/* Lid */}
          <motion.div
            className="chest-lid"
            animate={phase === 'open' || phase === 'choosing' || phase === 'done'
              ? { rotateX: -130, y: -10 }
              : { rotateX: 0, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            style={{ transformOrigin: 'bottom center', transformStyle: 'preserve-3d' }}
          >
            <div className="chest-lid-inner" />
          </motion.div>
          {/* Body */}
          <div className="chest-body">
            <div className="chest-lock">
              <div className="chest-lock-shackle" />
              <div className="chest-lock-body" />
            </div>
            {/* Inner glow when open */}
            <AnimatePresence>
              {(phase === 'open' || phase === 'choosing' || phase === 'done') && (
                <motion.div
                  className="chest-glow"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Tap hint */}
        <AnimatePresence>
          {phase === 'locked' && (
            <motion.p
              className="chest-hint"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: [0.6, 1, 0.6], y: [0, -4, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, repeat: Infinity }}
            >
              {t.chest}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Sticker flying out */}
        <AnimatePresence>
          {(phase === 'open' || phase === 'choosing' || phase === 'done') && (
            <motion.div
              className="chest-sticker-fly"
              initial={{ y: 60, scale: 0, opacity: 0 }}
              animate={{ y: -160, scale: 1.1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
            >
              <img
                src={`/stickers/${slug}.png`}
                alt={word.name}
                className="chest-sticker-img"
                draggable={false}
              />
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

      {/* Bottom actions */}
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
        {phase === 'done' && chosenRoom && (
          <motion.div
            className="chest-done-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <motion.button
              className="chest-open-book-btn"
              onClick={onOpenStickerbook}
              whileTap={{ scale: 0.95 }}
            >
              📚 {t.chestOpenStickerbook}
            </motion.button>
            <motion.button
              className="chest-continue-btn"
              onClick={onRoomChosen}
              whileTap={{ scale: 0.95 }}
            >
              {t.playAgain}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
