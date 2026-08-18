# LeadBoard AI

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19.x-blue.svg?logo=react&logoColor=white)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.x-38bdf8.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Clerk Auth](https://img.shields.io/badge/Auth-Clerk-6C47FF.svg?logo=clerk&logoColor=white)](https://clerk.com)
[![Google Gemini API](https://img.shields.io/badge/AI-Google_Gemini-4285F4.svg?logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com)

A lightweight, high-performance, and AI-assisted CRM designed for solo founders, small sales teams, and digital agencies to streamline lead management, manage follow-ups, track outreach workflows, and automate key sales tasks.

## Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Zero-Configuration Development](#zero-configuration-development)
    - [Standard Installation](#standard-installation)
    - [Environment Variables](#environment-variables)
6. [Available Scripts](#available-scripts)
7. [API Route Reference](#api-route-ref)
8. [Architecture & How It Works](#architecture--how-it-works)
    - [Clerk Authentication & User Sync](#clerk-authentication--user-sync)
    - [Multi-Tenant Data Isolation](#multi-tenant-data-isolation)
    - [AI Action-Proposals Loop](#ai-action-proposals-loop)
9. [Deployment](#deployment)
    - [Backend (Render Web Service)](#1-backend-render)
    - [Frontend (Vercel SPA)](#2-frontend-vercel)
10. [Smoke Tests](#smoke-tests)
11. [License](#license)

---

## Overview

LeadBoard AI solves the problem of scattered pipelines for small-scale sales operations. Instead of jumping between spreadsheets, email clients, scheduling apps, and AI wrappers, LeadBoard AI aggregates these tools into a single workflow. 

It provides an intuitive dashboard, a comprehensive leads pipeline, custom agency website audit tracking, dynamic follow-up notifications, and a context-aware AI Sales Assistant powered by Google Gemini that works with a **strict confirmation-gated mutation loop** to ensure the user is always in control of database updates.

---

## Key Features

### 📋 Lead & Pipeline Management
*   **9-Stage Kanban Pipeline**: Track deals from initial discovery to final closing: `New` → `Researched` → `Contacted` → `Replied` → `Qualified` → `Meeting` → `Proposal` → `Won` / `Lost`.
*   **Advanced Filtering & Search**: Sort and filter leads by name, company, date created, status, source, outreach channel, and website status.
*   **Audit Logging**: Every lead timeline features an activity history tracking creations, updates, follow-ups, and AI interactions.
*   **CSV Import & Export**: Import prospect sheets or export your CRM data dynamically.

### 💼 Agency Cold Outreach Workspace
*   **Dedicated Outreach Workspace**: View daily prospecting tasks across structured tabs: `Today's Outreach`, `Pending Outreach`, `Recently Contacted`, `Follow-ups`, and `Hot Leads`.
*   **Website Audit Metrics**: Categorize targets by audit status (`No Website`, `Outdated Website`, `Good Website`, `Redesign Opportunity`) to prepare tailored pitches.
*   **Multi-Channel Targeting**: Log communication methods such as `Cold Email`, `Phone`, `WhatsApp`, `Instagram`, `Referral`, or `Other`.
*   **Bulk Operations Toolbar**: Bulk update outreach channels, bulk mark leads as contacted today, or batch schedule follow-ups.
*   **Needs Attention Banner**: Auto-prioritizes overdue follow-ups, Replied (unqualified) leads, and missing follow-ups on active proposals.

### 🤖 Gemini-Powered AI Sales Assistant
*   **Fit & Opportunity Analysis**: Evaluates prospect websites, niches, and audit statuses to estimate a client-fit score and suggest custom pitching angles.
*   **Lead Prioritization**: Scans your lead table daily to prioritize hot prospects needing immediate action.
*   **Outreach Message Drafting**: Generates context-aware, editable outreach message templates (Cold Intro, Follow Up, Post Call) customized by tone (`short`, `professional`, `friendly`).
*   **Follow-Up Scheduler assistant**: Analyzes interaction history and suggest dates and tasks for future outreach.
*   **Weekly Executive Summary**: Creates an automated weekly sales performance report summarizing outreach completions, meetings booked, and wins.

### 🔔 In-App Notifications & Workflows
*   **Smart Background Scheduler**: Runs periodic database sweeps to automatically generate notification alerts when follow-ups are due today or overdue.
*   **Deduplication & Idempotency**: Scheduler executions use date-stamped keys to guarantee no duplicate notifications are sent.
*   **Interactive Notification Bell**: Real-time unread badge alerts and click-to-read dropdown list synced with database states.

### 💳 SaaS Gating & Workspace Preferences
*   **Tiered Plans**: Built-in limits distinguishing `Free` tier (max 50 leads, 20 monthly AI actions, blocked CSV features) and `Pro` tier (unlimited leads, 500 AI actions, full access).
*   **Preferences Manager**: Live theme toggles (`light`, `dark`, `system`) synchronized to local storage and user database profile.
*   **SaaS Metrics Showcase**: Dynamic product-wide performance statistics and customer review carousels on the public-facing landing page.

---

## Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS v4, Framer Motion, Recharts, Lucide React, Sonner |
| **Backend** | Node.js, Express.js (v5), Mongoose 9 |
| **Database** | MongoDB (Production), MongoDB In-Memory Server (Development Fallback) |
| **Authentication** | Clerk (`@clerk/clerk-react` and `@clerk/express`) |
| **AI Integration** | Google Gemini API (Direct REST Integration) |
| **Development Tools**| Concurrently, Nodemon, Oxlint (Linter) |

---

## Project Structure

```
LeadBoardAI/
├── client/                     # React + Vite Frontend
│   ├── public/                 # Static assets & favicon
│   ├── src/
│   │   ├── components/         # Reusable UI component library
│   │   │   ├── activity/       # Timeline & activity widgets
│   │   │   ├── ai/             # AI panels & assistant modals
│   │   │   ├── layout/         # Navigation, TopBar, Notifications Dropdown
│   │   │   ├── landing/        # Hero, Pricing, Testimonials (landing page components)
│   │   │   └── ui/             # Radix primitives & shadcn styling
│   │   ├── context/            # React context providers
│   │   ├── hooks/              # Custom React hooks (e.g. useAsync)
│   │   ├── lib/                # Theme engine & API client setup
│   │   ├── pages/              # Page views (Dashboard, Outreach, Leads, Settings, etc.)
│   │   ├── App.jsx             # Router definition and route guards
│   │   └── main.jsx            # App entrypoint & theme initialization
│   ├── vercel.json             # Vercel SPA routing rewrites
│   └── package.json
│
├── server/                     # Express Backend
│   ├── scripts/                # Database seeders & smoke integration test suite
│   ├── src/
│   │   ├── config/             # DB, environment variables, and Clerk setups
│   │   ├── controllers/        # Thin HTTP controllers parsing req -> calling services
│   │   ├── middleware/         # Auth require, rate limiter, validation guards
│   │   ├── models/             # Mongoose Schemas (User, Lead, FollowUp, Activity, Notification)
│   │   ├── routes/             # Express API router configuration
│   │   ├── seed/               # Demo data records generator
│   │   ├── services/           # Business logic, Gemini integration, scheduler jobs
│   │   ├── tools/              # Whitelisted security boundaries for AI-driven updates
│   │   └── utils/              # Error handling classes (ApiError) & validators
│   ├── render.yaml             # Render deployment blueprint spec
│   └── package.json
│
├── package.json                # Root orchestrator package
└── AGENTS.md                   # Agent guidelines and specifications
```

---

## Getting Started

### Prerequisites
*   Node.js 18 or higher
*   NPM (v9+)
*   MongoDB instance (Optional for local development)

### Zero-Configuration Development
LeadBoard AI is built to run immediately without configuring cloud accounts or external databases:
1.  **In-Memory Database Fallback**: If the server cannot connect to a configured `MONGODB_URI` within 3 seconds, it starts an in-memory MongoDB server instance (`mongodb-memory-server`) automatically.
2.  **Auth Demo Bypass**: If no Clerk environment variables are detected, the system operates in bypass mode, generating a demo user session so you can explore all workspace controls immediately.

### Standard Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/mrdeyroy/LeadBoardAI.git
    cd LeadBoardAI
    ```

2.  **Bootstrap Dependencies**:
    Install dependencies for the root orchestrator, frontend, and backend packages concurrently:
    ```bash
    npm run setup
    ```

3.  **Setup Environment Variables**:
    Copy the sample configuration templates:
    ```bash
    cp server/.env.example server/.env
    cp client/.env.example client/.env
    ```
    *(See [Environment Variables](#environment-variables) below to fill values).*

4.  **Run the Applications**:
    Start the development database, API backend (port 5000), and React frontend (port 5173):
    ```bash
    npm run dev
    ```

5.  **Seed Demo Data**:
    If you are running a persistent local MongoDB instance and want to pre-fill the workspace with data:
    ```bash
    cd server
    npm run seed
    ```

---

## Environment Variables

### Backend Configuration (`server/.env`)

Create `server/.env` using the following keys:

| Key | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Local server port | `5000` |
| `MONGODB_URI` | Connection URI to MongoDB | `mongodb://127.0.0.1:27017/leadboard` |
| `CLIENT_URL` | Cross-Origin Resource Sharing (CORS) origin | `http://localhost:5173` |
| `CLERK_PUBLISHABLE_KEY` | Clerk Publishable Key (Required in production) | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk Secret API Key (Required in production) | `sk_test_...` |
| `CLERK_JWT_KEY` | Optional PEM public key for networkless JWT validation | `-----BEGIN PUBLIC KEY-----...` |
| `GEMINI_API_KEY` | Google Gemini API Key for assistant functionality | `AIzaSy...` |
| `GEMINI_MODEL` | AI engine generation model | `gemini-2.5-flash` |
| `NODE_ENV` | Running node environment mode | `development` |

### Frontend Configuration (`client/.env`)

Create `client/.env` using the following keys:

| Key | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_CLERK_PUBLISHABLE_KEY`| Clerk Publishable Key | `pk_test_...` |
| `VITE_API_URL` | API base URL (Vite proxies requests in dev) | `http://localhost:5000` (Production only) |

---

## Available Scripts

### Root Directory Commands
*   `npm run setup`: Installs all dependencies across the entire monorepo.
*   `npm run dev`: Runs frontend and backend concurrently in watch mode.
*   `npm run server`: Launches only the API backend (via nodemon).
*   `npm run client`: Launches only the React frontend (via Vite).
*   `npm run build`: Bundles the React application for production.

### Backend Commands (`server/package.json`)
*   `npm run dev`: Watch mode nodemon.
*   `npm start`: Production node server.
*   `npm run seed`: Seeds mock leads, tasks, and historical activities into the DB.
*   `npm test`: Executes the backend smoke test suite.

### Frontend Commands (`client/package.json`)
*   `npm run dev`: Start Vite development server.
*   `npm run build`: Production static asset compiler.
*   `npm run lint`: Fast code-quality scan with `oxlint`.
*   `npm run preview`: Previews local production build static build.

---

## API Route Reference

All backend endpoints (except `/api/health`) require a valid Clerk session token passed in the Authorization header.

### Authentication & Profile
*   `GET    /api/auth/me`             - Returns current user details (syncs from Clerk claims).
*   `GET    /api/user/profile`        - Returns authenticated user details and active subscription plan parameters.
*   `PATCH  /api/user/profile`        - Update profile information (e.g. name).
*   `PATCH  /api/user/preferences`    - Update workspace UI preferences (theme, page size, views).

### Leads & Pipeline
*   `GET    /api/leads`               - Paginated search, sorting, and filter lead pipeline.
*   `POST   /api/leads`               - Creates a new lead (enforces plan limit checks).
*   `GET    /api/leads/:id`           - Retrieves single lead by ID.
*   `PATCH  /api/leads/:id`           - Partially updates lead parameters.
*   `DELETE /api/leads/:id`           - Removes lead (cascades deletes to follow-ups & activities).
*   `POST   /api/leads/import`        - Performs bulk lead JSON upload (Pro plan only).
*   `GET    /api/leads/export`        - Exports pipeline to CSV format (Pro plan only).
*   `POST   /api/leads/bulk-update`   - Batch modify channel, contacted status, or schedule follow-ups.

### Follow-Ups & Tasks
*   `GET    /api/followups`           - Retrieves pending follow-up schedules.
*   `POST   /api/followups`           - Schedules a follow-up task.
*   `PATCH  /api/followups/:id`       - Edit follow-up title, date, or toggles completed state.
*   `DELETE /api/followups/:id`       - Deletes a follow-up.

### Activities & Audit Trail
*   `GET    /api/activities`          - Retrieves global activity audit timeline.
*   `GET    /api/leads/:id/activities`- Retrieves isolated history for a specific lead.

### In-App Notifications
*   `GET    /api/notifications`       - Fetch notifications (with `?unreadOnly=true` filter support).
*   `PATCH  /api/notifications/:id/read` - Marks an individual notification as read.
*   `PATCH  /api/notifications/read-all` - Marks all user notifications as read.

### AI Assistant Engine
*   `POST   /api/ai/analyze`          - Evaluates lead requirements and drafts structural profiles.
*   `POST   /api/ai/reply`            - Writes outreach drafts customized by selected tone.
*   `POST   /api/ai/qualify`          - Suggests lead qualification category and rationale.
*   `POST   /api/ai/timing`           - Suggests ideal date and task structure for subsequent outreach.
*   `POST   /api/ai/chat`             - Full-context conversation chat with message history memory.
*   `POST   /api/ai/prioritize`       - Returns structured lead action priority list.
*   `POST   /api/ai/fit-analysis`     - Calculates client fit score and opportunity driver logs.
*   `POST   /api/ai/followup-assistant` - Order follow-ups in priority sequence with pitch suggestions.
*   `POST   /api/ai/draft-outreach`   - Drafts outreach communications based on cold-contact scenarios.
*   `POST   /api/ai/weekly-summary`   - Generates weekly performance metrics executive briefings.
*   `POST   /api/ai/actions`          - Execute user-approved proposed AI database updates.

### System
*   `GET    /api/health`              - Public route returning service status and database state.

---

## Architecture & How It Works

### Clerk Authentication & User Sync
Security relies on Clerk identity tokens.
1.  **Frontend**: The React client uses `@clerk/clerk-react` to manage active sessions. The custom token bridge interceptor (`client/src/lib/api.js`) automatically intercepts HTTP calls, retrieves the Clerk token, and appends it to the Request `Authorization` header.
2.  **Backend**: The `@clerk/express` middleware intercepts incoming API requests, validates the signature, and resolves the identity. The `findOrCreateAppUser` middleware maps the Clerk ID to our internal MongoDB `User` model, initializing default subscription settings, usage counts, and preferences.

### Multi-Tenant Data Isolation
Every database query strictly enforces resource owner validation:
*   Queries scope by the authenticated user's ID: `Model.find({ owner: req.user.id })`.
*   If a user requests a lead or follow-up that is missing or owned by another user account, the controller throws a `404 Not Found` rather than a `403 Forbidden` to prevent revealing resource existence.

### AI Action-Proposals Loop
To prevent AI hallucination or prompt injection attacks from altering your live CRM records without oversight, LeadBoard AI enforces a **propose-and-confirm safety bridge**:

```
[User Chat] ──────> [Gemini API] ──────> Proposes Action (e.g. createFollowUp)
                         │
                         ▼
[User UI]   <───── Renders "Confirm / Cancel" Banner
  (Confirm)
     │
     ▼
[POST /api/ai/actions] ──> [Tool Validator] ──> [Database Write]
```

1.  **AI Proposes**: When chat requests result in recommended database changes, the Gemini REST API returns a structured tool call definition containing a whitelisted tool (`updateLeadStatus`, `addLeadNote`, `createFollowUp`) and validated parameters.
2.  **Client UI Holds**: The client application holds this action in the UI, displaying a confirmation box to the user instead of executing it automatically.
3.  **User Confirms**: If the user clicks **Confirm**, the frontend sends a `POST` request to `/api/ai/actions`. The backend runs database ownership verification, schema checks, plan usage increments, and logs the change to the lead timeline with `metadata.actor = "ai"`.

---

## Deployment

LeadBoard AI is optimized for cloud platforms.

### 1. Backend (Render)
The backend includes a `server/render.yaml` specification file enabling direct blueprint setup:
*   **Service Type**: Web Service
*   **Root Directory**: `server`
*   **Build Command**: `npm install`
*   **Start Command**: `npm start`
*   **Port**: `10000` (configurable)
*   **Health Check Route**: `/api/health`

*Note: In Render, configure all required backend environment variables, specifically pointing the `CLIENT_URL` to your Vercel URL.*

### 2. Frontend (Vercel)
The client directory includes a `client/vercel.json` file configuring single-page application route rewrites:
*   **Root Directory**: `client`
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist`
*   **Routes**: Rewrites all browser requests (`/(.*)`) back to `/index.html` to support react-router client-side routes.

---

## Smoke Tests

LeadBoard AI includes a test suite covering auth middleware, CRUD endpoints, database constraints, bulk updates, multi-user isolation, and in-app scheduler rules:

```bash
cd server
npm test
```

Running tests initiates a clean `mongodb-memory-server` database workspace, executes **150 integration checks**, and reports status with zero dependency on running external networks or databases.

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.