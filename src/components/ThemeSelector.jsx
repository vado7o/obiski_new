import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { themes } from '../data/themes.js'
import { useLang } from '../contexts/LanguageContext.jsx'
import { LANGUAGES } from '../i18n/translations.js'
import './ThemeSelector.css'

export default function ThemeSelector({ selected, onToggle, onStart }) {
  const { t, lang, setLang } = useLang()
  const canStart = selected.length > 0
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <div className="theme-selector">
      <motion.div
        className="app-nav"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="app-nav-left">
          <span className="app-title">Obiski</span>
          <p className="tagline">{t.tagline}</p>
        </div>

        <div className="menu-wrap" ref={menuRef}>
          <button className="menu-btn" onClick={() => setMenuOpen(o => !o)}>
            {t.menuBtn}
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                className="lang-dropdown"
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18 }}
              >
                <p className="lang-dropdown-title">{t.language}</p>
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    className={`lang-option ${lang === l.code ? 'active' : ''}`}
                    onClick={() => { setLang(l.code); setMenuOpen(false) }}
                  >
                    <span className="lang-flag">{l.flag}</span>
                    <span className="lang-label">{l.label}</span>
                    {lang === l.code && <span className="lang-check">✓</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
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
          const themeName = t.themeNames[theme.id] || theme.name
          return (
            <motion.button
              key={theme.id}
              className={`theme-card ${isSelected ? 'selected' : ''}`}
              style={{ '--theme-color': theme.color, '--theme-bg': theme.bgColor }}
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
              <span className="theme-name">{themeName}</span>
              <span className="theme-count">{t.words(theme.words.length)}</span>
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
          <motion.p className="selected-hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {t.themesSelected(selected.length)}
          </motion.p>
        )}
        <motion.button
          className={`start-btn ${canStart ? 'active' : 'inactive'}`}
          onClick={canStart ? onStart : undefined}
          whileHover={canStart ? { scale: 1.05 } : {}}
          whileTap={canStart ? { scale: 0.96 } : {}}
        >
          {canStart ? t.startLearning : t.selectTheme}
        </motion.button>
      </motion.div>
    </div>
  )
}
