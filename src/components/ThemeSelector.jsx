import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLang } from '../contexts/LanguageContext.jsx'
import { useContent } from '../contexts/ContentContext.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { LANGUAGES } from '../i18n/translations.js'
import { useDifficulty } from '../contexts/DifficultyContext.jsx'
import './ThemeSelector.css'

export default function ThemeSelector({ selected, onToggle, onStart, onOpenAdmin, onOpenUserSounds }) {
  const { t, lang, setLang } = useLang()
  const { themes, loading } = useContent()
  const { user, isAdmin, login, logout } = useAuth()
  const { difficulty, setDifficulty, DIFFICULTY_OPTIONS } = useDifficulty()
  const canStart = selected.length > 0
  const [menuOpen, setMenuOpen] = useState(false)
  const [langView, setLangView] = useState(false)
  const [difficultyView, setDifficultyView] = useState(false)
  const [loginPromptOpen, setLoginPromptOpen] = useState(false)
  const menuRef = useRef(null)

  const userName =
    user && (([user.firstName, user.lastName].filter(Boolean).join(' ')) || user.email)

  function closeMenu() {
    setMenuOpen(false)
    setLangView(false)
    setDifficultyView(false)
  }

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        closeMenu()
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const currentLang = LANGUAGES.find(l => l.code === lang)

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
                {langView ? (
                  <>
                    <button
                      className="lang-option lang-back"
                      onClick={() => setLangView(false)}
                    >
                      <span className="lang-flag">‹</span>
                      <span className="lang-label">{t.admin.back}</span>
                    </button>
                    <div className="menu-divider" />
                    {LANGUAGES.map(l => (
                      <button
                        key={l.code}
                        className={`lang-option ${lang === l.code ? 'active' : ''}`}
                        onClick={() => { setLang(l.code); closeMenu() }}
                      >
                        <span className="lang-flag">{l.flag}</span>
                        <span className="lang-label">{l.label}</span>
                        {lang === l.code && <span className="lang-check">✓</span>}
                      </button>
                    ))}
                  </>
                ) : difficultyView ? (
                  <>
                    <button
                      className="lang-option lang-back"
                      onClick={() => setDifficultyView(false)}
                    >
                      <span className="lang-flag">‹</span>
                      <span className="lang-label">{t.admin.back}</span>
                    </button>
                    <div className="menu-divider" />
                    {DIFFICULTY_OPTIONS.map(n => (
                      <button
                        key={n}
                        className={`lang-option ${difficulty === n ? 'active' : ''}`}
                        onClick={() => { setDifficulty(n); closeMenu() }}
                      >
                        <span className="lang-label">{t.admin.difficultyLabel(n)}</span>
                        {difficulty === n && <span className="lang-check">✓</span>}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <button
                      className="lang-option"
                      onClick={() => setDifficultyView(true)}
                    >
                      <span className="lang-label">{t.admin.difficulty}</span>
                      <span className="lang-chevron">›</span>
                    </button>

                    <button
                      className="lang-option"
                      onClick={() => {
                        closeMenu()
                        if (user) {
                          onOpenUserSounds()
                        } else {
                          setLoginPromptOpen(true)
                        }
                      }}
                    >
                      <span className="lang-label">{t.admin.recordSounds}</span>
                    </button>

                    <button
                      className="lang-option"
                      onClick={() => setLangView(true)}
                    >
                      {currentLang && <span className="lang-flag">{currentLang.flag}</span>}
                      <span className="lang-label">{t.language}</span>
                      <span className="lang-chevron">›</span>
                    </button>

                    <div className="menu-divider" />
                    {user ? (
                      <>
                        {userName && (
                          <div className="menu-user">{userName}</div>
                        )}
                        {isAdmin && (
                          <button
                            className="lang-option"
                            onClick={() => { closeMenu(); onOpenAdmin() }}
                          >
                            <span className="lang-label">{t.admin.menuManage}</span>
                          </button>
                        )}
                        <button
                          className="lang-option"
                          onClick={() => { closeMenu(); logout() }}
                        >
                          <span className="lang-label">{t.admin.menuLogout}</span>
                        </button>
                      </>
                    ) : (
                      <button
                        className="lang-option"
                        onClick={() => { closeMenu(); login() }}
                      >
                        <span className="lang-label">{t.admin.menuLogin}</span>
                      </button>
                    )}
                  </>
                )}
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

      <AnimatePresence>
        {loginPromptOpen && (
          <motion.div
            className="login-prompt-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLoginPromptOpen(false)}
          >
            <motion.div
              className="login-prompt-modal"
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="login-prompt-icon">🎤</div>
              <p className="login-prompt-text">{t.admin.loginPrompt}</p>
              <div className="login-prompt-btns">
                <button
                  className="login-prompt-cancel"
                  onClick={() => setLoginPromptOpen(false)}
                >
                  {t.admin.cancel}
                </button>
                <button
                  className="login-prompt-confirm"
                  onClick={() => {
                    setLoginPromptOpen(false)
                    sessionStorage.setItem('loginIntent', 'recordSounds')
                    login()
                  }}
                >
                  {t.admin.loginPromptBtn}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
