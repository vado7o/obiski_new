import { motion } from 'framer-motion'
import { themes } from '../data/themes.js'
import './ThemeSelector.css'

export default function ThemeSelector({ selected, onToggle, onStart }) {
  const canStart = selected.length > 0

  return (
    <div className="theme-selector">
      <motion.div
        className="app-nav"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="app-title">Obiski</span>
        <div className="app-nav-right">
          <p className="tagline">Choose your themes and start learning!</p>
        </div>
      </motion.div>

      <motion.div
        className="themes-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        {themes.map((theme, i) => {
          const isSelected = selected.includes(theme.id)
          return (
            <motion.button
              key={theme.id}
              className={`theme-card ${isSelected ? 'selected' : ''}`}
              style={{
                '--theme-color': theme.color,
                '--theme-bg': theme.bgColor,
              }}
              onClick={() => onToggle(theme.id)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="theme-icon-wrap">
                <span className="theme-icon">{theme.icon}</span>
                {isSelected && (
                  <motion.div
                    className="check-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    ✓
                  </motion.div>
                )}
              </div>
              <span className="theme-name">{theme.name}</span>
              <span className="theme-count">{theme.words.length} words</span>
            </motion.button>
          )
        })}
      </motion.div>

      <motion.div
        className="start-bar"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {selected.length > 0 && (
          <motion.p
            className="selected-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {selected.length} theme{selected.length > 1 ? 's' : ''} selected
          </motion.p>
        )}
        <motion.button
          className={`start-btn ${canStart ? 'active' : 'inactive'}`}
          onClick={canStart ? onStart : undefined}
          whileHover={canStart ? { scale: 1.05 } : {}}
          whileTap={canStart ? { scale: 0.96 } : {}}
        >
          {canStart ? '▶  Start Learning' : 'Select a theme to begin'}
        </motion.button>
      </motion.div>
    </div>
  )
}
