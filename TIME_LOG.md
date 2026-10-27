# Time Log

All times are Asia/Tehran (UTC+03:30), taken from real git commit timestamps (`git log --date=iso`,
recorded in +0330). A task's start is the previous commit (or the moment its request arrived, for
user-requested extensions); its end is its last commit.

| Item | Value |
|---|---|
| Window start | 2026-10-27 16:51 (first commit 75149d0) |
| Deadline (24 h) | 2026-10-28 16:51 |
| First complete delivery | 2026-10-27 17:27 (d621dbc), ~36 min after start |
| Last update | 18:29 |
| Elapsed of 24 h window at last update | ~98 min (at 18:29) |

## 1. Required tasks (from the assignment README)

| # | Requirement | Start | End | Duration | Commits |
|---|---|---|---|---|---|
| 1 | Fork; first commit contains only `TIME_LOG.md` with start time | 16:51 | 16:51:51 | <1 min | 75149d0 |
| 2 | Read spec, task plan, `.gitignore`, API contract | 16:51:51 | 16:55:22 | 4 min | b9a3a75 |
| 3 | Backend core: data model (users, tickets, status), SQLite, settings | 16:55:22 | 17:00:25 | 5 min | b737e56 |
| 4 | AI on new tickets: category, priority, suggested reply; strict validation; fallback when AI fails; secret masking | 17:00:25 | 17:01:34 | 1 min | ca9b475 |
| 5 | Roles enforced server-side (employee sees only own tickets; IT lists all, changes status, sends one final reply); seed README users/tickets | 17:01:34 | 17:03:35 | 2 min | 210a415 |
| 6 | Automated tests offline without API key (incl. the two mandatory ones) | 17:03:35 | 17:04:11 | 1 min | 881f49d |
| 7 | Persian RTL, mobile-friendly UI: employee view, IT view, user switcher, frontend tests (built in parallel) | 16:55:22 | 17:06:58 | 12 min | 222ab86, 14bcc51, 706f277, a8465a3, 789d329, e4fb5e7 |
| 8 | One-command start (`docker compose up --build`) | 17:04:11 | 17:07:12 | 3 min | 66b5345, d946bf2 |
| 9 | Docs: run command, decisions, assumptions, limitations, production auth, "with more time"; `AI_USAGE.md` (after verifying compose end to end) | 17:07:12 | 17:19:39 | 12 min | 605ea96 |
| 10 | 2-3 screenshots (employee, IT, mobile) | 17:19:39 | 17:26:54 | 7 min | 36dfb46 |
| 11 | `TIME_LOG.md` / `TASK.md` final update | 17:26:54 | 17:29:19 | 2 min | d621dbc, 07bba20 |

## 2. Additional tasks (beyond the spec, at the user's request)

| # | Task | Reason | Start | End | Duration | Commits |
|---|---|---|---|---|---|---|
| A | Mixed-direction text fix (per-line bidi) | Pasted English error lines inside Persian text rendered out of order; found in the E2E check | 17:19:39 | 17:26:26 | 7 min (overlaps #10) | 89d6608 |
| B | UI enhancements + skeleton loaders | Smoother loading and clearer cards (hierarchy, badges, collapsible body, code blocks, validation, toasts, dark mode, reduced motion) | 17:56 (request) | 18:02:18 | 6 min | bd9beef, a30a7b8, 99ff847 |
| C | Ticket message threads with conversation-aware AI context | Owner and IT can talk back and forth with reply-to; the AI suggestion takes the whole conversation into account (bounded, untrusted-data framing) | 17:59 (request) | 18:04:04 | 5 min | 38b6a87, 8149518 |
| D | Time log update | Keep the log current | 18:04:04 | 18:08:39 | 5 min | c087555 |
| E | Searchable multi-provider model picker | Let IT choose among verified OpenAI, Gemini, Claude and DeepSeek models; server-side allowlist | 18:07 (request) | 18:13:25 | 6 min | 0a073c8, a5e226d |
| F | IT ticket detail rework | Suggestion made after the final reply could not be sent; final reply shown twice; code block faded and clipped; layout order | 18:22 (request) | 18:24:50 | 3 min | 6e2ebba |
| G | `PROMPTS.md` (AI prompt documentation) | Document the exact system prompt, template, limits and a filled example | 18:26 (request) | 18:29 | ~ | this batch |
| H | Screenshot refresh + docs/time-log update | Screenshots and docs show the extended UI (thread, skeletons, model picker, reworked IT detail) | 18:13:25 | 18:29 | ~ | this batch |
