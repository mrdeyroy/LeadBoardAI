# LeadBoard AI

A lightweight CRM for small businesses that combines lead management with an
AI assistant. This is a focused MVP — not an enterprise CRM.

## Tech Stack

**Frontend** — React, Vite, Tailwind CSS, shadcn/ui, Lucide React
**Backend** — Node.js, Express.js
**Database** — MongoDB with Mongoose
**Auth** — JWT (bearer tokens)
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
(`mongodb-memory-server`), seeds demo data and prints:

```
[db] demo data ready — log in with demo@leadboard.ai / demo1234
```

So you can run `npm run dev` and log in immediately with
`demo@leadboard.ai` / `demo1234`. Data in the in-memory DB resets when the
server restarts. In production a real `MONGODB_URI` is always required.

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
| `npm run seed`   | Seed demo data (demo@leadboard.ai / demo1234) |
| `npm test`       | API integration smoke tests    |

## Environment Variables

### `server/.env`

| Variable        | Description                        | Default                          |
| --------------- | ---------------------------------- | -------------------------------- |
| `PORT`          | API port                           | `5000`                           |
| `MONGODB_URI`   | MongoDB connection string          | `mongodb://127.0.0.1:27017/leadboard` |
| `CLIENT_URL`    | Allowed CORS origin                | `http://localhost:5173`          |
| `JWT_SECRET`    | Auth secret (required in production) | —                              |
| `JWT_EXPIRES_IN`| JWT lifetime (optional)            | `7d`                             |
| `GEMINI_API_KEY`| Gemini API key for the AI assistant | —                              |
| `GEMINI_MODEL`  | Gemini model (optional)            | `gemini-2.5-flash`               |

### `client/.env`

| Variable        | Description                        |
| --------------- | ---------------------------------- |
| `VITE_API_URL`  | API base URL (optional; dev uses the Vite proxy) |

Create a `.env` file from each `.env.example` — never commit real secrets.

## API Overview

All routes except auth return `401` without `Authorization: Bearer <token>`.

| Method   | Route                      | Description                          |
| -------- | -------------------------- | ------------------------------------ |
| POST     | `/api/auth/register`       | Create account → `{ token, user }`   |
| POST     | `/api/auth/login`          | Login → `{ token, user }`            |
| POST     | `/api/auth/logout`         | Logout (client discards token)       |
| GET      | `/api/auth/me`             | Current user                         |
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

- **Client** → Vercel: build command `npm run build`, output `client/dist`.
- **Server** → Render (web service): start command `npm start`, working
  directory `server/`, set `MONGODB_URI`, `CLIENT_URL`, `JWT_SECRET`.

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

To try the app with populated data: `cd server && npm run seed`, then log in
with `demo@leadboard.ai` / `demo1234`. The seed is idempotent — it replaces any
existing demo data.