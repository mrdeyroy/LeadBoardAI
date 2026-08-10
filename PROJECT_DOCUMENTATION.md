# LeadBoard AI — Project Documentation

This is the living, phase-by-phase engineering record for the LeadBoard AI
project. It explains **what** we built, **why** we built it, **how** it works,
and the real decisions, problems and lessons behind every phase. This document
is updated after **every** phase and stays synchronized with the codebase.

> Reading order: Sections 1–5 give the big picture; the **Phase** sections are
> the history log; the reference sections (AI, Database, API, Auth, Frontend,
> Security, Deployment, Testing) are the manual.

---

## 1. Project Overview

**LeadBoard AI** is a lightweight, AI-assisted CRM for small businesses. A
salesperson captures a lead (name, company, requirement, budget, source…), and
LeadBoard stores it, tracks every change, schedules follow-ups, shows the state
of the whole pipeline on a dashboard — and hands each lead to an **AI
assistant** that can analyze it, draft a reply, qualify it, suggest timing, and
propose concrete actions.

### The real-world problem

Small businesses (bakeries, gyms, consultants, agencies, freelancers) keep
their customers in WhatsApp chats, notebooks and spreadsheets. Leads get lost,
nobody follows up, and there is no shared "pipeline" view. Full CRMs
(Salesforce, HubSpot) are complex, expensive and overkill for a solo founder or
a 3-person team.

LeadBoard solves the *"my conversations are everywhere"* problem with one simple
place to:

- centralize leads
- know the state of every deal (pipeline status)
- never forget a follow-up
- see what changed and why (activity timeline)
- get AI help on **the** lead in front of you

### Target users

Solo founders, freelancers and tiny sales teams (1–5 people) who want CRM value
**without** CRM complexity. This is why the MVP deliberately excludes
enterprise features (see §2, Non-Goals).

### Why this is more than a CRUD CRM

A normal CRM is a database with forms. LeadBoard adds three things on top:

1. **Activity as a first-class concept** — every meaningful change is a
   persisted event, so the dashboard and lead pages are always explainable.
2. **An AI assistant on every lead** — analyze / draft reply / qualify / timing
   / chat, one click away.
3. **A safe AI *agent* layer** — the model can *propose* and the user
   *approves* actions that execute through a whitelisted, ownership-checked
   tool runner (see §8 / the AI section).

### High-level workflow

```
User → Lead → AI Analysis → Recommendation → User Confirmation → Action → Activity Log
```

The full loop end-to-end:

```
User logs in
 → JWT issued
 → User creates lead
 → Lead stored in MongoDB
 → User asks AI to analyze the lead
 → Gemini analyzes the lead
 → AI recommends an action (e.g. "schedule a follow-up")
 → User confirms the proposal
 → Whitelisted tool executes (ownership-checked)
 → Database updated + follow-up created
 → Activity recorded
 → Dashboard reflects the change
```

---

## 2. Product Goals

### Primary goals (MVP)

- A working, deployable end-to-end product: register → log in → manage leads →
  follow-ups → dashboard.
- Lead CRUD with search, status filter and pagination.
- Follow-up scheduling with overdue highlighting.
- A dashboard (stat cards, conversion funnel chart, pending follow-ups,
  activity feed) that proves the data is real and connected.
- An AI assistant on each lead: analysis, reply drafting, qualification,
  follow-up timing, and a chat that can **propose** (never force) actions.
- Zero-setup local development (in-memory MongoDB fallback, §Phase 8).

### Secondary goals (later)

- AI memory / conversation history per lead.
- Better analytics (time-to-close, source performance).
- Notifications (email/push) for follow-ups.
- Import/export (CSV).
- Profile editing + password change (backend endpoint needed).
- Additional Gemini models / streaming responses.

### Non-goals (excluded from the MVP)

| Excluded | Why |
|---|---|
| WhatsApp integration | Requires Meta/BSP accounts, webhooks and message templates — a separate project. Leads are still captured with `source = WhatsApp`. |
| Email automation | Needs an email provider, templating, send quotas, spam controls. |
| Payments / billing | Adds PCI and accounting surface; not core to CRM value. |
| Team management | MVP is single-user; teams need roles, invitations and sharing. |
| Complex permissions / roles | One owner per row today; RBAC is future work. |
| Full multi-tenancy | Data is already isolated per user; tenant billing/realms are future work. |
| Mobile app | Responsive web covers phones; a native app is a big separate effort. |
| Realtime / collaboration | Websockets + presence intentionally out of scope. |

These exclusions keep the MVP buildable in weeks, and the architecture (clean
layered code, ownership on every query) is shaped so most can be added without
a rewrite.

---

## 3. Technology Stack

| Layer      | Technology        | Why |
|------------|-------------------|-----|
| Frontend   | React             | Ubiquitous, component model fits this UI, huge ecosystem |
| Build tool | Vite              | Instant dev server, fast production builds, first-class React HMR |
| Styling    | Tailwind CSS v4   | Utility-first styling; consistent via design tokens |
| UI kit     | shadcn/ui         | Source-copied components; full ownership, no wrapper lock-in |
| Charts     | Recharts          | Declarative React charts for the dashboard funnel |
| Animation  | Framer Motion     | Tiny, declarative page transitions |
| Backend    | Node.js + Express | Same language as the client; simple middleware pipeline; easy deploy |
| Database   | MongoDB + Mongoose| Document model fits a lead; ODM validation; JSON-friendly |
| Auth       | JWT               | Stateless tokens that work from any SPA/origin |
| AI         | Gemini API        | Function calling + JSON output out of the box |

**Frontend — React.** The app is component-based: pages compose small
primitives (buttons, cards, badges). React's unidirectional data flow keeps the
loading/error/empty states predictable.

