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
  const device = getDevice()

  async function trackGameStart() {
    try {
      await fetch('/api/analytics/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonId, device }),
      })
    } catch {}
  }

  async function trackRound({ themes, difficulty }) {
    try {
      await fetch('/api/analytics/round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonId, themes, difficulty, device }),
      })
    } catch {}
  }

  return { trackGameStart, trackRound }
}
