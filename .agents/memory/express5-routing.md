---
name: Express 5 routing
description: Wildcard/catch-all route syntax changed in Express 5 (path-to-regexp v8) and throws at boot if you use the old form.
---

Express 5 bundles path-to-regexp v8, which **removed the old wildcard syntax**.
These now throw `PathError: Unexpected ( ...` at server boot:
- `/objects/:objectPath(*)` → use `/objects/*objectPath` (named splat)
- `app.get('*', handler)` → use a path-less `app.use((req,res,next)=>...)` for SPA fallback

**Why:** the parser is stricter; bad patterns fail at startup, not at request time, so
the whole workflow fails to start with a cryptic stack trace.

**How to apply:** when a route uses `(*)`, `*`, or unnamed groups and the server won't
boot, convert to named splats or a middleware fallback.