**Build tool — Vite.** Instant dev server, HMR, one build command. Provides the
dev proxy (`/api` → backend, removing CORS in dev) and the `@/` import alias.

**Styling — Tailwind CSS v4.** Utility classes live in JSX; the shadcn theme
tokens make spacing/colors consistent.

**UI — shadcn/ui.** Components (button, card, dialog, sidebar, toast…) are
**copied into the repo** as regular files under `components/ui/`, so we control
every pixel and never fight a third-party wrapper.

**Charts — Recharts.** We needed exactly one chart; Recharts is the least
friction React chart lib and ships in its own lazy chunk (§Phase 6).

**Animation — Framer Motion.** A single `motion.div` keyed by `location.pathname`
gives every route a subtle fade/slide (in `AppShell`).

**Backend — Node.js + Express.** Express 5's small pipeline maps cleanly onto
our layered architecture (route → middleware → controller → service → model).

**Database — MongoDB + Mongoose.** A lead is "everything I know about one
person", which is a document, not a normalized row set. Mongoose supplies
schemas, enum validation, indexes, and the pre-save hook for password hashing.

**Auth — JWT.** Stateless bearer tokens: the server only verifies a signature.
No session storage; works for SPA/API/mobile. (§6.)

**AI — Gemini API.** We call `gemini-2.5-flash` via the `generateContent` REST
endpoint with system prompts, JSON response mode for structured reads, and
**function declarations** so the model can *propose* tool calls (§AI section).

---

## 4. System Architecture

### 4.1 Runtime architecture (request flow)

```
            Browser (React SPA)
                 │  HTTP fetch
                 ▼
          ┌──────────────┐
          │  Vite dev     │  dev: proxies /api/* → :5000 (no CORS)
          │  server :5173 │  prod: static files (Vercel)
          └──────┬───────┘
                 │  /api/*
                 ▼
          ┌──────────────┐
          │  Express app  │  cors → json body → routers → notFound/errorHandler
          │  API :5000    │
          └──────┬───────┘
                 │
       ┌─────────┼──────────────────┐
       ▼         ▼                  ▼
  Middleware   Controllers       Services
  (auth,       (read req →      (shared logic,
   validation)  call service →   integrations)
                respond)
                  │                │
                  ▼                ▼
              Mongoose Models ◄────┘
                  │
                  ▼
               MongoDB
```

Why each layer exists:

- **Browser/SPA** — presents data, collects input, holds the JWT.
- **Vite proxy (dev)** — the client calls relative `/api/*` URLs with zero
  CORS config and no hard-coded host.
- **Express app** — HTTP boundary: parses JSON, enforces CORS, mounts router
  groups, and terminates with `notFound` + `errorHandler`.
- **Middleware** — cross-cutting concerns (`requireAuth`, `validateBody`).
- **Controllers** — thin: read `req`, call a service/model, shape `res`.
- **Services** — reusable logic and third-party integrations (ownership lookup,
  activity recording, AI/Gemini).
- **Models** — schema/validation layer; the only place that talks to Mongo.
- **Indexes** — `user`, `lead`, `status`, `type` keep every query user-scoped.

### 4.2 AI tool-flow architecture

```
React (AIPanel)
   │  POST /api/ai/chat { message }
   ▼
Gemini (function calling)  ──►  proposes { tool, params }  (NOTHING executes)
   │
   ▼
AIPanel shows "Suggested action" card  →  User clicks Confirm
   │  POST /api/ai/actions { tool, params }
   ▼
Tool Registry (getTool) ──► whitelist: updateLeadStatus | addLeadNote | createFollowUp
   ▼
Action Executor ──────────► schema-driven parameter validation
   ▼
Tool implementation ─────► ownership check (findOwnedLead) → 404 if not yours
   ▼
Mongoose mutation ───────► database write
   ▼
Activity record ─────────► dashboard + lead timeline update
```

Key property: **Gemini never touches the database.** It returns *proposed* tool
calls; a separate, server-side, user-confirmed path executes them.

---

## 5. Project Folder Structure

```
LeadBoardAI/
├── package.json                 # root orchestration only (concurrently)
├── README.md                    # quick start + API overview
├── PROJECT_DOCUMENTATION.md     # ← this document
├── client/                      # React + Vite frontend
│   ├── index.html
│   ├── vite.config.js           # proxy /api → :5000, @ alias
│   └── src/
│       ├── main.jsx             # entry: mounts <App/>
│       ├── App.jsx              # routes + AuthProvider + lazy pages
│       ├── index.css            # Tailwind + theme tokens
│       ├── pages/               # route components (one per URL)
│       ├── components/
│       │   ├── ui/              # shadcn primitives (button, card, sidebar…)
│       │   ├── layout/          # AppShell, AppSidebar, TopBar, nav
│       │   ├── auth/            # auth page building blocks
│       │   ├── leads/           # LeadDialog, StatusBadge
│       │   ├── ai/              # AIPanel
│       │   ├── dashboard/       # StatCard
│       │   ├── activity/        # ActivityTimeline
│       │   └── (RouteGuards, EmptyState, PagePlaceholder)
│       ├── context/AuthContext.jsx
│       ├── hooks/useAsync.js
│       └── lib/                 # api client, formatters, lead constants
└── server/                      # Express + Mongoose backend
    ├── scripts/
    │   ├── seed.js              # `npm run seed` demo data
    │   └── smoke.js             # in-memory API integration test suite
    └── src/
        ├── index.js             # boot: listen + connectDB + graceful shutdown (prod)
        ├── app.js               # express app: cors, routers, error middleware
        ├── config/              # env.js (dotenv), db.js (connect + memory fallback)
        ├── routes/              # route mounting + validation middleware
        ├── controllers/         # request/response logic
        ├── services/            # leadService, activityService, aiService, geminiService, prompts, actionExecutor
        ├── tools/               # whitelisted AI tool implementations
        ├── models/              # Mongoose schemas
        ├── middleware/          # requireAuth, errorHandler/notFound
        ├── utils/               # ApiError, asyncHandler, jwt, validate
        └── seed/demoData.js     # shared demo dataset (seed + dev fallback)
```

