import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { speak } from '../hooks/useSpeech.js'
import { useLang } from '../contexts/LanguageContext.jsx'
import './VictoryScreen.css'

export default function VictoryScreen({ onPlayAgain }) {
  const { t } = useLang()
  const hasSpoken = useRef(false)

  useEffect(() => {
    const fire = () => {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#7C4DFF', '#FF6D00', '#4CAF50', '#FFD700', '#E91E63'],
      })
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { x: 0.1, y: 0.6 },
          colors: ['#42A5F5', '#FF7043', '#9C27B0'],
        })
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { x: 0.9, y: 0.6 },
          colors: ['#66BB6A', '#FFA726', '#EC407A'],
        })
      }, 300)
    }
    fire()
    const interval = setInterval(fire, 2500)

    if (!hasSpoken.current) {
      hasSpoken.current = true
      setTimeout(() => speak(t.congrats), 500)
    }

    return () => clearInterval(interval)
  }, [t])

  return (
    <div className="victory-screen">
      <motion.div
        className="victory-content"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
      >
        <motion.div
          className="trophy"
          animate={{ rotate: [0, -10, 10, -8, 8, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 1.2, delay: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          🏆
        </motion.div>

        <motion.h1
          className="victory-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {t.amazing}
        </motion.h1>

        <motion.p
          className="victory-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          {t.completedAll}
        </motion.p>

        <motion.div
          className="stars"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {['⭐', '⭐', '⭐'].map((star, i) => (
            <motion.span
              key={i}
              className="star"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.7 + i * 0.15 }}
            >
              {star}
            </motion.span>
          ))}
        </motion.div>

        <motion.button
          className="play-again-btn"
          onClick={onPlayAgain}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.95 }}
        >
          {t.playAgain}
        </motion.button>
      </motion.div>
    </div>
  )
}
