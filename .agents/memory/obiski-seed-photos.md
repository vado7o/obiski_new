---
name: Obiski seed photos
description: How card photos are seeded into object storage and why some are missing.
---

The seed pipeline fetches photos server-side and uploads them to Replit object
storage, writing the object path to `words.image_path`. The game serves them from
`/objects/*` (own storage), not from external URLs.

**Why loremflickr was abandoned in the browser:** it works via curl/server fetch but
fails to load in the browser; that motivated migrating to own storage.

**Known gap:** loremflickr also rate-limits/500s during bulk server seeding —
~32 of 220 words consistently failed even across retries. Those rows keep
`image_path = NULL`; the UI falls back to the word's emoji, and the owner can
upload a real photo via the admin panel.

**How to apply:** the seed (`npm run seed`) is idempotent — it only fetches words
whose `image_path` is still NULL, so it is safe to re-run. Don't expect 220/220
from loremflickr; treat the admin upload path as the reliable source of truth.