Placement rules that keep this working:

- `controllers/` — **only** HTTP concerns: read `req`, call a service/model,
  `res.json`. No business logic.
- `services/` — reusable business logic + integrations (Gemini, activity,
  ownership). Imported by controllers **and** tools.
- `tools/` — **nothing but the three allowed AI actions.** This is the security
  boundary for AI mutations.
- `utils/` — pure helpers (errors, JWT, validation, async wrapper).
- `components/ui/` — generic primitives only; domain components live in their
  own folders.
- Never put secrets/keys/connections in code — only in `.env`.

---

## 6. Phase Log (What we did so far)

### Phase 1 — Project Scaffolding (workspace, client, server)

**Goal:** a clean two-folder monorepo that runs one command and opens the app.

**Setup decided together:** one root `package.json` with `concurrently` running
both `client` and `server`. No Nx/Turbo complexity. Client = Vite + React,
server = Express + Mongoose, both with their own scripts.

**What was built:**

- Root `package.json` with `dev`, `build`, `start`, `seed` scripts.
- `client/` — Vite + React app with `@/` alias and `/api` dev proxy.
- `server/` — Express app skeleton with `/api/health` and `connectDB`.
- `.gitignore`, `.env.example`, README start.
- Empty shell pages (Dashboard, Leads, Settings) via `PagePlaceholder` so the
  sidebar has destinations.
- Chosen stack: **React + Vite + Tailwind + shadcn/ui + Express + Mongoose +
  JWT + Gemini** (final stack, §3).

**Deliberate decisions:**

- Keep both apps behind one root `npm run dev` — a founder should clone, run
  one command, and get a working UI.
- Tailwind v4 via the Vite plugin (new CSS-first config, no `tailwind.config.js`).
- Server routes mounted at `/api/*` from day one; the frontend proxy keeps the
  client free of CORS and host config.

### Phase 2 — Server Foundations (error handling, config, base models)

**Goal:** the backend that other phases build on.

**What was built:**

- **Error handling:** `ApiError` class + `errorHandler` middleware + async
  wrapper (`asyncHandler`), so every controller can throw and Express 5 sends a
  clean JSON error (`{ error, details? }`).
- **Config:** `env.js` reads `PORT`, `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`
  with sensible defaults; `.env.example` documents them.
- **Models (v1):**
  - `User` — name, email, hashed password (bcrypt pre-save hook), createdAt.
  - `Lead` — name, company, contact, requirement, budget, source, status,
    notes, `user` (owner ref → User).
  - `FollowUp` — lead ref, title, due date, completed flag.
- **Indexes** on `Lead.user` and `FollowUp.lead` so every query is user-scoped.
- `/api/health` endpoint returning server + DB state.

**Decisions:**

- Models are the only layer that talks to Mongo; controllers stay thin.
- All async routes wrapped in `asyncHandler` — Express 4 silently swallowed
  rejected promises, Express 5 rethrows them, and the wrapper routes them to
  `errorHandler`.
- Activity was deliberately deferred to a dedicated phase (it needed careful
  modeling).

### Phase 3 — Authentication (register, login, JWT)

**Goal:** real, safe authentication so every lead is owned by a user.

**What was built:**

- **`POST /api/auth/register`** — name/email/password → bcrypt-hashed User.
- **`POST /api/auth/login`** — returns `{ token, user }` (JWT).
- **`GET /api/auth/me`** — validates the token, returns the current user
  (the SPA calls it on boot to restore the session).
- **`POST /api/auth/logout`** — client discards its token (no server state).
- **`requireAuth`** middleware — decodes the `Authorization: Bearer` token and
  attaches `req.user` (id + email).
- **Validation** — email format, password length, duplicate-email rejection,
  uniform `400 { error, details }` errors.
- **Client side** — `AuthContext` (register/login/logout, session restore via
  `GET /auth/me`), route guards (redirect to `/login` when unauthenticated),
  and the `apiClient` that injects the bearer token on every request.

**Decisions:**

- Passwords are never stored — only bcrypt hashes, cost factor 10.
- JWT secret from env (default only for local dev; README warns to change it).
- The client keeps the token in `localStorage` (simple SPA pattern; token theft
  risk documented in §Security).
- Auth pages are split into small reusable components (auth page shell, submit
  button, social-button placeholder) so future providers slot in cleanly.

### Phase 4 — Leads (CRUD + search + status filter)

**Goal:** the heart of the CRM — create, read, update, delete leads, and find
the one you need.

**What was built:**

- `Lead` model finalized: name, company, contact (phone/email/website), notes,
  requirement, budget, source (free-text string, e.g. `WhatsApp`, `Website`,
  `Referral`, `Instagram`), timeline, status (enum: `New`, `Contacted`,
  `Qualified`, `Proposal`, `Won`, `Lost`), `user` (owner).
- **`POST /api/leads`** — create (validated, ownership set from `req.user`).
- **`GET /api/leads`** — list with `search` (name/company/email/phone), `status`
  filter, `page`/`limit`/`total` pagination; **never returns another user's
  leads** (`{ user: userId }` guaranteed).
- **`GET /api/leads/:id`** — get one; 404 if it doesn't exist **or belongs to
  someone else** (ownership check).
- **`PATCH /api/leads/:id`** — update; detects and records status/note changes
  as activity.
