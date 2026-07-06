import { useState, useRef } from 'react'

function requestMicFromNative() {
  return new Promise((resolve) => {
    const handler = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'MIC_PERMISSION_RESULT') {
          window.removeEventListener('message', handler)
          resolve({ granted: data.granted, neverAskAgain: data.neverAskAgain })
        }
      } catch {}
    }
    window.addEventListener('message', handler)
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'REQUEST_MIC_PERMISSION' })
    )
  })
}

function openNativeSettings() {
  window.ReactNativeWebView.postMessage(
    JSON.stringify({ type: 'OPEN_APP_SETTINGS' })
  )
}

export default function MicRecorder({ onRecorded, disabled, labelRecord, labelStop, labelError }) {
  const [state, setState] = useState('idle')
  const [errMsg, setErrMsg] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])

  async function startRecording() {
    setShowSettings(false)
    try {
      if (window.ReactNativeWebView) {
        const { granted, neverAskAgain } = await requestMicFromNative()
        if (!granted) {
          if (neverAskAgain) {
            setShowSettings(true)
          } else {
            setErrMsg(labelError || 'Нет доступа к микрофону')
            setState('error')
            setTimeout(() => setState('idle'), 3000)
          }
          return
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg'
      const recorder = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: mimeType })
        onRecorded(blob)
        setState('idle')
      }
      recorder.start()
      recorderRef.current = recorder
      setState('recording')
    } catch {
      setErrMsg(labelError || 'Нет доступа к микрофону')
      setState('error')
      setTimeout(() => setState('idle'), 3000)
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
      recorderRef.current = null
    }
  }

  if (showSettings) {
    return (
      <span className="mic-settings-prompt">
        <span className="mic-error">Разрешите микрофон в настройках</span>
        <button
          className="btn-mini btn-mini-settings"
          onClick={() => { openNativeSettings(); setShowSettings(false) }}
        >
          ⚙️ Настройки
        </button>
      </span>
    )
  }

  if (state === 'error') {
    return <span className="mic-error">{errMsg}</span>
  }

  if (state === 'recording') {
    return (
      <button className="btn-mini btn-mini-rec active" onClick={stopRecording}>
        🔴 {labelStop || 'Стоп'}
      </button>
    )
  }

  return (
    <button className="btn-mini btn-mini-rec" disabled={disabled} onClick={startRecording}>
      🎤 {labelRecord || 'Записать'}
    </button>
  )
}
