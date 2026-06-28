const DB_NAME = 'obiski-user-sounds'
const STORE_NAME = 'sounds'
const DB_VERSION = 1

let _db = null

function openDB() {
  if (_db) return Promise.resolve(_db)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME)
    }
    req.onsuccess = (e) => {
      _db = e.target.result
      resolve(_db)
    }
    req.onerror = (e) => reject(e.target.error)
  })
}

function k(lang, type, slot) {
  return `${lang}|${type}|${slot}`
}

export async function setBlob(lang, type, slot, blob) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(blob, k(lang, type, slot))
    tx.oncomplete = () => resolve()
    tx.onerror = (e) => reject(e.target.error)
  })
}

export async function removeBlob(lang, type, slot) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(k(lang, type, slot))
    tx.oncomplete = () => resolve()
    tx.onerror = (e) => reject(e.target.error)
  })
}

export async function clearAllForLang(lang) {
  const db = await openDB()
  const keys = []
  for (const type of ['correct', 'incorrect']) {
    for (let slot = 1; slot <= 5; slot++) {
      keys.push(k(lang, type, slot))
    }
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    for (const key of keys) store.delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = (e) => reject(e.target.error)
  })
}

export async function getAllBlobsForLang(lang) {
  const db = await openDB()
  const result = {
    correct: Array(5).fill(null),
    incorrect: Array(5).fill(null),
  }
  const entries = []
  for (const type of ['correct', 'incorrect']) {
    for (let slot = 1; slot <= 5; slot++) {
      entries.push({ type, slot, key: k(lang, type, slot) })
    }
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    let pending = entries.length
    if (pending === 0) { resolve(result); return }
    for (const { type, slot, key } of entries) {
      const req = store.get(key)
      req.onsuccess = (e) => {
        if (e.target.result) result[type][slot - 1] = e.target.result
        if (--pending === 0) resolve(result)
      }
      req.onerror = () => { if (--pending === 0) resolve(result) }
    }
  })
}
