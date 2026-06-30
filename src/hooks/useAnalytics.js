const ANON_KEY = 'obiski_anon_id'

function getOrCreateAnonId() {
  try {
    let id = localStorage.getItem(ANON_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(ANON_KEY, id)
    }
    return id
  } catch {
    return 'unknown'
  }
}

function getDevice() {
  return /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
}

export function useAnalytics() {
  const anonId = getOrCreateAnonId()

  async function trackVisit(lang) {
    try {
      await fetch('/api/analytics/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonId, lang, device: getDevice() }),
      })
    } catch {}
  }

  async function trackRound({ themes, difficulty, cardsTotal, cardsCorrect, startedAt }) {
    try {
      await fetch('/api/analytics/round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonId, themes, difficulty, cardsTotal, cardsCorrect, startedAt }),
      })
    } catch {}
  }

  return { trackVisit, trackRound }
}
