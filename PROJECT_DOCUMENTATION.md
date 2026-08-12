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
| Auth       | Clerk             | Managed sign-in/sessions for a single-user SPA + API |
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
schemas, enum validation, and indexes.

**Auth — Clerk.** Managed sign-in/sign-up flows, sessions, and profile
management handled by Clerk (`@clerk/express` backend, `@clerk/clerk-react`
frontend). The backend verifies sessions via `getAuth` and maps the Clerk
identity to an in-app `User` row; no passwords are ever stored here. (§10.)

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

- **Browser/SPA** — presents data, collects input; holds the Clerk session.
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
│       ├── main.jsx             # entry: ClerkProvider + mounts <App/>
│       ├── App.jsx              # routes + lazy pages (Clerk guards)
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
│       ├── context/ClerkTokenBridge.jsx
│       ├── hooks/useAsync.js
│       └── lib/                 # api client, formatters, lead constants
└── server/                      # Express + Mongoose backend
    ├── scripts/
    │   ├── seed.js              # `npm run seed` demo data
    │   └── smoke.js             # in-memory API integration test suite
    └── src/
        ├── index.js             # boot: listen + connectDB + graceful shutdown
        ├── app.js               # express app: cors, clerk, routers, error middleware
        ├── config/              # env.js, db.js, clerk.js (middlware wiring)
        ├── routes/              # route mounting + validation middleware
        ├── controllers/         # request/response logic
        ├── services/            # leadService, activityService, aiService, geminiService, userSync, actionExecutor
        ├── tools/               # whitelisted AI tool implementations
        ├── models/              # Mongoose schemas
        ├── middleware/          # requireAuth, rateLimit, logger, errorHandler/notFound
        └── seed/demoData.js     # shared demo dataset (seed + dev fallback)
