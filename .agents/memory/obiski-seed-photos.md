---
name: Obiski card photos
description: Where card photos come from and the rule to keep baseline cards fully covered.
---

Card photos live in Replit object storage; `words.image_path` holds the `/objects/*`
path and the game serves them from there (never external URLs).

**Rule:** every baseline word must have a stored image so the emoji fallback is only
for owner-added cards, not shipped content.

**Why:** loremflickr (the original bulk source) is unreliable — it serves via curl
but fails in-browser and rate-limits during bulk seeding, leaving gaps. Generated
images were used to backfill the cards it could not cover.

**How to apply:** if baseline cards show emoji instead of photos, backfill them
(generate or upload) and set `image_path`; don't rely on re-running the loremflickr
seed to reach full coverage. The seed (`npm run seed`) is idempotent — it only
touches rows where `image_path IS NULL`.