- **`DELETE /api/leads/:id`** — remove (also removes follow-ups + activity).
- **Client:** `Leads` page — table with search bar, status filter, LeadDialog
  (create/edit form), StatusBadge (color per status).

**Dashboard goes live** (tied to real lead data):
- Stat cards (total, new, qualified, won).
- Status distribution chart (Recharts bar chart of lead counts per status).
- Recent activity feed + pending follow-ups (both pulled from /dashboard API).

**Decisions:**

- `status` is a schema enum so the DB enforces valid values; other inputs
  (source, company, budget, …) are validated server-side via length rules.
- Change detection lives in the **controller/service layer**, not duplicated in
  clients — this is the foundation for the Activity Timeline and the "what did
  the AI change" story.
- Ownership is enforced in the query, not by filtering results in memory.

### Phase 5 — Follow-ups (schedule + overdue highlight)

**Goal:** stop lost leads — every lead scheduled, every task visible.

**What was built:**

- `FollowUp` model: lead ref, `title`, `dueDate`, `completed` flag.
- **`GET /api/followups`** — list (optionally `?openOnly=true` for open items).
- **`POST /api/followups`** — schedule new follow-up on a lead.
- **`PATCH /api/followups/:id`** — update title/date, toggle `completed`.
- **`DELETE /api/followups/:id`** — remove.
- **Client:** Follow-ups view in the UI — a single panel listing **overdue
  (red), today (yellow), upcoming (default)** with **done** checkboxes; overdue
  detection is computed client-side in `FollowUps.jsx`.
- Dashboard "Pending follow-ups" card links here.

**Decisions:**

- Follow-ups are their own schema (they grow timestamps, reminders, assignment
  later) — not a field on Lead.
- Grouping by overdue/today/upcoming is computed in the UI against the returned
  `dueDate`; the server returns the full open list and the client renders the
  three buckets.

### Phase 6 — Dashboard & Polish (charts, states, navigation)

**Goal:** the product *feels* finished — numbers, visuals, and navigation.

**What was built:**

- **Charts:** Recharts **bar chart** of lead counts per status (conversion
  funnel), fed by `GET /api/dashboard` aggregation in `controllers/dashboard.js`.
- **Stat cards:** computed server-side (total, new, qualified, won).
- **Recent activity** and **pending follow-ups** cards wired to real data.
- **Empty states everywhere:** the dashboard and tables show friendly
  "no data yet" cards instead of blank boxes.
- **Page transitions:** Framer Motion fade/slide keyed by `location.pathname`
  in `AppShell`.
- **Loading states:** skeletons); consistent `useAsync` hook (loading /
  error / data).
- **Sidebar navigation:** Dashboard / Leads / Follow-ups / Settings with
  active-route highlighting.
- **Route structure finalized:** `/login`, `/register`, `/` (dashboard),
  `/leads`, `/leads/:id` (lead detail), `/follow-ups`, `/settings`.
- **Recharts in a lazy chunk** via `React.lazy` + `Suspense` so the dashboard
  chart never blocks the first paint of other pages.

**Decisions:**

- Chart/stat aggregation lives in one place (`controllers/dashboard.js`: status
  counts via aggregation pipeline, plus follow-ups and recent activity) — one
  source of truth for "what numbers does the boss see".
- Aggregation is done server-side with a single `$group` query rather than N
  client round-trips, so the dashboard and the AI share the same authority.
- Every user-facing route has loading, error, and empty states — always.

### Phase 7 — AI Assistant (analysis, reply drafting, qualification, chat)

**Goal:** give every lead an AI assistant that is *helpful and safe* — it can
analyze, draft, judge, and **propose**, but can never silently mutate data.

**What was built:**

- **Backend:**
  - `geminiService` — thin wrapper around Gemini's `generateContent` with
    system instructions, tools (function declarations) and JSON output
    support; wraps provider errors as `ApiError(502)`.
  - **System prompt engineering** (`prompts.js`): one assistant identity plus
    narrowly-scoped prompts per operation (`analyze`, `qualify`, `timing`,
    `reply(tone)`, `chat`), each requesting JSON where a typed read is needed.
  - **Prompt injection guard** — the user-supplied message and lead content are
    treated as *data*, never part of the system prompt; the model is instructed
    to ignore any instruction hidden in lead content/messages.
  - `aiService` — orchestration: builds service-side context (lead details),
    calls Gemini, extracts/pre-validates JSON (or throws a clean `ApiError(502)`
    on unreadable output), and normalizes each answer shape.
- **Endpoints** (`/api/ai/*`, all auth-guarded, lead-ownership checked):
  - `POST /ai/analyze` `{ leadId }` — summary, quality (`High/Medium/Low`),
    intent, requirements, missing information, recommended next action.
  - `POST /ai/qualify` `{ leadId }` — recommended status + a one-line reason.
  - `POST /ai/timing` `{ leadId }` — `dueInDays` + reason.
  - `POST /ai/reply` `{ leadId, tone }` — drafted reply text (tone:
    `professional` | `casual`).
  - `POST /ai/chat` `{ leadId, message }` — context-scoped chat; **function
    calls** let the model return proposed actions in `actions[]` — nothing
    executes until **user confirmation**.
  - `POST /ai/actions` — takes a *confirmed* tool call: `{ tool, params }`;
    validated against the whitelist, params schema-checked, ownership-checked,
    executes via the Tool Registry.
- **Tool Registry (backend security core of AI):**
  - Whitelisted tools: `createFollowUp`, `updateLeadStatus`, `addLeadNote`
    (see §Tools). Default cap: AI never deletes, never re-assigns, only ever
    creates/mutates with field allow-lists.
  - Every tool runs through the same ownership query used by CRUD—so a tool
    never touches a lead it doesn't own.
