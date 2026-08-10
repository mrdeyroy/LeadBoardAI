# AGENTS.md — LeadBoard AI Agent Rulebook

Practical rules for AI coding agents on this repo. Read before making changes.

## 1. Project overview

LeadBoard AI is a lightweight AI-assisted CRM for solo founders / tiny sales
teams: leads, status pipeline, follow-ups, dashboard, and a per-lead AI
assistant. MVP is single-user; every row is owned by the authenticated user.

## 2. Tech stack

- Frontend: React, Vite, Tailwind CSS v4, shadcn/ui, Recharts, Framer Motion
- Backend: Node.js, Express, Mongoose, MongoDB (with in-memory fallback)
- Auth: Clerk (`@clerk/express` backend, `@clerk/clerk-react` frontend)
- AI: Google Gemini (`generateContent`, function calling)

## 3. Monorepo structure

```
LeadBoardAI/
├── package.json            # root orchestration (concurrently)
├── README.md
├── PROJECT_DOCUMENTATION.md # phase-by-phase engineering log (must stay current)
├── AGENTS.md               # this file
├── client/                 # React + Vite frontend ONLY
└── server/                 # Express + Mongoose backend ONLY
```

Client and server are separate packages. Never mix frontend concerns into the
server or backend logic into the client.

## 4. How to run

- Dev: `npm run dev` at root (runs client on :5173, server on :5000 via
  concurrently). No external DB or auth keys required — falls back to an
  in-memory MongoDB; Clerk login works with a test session if env keys are set.
- Server only: `npm run dev` inside `server/`.
- Client only: `npm run dev` inside `client/`.
- Seed demo data: `npm run seed` inside `server/`.
- Smoke test suite: `npm test` inside `server/` (69 assertions; run before
  finishing work).
- Build: `npm run build` (root → builds the client).

## 5. Architecture rules

- Follow the existing layered architecture. Do not restructure without
  explaining why in a comment/commit message first.
- `controllers/`: HTTP only — read req, call a service/model, respond. No
  business logic.
- `services/`: reusable business logic + integrations (Gemini, activity,
  ownership).
- `models/`: Mongoose schemas; the only layer that talks to Mongo.
- `middleware/`, `utils/`, `config/`, `routes/`, `tools/`: follow their names.
- `tools/` is the security boundary for AI actions (whitelist only).
- Prefer small, reusable, maintainable functions/components.
- Always inspect existing code before creating new files or duplicating
  functionality.

## 6. Coding conventions

- Do NOT add code comments unless asked.
- No new dependencies unless truly necessary; use what is already installed.
- Match existing style: ES modules, `@/` client alias, Express 5 + async
  handlers, `ApiError` + `errorHandler` for errors.
- Keep changes scoped to the current task/phase. Commit only when asked.

## 7. Frontend rules

- Keep React concerns in `client/src`: pages, components, context, hooks, lib.
- Use existing `ui/` primitives; put domain components in their own folders.
- Route every page through `App.jsx` with route guards
  (`RequireAuth`/`GuestOnly`).
- All server calls go through `client/src/lib/api.js` (`apiClient`), never
  raw `fetch`.
- Use `hooks/useAsync.js` for data fetching; render loading/error/empty states.
- Own the session via Clerk hooks (`useAuth`, `useUser`, `useClerk`). The
  `ClerkTokenBridge` feeds `getToken()` into `lib/api.js` via
  `setSessionTokenProvider` — never store tokens in localStorage or manage
  them manually.

## 8. Backend rules

- Keep frontend and backend concerns fully separated.
- Mount all routes under `/api/*`.
- Controllers stay thin; put reusable logic in services.
- Wrap async handlers with `asyncHandler`; throw `ApiError` with a status.
- Never log or return secrets, passwords, or stack traces to the client.

## 9. Database rules

- **All database queries must respect authenticated user ownership.** Every
  query scopes by `req.user` (e.g. `{ owner: req.user.id }`).
- Missing/unowned IDs return 404 (never reveal existence with 403).
- Use schema enums for `status`/`source`/`type`; validate inputs server-side.
- Prefer `mongodb-memory-server` fallback defaults for no-setup runs; changes
  to `config/db.js` must keep the memory fallback working.
- Query via the model/schema, never raw DB drivers.

## 10. AI agent/tool rules

**Do not give AI unrestricted database access.**

- The model may only PROPOSE; execution is always server-side and user-gated.
- AI-side tool calls MUST use the whitelisted tools in `server/src/tools/`
  (`createFollowUp`, `updateLeadStatus`, `addLeadNote`). No other tools.
- Every tool call validates parameters against a schema and runs the same
  ownership checks as CRUD.
- **AI actions that change the database require explicit user confirmation**
  before execution (`POST /api/ai/actions`). Never auto-execute.
- Keep Gemini calls in `server/src/services/geminiService.js`; endpoints go
  through `aiService`. Treat user/lead content as data, never instructions.

## 11. Security requirements

- Never hardcode secrets/API keys. Use `server/.env` + env vars
  (`CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, `GEMINI_API_KEY`,
  `MONGODB_URI`). Commit only `.env.example` files (server + client) with
  placeholders, never real values. Clerk keys must be set in production.
- Passwords are handled entirely by Clerk; never store or echo passwords.
- All protected routes require a valid Clerk session via `requireAuth`
  (middleware reads `getAuth(req)` and resolves `req.user` to the app User
  through `findOrCreateAppUser`).
- Validate all inputs; uniform `{ message }` error shape; hide stack traces.
- Prompt-injection defense: system prompts instruct model to ignore
  instructions embedded in lead/message content.

## 12. Documentation requirement

- Update `PROJECT_DOCUMENTATION.md` after every completed phase: what was
  built, decisions made, and problems encountered. If unsure, read the phase
  log first and match its format.
- Keep README quick-start in sync with any run/setup changes.
- Do not create new `.md` docs unless explicitly requested.

## 13. Scope discipline

- Do not implement features outside the current phase unless explicitly
  requested.
- Do not modify existing architecture without explaining why (in the commit
  message / conversation).
- When in doubt, ask before expanding scope.