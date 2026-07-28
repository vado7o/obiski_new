import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../contexts/LanguageContext.jsx'
import { useContent } from '../contexts/ContentContext.jsx'
import {
  createTheme, updateTheme, deleteTheme,
  createWord, updateWord, deleteWord,
  uploadWordPhoto, uploadWordAudio, deleteWordAudio,
  updateWordTranslations,
} from '../api.js'

const LANG_LABELS = {
  ru: { label: 'Русский', flag: '🇷🇺' },
}
import FeedbackSoundsSection from './FeedbackSoundsSection.jsx'
import StatsPanel from './StatsPanel.jsx'
import './AdminPanel.css'

const DEFAULT_THEME = { name: '', icon: '📚', color: '#6C63FF', bgColor: '#EDEBFF' }

export default function AdminPanel({ onClose }) {
  const { t } = useLang()
  const { themes, refresh } = useContent()
  const [selectedThemeId, setSelectedThemeId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const [activeTab, setActiveTab] = useState('cards')
  const [themeForm, setThemeForm] = useState(null) // {mode, data}
  const [wordForm, setWordForm] = useState(null)
  const [translationModal, setTranslationModal] = useState(null) // {word, draft}

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

  const openTranslationModal = (word) => {
    const draft = {}
    for (const lang of Object.keys(LANG_LABELS)) {
      draft[lang] = (word.translations && word.translations[lang]) || ''
    }
    setTranslationModal({ word, draft })
  }

  const saveTranslations = () =>
    run(async () => {
      await updateWordTranslations(translationModal.word.id, translationModal.draft)
      setTranslationModal(null)
    })

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

        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('cards')}
          >
            🃏 {t.admin.tabCards}
          </button>
          <button
            className={`admin-tab ${activeTab === 'sounds' ? 'active' : ''}`}
            onClick={() => setActiveTab('sounds')}
          >
            🔊 {t.admin.tabFeedback}
          </button>
          <button
            className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 {t.admin.tabStats}
          </button>
        </div>

        {error && <p className="admin-error admin-error-bar">{error}</p>}

        {activeTab === 'stats' ? (
          <div className="admin-feedback-wrap">
            <StatsPanel />
          </div>
        ) : activeTab === 'sounds' ? (
          <div className="admin-feedback-wrap">
            <FeedbackSoundsSection />
          </div>
        ) : (
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
                      onTranslation={() => openTranslationModal(w)}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </div>
        )}
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
      {translationModal && (
        <TranslationModal
          word={translationModal.word}
          draft={translationModal.draft}
          busy={busy}
          onChange={(lang, val) =>
            setTranslationModal((m) => ({ ...m, draft: { ...m.draft, [lang]: val } }))
          }
          onCancel={() => setTranslationModal(null)}
          onSave={saveTranslations}
        />
      )}
    </motion.div>
  )
}

function WordRow({ word, t, busy, onEdit, onDelete, onPhoto, onAudio, onRemoveAudio, onTranslation }) {
  const photoRef = useRef(null)
  const audioRef = useRef(null)
  const hasTranslations = word.translations && Object.keys(word.translations).length > 0
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
        <span className={`admin-tag ${hasTranslations ? 'ok' : 'warn'}`}>
          {hasTranslations ? '🌐 ' + Object.keys(word.translations).length : '🌐 —'}
        </span>
      </div>
      <div className="admin-word-buttons">
        <input ref={photoRef} type="file" accept="image/*" hidden onChange={(e) => { onPhoto(e.target.files[0]); e.target.value = '' }} />
        <input ref={audioRef} type="file" accept="audio/*" hidden onChange={(e) => { onAudio(e.target.files[0]); e.target.value = '' }} />
        <button className="btn-mini" disabled={busy} onClick={() => photoRef.current.click()}>{t.admin.choosePhoto}</button>
        <button className="btn-mini" disabled={busy} onClick={() => audioRef.current.click()}>{t.admin.chooseAudio}</button>
        {word.audioUrl && <button className="btn-mini" disabled={busy} onClick={onRemoveAudio}>{t.admin.removeAudio}</button>}
        <button className="btn-mini btn-mini-translate" disabled={busy} onClick={onTranslation}>🌐 {t.admin.translations || 'Перевод'}</button>
        <button className="icon-btn" onClick={onEdit}>✏️</button>
        <button className="icon-btn" onClick={onDelete}>🗑️</button>
      </div>
    </div>
  )
}

function TranslationModal({ word, draft, busy, onChange, onCancel, onSave }) {
  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <div className="modal-card translation-modal" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="modal-title">🌐 {word.name}</h2>
        <div className="translation-rows">
          {Object.entries(LANG_LABELS).map(([lang, { flag, label }]) => (
            <label key={lang} className="translation-row">
              <span className="translation-lang">
                <span className="translation-flag">{flag}</span>
                <span className="translation-lang-name">{label}</span>
              </span>
              <input
                className="admin-input translation-input"
                value={draft[lang] || ''}
                placeholder="—"
                onChange={(e) => onChange(lang, e.target.value)}
              />
            </label>
          ))}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>Отмена</button>
          <button type="button" className="btn-primary" disabled={busy} onClick={onSave}>
            {busy ? 'Сохранение…' : 'Сохранить'}
          </button>
        </div>
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
