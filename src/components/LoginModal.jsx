import { useState } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../contexts/LanguageContext.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import './AdminPanel.css'

export default function LoginModal({ onClose }) {
  const { t } = useLang()
  const { login } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!password || busy) return
    setBusy(true)
    setError(false)
    try {
      await login(password)
      onClose()
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={onClose}
    >
      <motion.form
        className="modal-card login-card"
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={submit}
      >
        <h2 className="modal-title">{t.admin.loginTitle}</h2>
        <input
          className="admin-input"
          type="password"
          autoFocus
          placeholder={t.admin.passwordPlaceholder}
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false) }}
        />
        {error && <p className="admin-error">{t.admin.loginError}</p>}
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onClose}>
            {t.admin.cancel}
          </button>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? '…' : t.admin.loginBtn}
          </button>
        </div>
      </motion.form>
    </motion.div>
  )
}
