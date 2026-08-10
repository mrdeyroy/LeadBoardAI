# LeadBoard AI

A lightweight CRM for small businesses that combines lead management with an
AI assistant. This is a focused MVP — not an enterprise CRM.

## Tech Stack

**Frontend** — React, Vite, Tailwind CSS, shadcn/ui, Lucide React
**Backend** — Node.js, Express.js
**Database** — MongoDB with Mongoose
**Auth** — Clerk (managed sign-in, sessions)
**AI** — Gemini API (via whitelisted server-side tools)

## Project Structure

```
LeadBoardAI/
├── client/   # React + Vite frontend (port 5173)
└── server/   # Express + Mongoose backend (port 5000)
```

The root `package.json` only coordinates scripts. Each app is fully
independent (own dependencies, own lockfile) so they can be deployed to
Vercel (client) and Render (server) separately.

## Prerequisites

- Node.js 18+ (MongoDB is optional — see below)

## Getting Started

```bash
# 1. Install dependencies (root, client, server)
npm run setup

# 2. Configure environment variables (optional in development)
#    Copy the examples — edit as needed:
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. (Optional) Start MongoDB, then:
npm run dev
```

**No MongoDB? No problem.** In development, if the configured `MONGODB_URI`
is unreachable the server automatically boots an in-memory MongoDB
(`mongodb-memory-server`). **No Clerk keys? Also fine** — without
`CLERK_SECRET_KEY` / `CLERK_PUBLISHABLE_KEY` the client shows a notice with
`npm run dev`, and authenticated routes are protected until you add real
keys. Add Clerk keys from the [Clerk dashboard](https://dashboard.clerk.com)
(API Keys) and start or sign up with a test session to use the app.

Data in the in-memory DB resets when the server restarts. In production a
real `MONGODB_URI` is always required.

`npm run dev` starts both applications:

| App    | URL                         |
| ------ | --------------------------- |
| API    | http://localhost:5000       |
| Health | http://localhost:5000/api/health |
| Client | http://localhost:5173       |

In development the Vite server proxies `/api/*` to the backend, so the
client can call the API without CORS.

## Scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `npm run dev`    | Start API + client together          |
| `npm run server` | Start only the API (nodemon)         |
| `npm run client` | Start only the client (Vite)         |
| `npm run build`  | Production build of the client       |
| `npm run setup`  | Install root, client and server deps |

### Server

| Command          | Description                    |
| ---------------- | ------------------------------ |
| `npm run dev`    | Watch mode (nodemon)           |
| `npm start`      | Production start               |
| `npm run seed`   | Seed demo data (Clerk demo user) |
| `npm test`       | API integration smoke tests    |

## Environment Variables

### `server/.env`

| Variable        | Description                        | Default                          |
| --------------- | ---------------------------------- | -------------------------------- |
| `PORT`          | API port                           | `5000`                           |
| `MONGODB_URI`   | MongoDB connection string          | `mongodb://127.0.0.1:27017/leadboard` |
| `CLIENT_URL`    | Allowed CORS origin                | `http://localhost:5173`          |
| `CLERK_SECRET_KEY` | Clerk secret key (required in production) | —                          |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key (required in production) | —                  |
| `CLERK_JWT_KEY` | Optional PEM public key for networkless token verification | —   |
| `GEMINI_API_KEY`| Gemini API key for the AI assistant | —                              |
| `GEMINI_MODEL`  | Gemini model (optional)            | `gemini-2.5-flash`               |

### `client/.env`

| Variable        | Description                        |
| --------------- | ---------------------------------- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key (required to sign in) |
| `VITE_API_URL`  | API base URL (optional; dev uses the Vite proxy) |

Create a `.env` file from each `.env.example` — never commit real secrets.

## API Overview

All routes except `/api/health` return `401` without a valid Clerk session.

| Method   | Route                      | Description                          |
| -------- | -------------------------- | ------------------------------------ |
| GET      | `/api/auth/me`             | Current user (from Clerk session)    |
| GET      | `/api/leads`               | List: `?search=&status=&page=&limit=` |
| POST     | `/api/leads`               | Create lead                          |
| GET      | `/api/leads/:id`           | Get lead                             |
| PATCH    | `/api/leads/:id`           | Update lead (partial)                |
| DELETE   | `/api/leads/:id`           | Delete lead (+ follow-ups, activities) |
| GET      | `/api/followups`           | List follow-ups: `?openOnly=&limit=`  |
| POST     | `/api/followups`           | Create follow-up                     |
| PATCH    | `/api/followups/:id`       | Update / toggle complete             |
| DELETE   | `/api/followups/:id`       | Delete follow-up                     |
| GET      | `/api/leads/:id/activities`| Activity timeline for a lead         |
| GET      | `/api/activities`          | Recent activity feed: `?limit=`      |
| GET      | `/api/dashboard`           | Stats, status funnel, pending follow-ups, recent activity |
| POST     | `/api/ai/analyze`          | Lead analysis (JSON)                    |
| POST     | `/api/ai/reply`            | Drafted reply (`tone`: professional/casual) |
| POST     | `/api/ai/qualify`          | Recommended status + reason             |
| POST     | `/api/ai/timing`           | Recommended follow-up timing            |
| POST     | `/api/ai/chat`             | Conversational: `{ reply, actions[] }` — action proposals are never auto-executed |
| POST     | `/api/ai/actions`          | Confirm + execute a whitelisted tool: `{ tool, params }` |
| GET      | `/api/health`              | Service + DB status                  |

Lead statuses: `New`, `Contacted`, `Qualified`, `Proposal`, `Won`, `Lost`.

### AI architecture

The model only ever **suggests** mutations. `POST /api/ai/chat` returns
proposed tool calls as `actions`; the client shows them with
Cancel/Confirm and only on confirmation calls `POST /api/ai/actions`,
which runs the validated, userId-scoped tool. The model has no database
access — only three whitelisted tools exist:

| Tool               | Effect                          |
| ------------------ | ------------------------------- |
| `updateLeadStatus` | Change lead status              |
| `addLeadNote`      | Set lead notes                  |
| `createFollowUp`   | Schedule a follow-up            |

Every AI-driven mutation is logged in the activity timeline with
`metadata.actor = "ai"`. Without `GEMINI_API_KEY`, AI endpoints return a
clear `500` while the rest of the API keeps working.

## Deploying

- **Client** → Vercel: build command `npm run build`, output `client/dist`,
  env `VITE_CLERK_PUBLISHABLE_KEY`.
- **Server** → Render (web service): start command `npm start`, working
  directory `server/`, set `MONGODB_URI`, `CLIENT_URL`, `CLERK_SECRET_KEY`,
  `CLERK_PUBLISHABLE_KEY` (and `CLERK_JWT_KEY` to skip network round-trips).

## Status

- ✅ **Phase 1** — Monorepo scaffolding
- ✅ **Phase 2** — Server foundations: models (User, Lead, FollowUp, Activity),
  error handling, config
- ✅ **Phase 3** — Authentication: JWT auth (register/login/logout/me),
  bcrypt, route guards
- ✅ **Phase 4** — Leads CRUD with search, filter, pagination, validation, and
  activity logging; dashboard stats endpoint (total/new/qualified/won, status
  counts, pending follow-ups, recent activity feed)
- ✅ **Phase 5** — Follow-up and activity routes
- ✅ **Phase 6** — Dashboard & polish: stat cards, Recharts status bar chart,
  empty/loading/error states, sidebar navigation, route transitions
- ✅ **Phase 7** — AI assistant: Gemini service, prompt builders, the four
  read-only AI operations (analyze/qualify/timing/reply), AI chat, and a
  whitelisted mutation-tool registry + executor (confirm-before-execute
  pattern)
- ✅ **Phase 8** — Runtime fixes & zero-setup dev: `mongodb-memory-server`
  fallback, demo seed, 55-assertion smoke suite green
- ✅ **Phase 9** — Documentation baseline & git history sync
- ✅ **Phase 10** — Clerk authentication: `@clerk/express` backend sessions,
  `@clerk/clerk-react` UI, profile sync via Clerk identity, rate limiting for
  auth + AI, 69-assertion smoke suite green

To try the app: follow the quick-start above, add your Clerk keys, and sign in
from the login page. To preload demo data (tied to the Clerk demo user):
`cd server && npm run seed`.