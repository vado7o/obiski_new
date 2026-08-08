import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LanguageProvider } from './contexts/LanguageContext.jsx'
import { ContentProvider } from './contexts/ContentContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { useAuth } from './contexts/AuthContext.jsx'
import { DifficultyProvider } from './contexts/DifficultyContext.jsx'
import { ShowTranslationProvider } from './contexts/ShowTranslationContext.jsx'
import { ShowTextProvider } from './contexts/ShowTextContext.jsx'
import { PlayFeedbackSoundsProvider } from './contexts/PlayFeedbackSoundsContext.jsx'
import { StickerProvider } from './contexts/StickerContext.jsx'
import { useLang } from './contexts/LanguageContext.jsx'
import { useContent } from './contexts/ContentContext.jsx'
import { useStickers } from './contexts/StickerContext.jsx'
import { useAnalytics } from './hooks/useAnalytics.js'
import ThemeSelector from './components/ThemeSelector.jsx'
import GameScreen from './components/GameScreen.jsx'
import VictoryScreen from './components/VictoryScreen.jsx'
import ChestScreen from './components/ChestScreen.jsx'
import StickerBook from './components/StickerBook.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import UserSoundsModal from './components/UserSoundsModal.jsx'

const SCREEN = {
  SELECT: 'select',
  GAME: 'game',
  VICTORY: 'victory',
  CHEST: 'chest',
  STICKERBOOK: 'stickerbook',
}

const THEME_TO_ROOM = {
  animals: 'island',
  insects: 'island',
  nature: 'island',
  fruits: 'island',
  body: 'myroom',
  clothes: 'myroom',
  food: 'myroom',
  vehicles: 'garage',
  sports: 'worldmap',
  // Production extra themes
  'theme-42dhuX': 'island',   // wild animals
  'theme-YduoHf': 'myroom',   // family
  'theme-p7m4gB': 'myroom',   // vegetables
}

const pageVariants = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
}

function AppInner() {
  const { user, ready } = useAuth()
  const { lang } = useLang()
  const { themes } = useContent()
  const { unlocked } = useStickers()
  const { trackVisit, trackRound } = useAnalytics()
  const [screen, setScreen] = useState(SCREEN.SELECT)
  const [selectedThemes, setSelectedThemes] = useState([])
  const [rewardWord, setRewardWord] = useState(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const [userSoundsOpen, setUserSoundsOpen] = useState(false)
  const roundStartedAtRef = useRef(null)
  const visitTrackedRef = useRef(false)

  useEffect(() => {
    if (!visitTrackedRef.current) {
      visitTrackedRef.current = true
      trackVisit(lang)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready || !user) return
    const intent = sessionStorage.getItem('loginIntent')
    if (intent === 'recordSounds') {
      sessionStorage.removeItem('loginIntent')
      setUserSoundsOpen(true)
    }
  }, [ready, user])

  const toggleTheme = (id) => {
    setSelectedThemes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const startGame = () => {
    roundStartedAtRef.current = Date.now()
    setScreen(SCREEN.GAME)
  }

  const handleComplete = (stats) => {
    if (stats) {
      trackRound({ ...stats, startedAt: roundStartedAtRef.current })
    }
    // Pick a reward word from the played themes
    const allWords = themes.flatMap(t => t.words)
    const themeWords = allWords.filter(w => selectedThemes.includes(w.themeId))
    const stickerThemeWords = themeWords.filter(w => THEME_TO_ROOM[w.themeId])
    const available = stickerThemeWords.filter(w => !unlocked.includes(w.name.trim().toLowerCase().replace(/ /g, '_')))
    const pool = available.length > 0 ? available : stickerThemeWords
    const word = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null
    setRewardWord(word)
    setScreen(word ? SCREEN.CHEST : SCREEN.VICTORY)
  }

  const handlePlayAgain = () => {
    setSelectedThemes([])
    setScreen(SCREEN.SELECT)
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {screen === SCREEN.SELECT && (
          <motion.div key="select" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <ThemeSelector
              selected={selectedThemes}
              onToggle={toggleTheme}
              onStart={startGame}
              onOpenAdmin={() => setAdminOpen(true)}
              onOpenUserSounds={() => setUserSoundsOpen(true)}
              onOpenStickerbook={() => setScreen(SCREEN.STICKERBOOK)}
            />
          </motion.div>
        )}
        {screen === SCREEN.GAME && (
          <motion.div key="game" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <GameScreen selectedThemes={selectedThemes} onComplete={handleComplete} onMenu={handlePlayAgain} />
          </motion.div>
        )}
        {screen === SCREEN.VICTORY && (
          <motion.div key="victory" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
            <VictoryScreen onPlayAgain={handlePlayAgain} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chest screen — full-screen overlay, shown after game completes */}
      <AnimatePresence>
        {screen === SCREEN.CHEST && rewardWord && (
          <ChestScreen
            word={rewardWord}
            onRoomChosen={() => setScreen(SCREEN.VICTORY)}
            onOpenStickerbook={() => setScreen(SCREEN.STICKERBOOK)}
            onSkip={() => setScreen(SCREEN.VICTORY)}
          />
        )}
      </AnimatePresence>

      {/* Stickerbook — full-screen overlay */}
      <AnimatePresence>
        {screen === SCREEN.STICKERBOOK && (
          <motion.div
            key="stickerbook"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ position: 'fixed', inset: 0, zIndex: 180 }}
          >
            <StickerBook onClose={handlePlayAgain} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {userSoundsOpen && <UserSoundsModal onClose={() => setUserSoundsOpen(false)} />}
      </AnimatePresence>
    </>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <DifficultyProvider>
        <ShowTranslationProvider>
        <ShowTextProvider>
        <PlayFeedbackSoundsProvider>
        <StickerProvider>
        <AuthProvider>
          <ContentProvider>
            <AppInner />
          </ContentProvider>
        </AuthProvider>
        </StickerProvider>
        </PlayFeedbackSoundsProvider>
        </ShowTextProvider>
        </ShowTranslationProvider>
      </DifficultyProvider>
    </LanguageProvider>
  )
}
