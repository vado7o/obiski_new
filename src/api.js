async function jsonRequest(url, options = {}) {
  const res = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const err = new Error((data && data.error) || `request_failed_${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}

export function getContent() {
  return jsonRequest('/api/content')
}

export function getMe() {
  return jsonRequest('/api/auth/user')
}

export function getSettings() {
  return jsonRequest('/api/me/settings')
}

export function saveSettings(data) {
  return jsonRequest('/api/me/settings', {
    method: 'PUT',
    body: JSON.stringify(data || {}),
  })
}

export function createTheme(payload) {
  return jsonRequest('/api/admin/themes', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateTheme(id, payload) {
  return jsonRequest(`/api/admin/themes/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function deleteTheme(id) {
  return jsonRequest(`/api/admin/themes/${id}`, { method: 'DELETE' })
}

export function createWord(payload) {
  return jsonRequest('/api/admin/words', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateWord(id, payload) {
  return jsonRequest(`/api/admin/words/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

export function deleteWord(id) {
  return jsonRequest(`/api/admin/words/${id}`, { method: 'DELETE' })
}

async function uploadFile(url, file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(url, { method: 'POST', credentials: 'same-origin', body: form })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) {
    const err = new Error((data && data.error) || `upload_failed_${res.status}`)
    err.status = res.status
    throw err
  }
  return data
}

export function uploadWordPhoto(id, file) {
  return uploadFile(`/api/admin/words/${id}/photo`, file)
}

export function uploadWordAudio(id, file) {
  return uploadFile(`/api/admin/words/${id}/audio`, file)
}

export function deleteWordAudio(id) {
  return jsonRequest(`/api/admin/words/${id}/audio`, { method: 'DELETE' })
}

export function getTitleSound() {
  return jsonRequest('/api/title-sound')
}

export function getAdminTitleSound() {
  return jsonRequest('/api/admin/title-sound')
}

export function uploadTitleSound(file) {
  return uploadFile('/api/admin/title-sound', file)
}

export function deleteTitleSound() {
  return jsonRequest('/api/admin/title-sound', { method: 'DELETE' })
}

export function getFeedbackSounds(lang) {
  return jsonRequest(`/api/feedback-sounds/${encodeURIComponent(lang)}`)
}

export function getAdminFeedbackSounds() {
  return jsonRequest('/api/admin/feedback-sounds')
}

export function uploadFeedbackSound(lang, type, slot, file) {
  return uploadFile(`/api/admin/feedback-sounds/${encodeURIComponent(lang)}/${type}/${slot}`, file)
}

export function deleteFeedbackSound(lang, type, slot) {
  return jsonRequest(`/api/admin/feedback-sounds/${encodeURIComponent(lang)}/${type}/${slot}`, { method: 'DELETE' })
}
