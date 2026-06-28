import { useState, useEffect, useRef } from 'react'
import { useLang } from '../contexts/LanguageContext.jsx'
import { LANGUAGES } from '../i18n/translations.js'
import {
  getAdminFeedbackSounds,
  uploadFeedbackSound,
  deleteFeedbackSound,
} from '../api.js'
import MicRecorder from './MicRecorder.jsx'

const SLOTS = [1, 2, 3, 4, 5]

export default function FeedbackSoundsSection() {
  const { t, lang } = useLang()
  const a = t.admin
  const [sounds, setSounds] = useState([]) // raw rows from server
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const langLabel = LANGUAGES.find((l) => l.code === lang)

  async function load() {
    try {
      const data = await getAdminFeedbackSounds()
      setSounds(data.sounds)
    } catch {
      setError(a.errorGeneric)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function getSlot(type, slot) {
    return sounds.find((s) => s.lang === lang && s.type === type && s.slot === slot) || null
  }

  async function handleUpload(type, slot, file) {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      await uploadFeedbackSound(lang, type, slot, file)
      await load()
    } catch (err) {
      setError(err.message || a.errorGeneric)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(type, slot) {
    setBusy(true)
    setError(null)
    try {
      await deleteFeedbackSound(lang, type, slot)
      await load()
    } catch (err) {
      setError(err.message || a.errorGeneric)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="feedback-sounds-section">
      <div className="feedback-lang-badge">
        {langLabel ? `${langLabel.flag} ${langLabel.label}` : lang}
      </div>
      <p className="feedback-hint">{a.feedbackSoundsHint}</p>
      {error && <p className="admin-error admin-error-bar">{error}</p>}

      <div className="feedback-groups">
        <SoundGroup
          label={a.correctSounds}
          type="correct"
          slots={SLOTS}
          getSlot={getSlot}
          onUpload={handleUpload}
          onDelete={handleDelete}
          busy={busy}
          a={a}
        />
        <SoundGroup
          label={a.incorrectSounds}
          type="incorrect"
          slots={SLOTS}
          getSlot={getSlot}
          onUpload={handleUpload}
          onDelete={handleDelete}
          busy={busy}
          a={a}
        />
      </div>
    </div>
  )
}

function SoundGroup({ label, type, slots, getSlot, onUpload, onDelete, busy, a }) {
  return (
    <div className="feedback-group">
      <div className="feedback-group-label">{label}</div>
      <div className="feedback-slots">
        {slots.map((slot) => (
          <SoundSlot
            key={slot}
            slot={slot}
            type={type}
            row={getSlot(type, slot)}
            onUpload={onUpload}
            onDelete={onDelete}
            busy={busy}
            a={a}
          />
        ))}
      </div>
    </div>
  )
}

function SoundSlot({ slot, type, row, onUpload, onDelete, busy, a }) {
  const fileRef = useRef(null)
  const hasFile = !!row

  function handleFileChange(e) {
    const file = e.target.files[0]
    e.target.value = ''
    if (file) onUpload(type, slot, file)
  }

  return (
    <div className={`feedback-slot ${hasFile ? 'filled' : 'empty'}`}>
      <span className="feedback-slot-num">{a.slotLabel(slot)}</span>

      <div className="feedback-slot-controls">
        {hasFile ? (
          <>
            <audio
              key={row.object_path}
              src={row.object_path}
              controls
              preload="none"
              className="feedback-audio"
            />
            <button
              className="btn-mini"
              disabled={busy}
              onClick={() => fileRef.current.click()}
              title={a.replaceSound}
            >
              {a.replaceSound}
            </button>
            <MicRecorder
              disabled={busy}
              labelRecord={a.recordMic}
              labelStop={a.stopRec}
              labelError={a.micError}
              onRecorded={(blob) => {
                const file = new File([blob], 'recording.webm', { type: blob.type })
                onUpload(type, slot, file)
              }}
            />
            <button
              className="btn-mini btn-mini-danger"
              disabled={busy}
              onClick={() => onDelete(type, slot)}
              title={a.deleteSound}
            >
              {a.deleteSound}
            </button>
          </>
        ) : (
          <>
            <span className="feedback-empty-label">{a.emptySlot}</span>
            <button
              className="btn-mini"
              disabled={busy}
              onClick={() => fileRef.current.click()}
            >
              {a.uploadSound}
            </button>
            <MicRecorder
              disabled={busy}
              labelRecord={a.recordMic}
              labelStop={a.stopRec}
              labelError={a.micError}
              onRecorded={(blob) => {
                const file = new File([blob], 'recording.webm', { type: blob.type })
                onUpload(type, slot, file)
              }}
            />
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          hidden
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
