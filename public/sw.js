const CONTENT_CACHE = 'obiski-content-v1'
const MEDIA_CACHE = 'obiski-media-v1'
const ALL_CACHES = [CONTENT_CACHE, MEDIA_CACHE]

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !ALL_CACHES.includes(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (!url.protocol.startsWith('http')) return

  if (url.pathname === '/api/content') {
    event.respondWith(staleWhileRevalidate(request, CONTENT_CACHE))
    return
  }

  if (url.pathname.startsWith('/objects/')) {
    event.respondWith(cacheFirst(request, MEDIA_CACHE))
    return
  }
})

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const networkFetch = fetch(request)
    .then(res => { if (res.ok) cache.put(request, res.clone()); return res })
    .catch(() => null)
  return cached || (await networkFetch)
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  const res = await fetch(request)
  if (res.ok) cache.put(request, res.clone())
  return res
}