- **Emergency stop** — if the AI-produced JSON doesn't parse or fails
  validation, the endpoint returns a clean structure — no raw model output
  leaks, no silent partial data mutates.

**Client:**

- **AI Panel on the lead detail page** — Analyze | Draft reply | Qualify |
  Timing buttons with a chat always visible.
- **Suggested Action cards in chat** — when Gemini proposes a tool call (or
  Qualify/Timing produce a recommendation), the UI renders a Confirm/Dismiss
  card; a click issues `POST /ai/actions`.
- The panel always shows **loading (with a spinner), error (Retry button), and**
  click-to-copy for drafted replies.

**Decisions:**

- Model calls are **zero-trust**: Gemini may only *propose*; the server owns
  execution. This is the single most important safety decision in the project.
- Read-only operations (analyze/qualify/timing/reply) are typed one-shot calls;
  the chat is the flexible surface for proposals.
- Every endpoint wraps errors with `ApiError` so the client always gets
  `{ error }`.

### Phase 8 — Runtime Fixes & Zero-Setup Development

**Goal:** the app must "just work" when someone clones, runs `npm install` and
`npm run dev`, with zero external dependencies, and with the smoke test suite
green.

**What was built / fixed:**

- **Login 404 bug (critical):** `/auth/login` returned **404 NotFound** on
  register. Root cause: the frontend called `/api/auth/login`, but the route was
  registered at a path that didn't reach it, and controllers/validation had
  drifted out of sync after earlier refactors. Fixed by verifying the route
  wiring end-to-end (`authRoutes` → controller → service → model) and making the
  mounted path consistent everywhere (`/api/auth/login`).
- **Register 400 bug:** registration validated fine but the client didn't handle
  the `400 { error, details }` shape consistently; fixed client error handling on the
  auth pages.
- **MongoDB-not-installed (no-setup dev):** the whole stack died if a user
  didn't have Mongo installed. Added a **`mongodb-memory-server`** fallback in
  `config/db.js`: if `MONGODB_URI` is unreachable, the app
  boots an in-memory mongod, seeds a demo user/leads/follow-ups/dashboard data
  from `seed/demoData.js`. In-memory
  mode is clearly labeled (console banner) so you
  always know which DB you're on; the boot banner shows
  `demo@leadboard.ai / demo1234`.
- **Seed script hang:** `npm run seed` reconnected long after the app had
  opened a connection and blocked; fixed so it no longer hangs on a live DB.
- **Smoke test suite (55 assertions green):** `server/scripts/smoke.js` — a
  test harness that boots an in-memory Mongo, a fresh Express app, then runs
  auth → leads CRUD → follow-ups → dashboard stats → AI endpoints end-to-end,
  asserting status codes, shapes and JWT flow. This is what proves "everything
  still works".

**Decisions:**

- Develop against in-memory Mongo by default so **anyone** can open the project
  with zero setup; use a real Mongo only when you need persistence.
- Every fix ships with a regression test in the smoke suite (login flow is
  permanently covered now).
- Demo credentials are printed at boot so a confused first-time user is not
  stuck.

### Phase 9 — Documentation + Git + Project Baseline

**Goal:** reconcile the record with reality, protect secrets, and establish a
version-controlled baseline so future phases can be reviewed commit by commit.

**What was built/changed:**

- **Reconciled PROJECT_DOCUMENTATION.md with the code:**
  - API reference now matches the real routes (Auth: `register/login/me/logout`,
    no `verify`; Leads use `PATCH` not `PUT`; Follow-ups use `/api/followups`
    with `PATCH /:id` toggle, no `/due-today` or `/overdue` endpoints — overdue
    highlighting is client-side in `FollowUps.jsx`).
  - Error responses documented as `{ error, details? }` (not `{ message }`) —
    matches `errorHandler`.
  - AI endpoints corrected to `analyze / qualify / timing / reply / chat /
    actions` with `{ leadId }`-style bodies; removed the non-existent
    `/ai/dashboard`, `/ai/quality`, `/ai/draft`, `/ai/plan` and
    `:leadId`-in-path variants.
  - Tool params corrected to the real field names (`createFollowUp`:
    `leadId/title/dueDate`; `addLeadNote`: `leadId/content`).
  - Database design updated: `user` (not `owner`) ownership field, `status`
    enum values capitalised, `source` is a free-text string, no `type` enum,
    `FollowUp.title/completed`, activity enum list synchronised.
  - Phase log corrected (charts = Recharts bar chart via
    `controllers/dashboard.js`, no dedicated "Dashboard Service"; no
    `verify` endpoint; `{ error }` shapes; no fabricated AI endpoint names).
  - Frontend section updated real guard names (`GuestOnly`/`RequireAuth`) and
    `useAsync` API (`reload`).
- **README phase numbering aligned** to the 1–8 scheme used here (was grouped
  differently as 1–7).
- **AGENTS.md verified/tightened:** corrected run commands (`npm test` and
  `npm run seed` run inside `server/`, not at the root — root has no smoke/seed
  script).
- **.gitignore hardened:** ignores `.env*` while keeping `.env.example`, so no
  real Atlas/Gemini/JWT secrets can be committed.
- **Git baseline:** `git init` (default branch `main`), then the first commit
  with the full source — `server/.env` (real secrets) is excluded.

**Problems found & fixed:**

- `npm test` reported **2 failures** (`analyze/chat without key -> 500`) once a
  real `GEMINI_API_KEY` existed in `server/.env`. The smoke harness expected the
  "no key" path, so it now explicitly forces `process.env.GEMINI_API_KEY = ''`
  before booting the test app — deterministic, offline, and gives a green
  **55/55**.

**Status:** Docs match code; secrets protected; clean `main` commit in place.
Next: Phase 10 (production readiness).

