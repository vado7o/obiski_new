import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../contexts/LanguageContext.jsx'
import { useContent } from '../contexts/ContentContext.jsx'
import {
  createTheme, updateTheme, deleteTheme,
  createWord, updateWord, deleteWord,
  uploadWordPhoto, uploadWordAudio, deleteWordAudio,
} from '../api.js'
import './AdminPanel.css'

const DEFAULT_THEME = { name: '', icon: '📚', color: '#6C63FF', bgColor: '#EDEBFF' }

export default function AdminPanel({ onClose }) {
  const { t } = useLang()
  const { themes, refresh } = useContent()
  const [selectedThemeId, setSelectedThemeId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const [themeForm, setThemeForm] = useState(null) // {mode, data}
  const [wordForm, setWordForm] = useState(null)

  useEffect(() => {
    if (!selectedThemeId && themes.length) setSelectedThemeId(themes[0].id)
  }, [themes, selectedThemeId])

  const selectedTheme = themes.find((th) => th.id === selectedThemeId) || null

  async function run(fn) {
    setBusy(true)
    setError(null)
    try {
      await fn()
      await refresh()
    } catch (err) {
      setError(err.message || t.admin.errorGeneric)
    } finally {
      setBusy(false)
    }
  }

  // ---- Theme actions ----
  const saveTheme = () =>
    run(async () => {
      if (themeForm.mode === 'create') {
        const created = await createTheme(themeForm.data)
        setSelectedThemeId(created.id)
      } else {
        await updateTheme(themeForm.id, themeForm.data)
      }
      setThemeForm(null)
    })

  const removeTheme = (id) => {
    if (!window.confirm(t.admin.confirmDeleteTheme)) return
    run(async () => {
      await deleteTheme(id)
      if (selectedThemeId === id) setSelectedThemeId(null)
    })
  }

  // ---- Word actions ----
  const saveWord = () =>
    run(async () => {
      if (wordForm.mode === 'create') {
        await createWord({ themeId: selectedThemeId, name: wordForm.data.name, emoji: wordForm.data.emoji })
      } else {
        await updateWord(wordForm.id, { name: wordForm.data.name, emoji: wordForm.data.emoji })
      }
      setWordForm(null)
    })

  const removeWord = (id) => {
    if (!window.confirm(t.admin.confirmDeleteWord)) return
    run(() => deleteWord(id))
  }

  const onPhoto = (wordId, file) => file && run(() => uploadWordPhoto(wordId, file))
  const onAudio = (wordId, file) => file && run(() => uploadWordAudio(wordId, file))
  const onRemoveAudio = (wordId) => run(() => deleteWordAudio(wordId))

  return (
    <motion.div
      className="admin-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="admin-panel"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
      >
        <div className="admin-head">
          <h2>{t.admin.panelTitle}</h2>
          <button className="btn-ghost" onClick={onClose}>{t.admin.close}</button>
        </div>

        {error && <p className="admin-error admin-error-bar">{error}</p>}

        <div className="admin-body">
          {/* Theme list */}
          <aside className="admin-themes">
            <div className="admin-section-head">
              <span>{t.admin.themes}</span>
              <button className="btn-mini" onClick={() => setThemeForm({ mode: 'create', data: { ...DEFAULT_THEME } })}>
                {t.admin.addTheme}
              </button>
            </div>
            <ul className="admin-theme-list">
              {themes.map((th) => (
                <li key={th.id}>
                  <button
                    className={`admin-theme-item ${selectedThemeId === th.id ? 'active' : ''}`}
                    onClick={() => setSelectedThemeId(th.id)}
                  >
                    <span className="admin-theme-icon">{th.icon}</span>
                    <span className="admin-theme-name">{t.themeNames[th.id] || th.name}</span>
                    <span className="admin-theme-count">{th.words.length}</span>
                  </button>
                  <div className="admin-theme-actions">
                    <button className="icon-btn" onClick={() => setThemeForm({ mode: 'edit', id: th.id, data: { name: th.name, icon: th.icon, color: th.color, bgColor: th.bgColor } })}>✏️</button>
                    <button className="icon-btn" onClick={() => removeTheme(th.id)}>🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          {/* Word list */}
          <section className="admin-words">
            {!selectedTheme ? (
              <p className="admin-empty">{t.admin.selectThemeFirst}</p>
            ) : (
              <>
                <div className="admin-section-head">
                  <span>{t.admin.words} · {t.themeNames[selectedTheme.id] || selectedTheme.name}</span>
                  <button className="btn-mini" onClick={() => setWordForm({ mode: 'create', data: { name: '', emoji: '' } })}>
                    {t.admin.addWord}
                  </button>
                </div>
                <div className="admin-word-grid">
                  {selectedTheme.words.map((w) => (
                    <WordRow
                      key={w.id}
                      word={w}
                      t={t}
                      busy={busy}
                      onEdit={() => setWordForm({ mode: 'edit', id: w.id, data: { name: w.name, emoji: w.emoji } })}
                      onDelete={() => removeWord(w.id)}
                      onPhoto={(f) => onPhoto(w.id, f)}
                      onAudio={(f) => onAudio(w.id, f)}
                      onRemoveAudio={() => onRemoveAudio(w.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
      </motion.div>

      {themeForm && (
        <ThemeFormModal
          t={t}
          busy={busy}
          form={themeForm}
          onChange={(data) => setThemeForm({ ...themeForm, data })}
          onCancel={() => setThemeForm(null)}
          onSave={saveTheme}
        />
      )}
      {wordForm && (
        <WordFormModal
          t={t}
          busy={busy}
          form={wordForm}
          onChange={(data) => setWordForm({ ...wordForm, data })}
          onCancel={() => setWordForm(null)}
          onSave={saveWord}
        />
      )}
    </motion.div>
  )
}

function WordRow({ word, t, busy, onEdit, onDelete, onPhoto, onAudio, onRemoveAudio }) {
  const photoRef = useRef(null)
  const audioRef = useRef(null)
  return (
    <div className="admin-word">
      <div className="admin-word-media">
        {word.imageUrl ? (
          <img src={word.imageUrl} alt={word.name} className="admin-word-img" />
        ) : (
          <span className="admin-word-emoji">{word.emoji || '🖼️'}</span>
        )}
      </div>
      <div className="admin-word-info">
        <strong>{word.name}</strong>
        <span className="admin-word-emoji-tag">{word.emoji}</span>
        <span className={`admin-tag ${word.imageUrl ? 'ok' : 'warn'}`}>
          {word.imageUrl ? t.admin.photo : t.admin.noPhoto}
        </span>
        <span className={`admin-tag ${word.audioUrl ? 'ok' : 'warn'}`}>
          {word.audioUrl ? t.admin.hasAudio : t.admin.usesTts}
        </span>
      </div>
      <div className="admin-word-buttons">
        <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => { onPhoto(e.target.files[0]); e.target.value = '' }} />
        <input ref={audioRef} type="file" accept="audio/*" hidden onChange={(e) => { onAudio(e.target.files[0]); e.target.value = '' }} />
        <button className="btn-mini" disabled={busy} onClick={() => photoRef.current.click()}>{t.admin.choosePhoto}</button>
        <button className="btn-mini" disabled={busy} onClick={() => audioRef.current.click()}>{t.admin.chooseAudio}</button>
        {word.audioUrl && <button className="btn-mini" disabled={busy} onClick={onRemoveAudio}>{t.admin.removeAudio}</button>}
        <button className="icon-btn" onClick={onEdit}>✏️</button>
        <button className="icon-btn" onClick={onDelete}>🗑️</button>
      </div>
    </div>
  )
}

function ThemeFormModal({ t, busy, form, onChange, onCancel, onSave }) {
  const d = form.data
  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <form className="modal-card" onMouseDown={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSave() }}>
        <h2 className="modal-title">{form.mode === 'create' ? t.admin.newTheme : t.admin.editTheme}</h2>
        <label className="admin-label">{t.admin.name}
          <input className="admin-input" value={d.name} autoFocus onChange={(e) => onChange({ ...d, name: e.target.value })} />
        </label>
        <label className="admin-label">{t.admin.icon}
          <input className="admin-input" value={d.icon} onChange={(e) => onChange({ ...d, icon: e.target.value })} />
        </label>
        <div className="admin-row">
          <label className="admin-label">{t.admin.color}
            <input className="admin-color" type="color" value={d.color} onChange={(e) => onChange({ ...d, color: e.target.value })} />
          </label>
          <label className="admin-label">{t.admin.bgColor}
            <input className="admin-color" type="color" value={d.bgColor} onChange={(e) => onChange({ ...d, bgColor: e.target.value })} />
          </label>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>{t.admin.cancel}</button>
          <button type="submit" className="btn-primary" disabled={busy || !d.name.trim()}>{busy ? t.admin.saving : t.admin.save}</button>
        </div>
      </form>
    </div>
  )
}

function WordFormModal({ t, busy, form, onChange, onCancel, onSave }) {
  const d = form.data
  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <form className="modal-card" onMouseDown={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); onSave() }}>
        <h2 className="modal-title">{form.mode === 'create' ? t.admin.newWord : t.admin.editWord}</h2>
        <label className="admin-label">{t.admin.name}
          <input className="admin-input" value={d.name} autoFocus onChange={(e) => onChange({ ...d, name: e.target.value })} />
        </label>
        <label className="admin-label">{t.admin.emoji}
          <input className="admin-input" value={d.emoji} onChange={(e) => onChange({ ...d, emoji: e.target.value })} />
        </label>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>{t.admin.cancel}</button>
          <button type="submit" className="btn-primary" disabled={busy || !d.name.trim()}>{busy ? t.admin.saving : t.admin.save}</button>
        </div>
      </form>
    </div>
  )
}
