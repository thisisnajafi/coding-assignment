# Task plan

Source spec: `README.md` (not modified). Status: [x] done, [ ] todo.

## Core
- [ ] Backend skeleton: FastAPI + SQLAlchemy + SQLite, settings via `backend/.env`
- [ ] Models: users, tickets (status, category, priority, AI suggestion, final reply)
- [ ] Seed 3 users and 6 sample tickets on startup through the same pipeline
- [ ] Demo auth via `X-User` header, server-side role/ownership checks
- [ ] Employee: create ticket, list/view own tickets only (others -> 404)
- [ ] IT: list all, change status (open / in_progress / closed), view AI suggestion, edit and send one final reply
## AI
- [ ] GapGPT (OpenAI-compatible) client, default `gpt-4o`, model picker for regenerate
- [ ] Strict validation (enums) of AI output; reject anything else
- [ ] Fallback on failure/timeout/invalid output: keyword rules, priority medium, template reply marked non-AI
- [ ] Prompt-injection defence: ticket text delimited as data, no cross-user data, AI only suggests
## Security
- [ ] Mask passwords/secrets before storing and before sending to AI
- [ ] XSS: render ticket text as plain text only
## Frontend (Next.js, Persian RTL, mobile-friendly)
- [ ] User switcher, employee view, IT view, model picker
## Delivery
- [ ] Backend tests offline (mocked AI) incl. the two mandatory tests
- [ ] Frontend tests
- [ ] `docker compose up --build`
- [ ] DOCS.md, AI_USAGE.md, TIME_LOG.md, screenshots
