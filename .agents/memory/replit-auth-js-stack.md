---
name: Replit Auth on a JS/pg stack
description: How Replit Auth (OIDC) was integrated into a plain-JS + raw-pg + vanilla-React project, and the non-obvious gotchas.
---

# Replit Auth on a plain-JS / raw-pg stack

The official `javascript_log_in_with_replit` blueprint scaffolds TypeScript + Drizzle + shadcn files. When the project is plain ESM JavaScript, raw `pg`, and vanilla React, do NOT add the blueprint — implement the same OIDC flow manually in JS (openid-client v6 + passport + connect-pg-simple + memoizee).

**Why:** Adding the blueprint drops `.ts` files and a Drizzle schema that won't run under `node server/index.js` and won't match a raw-pg data layer. Manual implementation following the canonical pattern works as long as `REPL_ID` and `REPLIT_DOMAINS` env vars exist (they're Replit-injected).

**Gotchas:**
- **connect-pg-simple `ttl` is in SECONDS**, but express-session `cookie.maxAge` is in MILLISECONDS. Passing ms to `ttl` makes DB sessions effectively never expire. Keep them in their own units.
- **`/api/login` returns 500 when hit via `localhost`.** Passport strategies are registered per host in `REPLIT_DOMAINS` (`replitauth:<domain>`), and `req.hostname` of `localhost` matches none. This is expected — test the login redirect with the real Replit domain (302 to `replit.com/oidc/auth`), not localhost.
- Startup order matters: `ensureSchema()` must run before `setupAuth()` because connect-pg-simple uses `createTableIfMissing:false` and needs the `sessions` table to already exist.

**How to apply:** owner/admin gating is by email allowlist (`OWNER_EMAILS`) checked after `isAuthenticated`; the email claim comes from the OIDC token. Each login upserts a `users` row and ensures a `user_settings` JSONB row (the per-user "personal folder").
