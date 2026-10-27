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

## Extensions (user requests after first delivery)
- [x] Skeleton loaders (lists, detail, suggestion, thread, model picker, user switcher), reduced motion
- [x] UI polish: card hierarchy, consistent badges, collapsible body, code blocks, final reply block, validation, toasts, dark mode
- [x] Message thread per ticket with reply-to; same access control and masking; final reply kept
- [x] Thread-aware AI suggestion (bounded, role-labelled, untrusted-data framing)
- [x] Provider-grouped, verified model allowlist + searchable combobox
- [x] IT detail rework: suggestion actions (use / send / send as final), final reply shown once, readable code blocks, layout order

## Verified
- [x] Backend: 43 pytest tests pass offline
- [x] Frontend: 22 vitest tests pass; `npm run build` and lint clean
- [x] `docker compose up --build` on Windows (Docker Desktop), live GapGPT triage of seed tickets
- [x] Browser E2E with Playwright: create ticket, IT reply, owner sees reply; screenshots saved
