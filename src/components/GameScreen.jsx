import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { shuffleArray } from '../data/themes.js'
import { useDifficulty } from '../contexts/DifficultyContext.jsx'
import { useShowTranslation } from '../contexts/ShowTranslationContext.jsx'
import { speak, speakWordObject } from '../hooks/useSpeech.js'
import { useLang } from '../contexts/LanguageContext.jsx'
import { useContent } from '../contexts/ContentContext.jsx'
import { getFeedbackSounds } from '../api.js'
import { getAllBlobsForLang } from '../db/userSoundsDB.js'
import WordCard from './WordCard.jsx'
import './GameScreen.css'

function AnimatedSpeaker() {
  return (
    <div className="speaker-playing-wrap">
      <div className="speaker-playing-glow" />
      <svg className="speaker-playing-svg" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M10 24 L10 40 L20 40 L33 52 L33 12 L20 24 Z" fill="#7C4DFF" />
        <path className="speaker-wave speaker-wave-1" d="M38 29 Q43 32 38 35" stroke="#7C4DFF" strokeWidth="2.8" strokeLinecap="round" />
        <path className="speaker-wave speaker-wave-2" d="M42 23 Q52 32 42 41" stroke="#7C4DFF" strokeWidth="2.8" strokeLinecap="round" />
        <path className="speaker-wave speaker-wave-3" d="M47 17 Q62 32 47 47" stroke="#7C4DFF" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
    </div>
  )
}

function playRandom(urls, onEnd) {
  if (!urls || urls.length === 0) return false
  const url = urls[Math.floor(Math.random() * urls.length)]
  try {
    const audio = new Audio(url)
    const done = () => { if (onEnd) onEnd() }
    audio.onended = done
    audio.onerror = done
    audio.play().catch(done)
  } catch {
    if (onEnd) onEnd()
  }
  return true
}