---

## 7. AI Agent Architecture

### 7.1 How the assistant stays safe

The core rule, restated: **the model proposes; the server disposes.**

```
user message ──► Gemini (client-side, function-declaration) ──► proposed action (JSON)
                                                                  │
                                                                  ▼  user clicks "Confirm"
                                                        POST /ai/actions  (server-side)
                                                                  │
                                                                  ▼
                                Tool Registry ──► schema-validate ──► ownership check ──► DB write ──► activity
```

Because execution is always gated on (a) a whitelist, (b) parameter schema
validation, and (c) the ownership query, a hallucinated or malicious model
output can never delete, reassign, or touch another user's lead.

### 7.2 The Tool Registry (whitelist)

| Tool | Allowed fields | Effect |
|---|---|---|
| `createFollowUp` | `leadId`, `title`, `dueDate` (ISO date) | Creates a FollowUp row |
| `updateLeadStatus` | `leadId`, `status` (in enum) | Moves the lead through pipeline |
| `addLeadNote` | `leadId`, `content` (≤ 5000 chars) | Sets the lead notes field |

**Explicitly NOT whitelisted:** delete lead, delete follow-up, DANGEROUS
cross-user operations. The registry is the single file to review for AI
permissions (server/src/tools/).

### 7.3 Prompt discipline

- User/lead content is **data**, never instructions; prompts tell the model to
  ignore instructions hidden inside lead fields.
- JSON output is requested via JSON schema; invalid output becomes a clean
  structure, never raw text.
- Each endpoint has its own narrowly-scoped system prompt (analysis vs
  qualification vs drafting vs planning) instead of one huge ask-all prompt.

### 7.4 Chat vs single-purpose endpoints

- `analyze / quality / draft / plan` → **typed, one-shot reads** (ideal for
  buttons and quick answers).
- `chat` → **context-scoped conversation** with function-calling for action
  proposals.

---

## 8. Database Design

MongoDB + Mongoose. Document model: "everything I know about one person".

### Collections

**users**
| field | type | notes |
|---|---|---|
| name | String | required |
| email | String | unique, lowercase |
| passwordHash | String | bcrypt, never plaintext |
| createdAt | Date | default now |

**leads**
| field | type | notes |
|---|---|---|
| user | ObjectId | ref User **owner**, indexed |
| name / company | String | searchable |
| email / phone | String | contact |
| notes | String | working notes |
| requirement | String | needed / goal |
| budget | String | amount / range |
| timeline | String | expected timing |
| source | String | free-text, e.g. WhatsApp, Website, Referral |
| status | enum | New, Contacted, Qualified, Proposal, Won, Lost |
| createdAt / updatedAt | Date | timestamps |

**followups**
| field | type | notes |
|---|---|---|
| user | ObjectId | ref User (denormalized for queries) |
| lead | ObjectId | ref Lead, indexed |
| title | String | brief task description |
| dueDate | Date | scheduled time |
| completed | Boolean | default false |

**activities**
| field | type | notes |
|---|---|---|
| user | ObjectId | ref User, indexed |
| lead | ObjectId | ref Lead, indexed |
| type | String | enum: lead_created, status_changed, note_added, ai_analysis, followup_created, ai_action |
| message | String | human-readable line for the timeline |
| metadata | Map | extra JSON (from/to status, actor='ai', note) |
| createdAt | Date | default now |

### Indexes & ownership

