import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ThemeSelector from './components/ThemeSelector.jsx'
import GameScreen from './components/GameScreen.jsx'
import VictoryScreen from './components/VictoryScreen.jsx'

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

export default function App() {
  const [screen, setScreen] = useState(SCREEN.SELECT)
  const [selectedThemes, setSelectedThemes] = useState([])

  const toggleTheme = (id) => {
    setSelectedThemes(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const startGame = () => {
    setScreen(SCREEN.GAME)
  }

  const handleComplete = () => {
    setScreen(SCREEN.VICTORY)
  }

  const handlePlayAgain = () => {
    setSelectedThemes([])
    setScreen(SCREEN.SELECT)
  }

  return (
    <AnimatePresence mode="wait">
      {screen === SCREEN.SELECT && (
        <motion.div
          key="select"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          <ThemeSelector
            selected={selectedThemes}
            onToggle={toggleTheme}
            onStart={startGame}
          />
        </motion.div>
      )}
      {screen === SCREEN.GAME && (
        <motion.div
          key="game"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          <GameScreen
            selectedThemes={selectedThemes}
            onComplete={handleComplete}
          />
        </motion.div>
      )}
      {screen === SCREEN.VICTORY && (
        <motion.div
          key="victory"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          <VictoryScreen onPlayAgain={handlePlayAgain} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
