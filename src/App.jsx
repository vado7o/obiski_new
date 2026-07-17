import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LanguageProvider } from './contexts/LanguageContext.jsx'
import { ContentProvider } from './contexts/ContentContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { useAuth } from './contexts/AuthContext.jsx'
import { DifficultyProvider } from './contexts/DifficultyContext.jsx'
import { ShowTranslationProvider } from './contexts/ShowTranslationContext.jsx'
import { useLang } from './contexts/LanguageContext.jsx'
import { useAnalytics } from './hooks/useAnalytics.js'
import ThemeSelector from './components/ThemeSelector.jsx'
import GameScreen from './components/GameScreen.jsx'
import VictoryScreen from './components/VictoryScreen.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import UserSoundsModal from './components/UserSoundsModal.jsx'

const SCREEN = {
  SELECT: 'select',
  GAME: 'game',
  VICTORY: 'victory',
}

const pageVariants = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -60 },
}

function AppInner() {
  const { user, ready } = useAuth()
  const { lang } = useLang()
  const { trackVisit, trackRound } = useAnalytics()
  const [screen, setScreen] = useState(SCREEN.SELECT)
  const [selectedThemes, setSelectedThemes] = useState([])
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
    setScreen(SCREEN.VICTORY)
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
            <ThemeSelector selected={selectedThemes} onToggle={toggleTheme} onStart={startGame} onOpenAdmin={() => setAdminOpen(true)} onOpenUserSounds={() => setUserSoundsOpen(true)} />
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
        <AuthProvider>
          <ContentProvider>
            <AppInner />
          </ContentProvider>
        </AuthProvider>
        </ShowTranslationProvider>
      </DifficultyProvider>
    </LanguageProvider>
  )
}
