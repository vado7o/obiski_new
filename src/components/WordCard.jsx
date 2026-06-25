import { useState } from 'react'
import { motion } from 'framer-motion'
import './WordCard.css'

export default function WordCard({ word, index, feedback, onClick }) {
  const [imgError, setImgError] = useState(false)
  const isCorrect = feedback === 'correct'
  const isWrong = feedback === 'wrong'

  return (
    <motion.button
      className={`word-card ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
      style={{ '--theme-color': word.themeColor }}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.3,
        delay: index * 0.04,
        type: 'spring',
        stiffness: 260,
        damping: 20,
      }}
      whileHover={{ scale: 1.04, y: -3 }}
      whileTap={{ scale: 0.96 }}
    >
      <div className="word-img-wrap">
        {!imgError ? (
          <img
            className="word-photo"
            src={word.imageUrl}
            alt={word.name}
            onError={() => setImgError(true)}
            draggable={false}
          />
        ) : (
          <span className="word-emoji-fallback">{word.emoji}</span>
        )}

        {isCorrect && (
          <motion.div
            className="feedback-overlay correct-overlay"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            ✓
          </motion.div>
        )}
        {isWrong && (
          <motion.div
            className="feedback-overlay wrong-overlay"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            ✗
          </motion.div>
        )}
      </div>
    </motion.button>
  )
}
