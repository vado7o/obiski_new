---
name: Replit bash background jobs
description: Why long background jobs die when launched via the bash tool, and how to keep them alive.
---

Background jobs started with `nohup cmd &` inside a single `bash` tool call get
**killed when that tool call returns** — the tool tears down the process group, so
nohup alone (which only ignores SIGHUP) is not enough.

**Why:** the bash tool kills the whole process group on return; the job is a child
of the tool's shell.

**How to apply:** for migrations/seeds that outlive one tool call, fully detach with
`setsid bash -c '...' > /tmp/log 2>&1 < /dev/null &`, then poll the log file in
later tool calls. Make the job idempotent so re-running after a kill is safe.
