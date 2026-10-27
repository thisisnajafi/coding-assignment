# Task plan

Source spec: `README.md` (not modified). Status: [x] done, [ ] todo.

## Core
- [x] Backend skeleton: FastAPI + SQLAlchemy + SQLite, settings via `backend/.env`
- [x] Models: users, tickets (status, category, priority, AI suggestion, final reply)
- [x] Seed 3 users and 6 sample tickets on startup through the same pipeline
- [x] Demo auth via `X-User` header, server-side role/ownership checks
- [x] Employee: create ticket, list/view own tickets only (others -> 404)
- [x] IT: list all, change status (open / in_progress / closed), view AI suggestion, edit and send one final reply
## AI
- [x] GapGPT (OpenAI-compatible) client, default `gpt-4o`, model picker for regenerate
- [x] Strict validation (enums) of AI output; reject anything else
- [x] Fallback on failure/timeout/invalid output: keyword rules, priority medium, template reply marked non-AI
- [x] Prompt-injection defence: ticket text delimited as data, no cross-user data, AI only suggests
## Security
- [x] Mask passwords/secrets before storing and before sending to AI
- [x] XSS: render ticket text as plain text only
## Frontend (Next.js, Persian RTL, mobile-friendly)
- [x] User switcher, employee view, IT view, model picker
## Delivery
- [x] Backend tests offline (mocked AI) incl. the two mandatory tests
- [x] Frontend tests
- [x] `docker compose up --build`
- [x] DOCS.md, AI_USAGE.md, TIME_LOG.md, screenshots

## Verified
- [x] Backend: 33 pytest tests pass offline
- [x] Frontend: 5 vitest tests pass
- [x] `docker compose up --build` on Windows (Docker Desktop), live GapGPT triage of seed tickets
- [x] Browser E2E with Playwright: create ticket, IT reply, owner sees reply; screenshots saved
