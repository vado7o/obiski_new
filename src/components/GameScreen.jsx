import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { themes, shuffleArray, BATCH_SIZE } from '../data/themes.js'
import { speak } from '../hooks/useSpeech.js'
import WordCard from './WordCard.jsx'
import './GameScreen.css'

function buildWordList(selectedIds) {
  const allWords = []
  for (const id of selectedIds) {
    const theme = themes.find(t => t.id === id)
    if (theme) {
      for (const w of theme.words) {
        allWords.push({ ...w, themeId: theme.id, themeColor: theme.color })
      }
    }
  }
  return shuffleArray(allWords)
}

export default function GameScreen({ selectedThemes, onComplete }) {
  const [wordList, setWordList] = useState([])
  const [currentBatch, setCurrentBatch] = useState([])
  const [wordIndex, setWordIndex] = useState(0)
  const [batchOffset, setBatchOffset] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [isLocked, setIsLocked] = useState(false)
  const [progress, setProgress] = useState(0)
  const speakTimeoutRef = useRef(null)

  useEffect(() => {
    const list = buildWordList(selectedThemes)
    setWordList(list)
    const batch = list.slice(0, BATCH_SIZE)
    setCurrentBatch(batch)
    setWordIndex(0)
    setBatchOffset(0)
    setProgress(0)
  }, [selectedThemes])

  const currentTarget = currentBatch[wordIndex] ?? null

  const speakCurrent = useCallback((word) => {
    if (!word) return
    speak(word.name)
  }, [])

  useEffect(() => {
    if (currentTarget) {
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current)
      speakTimeoutRef.current = setTimeout(() => {
        speakCurrent(currentTarget)
      }, 400)
    }
    return () => {
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current)
    }
  }, [currentTarget, speakCurrent])

  const handleCardClick = useCallback((word) => {
    if (isLocked || !currentTarget) return
    if (word.id === currentTarget.id) {
      setIsLocked(true)
      setFeedback({ id: word.id, type: 'correct' })
      speak('Correct!')
      const newProgress = batchOffset + wordIndex + 1
      setProgress(newProgress)
      setTimeout(() => {
        setFeedback(null)
        const nextIndex = wordIndex + 1
        if (nextIndex >= currentBatch.length) {
          const nextOffset = batchOffset + BATCH_SIZE
          if (nextOffset >= wordList.length) {
            onComplete()
          } else {
            const nextBatch = wordList.slice(nextOffset, nextOffset + BATCH_SIZE)
            setCurrentBatch(nextBatch)
            setBatchOffset(nextOffset)
            setWordIndex(0)
            setIsLocked(false)
          }
        } else {
          setWordIndex(nextIndex)
          setIsLocked(false)
        }
      }, 900)
    } else {
      setFeedback({ id: word.id, type: 'wrong' })
      speak('Try again!')
      setTimeout(() => {
        setFeedback(null)
        speakCurrent(currentTarget)
      }, 800)
    }
  }, [isLocked, currentTarget, wordIndex, currentBatch, batchOffset, wordList, onComplete, speakCurrent])

  const handleRepeat = () => {
    if (currentTarget) speakCurrent(currentTarget)
  }

  const totalWords = wordList.length
  const progressPct = totalWords > 0 ? (progress / totalWords) * 100 : 0

  return (
    <div className="game-screen">
      <div className="game-header">
        <div className="progress-bar-wrap">
          <motion.div
            className="progress-bar-fill"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <div className="game-stats">
          <span className="stat">{progress} / {totalWords} words</span>
        </div>
      </div>

      <div className="prompt-area">
        <motion.button
          className="speaker-btn"
          onClick={handleRepeat}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
        >
          <span className="speaker-icon">🔊</span>
          {currentTarget && (
            <span className="speaker-hint">Tap to hear again</span>
          )}
        </motion.button>
      </div>

      <div className="cards-grid">
        <AnimatePresence mode="wait">
          {currentBatch.map((word, i) => {
            const fb = feedback?.id === word.id ? feedback.type : null
            const isTarget = word.id === currentTarget?.id
            return (
              <WordCard
                key={`${batchOffset}-${word.id}`}
                word={word}
                index={i}
                feedback={fb}
                isTarget={isTarget}
                onClick={() => handleCardClick(word)}
              />
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