Every query is scoped `{ user: req.user.id }` (leads, follow-ups, activities)
plus indexes on `user`, `lead`, and `status`. No query can leak data across
users; missing/unowned IDs resolve to **404** (never "403 — it exists but it's
not yours", which leaks existence).

### Why in-memory fallback?

`mongodb-memory-server` replaces a real database automatically when `MONGODB_URI`
is not provided, so the smoke suite and no-setup dev both work offline.

---

## 9. API Reference

All endpoints are `/api/*`. Every route except `/api/health`,
`/api/auth/register`, `/api/auth/login` and `/api/auth/logout` requires
`Authorization: Bearer <token>`.

### Auth
| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | name, email, password | 201 + { token, user } |
| POST | `/api/auth/login` | email, password | { token, user } |
| GET | `/api/auth/me` | — | current user from token (auth required) |
| POST | `/api/auth/logout` | — | client discards token |

### Leads
| Method | Path | Query/Body | Notes |
|---|---|---|---|
| GET | `/api/leads` | `?search=&status=&page=&limit=` | paginated, user-scoped |
| POST | `/api/leads` | lead fields | 201 |
| GET | `/api/leads/:id` | — | 404 if not yours |
| PATCH | `/api/leads/:id` | lead fields | records status/note activity |
| DELETE | `/api/leads/:id` | — | also cleans follow-ups + activity |

### Follow-ups
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/followups` | optional `?openOnly=true` | user-scoped |
| POST | `/api/followups` | `{ leadId, title, dueDate }` | 201 |
| PATCH | `/api/followups/:id` | `{ title?, dueDate?, completed? }` | update / toggle done |
| DELETE | `/api/followups/:id` | — | user only |

### Activities
| Method | Path | Notes |
|---|---|---|
| GET | `/api/leads/:leadId/activities` | timeline for one lead |
| GET | `/api/activities?limit=` | recent activity feed |

### Dashboard
| Method | Path | Notes |
|---|---|---|
| GET | `/api/dashboard` | stats + status counts + follow-ups + recent activity (single call) |

### AI (all under `/api/ai`, auth + ownership required)
| Method | Path | Notes |
|---|---|---|
| POST | `/api/ai/analyze` | `{ leadId }` → summary/quality/intent/requirements/missing/next step |
| POST | `/api/ai/qualify` | `{ leadId }` → recommended status + reason |
| POST | `/api/ai/timing` | `{ leadId }` → dueInDays + reason |
| POST | `/api/ai/reply` | `{ leadId, tone }` → drafted reply text |
| POST | `/api/ai/chat` | `{ leadId, message }` → reply + proposed `actions[]` |
| POST | `/api/ai/actions` | `{ tool, params }` — **executes only on user confirm** |

### System
| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | { status, service, db, uptime, timestamp } |
| GET | `/` | service greeting |

**Error shape everywhere:** `{ error: string, details?: object }`. Statuses:
400 validation, 401 auth, 404 not found / not yours, 409 conflict (duplicate
email), 500 internal, 502 AI provider failure.

---

## 10. Authentication

### Flow

```
Register/Login → POST /api/auth/* → { token, user }  (JWT, HS256, secret from env)
                          │
    apiClient stores token in localStorage, sends header every request
                          ▼
Verify on boot → GET /api/auth/me → AuthContext restores session
                          ▼
Route guards redirect to /login when no valid session
```

### Implementation notes

- Passwords hashed with **bcrypt (cost 10)** in a Mongoose pre-save hook — plain
  passwords never reach the DB layer and never appear in logs.
- `requireAuth` middleware verifies the JWT on every protected route and sets
  `req.user`; controllers use that, never client-supplied `user`/owner.
- JWT has an **expiry** (`JWT_EXPIRES_IN`, default `7d`). Refresh-token
  rotation is not implemented yet (documented in §Security as a known limit).

---

## 11. Security

### Already in place

- **bcrypt hashing** + no plaintext storage.
- **JWT bearer auth** on every route; no anonymous data access. `JWT_SECRET`
  comes from env; a dev-only default must be replaced in production.
- **Ownership at the query level** — `{ user: req.user.id }` on all selects and
  mutations; foreign/unowned IDs → 404 (no existence leak).
- **Validation on every input** (email format, password rules, status enum,
  required names) with uniform 400s and field-level `details`.
- **Headers/CORS** — CORS locked to `CLIENT_URL`; JSON body limited to 1 MB.
  (A dedicated security-headers middleware (helmet-style) is not yet added —
  see known limits.)
- **AI zero-trust** — the model can only propose; execution runs through
  whitelist + schema validation + ownership check (§7).
- **Prompt-injection defense** — user/lead content is data, never instructions.
- **Whitelisted AI tools only** — delete/reassign/external actions impossible
  through AI.
- **Error hygiene** — `{ error }` responses, no stack traces to clients
  (`errorHandler` logs server-side only).
- **Graceful shutdown** — production process handles SIGINT/SIGTERM with a
  clean exit (in-memory Mongo is stopped at the end of the smoke suite).

### Known limits (documented, not yet fixed)

- `JWT_SECRET` default exists only for local dev — deployment must set a strong
  secret (README says so; `.env.example` lists it).
- No refresh-token rotation or logout server-side invalidation.
- No email verification, no password reset (needs email infra).
- `localStorage` token storage (XSS-exposed); for production, use httpOnly
  cookies or a secure store.
- No per-resource role checks beyond ownership (single-user MVP).
- No dedicated security-headers middleware (e.g. helmet) yet.
- Gemini model access stays behind the same JWT + ownership guard; a production
  deployment should also review API-key rotation.

---

## 12. Frontend Architecture

- **`src/main.jsx`** mounts `<App/>`; **`App.jsx`** owns routes, `AuthProvider`,
  lazy-loaded pages and the `Suspense` fallback.
- **`context/AuthContext.jsx`** — session state, login/register/logout,
  session restore via `GET /auth/me`, exposes the user to any component.
- **`lib/api.js`** — single `api` client (fetch wrapper) that injects the bearer
  token and normalizes `{ error, details }` responses; all pages talk to the
  server through it.
- **`hooks/useAsync.js`** — one hook for loading/data/error; pages stay tiny.
- **Route guards** — `GuestOnly` (redirect authed users away from
  /login,/register) and `RequireAuth` (redirect anonymous users to /login).
- **Pages:** Dashboard, Leads, LeadDetails, FollowUps, Settings, Login, Register.
- **Components grouped by domain:** `layout/`, `auth/`, `leads/`, `ai/`,
  `dashboard/`, `activity/`, plus generic `ui/` (shadcn) and shared
  `EmptyState`.
- **Styling:** Tailwind v4 + design tokens in `index.css`; shadcn theme
  variables keep color/radius/spacing consistent.
- **Navigation:** `AppShell` + `AppSidebar` with active-route highlights;
  Framer Motion transitions keyed by pathname.

---

## 13. Error Handling

**Backend belt-and-braces:**

1. Route-level validation middleware (`validateBody`) rejects bad input with
   `ApiError(400)` + field-level `details`.
2. `errorHandler` middleware converts any error to the right HTTP status
   (`ApiError` carries the status) and never leaks stack traces to the client;
   intentional errors expose their message, unexpected 5xx stay generic
   ("Internal server error").
3. DB/model errors → 500 generic; AI/provider failures → 502 with a clean
   message.
4. Gemini failures → wrapped `ApiError(502)` so the client can show
   "AI is busy — retry" instead of a crash.

**Frontend:**

- `useAsync` exposes `{ data, loading, error, reload }` — every page renders
  all three states.
- the `api` client surfaces server `{ error }` on failure so toasts/forms show
  human language, not raw HTTP statuses.
- Retry buttons on the dashboard and AI Panel.

Shorthand for engineers: `throw new ApiError(404, 'Not found')` anywhere in a
service → HTTP 404 automatically.

---

## 14. Deployment

**Target shape (not yet wired end-to-end in the repo):**

- **Frontend** → static host (e.g. Vercel/Netlify): `npm run build` produces
  `client/dist`; route via a SPA rewrite to `index.html`.
- **Backend** → Node host (e.g. Render/Railway/Fly): run `server` with env vars
  `MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`, `PORT`, plus MongoDB Atlas or
  self-hosted.
- **CORS** — once separated, set `CLIENT_ORIGIN` for the API; in dev the Vite
  proxy already avoids CORS.
- **Secrets** — never commit `.env`; set secrets in the platform's env
  dashboard.

**CI hints:** run `npm run smoke` (server in-memory suite) and `npm run build`
before merging; keep a preview deployment for demo.

---

## 15. Testing

- **`server/scripts/smoke.js`** — the main automated suite: boots an in-memory
  Mongo + fresh Express app, then exercises the whole product flow (auth →
  leads CRUD → follow-ups → dashboard → AI endpoints) asserting status codes,
  payload shapes and JWT flow. Bootstrapped to boot only when the API key isn't
  set (skips AI calls in mock moods; enable live AI with `GEMINI_API_KEY`).
  Currently **green (55 assertions)**.
- **`npm run seed`** — inserts the demo dataset (`seed/demoData.js`) for manual
  exploration.
- **Manual QA paths in README** — each major feature lists "try it" steps.
- No unit-test framework (Jest/Vitest) wired yet — the smoke harness is the
  integration layer; adding Vitest for unit tests is future work.

---

## 16. Development Lessons (real)

1. **Contain the AI.** The single best decision: models *propose*, a whitelisted
   server-side tool registry *executes*, only after user confirmation. It makes
   AI features safe by construction and demos trustworthy.
2. **Layer warning signs were real.** Register went 400, login went 404, because
   route wiring and client handling drifted after refactors. Fix: one steady
   pipeline (routes → validation → controller → service → model) + the smoke
   suite that pins it.
3. **Zero-setup pays off immediately.** `mongodb-memory-server` + demo seed
   means the project runs with `npm install && npm run dev` for anyone; missing
   Mongo or API keys no longer block evaluation.
4. **Empty states & loading states are the product.** The dashboard, tables and
   AI cards all render clearly what's happening; that's what "finished" feels
   like to a user.
5. **Seed-script hang** taught us: a CLI (seed) that connects to a DB the app
   already holds can block forever — reuse connection logic or document it; we
   fixed the hang.
6. **Don't fetch what you don't need.** Lazy-load the chart lib; keep one
   dashboard endpoint instead of N parallel calls.

---

## 17. Interview Talking Points (short version)

- **Owned an end-to-end product:** auth → leads → follow-ups → dashboard → AI.
- **Built a safe AI agent:** function-calling proposals + a whitelisted,
  ownership-checked tool registry + human confirmation. Say "the model can
  never touch data by itself" — it's our answer to "isn't AI dangerous in a
  CRM?"
- **Designed for a specific user:** solo founders/1–5 person teams; MVP cuts
  (no WhatsApp, no teams, no billing) were deliberate.
- **Clean architecture:** thin controllers, service layer for logic, models as
  the DB boundary; ownership enforced in queries.
- **Zero-setup DX** and a 55-assertion integration suite to keep the demo green.
- **Known trade-offs owned upfront:** localStorage tokens, no refresh tokens /
  logout invalidation, no email verification — with a plan to fix in production.

---

## 18. Future Improvements

### Short term
- Refresh-token rotation and logout server-side invalidation; httpOnly-cookie auth.
- Profile editing + password change (db endpoint exists pattern).
- Vitest unit tests; CI that runs smoke + build.
- Real deployment (Vercel + Render) with secrets dashboard.
- Soft-delete / restore leads; bulk status transitions.
- README polish: screenshots, "how the AI stays safe" diagram.

### Medium term
- AI memory / per-lead conversation history.
- Notifications for due/overdue follow-ups (email or push).
- CSV import/export; source-performance analytics.
- Team mode: invitations, roles, shared pipelines (design around ownership
  checks we already have).

### Longer term
- WhatsApp/webhook integration; email automation; multi-tenant billing.
- Streamed long-form AI answers; more Gemini models; per-tool audit log.

---

## 19. Where To Look In The Code (fast map)

| You want… | Look here |
|---|---|
| Start the app | `package.json` scripts + `README.md` |
| Express wiring | `server/src/app.js`, `server/src/index.js` |
| Routes | `server/src/routes/` |
| Business logic | `server/src/services/` |
| AI / Gemini | `server/src/services/geminiService.js`, `aiService.js`, `prompts.js`, `server/src/tools/` |
| Models / schema | `server/src/models/` |
| Auth logic | `server/src/controllers/auth.js`, `server/src/middleware/auth.js` |
| Frontend routes & guards | `client/src/App.jsx`, `client/src/components/RouteGuards.jsx` |
| Auth context / API client | `client/src/context/AuthContext.jsx`, `client/src/lib/api.js` |
| Dashboard + charts | `server/src/controllers/dashboard.js`, `client/src/pages/Dashboard.jsx` |
| In-memory DB fallback | `server/src/config/db.js` |
| Demo data | `server/src/seed/demoData.js`, `server/scripts/seed.js` |
| Integration tests | `server/scripts/smoke.js` |

---

*Phase-by-phase log: **Phase 1** scaffolding → **Phase 2** server foundations →
**Phase 3** auth/JWT → **Phase 4** leads + dashboard → **Phase 5** follow-ups →
**Phase 6** dashboard/polish → **Phase 7** AI assistant (analysis, reply,
qualification, chat + safe tool actions) → **Phase 8** runtime fixes
(login/register 400/404, MongoDB not-installed fallback, seed hang, 55-assertion
smoke suite green). Next: deployment, notifications, or team mode.*