```

Placement rules that keep this working:

- `controllers/` — **only** HTTP concerns: read `req`, call a service/model,
  `res.json`. No business logic.
- `services/` — reusable business logic + integrations (Gemini, activity,
  ownership). Imported by controllers **and** tools.
- `tools/` — **nothing but the three allowed AI actions.** This is the security
  boundary for AI mutations.
- `utils/` — pure helpers (errors, validation, async wrapper).
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

### Phase 10 — Clerk Authentication (managed sign-in, sessions, rate limiting)

**Goal:** replace the in-house JWT+bcrypt auth with Clerk — the same data model
and `req.user` ownership stay, but identity, sign-in, sessions, and profile
management move to Clerk. No functionality regressions, 69 smoke assertions
green.

**What was built/changed:**

- **Backend → Clerk (`@clerk/express`):**
  - `config/clerk.js` — `clerkAuth()` mounts `clerkMiddleware` (with optional
    `CLERK_JWT_KEY`) when `CLERK_SECRET_KEY` is set, else a no-op. `requireAuth`
    **fails closed** (401) when no keys are configured.
  - `middleware/auth.js` — async `requireAuth`: reads `getAuth(req)`, requires
    `isAuthenticated`, resolves the app `User` via `findOrCreateAppUser`, sets
    `req.user`. Controllers keep using `req.user.id` unchanged.
  - `services/userSync.js` (new) — `findOrCreateAppUser(clerkUserId,
    sessionClaims)`: prefers profile from signed session claims, falls back to
    the Clerk API, then placeholders offline.
  - `models/User.js` — `clerkUserId` required/unique/indexed added; `email`
    optional; `passwordHash` + bcrypt removed.
  - Auth surface reduced to `GET /api/auth/me`; register/login/logout removed.
  - **Rate limiting** (new dependency-free fixed-window IP limiter): 30/min on
    `/api/auth/me` and `/api/ai/*`; the AI limit doubles as an abuse test.
  - `middleware/logger.js` (request log: method/path/status/duration) and
    hardened `errorHandler` (malformed JSON → 400, oversized body → 413).
  - `index.js` — graceful shutdown on SIGTERM/SIGINT (server close + mongoose
    disconnect + stop in-memory mongod).
  - Seed/demo data tied to Clerk demo user `user_2demoLeadBoardAI`.
  - `env.js` reads `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `CLERK_JWT_KEY`;
    production requires both Clerk keys; JWT vars removed.
  - Dependencies: `@clerk/express` added; `bcryptjs` removed; `jsonwebtoken`
    moved to devDependencies (tests only).
- **Tests — `server/scripts/smoke.js` rewritten (69 assertions green):**
  - Generates a throwaway RSA keypair, sets Clerk env vars, and mints signed
    RS256 tokens (`jsonwebtoken`) for users, so auth is fully offline.
  - Covers: no token / garbage / expired / wrong-signing-key / fake-`userId`
    claim → 401; app-user sync from Clerk identity; every route's ownership
    isolation; input validation; AI rate-limit 429; public health route.
- **Frontend → Clerk (`@clerk/clerk-react`):**
  - `main.jsx` wraps the app in `ClerkProvider` (`VITE_CLERK_PUBLISHABLE_KEY`).
  - `context/ClerkTokenBridge.jsx` (new) — feeds `getToken()` into `lib/api.js`
    every request; tokens **never** hit localStorage.
  - `lib/api.js` — `setSessionTokenProvider` pattern, no token persistence.
  - `App.jsx` + `components/RouteGuards.jsx` — `RequireAuth`/`GuestOnly` built
    on Clerk `useAuth` (`isLoaded`/`isSignedIn`); `/login`/`/register` are
    guest-only routes.
  - `pages/Login.jsx` / `Register.jsx` — Clerk `<SignIn>`/`<SignUp>` embedded in
    the branded `AuthLayoutCard`.
  - `components/layout/TopBar.jsx`, `pages/Dashboard.jsx`, `pages/Settings.jsx`
    use Clerk `useUser`/`useClerk` (display name, email, sign-out).
  - `context/AuthContext.jsx` deleted.
- **Docs/env:** `.env.example` (server + client) updated with Clerk vars only;
  README, AGENTS.md, and this document reconciled (auth sections now describe
  the Clerk flow).

**Problems found & fixed:**

- `req.auth` is a **branded function** set by `clerkMiddleware` — so when no
  Clerk keys are present the middleware must be skipped entirely and
  `requireAuth` must fail closed, otherwise tests/boots would throw.
- Network round-trips to Clerk's JWKS broke offline tests — solved with
  `CLERK_JWT_KEY` (PEM public key) so verification is local and deterministic.
- Detect-sign-out loops: `GuestOnly` uses `isSignedIn` (not `userId`) and
  redirects authenticated users to `/dashboard` as soon as the session loads —
  avoids navigating before the session exists.

**Status:** Phase 10 complete — Clerk auth end-to-end (UI → tokens → backend
verify → profile sync → ownership), rate limiting in place, 69/69 smoke green,
docs synchronized with the implementation. Deploying next should only need real
Clerk keys + env vars.

---

### Phase 11 — Smarter AI (live lead context, reply tones, chat memory, clearer UX)

**Goal:** make the AI features actually *useful* instead of generic: inject the
lead's real CRM state (follow-ups, recent activity, age) into every prompt,
give the reply drafts an explicit tone choice, let the chat remember earlier
messages in the session, and make the verify-before-execute flow unmistakable in
the UI. No API-surface growth beyond validation; 72 smoke assertions green.

**What was built/changed:**

- **Backend — richer, truthful context (`services/prompts.js` + `aiService`):**
  - `buildLeadContext` now includes the lead's full profile, **days in CRM**,
    **upcoming open follow-ups** (title + due date) and **recent activity**
    (last 5) — loaded live per call by `loadInsights(leadId)` in `aiService`.
    Every operation (analyze/qualify/timing/reply/chat) reasons from the same
    enriched context instead of a bare lead card.
  - Prompts tightened per operation: qualify warns it is *recommendation-only*
    and to keep the current status when evidence is thin; timing now also
    returns a `title` (concrete follow-up subject) and caps `dueInDays` 0–14;
    analyze keeps its strict JSON contract. Prompt-injection defence restated
    (lead/conversation content is data, never instructions).
- **Reply tones** (`/api/ai/reply`): enum changed `professional | casual` →
    `short | professional | friendly`, validated 400 server-side; each tone has
    its own drafting guidance in `PROMPTS.reply(tone)`.
- **Chat memory** (`/api/ai/chat`): accepts an optional `history` array
    (roles `user`/`assistant` + text). The controller sanitizes it (must be an
    array; invalid roles/text → 400; capped to last 12, each ≤ 5000 chars) and
    `aiService.chat` maps it into Gemini `contents` with role
    `user`→`user`, `assistant`→`model`, then appends the current message.
- **AI activity trace** — `analyze` activities now carry `metadata.actor: 'ai'`
    so the timeline can badge AI-generated entries.
- **Client — `AIPanel` upgrades:**
  - **Reply tone picker** (Short/Professional/Friendly) — pick before drafting,
    and re-drafting automatically if a reply is already on screen.
  - **Editable drafted reply** — the reply renders in a `Textarea`; Copy copies
    your edited text.
  - **Separate per-result views** — `QualifyView` shows current status →
    recommended status + reason (and a hint when no change is needed); a status
    proposal only appears when the recommendation actually differs.
    `TimingView` shows the suggested delay + reason; its proposal card now uses
    the AI's `title` for the follow-up.
  - **Clearer confirmations** — proposal cards read "Proposed by AI — requires
    your confirmation" with an explicit "Confirm & run" button, and a persistent
    footnote: "Proposed actions only run after you confirm them."
  - `useState`-driven tuned `sendChat` sends the session history; chat bubbles
    keep working as before.
- **ActivityTimeline** — AI-generated entries (analyze/ai_action, or
  `metadata.actor === 'ai'`) show a small sparkle "AI" badge.
- **Docs:** README API table reflects the new tone values and `history`/
    `dueInDays + title` fields; this document updated.
- **Tests — `server/scripts/smoke.js` (+3, now 72):** reply with invalid tone
    → 400; chat with non-array history → 400; chat history with invalid role →
    400. (Existing no-key 500 paths for analyze/chat still green.)

**Problems found & fixed:**

- A stray trailing comma after the closing backtick of `PROMPTS.reply` broke the
  whole module with `SyntaxError: Unexpected token '}'` — caught immediately by
  the smoke suite on boot; removed, tests green.
- Tone was previously `professional | casual`, which read as an anti-pair;
  switched to the 3-tone set for a real choice (and covered it with a 400 test
  so a stale client can't silently send `casual` into the fallback).

**Status:** Phase 11 complete — every AI operation now reasons from the lead's
live CRM state, replies have an explicit tone, the chat carries session memory,
and the confirm-before-execute rule is spelled out in the UI. 72/72 smoke green,
client builds and lints clean.

---

### Phase 12 — SaaS CRM UX Polish & Verification

**Goal:** Polish LeadBoard AI into a professional, high-grade SaaS CRM with polished tables, sorting, filters, clear information hierarchy, KPI cards, and responsive transitions without adding heavy bloated features or breaking Clerk auth / AI tools.

**What was built/changed:**

- **Leads Table UX & Sorting:**
  - Sortable table columns (`name`, `company`, `source`, `budget`, `status`, `createdAt`) with dynamic direction indicators (`ArrowUp`/`ArrowDown`).
  - Source filter dropdown alongside Status filter.
  - Search bar with instant clear button (`X`).
  - Items-per-page selector (10, 20, 50) and responsive page controls.
- **Lead Details Page Polish:**
  - Hero header card with inline status selector & quick action toolbar.
  - Embedded Lead Follow-ups widget directly on the detail page (add follow-up for this lead, toggle completion, overdue alerts).
  - Filterable Activity Timeline tabs (All, Status Changes, Notes, AI Actions).
- **Dashboard Polish:**
  - Win Rate % indicator badge (`(Won / Total * 100).toFixed(1)%`).
  - Pipeline Conversion Funnel chart (Bar) and Lead Source distribution chart.
  - Categorized pending follow-ups (Overdue, Due Today, Upcoming).
  - Activity feed with relative time formatting (`timeAgo`) and action badges.
- **Follow-ups UX:**
  - Filter tabs (All, Overdue, Due Today, Upcoming, Completed).
  - Search input for follow-ups by title or lead name.
  - Edit Follow-up modal dialog for editing title and due date.
- **Verification:**
  - All 80 smoke test assertions green in `server/scripts/smoke.js`.
  - Vite production build verified clean (`npm run build`).

---

### Phase 13 — Core SaaS Features (Profile Editing, CSV Import/Export, Source Analytics, Preferences, Audit History)

**Goal:** Add essential SaaS features for solo founders and small teams without making the product bloated or introducing complex enterprise multi-tenant/teams overhead.

**What was built/changed:**

- **Profile Editing (`GET /api/user/profile`, `PATCH /api/user/profile`):**
  - Expanded `User` model with `phone`, `jobTitle`, `companyName`, and `bio`.
  - Profile settings tab lets users manage contact info and business details.
- **Password & Account Settings (Clerk Native):**
  - Settings page "Security & Account" tab embeds Clerk's native `openUserProfile()` trigger button.
  - Password updates, email management, and MFA are delegated entirely to Clerk natively (no custom password endpoints or raw hash storage).
- **CSV Lead Export (`GET /api/leads/export`):**
  - Backend endpoint returns `.csv` download of authenticated user's leads with escaped CSV cells and `Content-Disposition` attachment header.
  - Front-end "Export CSV" button triggers browser download.
- **CSV Lead Import (`POST /api/leads/import` + `CsvImportDialog`):**
  - Drag-and-drop CSV importer with native string parser, auto-header detection, preview table of parsed rows, row validation (requires `name`), bulk insertion attached to `req.user.id`, and bulk activity logging.
- **Lead Source Analytics (`sourceCounts` in `GET /api/dashboard`):**
  - Aggregates lead counts by acquisition source (`source`).
  - Displays a Lead Source distribution chart on the dashboard.
- **Improved Audit History (`GET /api/activities`):**
  - Enhanced activity endpoint with filtering by activity `type`, message search, and pagination.
- **User Preferences (`PATCH /api/user/preferences`):**
  - Persists `itemsPerPage` (10, 20, 50), `defaultView` (`table`/`cards`), and `theme` (`light`/`dark`/`system`) in User schema and applies to workspace views.
- **Tests & Verification:**
  - 80/80 smoke test assertions green in `server/scripts/smoke.js` covering profile GET/PATCH, preferences PATCH, CSV export, CSV import validation, lead sorting, and source analytics.

---

### Phase 14 — Automated Testing & Reliability Strengthening

**Goal:** Expand automated test coverage to harden every critical path: auth edge cases, ownership isolation, validation contracts, CRUD flows, AI tool authorization, and all edge cases across follow-ups, activities, dashboard, CSV import/export, and user profile/preferences.

**Test Strategy:**
All tests live in `server/scripts/smoke.js`. This single-file suite:
- Spins up an in-memory MongoDB via `mongodb-memory-server` (no external DB required).
- Generates an RSA keypair on boot; wires the public key into `CLERK_JWT_KEY` so `@clerk/express` verifies tokens offline with no network call.
- Mints RS256-signed tokens for two user identities (`DEMO_USER`, `OTHER_USER`).
- Tests run top-to-bottom in sequence; state accumulates across sections, so ordering matters.

**Test Areas & Key Cases:**
- **Clerk Auth:** No token → 401; garbage token → 401; expired token → 401; wrong-key signature → 401; fake `userId` claim ignored; `sub` is canonical identity.
- **User Sync:** App User auto-created on first request; no `passwordHash` field; email synced from Clerk claims; two clerk identities produce two distinct app users.
- **Lead CRUD:** Create with defaults (201); empty name → 400 with `details`; bad status enum → 400; malformed JSON → 400; search; status filter; source filter; pagination shape; sort-by-name; invalid sortBy falls back silently; GET missing → 404; PATCH status+notes; bad status patch → 400; activity logging; cascade delete (follow-ups + activities purged).
- **Follow-ups:** Create (201); missing lead → 404; bad date → 400; openOnly filter; complete toggle; `PATCH` empty title → 400; `PATCH` bad date → 400; `PATCH` valid title → 200; `DELETE` owned → 200; `DELETE` unowned → 404; deleted item absent from list.
- **Activities:** Auto-recorded for create/status/note/follow-up/AI actions; `?type=` filter on `/leads/:id/activities`; `?type=` filter on `/activities`; `?search=` keyword filter; no-match search returns empty array; lead name populated; activity feed has `lead.name`.
- **Dashboard:** Status totals correct; `statusCounts` covers all statuses; `sourceCounts` items have `source` + `count` keys; `leads.won` is a number; pending follow-ups populated; recent activity populated; isolated per user.
- **Ownership Isolation:** User B cannot GET/PATCH/DELETE User A's lead; User B cannot create follow-up on User A's lead; User B cannot PATCH/DELETE User A's follow-up; User B's activity feed excludes User A's activities; User B's dashboard total is isolated; User B's AI tool calls on User A's lead → 404.
- **AI Tools & Actions:** No auth → 401; unknown tool → 400; missing required param → 400; invalid enum param → 400; `updateLeadStatus` executes and persists; `addLeadNote` executes; `createFollowUp` executes; bad date → 400; AI actions logged with `actor: 'ai'` metadata; AI endpoints rate-limited → 429.
- **AI Ownership:** `POST /ai/chat` with unowned lead → 404; `POST /ai/reply` with unowned lead → 404; `POST /ai/analyze` with unowned lead → 404.
- **AI Chat/Reply Validation:** `history` must be array → 400; history item invalid role → 400; invalid `tone` → 400; no Gemini key → 500 with clear error.
- **User Profile & Preferences:** `GET /api/user/profile` → 200; `PATCH` valid → 200; empty name → 400. `PATCH` preferences valid → 200; invalid → 400.
- **CSV Import/Export:** `GET /api/leads/export` → 200 `text/csv`. `POST /api/leads/import` valid rows imported; empty-name rows skipped; non-array body treated as empty.

**Final Test Results:** `108 passed, 0 failed` (up from 80 assertions in Phase 13).

**Bugs Fixed:**
- `updateFollowUp` accepted empty-string titles and invalid date strings without error -> added input validation (`ApiError(400)`).
- `getLeadActivities` had no `?type=` filter -> added optional `type` query param filtering.

---

### Phase 15 — Production Deployment Readiness

**Goal:** Prepare LeadBoard AI for production deployment across Vercel (frontend), Render (backend), and MongoDB Atlas (database), ensuring security, strict CORS isolation, environmental validation, clean SPA routing, health checks, and verified production builds.

**What Was Built / Configured:**

1. **Frontend Production Configuration (Vercel):**
   - SPA Routing Specification (`client/vercel.json`): Configured rewrite rules (`/(.*)` -> `/index.html`) so client-side React Router paths reload properly without 404ing.
   - API Client Integration (`client/src/lib/api.js`): Dynamic API URL resolution (`VITE_API_URL` environment variable support).
   - Production Build Verification: Clean compilation via `vite build` producing minified assets (`dist/`).

2. **Backend Production Configuration (Render & Node.js):**
   - Render Web Service Spec (`server/render.yaml`): Infrastructure-as-code specification defining service type (`web`), runtime (`node`), build command (`npm install`), start command (`npm start`), working directory (`server`), health check path (`/api/health`).
   - Strict Environment Validation (`server/src/config/env.js`): Enforces required production variables (`CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`) on boot in `production` environment.
   - CORS Isolation (`server/src/app.js`): Restricts allowed origins strictly to `env.clientUrl` (`CLIENT_URL`).
   - Production Health Check (`server/src/routes/health.js`): `/api/health` returns `200 OK` with database status, uptime, and timestamp.
   - Graceful Shutdown (`server/src/index.js`): Signal handlers (`SIGTERM`, `SIGINT`) close HTTP connections cleanly.
   - Production Request Logging (`server/src/middleware/logger.js`): Clean HTTP request logging without exposing sensitive data.

3. **Security Audit & Verification:**
   - Secrets Protection: Verified `.gitignore` excludes all `.env` files.
   - Zero Hardcoded Credentials: Confirmed no API keys or DB credentials exist in code.
   - Authentication & Ownership Boundary: All API routes except `/api/health` require valid Clerk session tokens. All DB queries enforce `{ user: req.user.id }` isolation.

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
| email | String | optional, default '' |
| clerkUserId | String | **required, unique, indexed** — Clerk identity (`sub`) |
| createdAt | Date | default now |

The app never stores passwords. A `User` row is created/synced on first
authenticated request via `findOrCreateAppUser`, which maps the Clerk
`clerkUserId` to the app-level owner every other collection references.

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

All endpoints are `/api/*`. Every route except `/api/health` and `/` requires
a valid Clerk session — the frontend's `lib/api.js` sends the session token as
`Authorization: Bearer <token>`.

### Auth
| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/api/auth/me` | — | current user, resolved from the Clerk session (auth required) |

Registration/sign-in/logout are handled entirely by Clerk's hosted flows on the
frontend (`/login`, `/register`); the backend has no password endpoints.

Everything below (Leads → AI) — plus `/api/auth/me` — requires a valid Clerk
session; `/api/health` and `/` are public.

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
email), 413 request body too large, 429 rate limited, 500 internal, 502 AI
provider failure.

---

## 10. Authentication

### Flow

```
Client sign-in via Clerk flows (/login, /register) → Clerk issues a session
                                                          │
   ClerkTokenBridge feeds getToken() → lib/api.js sets Authorization: Bearer
                                                          ▼
Backend clerkMiddleware (getAuth) verifies the session token → clerkUserId
                                                          ▼
findOrCreateAppUser(clerkUserId, sessionClaims) -> app User doc -> req.user
                                                          ▼
Route guards redirect to /login until a valid session exists
```

### Implementation notes

- Sessions are issued and verified by **Clerk** (`@clerk/express` on the
  backend, `@clerk/clerk-react` on the frontend). The app never sees passwords
  and no tokens are stored in `localStorage` — `lib/api.js` receives a
  freshly-minted token on each request via `getToken()`.
- `clerkMiddleware` runs only when `CLERK_SECRET_KEY` is set (a no-op
  otherwise, so the API can still boot for tests/local work), and verifies the
  token against the `CLERK_JWT_KEY` PEM public key when provided — so no
  network round-trip is needed at runtime.
- `findOrCreateAppUser` syncs a Clerk identity (`clerkUserId` = JWT `sub`) to
  the in-app `User` row, preferring profile fields inside the signed session
  claims, then falling back to the Clerk API, then placeholders offline.
- Backend tokens include per-endpoint rate limiting: 30/min on `/api/auth/me`
  and `/api/ai/*`. Old JWT fields (`JWT_SECRET`, `JWT_EXPIRES_IN`,
  `passwordHash`, `bcryptjs`) were fully removed (fsck clean).
- If no Clerk keys are configured, `requireAuth` **fails closed** (401) rather
  than allowing anonymous access. In production `CLERK_SECRET_KEY` /
  `CLERK_PUBLISHABLE_KEY` are required and validated at boot.

---

## 11. Security

### Already in place

- **Clerk-managed credentials** — no password storage, hashing, or reset code
  in this repo; sign-in/sign-up/2FA are handled by Clerk.
- **Session auth on every route** — `clerkMiddleware` + `requireAuth` gate all
  `/api/*` (except health); no anonymous data access. Fails closed when no
  Clerk keys are set.
- **Networkless verification** — optional `CLERK_JWT_KEY` (PEM public key)
  lets the server verify tokens without a JWKS round-trip.
- **Ownership at the query level** — `{ user: req.user.id }` on all selects and
  mutations; foreign/unowned IDs → 404 (no existence leak).
- **Validation on every input** (email format, status enum, required names)
  with uniform 400s and field-level `details`.
- **Rate limiting** — fixed-window IP limiter (dependency-free) on `/api/auth/me`
  (30/min) and `/api/ai/*` (30/min).
- **Headers/CORS** — CORS locked to `CLIENT_URL`; JSON body limited to 1 MB.
- **AI zero-trust** — the model can only propose; execution runs through
  whitelist + schema validation + ownership check (§7).
- **Prompt-injection defense** — user/lead content is data, never instructions.
- **Whitelisted AI tools only** — delete/reassign/external actions impossible
  through AI.
- **Error hygiene** — `{ error }` responses, no stack traces to clients
  (`errorHandler` logs server-side only); malformed JSON → 400, oversized
  bodies → 413.
- **Graceful shutdown** — SIGINT/SIGTERM stop the HTTP server, disconnect
  Mongoose, and shut down the in-memory Mongo (if used).

---

## 12. Frontend Architecture

- **`src/main.jsx`** mounts `<App/>` inside `ClerkProvider` (publishable key from
  `VITE_CLERK_PUBLISHABLE_KEY`); **`App.jsx`** owns routes + lazy pages.
- **`context/ClerkTokenBridge.jsx`** — feeds Clerk's `getToken()` into
  `lib/api.js` via `setSessionTokenProvider` on mount; renders nothing.
- **Session state** comes from Clerk hooks (`useAuth`, `useUser`, `useClerk`)
  — never stored in localStorage; sign-in/sign-up handled by Clerk's embedded
  `<SignIn>`/`<SignUp>` flows on `/login` and `/register`.
- **`lib/api.js`** — single `api` client (fetch wrapper) that attaches a
  fresh Clerk session token and normalizes `{ error, details }` responses; all
  pages talk to the server through it.
- **`hooks/useAsync.js`** — one hook for loading/data/error; pages stay tiny.
- **Route guards** — `GuestOnly` (redirect authed users away from
  /login,/register) and `RequireAuth` (redirect anonymous users to /login),
  both built on Clerk `useAuth`.
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

---

## 14. Deployment

**Target shape:**

- **Frontend** → Vercel: build command `npm run build`, output `client/dist`, SPA rewrite in `vercel.json`.
- **Backend** → Render (web service): start command `npm start`, working directory `server/`, environment variables configured in dashboard.

---

## 15. Testing

- **`server/scripts/smoke.js`** — the main automated suite: 108 assertions green.
- **`npm run seed`** — inserts the demo dataset (`seed/demoData.js`) for manual exploration.

---

## 16. Development Lessons (real)

1. **Contain the AI.** The single best decision: models *propose*, a whitelisted
   server-side tool registry *executes*, only after user confirmation.
2. **Layer warning signs were real.** Express 5 route wiring + async middleware require rigorous testing.
3. **Zero-setup pays off immediately.** `mongodb-memory-server` + demo seed.
4. **Empty states & loading states are the product.**
5. **Don't fetch what you don't need.**

---

## 17. Interview Talking Points (short version)

- **Owned an end-to-end product:** auth → leads → follow-ups → dashboard → AI.
- **Built a safe AI agent:** function-calling proposals + whitelisted tool registry.
- **Designed for a specific user:** solo founders/1–5 person teams.
- **Clean architecture:** thin controllers, service layer, ownership enforced in queries.
- **Zero-setup DX** and a 108-assertion integration suite.

---

## 18. Future Improvements

### Short term
- Production deployment setup on live platforms.
- Soft-delete / restore leads; bulk status transitions.

### Medium term
- Notifications for due/overdue follow-ups (email or push).
- Team mode: invitations, roles, shared pipelines.

### Longer term
- WhatsApp/webhook integration; email automation; multi-tenant billing.

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
| Auth logic | `server/src/middleware/auth.js`, `server/src/services/userSync.js`, `server/src/config/clerk.js` |
| Frontend routes & guards | `client/src/App.jsx`, `client/src/components/RouteGuards.jsx` |
| Auth bridge / API client | `client/src/context/ClerkTokenBridge.jsx`, `client/src/lib/api.js` |
| Dashboard + charts | `server/src/controllers/dashboard.js`, `client/src/pages/Dashboard.jsx` |
| In-memory DB fallback | `server/src/config/db.js` |
| Demo data | `server/src/seed/demoData.js`, `server/scripts/seed.js` |
| Integration tests | `server/scripts/smoke.js` |

---

## Phase 17 — In-App Notifications & Scheduled Follow-up Workflows

### Goal

Transform follow-ups into a complete, proactive business workflow by introducing in-app notifications, periodic background job scheduling for due/overdue items, an email service abstraction, and notification management endpoints.

### What Was Built / Changed

1. **Notification Data Model (`server/src/models/Notification.js`)**:
   - Fields: `user` (ref User), `lead` (ref Lead), `followUp` (ref FollowUp), `type` (`followup_due`, `followup_overdue`, `ai_suggestion`), `title`, `message`, `read` (boolean, default false), `readAt`, and `dedupKey` (sparse unique index for idempotency).
2. **Notification Service Abstraction (`server/src/services/notificationService.js`)**:
   - Enforces unique `dedupKey` insertion logic to guarantee duplicate prevention.
   - Pluggable email provider interface (`setEmailProvider`) — if no email provider is configured or an email fails, in-app notifications still persist cleanly without throwing.
   - Provides methods for user-scoped fetching (`getNotifications`), marking individual item read (`markAsRead`), and marking all unread read (`markAllAsRead`).
3. **Scheduled Follow-up Processor (`server/src/services/schedulerService.js`)**:
   - Periodic background worker (`startFollowUpScheduler`) scanning pending follow-ups.
   - Automatically generates `followup_due` for follow-ups due today and `followup_overdue` for past-due follow-ups.
   - Uses date-stamped `dedupKey` (`due_<fupId>_<YYYY-MM-DD>` / `overdue_<fupId>_<YYYY-MM-DD>`), making repeated scheduler execution 100% idempotent.
4. **Notification Endpoints & Controllers (`server/src/routes/notifications.js`, `server/src/controllers/notifications.js`)**:
   - `GET /api/notifications`: Returns user's notifications (sorted by newest) and `unreadCount`. Supports `?unreadOnly=true` and `?limit=`.
   - `PATCH /api/notifications/:id/read`: Marks a specific notification as read.
   - `PATCH /api/notifications/read-all`: Marks all unread notifications for the user as read.
5. **Frontend UI (`client/src/components/layout/NotificationsDropdown.jsx` & `TopBar.jsx`)**:
   - Added interactive notification bell button to `TopBar`.
   - Shows live unread badge count with auto-refresh polling every 30 seconds.
   - Dropdown displays list of notifications with relative timestamps, type icons, unread highlight styling, click-to-read, and "Mark all read" button.

### Testing & Verification

- Added 11 new integration test assertions to `server/scripts/smoke.js` (total **119 passed, 0 failed**).
- Verified due today notification creation (`followup_due`).
- Verified overdue notification creation (`followup_overdue`).
- Verified duplicate prevention (scheduler re-run creates 0 duplicate notifications).
- Verified strict ownership isolation (User B cannot see or mark User A's notifications read -> 404).
- Verified `markAsRead` and `markAllAsRead` update `unreadCount` to 0.
- Verified clean frontend production compilation (`npm run build`).

---

## Phase 18 — SaaS Plan-Based Usage Limits & Feature Gating

### Goal

Make LeadBoard AI SaaS-ready by introducing plan-based usage limits (Free vs. Pro), monthly AI tracking & auto-reset mechanisms, server-side feature gating, and subscription UI indicators.

### Plan Architecture & Limits

- **Free Tier (`free`)**:
  - Max Leads: 50
  - Monthly AI Actions: 20
  - Features: Basic Analytics, In-App Notifications, Follow-ups
  - Blocked Features: CSV Export, CSV Import, Advanced Analytics
- **Pro Tier (`pro`)**:
  - Max Leads: Unlimited (`Infinity`)
  - Monthly AI Actions: 500
  - Features: Full Lead Pipeline, CSV Export, CSV Import, Advanced Analytics, In-App Notifications

### Server-Side Usage Flow & Enforcement

1. **User Model Schema (`server/src/models/User.js`)**:
   - Added `plan` enum (`free`, `pro`), `aiUsageCount` (number, default 0), and `aiUsageResetDate` (Date).
2. **Centralized Usage Service (`server/src/services/usageService.js`)**:
   - `checkLeadLimit(userId, count)`: Enforces `maxLeads` limit when creating or batch importing leads (returns `403 Forbidden` if exceeded).
   - `checkAIUsage(userId)`: Checks monthly AI usage count against plan allowance (returns `429 Too Many Requests` if exceeded).
   - `incrementAIUsage(userId)`: Increments `aiUsageCount` on successful AI execution.
   - `checkAndResetMonthlyUsage(user)`: Automatic monthly reset routine evaluating if current calendar month has elapsed since `aiUsageResetDate`. Resets `aiUsageCount` to 0.
   - `checkFeatureAccess(userId, featureName)`: Checks feature availability (e.g. `csvExport`, `csvImport`) and throws `403 Forbidden` if unavailable on plan.
3. **Endpoint Enforcement**:
   - `POST /api/leads` & `POST /api/leads/import`: Protected by `checkLeadLimit` and `checkFeatureAccess('csvImport')`.
   - `GET /api/leads/export`: Protected by `checkFeatureAccess('csvExport')`.
   - `POST /api/ai/*` (`/analyze`, `/reply`, `/qualify`, `/timing`, `/chat`, `/actions`): Protected by `checkAIUsage` and `incrementAIUsage`.
4. **Subscription Profile Endpoint**:
   - `GET /api/user/profile`: Returns normalized `user` object + `subscription` stats (`plan`, `planName`, `leadCount`, `maxLeads`, `aiUsageCount`, `maxAiActionsPerMonth`, `features`).

### Frontend Feature Gating & UI

- **Plan & Billing Settings**: Added a dedicated `Plan & Billing` tab in `Settings.jsx` showing progress bars for lead capacity and monthly AI actions, active feature badges, and an upgrade CTA.
- **CSV Gating**: Gracefully handles `403` feature gating responses in `Leads.jsx` with informative toast messages explaining plan upgrade requirements.

### Future Billing Integration Plan

- **Replaceable Interface**: No hardcoded payment vendor SDKs in core services.
- **Stripe / Razorpay Integration Path**:
  - Add `stripeCustomerId` and `stripeSubscriptionId` fields to `User` schema.
  - Implement webhook listener endpoint (`POST /api/webhooks/stripe`) to handle `customer.subscription.created`, `updated`, and `deleted` events.
  - Upgrading to Pro will update `user.plan = 'pro'` via webhooks without modifying endpoint limit checking logic.

### Testing & Verification

- Added Phase 18 automated integration tests to `server/scripts/smoke.js` (total **128 passed, 0 failed**).
- Verified `GET /api/user/profile` subscription payload structure.
- Verified Free user CSV Export and Import are blocked with `403 Forbidden`.
- Verified Free user AI actions are blocked with `429` once 20 actions are consumed.
- Verified user usage is isolated (User B's usage is unaffected by User A's activity).
- Verified automatic monthly usage reset logic (`checkAndResetMonthlyUsage`).
- Verified lead limit enforcement at 50 leads for Free users and unlimited for Pro users.
- Verified production build compilation via `npm run build` (`vite build` succeeded in `4.30s`).

---

## Phase 20 — Agency Cold-Outreach & Prospecting Workflow

### Goal

Adapt LeadBoard AI for real agency cold-outreach workflows without altering existing CRM core capabilities. Enable tracking prospect business details, website audit statuses, cold outreach channels, and dedicated outreach workflow views.

### Agency Data Model Extensions

Extended the `Lead` Mongoose schema (`server/src/models/Lead.js`) with agency-focused prospecting fields:

- **`contactPerson`**: Contact name / key decision maker at target business (String, max 200).
- **`website`**: Prospect business website URL (String, max 300).
- **`industry`**: Target business niche / industry category (String, max 100).
- **`websiteStatus`**: Prospect audit classification (`'No Website'`, `'Outdated Website'`, `'Good Website'`, `'Redesign Opportunity'`). Default: `'No Website'`.
- **`outreachChannel`**: Primary outreach channel (`'Cold Email'`, `'Phone'`, `'WhatsApp'`, `'Instagram'`, `'Referral'`, `'Other'`). Default: `'Cold Email'`.
- **`lastContactedAt`**: Date timestamp of most recent contact attempt.
- **`nextFollowUpAt`**: Date timestamp of upcoming scheduled outreach follow-up.

### Controller & Route Enhancements

1. **Leads Controller & Validation (`server/src/controllers/leads.js`, `server/src/routes/leads.js`)**:
   - Updated validation schemas (`createSchema`, `updateSchema`) to validate all agency fields and dates.
   - Enhanced `listLeads` to support searching across `contactPerson`, `website`, `industry`, and filtering by `websiteStatus`, `outreachChannel`, `industry`, and date ranges (`nextFollowUp=today|overdue|pending`).
   - Extended `exportLeads` and `importLeads` to handle 18 CSV columns with fallback defaults for legacy CSV imports.
2. **Outreach Activity Logging (`server/src/models/Activity.js`)**:
   - Added `website_status_changed`, `outreach_channel_changed`, and `next_followup_updated` enum values to `ACTIVITY_TYPES`.
   - Logged timeline events whenever agency status/channel/follow-up properties are modified.
3. **Dashboard Aggregation (`server/src/controllers/dashboard.js`)**:
   - Added `outreachSummary` metrics object returning counts for `totalProspects`, `contacted`, `replied`, `meetings`, `proposals`, and `won`.

### Frontend Outreach Workspace & UI

1. **Outreach Workspace Page (`client/src/pages/Outreach.jsx` & `/outreach` route)**:
   - Added dedicated `Outreach` view with 5 workflow tabs: `Today's Outreach`, `Pending Outreach`, `Recently Contacted`, `Follow-ups`, and `Hot Leads`.
   - Built live search and multi-select filter bars for Website Status, Outreach Channel, and Lead Status.
   - Provided instant "Mark Contacted Today" action buttons and audit status badges on prospect cards.
2. **Lead Details & Overview Card Updates (`client/src/pages/LeadDetails.jsx` & `LeadDialog.jsx`)**:
   - Added an **Outreach Management** card on lead details page with inline quick controls for `websiteStatus`, `outreachChannel`, `lastContactedAt`, and `nextFollowUpAt`.
   - Updated `Lead Overview` card and `LeadDialog` form inputs to allow capturing agency prospect details.
3. **Dashboard Compact Summary (`client/src/pages/Dashboard.jsx`)**:
   - Rendered a compact **Outreach Conversion Summary** funnel widget highlighting prospect conversion stages.

### Testing & Verification

- Added Phase 20 integration tests to `server/scripts/smoke.js` (total **136 passed, 0 failed**).
- Verified agency lead creation, field updates, and activity timeline logging.
- Verified backward-compatible CSV import with fallback defaults.
- Verified strict user ownership isolation across agency fields and outreach filters.
- Verified clean production build execution (`npm run build`).

---

## Phase 21 — Agency Daily Sales Workspace & Bulk Operations

### Goal

Transform the Outreach view into a practical daily sales workspace for agency cold prospecting with an extended status pipeline, bulk selection operations, automated analytics conversion rates, and a prioritized "Needs Attention" queue.

### Extended Pipeline & Backend Enhancements

1. **Extended Pipeline Statuses (`server/src/models/Lead.js`, `client/src/lib/leads.js`)**:
   - Expanded `LEAD_STATUSES` to 9 stages: `New` → `Researched` → `Contacted` → `Replied` → `Qualified` → `Meeting` → `Proposal` → `Won` / `Lost`.
   - Added badge styling & chart colors for `Researched` (#64748b), `Replied` (#6366f1), and `Meeting` (#14b8a6) while preserving 100% backward compatibility with existing lead status logic.
2. **Bulk Update Endpoint (`server/src/controllers/leads.js`, `server/src/routes/leads.js`)**:
   - Implemented `POST /api/leads/bulk-update` supporting `update_outreach_channel`, `mark_contacted`, `mark_replied`, `schedule_followup`, and `change_status`.
   - Enforced strict ownership isolation: only modifies leads belonging to `req.user.id` (returns `404` if unowned).
   - Created individual activity timeline records for every updated lead in the batch.
3. **Outreach Analytics Conversion Calculations (`server/src/controllers/dashboard.js`)**:
   - Calculated dynamic funnel metrics: `contacted`, `replied`, `meetings`, `proposals`, `won`.
   - Computed conversion rates:
     - `replyRate`: `(replied / contacted) * 100`
     - `meetingRate`: `(meetings / replied) * 100`
     - `closeRate`: `(won / contacted) * 100`

### Frontend Daily Sales Workspace (`client/src/pages/Outreach.jsx`)

1. **"Today's Outreach" View**:
   - Displays prospects needing action today: uncontacted (`!lastContactedAt` or status `New`/`Researched`), follow-ups due today, or overdue follow-ups.
2. **"Needs Attention" Priority Banner**:
   - Light-weight banner highlighting overdue follow-ups, `Replied` (unqualified), `Qualified` (no meeting scheduled), and `Proposal` (missing follow-up).
3. **Bulk Selection & Confirmation Toolbar**:
   - Checkboxes on prospect cards & select-all toggle.
   - Sticky bulk action toolbar (`Update Channel`, `Mark Contacted`, `Schedule Follow-up`) requiring an explicit confirmation dialog before execution.
4. **Prospect Card Quick Actions**:
   - Added 6 instant action controls: `Mark Contacted`, `Mark Replied`, `Remind` (Schedule Follow-up), `Status Dropdown`, `Details Link`, and `AI Outreach Advisor` modal.

### Testing & Verification

- Added Phase 21 integration tests to `server/scripts/smoke.js` (total **144 passed, 0 failed**).
- Verified strict ownership isolation on bulk updates (User B cannot update User A's leads -> 404).
- Verified clean production compilation (`npm run build`).

---

## Phase 22 — Agency AI Sales Assistant Capabilities

### Goal

Empower agency solo founders and sales reps with AI capabilities tailored for agency cold-prospecting workflows, including lead prioritization, prospect fit analysis, follow-up assistance, outreach message drafting, and automated weekly sales performance reports.

### AI Engine & Service Enhancements

1. **Lead Context Enrichment (`server/src/services/prompts.js`)**:
   - Expanded `buildLeadContext` to feed agency prospect fields (`Contact Person`, `Website`, `Industry`, `Website Audit Status`, `Outreach Channel`, `Last Contacted`, `Next Scheduled Follow-Up`) directly to Gemini AI.
2. **5 Agency AI Capabilities (`server/src/services/aiService.js`)**:
   - **`prioritizeLeads(userId)`**: Evaluates user's prospect list and prioritizes targets for today based on audit status, follow-up dates, and activity history (`POST /api/ai/prioritize`).
   - **`analyzeLeadFit(lead)`**: Analyzes why a business is a target prospect for agency web design/dev services, rating fit (0-100), listing audit opportunities, and recommending a custom pitch angle (`POST /api/ai/fit-analysis`).
   - **`suggestFollowUpQueue(userId)`**: Examines pending follow-ups & due dates to suggest an ordered follow-up queue with reasons & specific angles (`POST /api/ai/followup-assistant`).
   - **`draftOutreach(lead, type, tone)`**: Generates editable email/message drafts for 3 agency scenarios: `first_cold`, `follow_up`, and `post_call` (`POST /api/ai/draft-outreach`).
   - **`generateWeeklySummary(userId)`**: Aggregates 7-day sales metrics (`outreachCompleted`, `replies`, `meetings`, `proposals`, `wins`) and synthesizes an executive summary, leads needing attention, and next week's recommended actions (`POST /api/ai/weekly-summary`).
3. **Safe Execution Architecture**:
   - Maintained user-gated confirmation architecture via `POST /api/ai/actions` with whitelisted tools (`createFollowUp`, `updateLeadStatus`, `addLeadNote`).
   - Strictly prohibited automated email/WhatsApp dispatching — AI actions remain user-gated.

### Frontend Sales Assistant Controls

1. **Lead Details AI Sales Assistant (`client/src/components/ai/AIPanel.jsx`)**:
   - Added **Lead Fit** and **Draft Outreach** action buttons.
   - Built `FitView` (fit rating badge, fit drivers, audit opportunities, recommended pitch) and `DraftOutreachView` (editable subject & body textareas with copy button).
2. **Outreach Workspace AI Suite (`client/src/pages/Outreach.jsx`)**:
   - Added workspace AI action buttons in the top header: `Prioritize Today`, `Follow-Up Assistant`, and `Weekly Summary`.
   - Built responsive Dialog components displaying prioritized lead lists, follow-up queues, and executive weekly sales reports with metrics cards.

### Testing & Verification

- Added Phase 22 integration tests to `server/scripts/smoke.js` (total **150 passed, 0 failed**).
- Verified `POST /api/ai/prioritize`, `POST /api/ai/fit-analysis`, `POST /api/ai/followup-assistant`, `POST /api/ai/draft-outreach`, and `POST /api/ai/weekly-summary`.
- Verified ownership isolation across all agency AI endpoints.
- Verified clean production compilation (`npm run build`).