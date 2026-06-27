# Obiski

A children's word-learning game. 11 themes × 20 words = 220 cards. Multi-language UI (RU default; en/es/fr/de/zh).

## Architecture
- **Frontend**: React 18 + Vite, vanilla CSS, framer-motion. Plain JSX (no TypeScript).
- **Backend**: single Express 5 server (`server/index.js`) on port 5000. Dev serves Vite in middleware mode; prod serves `dist/`.
- **Database**: PostgreSQL via raw `pg` (no ORM). Schema created at startup by `ensureSchema()` in `server/db.js`.
- **Media/storage**: Replit object storage (`@replit/object-storage`); files served at `/objects/*`.
- **API**: `/api/*`. Game content is public (`/api/content`); admin CRUD is owner-only.

## Authentication
- **Replit Auth (OIDC)** — login with Google or Email. Implemented manually in plain JS in `server/replitAuth.js` (the TS/Drizzle blueprint does not fit this stack).
- Login/logout are redirects: `/api/login`, `/api/callback`, `/api/logout`. Frontend never posts credentials.
- On first login a `users` row + a `user_settings` row (the user's personal settings "folder", JSONB) are created.
- **Owner/admin access** is gated by email allowlist `OWNER_EMAILS` (env, default `pvb0700@rambler.ru`). The owner gets the content management panel; admin routes use `requireOwner`.
- Per-user settings API: `GET/PUT /api/me/settings` (any logged-in user).

## Key files
- `server/replitAuth.js` — OIDC + passport + pg session store + user upsert.
- `server/auth.js` — owner gating (`requireOwner`, `isOwner`) + `/api/auth/user`.
- `server/routes.js` — content, media, settings, admin CRUD.
- `src/contexts/AuthContext.jsx` — exposes `user`, `isOwner`, `isAdmin`(=isOwner), `login`, `logout`.

## Environment
- Requires: `DATABASE_URL`, `SESSION_SECRET`, `REPL_ID`, `REPLIT_DOMAINS` (Replit-provided). Optional: `OWNER_EMAILS`.
- Seed content: `npm run seed` (uploads `server/seed-assets/*.jpg`).

## User preferences
- User is non-technical and Russian-speaking; communicate in Russian, plainly.
- Default UI language is Russian.
- Owner identity: email `pvb0700@rambler.ru` (phone +79138499222 reserved for future SMS login, not yet enabled — SMS requires a paid provider).
