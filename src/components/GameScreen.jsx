import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { themes, shuffleArray, BATCH_SIZE } from '../data/themes.js'
import { speak } from '../hooks/useSpeech.js'
import { useLang } from '../contexts/LanguageContext.jsx'
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

function makeBatchState(batch) {
  return {
    words: batch,
    displayOrder: shuffleArray([...Array(batch.length).keys()]),
    questionOrder: shuffleArray([...Array(batch.length).keys()]),
  }
}

const GAP = 8

function computeOptimalLayout(W, H, n) {
  let bestSize = 0
  let bestCols = 4
  let bestRows = Math.ceil(n / 4)
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols)
    const cardW = (W - GAP * (cols - 1)) / cols
    const cardH = (H - GAP * (rows - 1)) / rows
    const size = Math.min(cardW, cardH)
    if (size > bestSize) {
      bestSize = size
      bestCols = cols
      bestRows = rows
    }
  }
  const cardSize = Math.min(
    (W - GAP * (bestCols - 1)) / bestCols,
    (H - GAP * (bestRows - 1)) / bestRows
  )
  return {
    cols: bestCols,
    rows: bestRows,
    gridW: Math.floor(cardSize * bestCols + GAP * (bestCols - 1)),
    gridH: Math.floor(cardSize * bestRows + GAP * (bestRows - 1)),
  }
}

export default function GameScreen({ selectedThemes, onComplete, onMenu }) {
  const { t } = useLang()
  const [wordList, setWordList] = useState([])
  const [batchState, setBatchState] = useState({ words: [], displayOrder: [], questionOrder: [] })
  const [questionIndex, setQuestionIndex] = useState(0)
  const [batchOffset, setBatchOffset] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [isLocked, setIsLocked] = useState(false)
  const [progress, setProgress] = useState(0)
  const [answeredIds, setAnsweredIds] = useState(new Set())
  const speakTimeoutRef = useRef(null)
  const wrapRef = useRef(null)
  const [gridLayout, setGridLayout] = useState({ cols: 4, rows: 2, gridW: null, gridH: null })

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      const W = el.clientWidth
      const H = el.clientHeight
      if (W > 0 && H > 0) {
        setGridLayout(computeOptimalLayout(W, H, BATCH_SIZE))
      }
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const list = buildWordList(selectedThemes)
    setWordList(list)
    const batch = list.slice(0, BATCH_SIZE)
    setBatchState(makeBatchState(batch))
    setQuestionIndex(0)
    setBatchOffset(0)
    setProgress(0)
    setAnsweredIds(new Set())
  }, [selectedThemes])

  const currentTarget = batchState.words[batchState.questionOrder[questionIndex]] ?? null

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
    if (isLocked || !currentTarget || answeredIds.has(word.id)) return

    if (word.id === currentTarget.id) {
      setIsLocked(true)
      setFeedback({ id: word.id, type: 'correct' })
      speak(t.correct)

      const newProgress = batchOffset + questionIndex + 1
      setProgress(newProgress)

      setTimeout(() => {
        setFeedback(null)

        const newAnswered = new Set(answeredIds)
        newAnswered.add(word.id)
        setAnsweredIds(newAnswered)

        const nextQIndex = questionIndex + 1

        if (nextQIndex >= batchState.words.length) {
          const nextOffset = batchOffset + BATCH_SIZE
          setTimeout(() => {
            if (nextOffset >= wordList.length) {
              onComplete()
            } else {
              const nextBatch = wordList.slice(nextOffset, nextOffset + BATCH_SIZE)
              setBatchState(makeBatchState(nextBatch))
              setBatchOffset(nextOffset)
              setQuestionIndex(0)
              setAnsweredIds(new Set())
              setIsLocked(false)
            }
          }, 600)
        } else {
          setQuestionIndex(nextQIndex)
          setIsLocked(false)
        }
      }, 700)
    } else {
      setFeedback({ id: word.id, type: 'wrong' })
      speak(t.tryAgain)
      setTimeout(() => {
        setFeedback(null)
        speakCurrent(currentTarget)
      }, 800)
    }
  }, [isLocked, currentTarget, questionIndex, batchState, batchOffset, wordList, answeredIds, onComplete, speakCurrent])

  const handleRepeat = () => {
    if (currentTarget) speakCurrent(currentTarget)
  }

  const totalWords = wordList.length
  const progressPct = totalWords > 0 ? (progress / totalWords) * 100 : 0

  return (
    <div className="game-screen">
      <div className="game-nav">
        <span className="app-title">Obiski</span>
        <button className="menu-btn" onClick={onMenu}>
          {t.menuBtn}
        </button>
      </div>
      <div className="game-header">
        <div className="progress-bar-wrap">
          <motion.div
            className="progress-bar-fill"
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <div className="game-stats">
          <span className="stat">{t.wordsProgress(progress, totalWords)}</span>
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
            <span className="speaker-hint">{t.tapToHear}</span>
          )}
        </motion.button>
      </div>

      <div className="cards-grid-wrap" ref={wrapRef}>
        <div
          className="cards-grid"
          style={{
            gridTemplateColumns: `repeat(${gridLayout.cols}, 1fr)`,
            gridTemplateRows: `repeat(${gridLayout.rows}, 1fr)`,
            ...(gridLayout.gridW ? { width: gridLayout.gridW, height: gridLayout.gridH } : {}),
          }}
        >
          {batchState.displayOrder.map((wordIdx, i) => {
            const word = batchState.words[wordIdx]
            const fb = feedback?.id === word.id ? feedback.type : null
            const isAnswered = answeredIds.has(word.id)
            return (
              <WordCard
                key={`${batchOffset}-${word.id}`}
                word={word}
                index={i}
                feedback={fb}
                isAnswered={isAnswered}
                onClick={() => handleCardClick(word)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
