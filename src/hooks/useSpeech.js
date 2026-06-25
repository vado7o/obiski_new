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
