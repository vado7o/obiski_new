import { useState, useEffect } from 'react'
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
  const { themes } = useContent()
  const { unlocked } = useStickers()
  const { trackGameStart, trackRound } = useAnalytics()
  const [screen, setScreen] = useState(SCREEN.SELECT)
  const [selectedThemes, setSelectedThemes] = useState([])
  const [rewardWord, setRewardWord] = useState(null)
  const [stickerInitialRoom, setStickerInitialRoom] = useState('island')
  const [adminOpen, setAdminOpen] = useState(false)
  const [userSoundsOpen, setUserSoundsOpen] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState(() => {
    const val = localStorage.getItem('obiski_onboarding')
    // 'done' — всё завершено, 'step1_seen' — шаг 1 отклонён но шаг 2 ещё возможен
    return val ? null : 'step1'
  })

  function handleOnboardingNext() {
    // Пользователь нажал кнопку «Меню» во время шага 1
    setOnboardingStep('step2')
  }
  function handleOnboardingDismiss() {
    if (onboardingStep === 'step1') {
      // Отклонил шаг 1 — шаг 2 всё ещё покажем когда откроет меню
      localStorage.setItem('obiski_onboarding', 'step1_seen')
    } else {
      // Отклонил шаг 2 — всё, онбординг завершён
      localStorage.setItem('obiski_onboarding', 'done')
    }
    setOnboardingStep(null)
  }
  function handleOnboardingDone() {
    // «Записать сейчас» — открываем окно записи и завершаем онбординг
    localStorage.setItem('obiski_onboarding', 'done')
    setOnboardingStep(null)
    setUserSoundsOpen(true)
  }
  function handleMenuOpen() {
    // Вызывается при открытии меню в обычном режиме (вне онбординга)
    // Если шаг 2 ещё не был завершён — показываем его
    const val = localStorage.getItem('obiski_onboarding')
    if (val !== 'done') {
      setOnboardingStep('step2')
    }
  }

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
    trackGameStart()
    setScreen(SCREEN.GAME)
  }

  const handleComplete = (stats) => {
    if (stats) {
      trackRound({ themes: stats.themes, difficulty: stats.difficulty })
    }
    // Pick a reward word — always show chest after any win
    const allWords = themes.flatMap(t => t.words)
    const makeSlug = w => w.name.trim().toLowerCase().replace(/ /g, '_')

    // First try: words from the played themes that have stickers
    const themeWords = allWords.filter(w => selectedThemes.includes(w.themeId))
    const stickerThemeWords = themeWords.filter(w => THEME_TO_ROOM[w.themeId])
    const availableFromTheme = stickerThemeWords.filter(w => !unlocked.includes(makeSlug(w)))
    let pool = availableFromTheme.length > 0 ? availableFromTheme : stickerThemeWords

    // Fallback: if the played theme has no sticker-eligible words (e.g. colors, numbers),
    // pick from ANY theme that has stickers
    if (pool.length === 0) {
      const allStickerWords = allWords.filter(w => THEME_TO_ROOM[w.themeId])
      const allAvailable = allStickerWords.filter(w => !unlocked.includes(makeSlug(w)))
      pool = allAvailable.length > 0 ? allAvailable : allStickerWords
    }

    const word = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null
    setRewardWord(word)
    // Always go to chest (even if somehow word is null we still show it)
    setScreen(SCREEN.CHEST)
  }

  const handleOpenStickerbook = (roomId) => {
    if (roomId) setStickerInitialRoom(roomId)
    setScreen(SCREEN.STICKERBOOK)
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
              onOpenStickerbook={() => handleOpenStickerbook('island')}
              onboardingStep={onboardingStep}
              onOnboardingNext={handleOnboardingNext}
              onOnboardingDismiss={handleOnboardingDismiss}
              onOnboardingDone={handleOnboardingDone}
              onMenuOpen={handleMenuOpen}
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
        {screen === SCREEN.CHEST && (
          <ChestScreen
            word={rewardWord}
            onOpenStickerbook={handleOpenStickerbook}
            onSkip={handlePlayAgain}
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
            <StickerBook
              initialRoom={stickerInitialRoom}
              onClose={handlePlayAgain}
            />
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
