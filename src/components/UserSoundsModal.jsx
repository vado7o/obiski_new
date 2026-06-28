import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useLang } from '../contexts/LanguageContext.jsx'
import { LANGUAGES } from '../i18n/translations.js'
import { getAllBlobsForLang, setBlob, removeBlob, clearAllForLang } from '../db/userSoundsDB.js'
import MicRecorder from './MicRecorder.jsx'
import './UserSoundsModal.css'

const SLOTS = [1, 2, 3, 4, 5]
const TYPES = ['correct', 'incorrect']

export default function UserSoundsModal({ onClose }) {
  const { t, lang } = useLang()
  const a = t.admin
  const [blobs, setBlobs] = useState({ correct: Array(5).fill(null), incorrect: Array(5).fill(null) })
  const [urls, setUrls] = useState({ correct: Array(5).fill(null), incorrect: Array(5).fill(null) })
  const [busy, setBusy] = useState(false)
  const prevUrlsRef = useRef({ correct: Array(5).fill(null), incorrect: Array(5).fill(null) })

  const langLabel = LANGUAGES.find((l) => l.code === lang)
  const hasAnySounds = blobs.correct.some(Boolean) || blobs.incorrect.some(Boolean)

  function revokeAll(u) {
    for (const type of TYPES) {
      for (const url of u[type]) {
        if (url) URL.revokeObjectURL(url)
      }
    }
  }

  async function load() {
    const loaded = await getAllBlobsForLang(lang)
    const newUrls = {
      correct: loaded.correct.map((b) => (b ? URL.createObjectURL(b) : null)),
      incorrect: loaded.incorrect.map((b) => (b ? URL.createObjectURL(b) : null)),
    }
    revokeAll(prevUrlsRef.current)
    prevUrlsRef.current = newUrls
    setBlobs(loaded)
    setUrls(newUrls)
  }

  useEffect(() => {
    load()
    return () => revokeAll(prevUrlsRef.current)
  }, [lang])

  async function handleSave(type, slot, blob) {
    setBusy(true)
    try {
      await setBlob(lang, type, slot, blob)
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(type, slot) {
    setBusy(true)
    try {
      await removeBlob(lang, type, slot)
      await load()
    } finally {
      setBusy(false)
    }
  }

  async function handleReset() {
    if (!window.confirm(a.resetConfirm)) return
    setBusy(true)
    try {
      await clearAllForLang(lang)
      await load()
    } finally {
      setBusy(false)
    }
  }

  return (
    <motion.div
      className="usersounds-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        className="usersounds-modal"
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
      >
        <div className="usersounds-head">
          <h2>{a.myFeedbackSounds}</h2>
          <div className="usersounds-head-right">
            {hasAnySounds && (
              <button className="btn-ghost btn-ghost-danger" disabled={busy} onClick={handleReset}>
                {a.resetToDefault}
              </button>
            )}
            <button className="btn-ghost" onClick={onClose}>{a.close}</button>
          </div>
        </div>

        <div className="usersounds-lang-badge">
          {langLabel ? `${langLabel.flag} ${langLabel.label}` : lang}
        </div>

        <p className="usersounds-hint">{a.userSoundsHint}</p>

        <div className="usersounds-body">
          {TYPES.map((type) => (
            <div key={type} className="feedback-group">
              <div className="feedback-group-label">
                {type === 'correct' ? a.correctSounds : a.incorrectSounds}
              </div>
              <div className="feedback-slots">
                {SLOTS.map((slot) => (
                  <UserSlot
                    key={slot}
                    slot={slot}
                    type={type}
                    url={urls[type][slot - 1]}
                    busy={busy}
                    a={a}
                    onSave={(blob) => handleSave(type, slot, blob)}
                    onDelete={() => handleDelete(type, slot)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

function UserSlot({ slot, type, url, busy, a, onSave, onDelete }) {
  const fileRef = useRef(null)
  const hasFile = !!url

  function handleFileChange(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (file) onSave(file)
  }

  return (
    <div className={`feedback-slot ${hasFile ? 'filled' : 'empty'}`}>
      <span className="feedback-slot-num">{a.slotLabel(slot)}</span>
      <div className="feedback-slot-controls">
        {hasFile ? (
          <audio key={url} src={url} controls preload="none" className="feedback-audio" />
        ) : (
          <span className="feedback-empty-label">{a.emptySlot}</span>
        )}
        <button className="btn-mini" disabled={busy} onClick={() => fileRef.current.click()}>
          {hasFile ? a.replaceSound : a.uploadSound}
        </button>
        <MicRecorder
          disabled={busy}
          labelRecord={a.recordMic}
          labelStop={a.stopRec}
          labelError={a.micError}
          onRecorded={onSave}
        />
        {hasFile && (
          <button className="btn-mini btn-mini-danger" disabled={busy} onClick={onDelete}>
            {a.deleteSound}
          </button>
        )}
        <input ref={fileRef} type="file" accept="audio/*" hidden onChange={handleFileChange} />
      </div>
    </div>
  )
}
