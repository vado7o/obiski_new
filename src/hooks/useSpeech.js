let currentAudio = null

export function speak(text, onEnd) {
  if (!window.speechSynthesis) {
    if (onEnd) onEnd()
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.85
  utterance.pitch = 1.1
  utterance.volume = 1
  if (onEnd) utterance.onend = onEnd
  window.speechSynthesis.speak(utterance)
}

export function speakWord(word) {
  speak(word)
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
}

export function speakWordObject(word, onEnd) {
  if (!word) {
    if (onEnd) onEnd()
    return
  }
  if (word.audioUrl) {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    stopAudio()
    const audio = new Audio(word.audioUrl)
    currentAudio = audio
    if (onEnd) audio.onended = onEnd
    audio.onerror = () => {
      currentAudio = null
      speak(word.name, onEnd)
    }
    audio.play().catch(() => {
      currentAudio = null
      speak(word.name, onEnd)
    })
    return
  }
  stopAudio()
  speak(word.name, onEnd)
}