function buildWordList(selectedIds, themes) {
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
  const { t, lang } = useLang()
  const { themes } = useContent()
  const { difficulty } = useDifficulty()
  const { showTranslation } = useShowTranslation()
  const [wordList, setWordList] = useState([])
  const [batchState, setBatchState] = useState({ words: [], displayOrder: [], questionOrder: [] })
  const [questionIndex, setQuestionIndex] = useState(0)
  const [batchOffset, setBatchOffset] = useState(0)
  const [feedback, setFeedback] = useState(null)
  const [isLocked, setIsLocked] = useState(false)
  const [progress, setProgress] = useState(0)
  const [answeredIds, setAnsweredIds] = useState(new Set())
  const [feedbackSounds, setFeedbackSounds] = useState({ correct: [], incorrect: [] })
  const speakTimeoutRef = useRef(null)
  const suppressAutoSpeakRef = useRef(false)
  const wrapRef = useRef(null)
  const debounceRef = useRef(null)
  const correctCountRef = useRef(0)
  const [gridLayout, setGridLayout] = useState({ cols: 4, rows: 2, gridW: null, gridH: null })

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const update = () => {
      const W = el.clientWidth
      const H = el.clientHeight
      if (W > 0 && H > 0) {
        setGridLayout(prev => {
          const next = computeOptimalLayout(W, H, difficulty)
          if (prev.cols === next.cols && prev.rows === next.rows &&
              prev.gridW === next.gridW && prev.gridH === next.gridH) return prev
          return next
        })
      }
    }
    const debouncedUpdate = () => {
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(update, 80)
    }
    update()
    const ro = new ResizeObserver(debouncedUpdate)
    ro.observe(el)
    return () => { ro.disconnect(); clearTimeout(debounceRef.current) }
  }, [difficulty])

  useEffect(() => {
    const list = buildWordList(selectedThemes, themes)
    setWordList(list)
    correctCountRef.current = 0
    const batch = list.slice(0, difficulty)
    setBatchState(makeBatchState(batch))
    setQuestionIndex(0)
    setBatchOffset(0)
    setProgress(0)
    setAnsweredIds(new Set())
  }, [selectedThemes, difficulty])

  useEffect(() => {
    let active = true
    const createdUrls = []

    async function load() {
      try {
        const userBlobs = await getAllBlobsForLang(lang)
        const correctUrls = userBlobs.correct
          .filter(Boolean)
          .map((b) => { const u = URL.createObjectURL(b); createdUrls.push(u); return u })
        const incorrectUrls = userBlobs.incorrect
          .filter(Boolean)
          .map((b) => { const u = URL.createObjectURL(b); createdUrls.push(u); return u })

        if (correctUrls.length > 0 || incorrectUrls.length > 0) {
          if (active) setFeedbackSounds({ correct: correctUrls, incorrect: incorrectUrls })
          return
        }
        const serverSounds = await getFeedbackSounds(lang)
        if (active) setFeedbackSounds(serverSounds)
      } catch {
        try {
          const serverSounds = await getFeedbackSounds(lang)
          if (active) setFeedbackSounds(serverSounds)
        } catch {}
      }
    }

    load()
    return () => {
      active = false
      for (const url of createdUrls) URL.revokeObjectURL(url)
    }
  }, [lang])

  const currentTarget = batchState.words[batchState.questionOrder[questionIndex]] ?? null

  const speakCurrent = useCallback((word, onEnd) => {
    if (!word) { onEnd?.(); return }
    speakWordObject(word, onEnd)
  }, [])

  useEffect(() => {
    if (!currentTarget) return
    if (suppressAutoSpeakRef.current) {
      suppressAutoSpeakRef.current = false
      return
    }
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current)
    speakTimeoutRef.current = setTimeout(() => {
      speakCurrent(currentTarget)
    }, 400)
    return () => {
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current)
    }
  }, [currentTarget, speakCurrent])

  const handleCardClick = useCallback((word) => {
    if (isLocked || !currentTarget || answeredIds.has(word.id)) return

    // Cancel any pending auto-speak before we take control
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current)

    // Lock cards immediately for BOTH correct and incorrect
    setIsLocked(true)

    if (word.id === currentTarget.id) {
      // ── CORRECT ──────────────────────────────────────────────
      correctCountRef.current += 1
      setFeedback({ id: word.id, type: 'correct' })
      setProgress(batchOffset + questionIndex + 1)

      // After feedback sound ends → advance state → speak next word → unlock
      const afterFeedback = () => {
        setFeedback(null)

        const newAnswered = new Set(answeredIds)
        newAnswered.add(word.id)
        setAnsweredIds(newAnswered)

        const nextQIndex = questionIndex + 1
        const unlock = () => setIsLocked(false)

        if (nextQIndex >= batchState.words.length) {
          // Batch finished
          const nextOffset = batchOffset + difficulty
          if (nextOffset >= wordList.length) {
            onComplete({ themes: selectedThemes, difficulty, cardsTotal: wordList.length, cardsCorrect: correctCountRef.current })
          } else {
            const nextBatch = wordList.slice(nextOffset, nextOffset + difficulty)
            const nextState = makeBatchState(nextBatch)
            suppressAutoSpeakRef.current = true
            setBatchState(nextState)
            setBatchOffset(nextOffset)
            setQuestionIndex(0)
            setAnsweredIds(new Set())
            const firstWord = nextState.words[nextState.questionOrder[0]]
            speakCurrent(firstWord, unlock)
          }
        } else {
          // Next card in same batch
          const nextWord = batchState.words[batchState.questionOrder[nextQIndex]]
          suppressAutoSpeakRef.current = true
          setQuestionIndex(nextQIndex)
          speakCurrent(nextWord, unlock)
        }
      }

      if (!playRandom(feedbackSounds.correct, afterFeedback)) {
        speak(t.correct, afterFeedback)
      }

    } else {
      // ── INCORRECT ────────────────────────────────────────────
      setFeedback({ id: word.id, type: 'wrong' })

      // After feedback sound ends → clear visual → re-speak current word → unlock
      const afterFeedback = () => {
        setFeedback(null)
        speakCurrent(currentTarget, () => setIsLocked(false))
      }

      if (!playRandom(feedbackSounds.incorrect, afterFeedback)) {
        speak(t.tryAgain, afterFeedback)
      }
    }
  }, [isLocked, currentTarget, questionIndex, batchState, batchOffset, wordList, answeredIds, feedbackSounds, onComplete, speakCurrent, t, difficulty])

  const handleRepeat = () => {
    if (currentTarget) speakCurrent(currentTarget)
  }

  const totalWords = wordList.length
  const progressPct = totalWords > 0 ? (progress / totalWords) * 100 : 0

  const layoutKey = `${gridLayout.cols}x${gridLayout.rows}`

  return (
    <div className="game-screen">
      <div className="game-nav">
        <span className="app-title">Obiski</span>
        <button className="menu-btn" onClick={onMenu}>
          {t.backBtn}
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
        {showTranslation && currentTarget && (
          <div className="word-translation">{currentTarget.name}</div>
        )}
      </div>

      <div className="prompt-area">
        {isLocked ? (
          <AnimatedSpeaker />
        ) : (
          <motion.button
            className="speaker-btn"
            onClick={handleRepeat}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.93 }}
          >
            {currentTarget && (
              <span className="speaker-hint">{t.tapToHear}</span>
            )}
          </motion.button>
        )}
      </div>

      <div className="cards-grid-wrap" ref={wrapRef}>
        <AnimatePresence mode="wait">
          <motion.div
            key={layoutKey}
            className="cards-grid"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{
              opacity: 1,
              scale: 1,
              width: gridLayout.gridW ?? undefined,
              height: gridLayout.gridH ?? undefined,
            }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{
              opacity: { duration: 0.18, ease: 'easeInOut' },
              scale: { duration: 0.22, ease: [0.34, 1.26, 0.64, 1] },
              width: { type: 'spring', stiffness: 280, damping: 28 },
              height: { type: 'spring', stiffness: 280, damping: 28 },
            }}
            style={{
              gridTemplateColumns: `repeat(${gridLayout.cols}, 1fr)`,
              gridTemplateRows: `repeat(${gridLayout.rows}, 1fr)`,
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
                  isLocked={isLocked}
                  onClick={() => handleCardClick(word)}
                />
              )
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
