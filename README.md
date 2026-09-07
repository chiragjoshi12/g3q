# G3Q — Gujarat Gyan Guru Quiz

G3Q is a Gujarati-language quiz platform. Students, college users, and citizens log in with a CTS number, ABC ID, or mobile (OTP, no password), play bilingual quizzes from a reviewed question bank, and see results and leaderboards. Admins review and allocate that bank. A separate analytics app shows participation by district and taluka.

This repo is **four apps**. Three talk to one MySQL database through the backend. Analytics currently uses local mock data.

| App | Path | What it is | Dev port |
| --- | --- | --- | --- |
| **Backend** | `backend/` | Express API: auth, quiz sessions, leaderboards, admin APIs | **4000** |
| **Client** | `client/` | Student / college / citizen quiz app (Next.js) | **3000** |
| **Admin** | `admin/` | Question-bank admin console (Next.js) | **3001** |
| **Analytics** | `analytics/` | Participation dashboard by state / district / taluka (Next.js) | **3003** |

```
client     (:3000)  ─┐
admin      (:3001)  ─┼──►  backend  (:4000)  ──►  MySQL  (:3307)
analytics  (:3003)  ─┘        (mock data today; no API required)
```

---

## What each project means

### 1. `backend/` — API

The source of truth. Express + Prisma against MySQL (`g3q_backend`). It handles OTP login, bank-backed quiz sessions, attempts, leaderboards, and the `/api/v1/admin` console APIs. Start this first if you are using the client or admin against live data.

### 2. `client/` — Quiz app

The public Gujarati quiz UI. Users sign in as student (CTS), college (ABC ID), or citizen (mobile), play quizzes, see results, certificates, and leaderboards. In development, OTP `1234` is accepted (no SMS gateway).

### 3. `admin/` — Admin console

Internal console for the bilingual question bank: review, enhance, comment, and allocate work to admins. Login uses **master admin** credentials (below). It calls `NEXT_PUBLIC_API_URL` → `/api/v1/admin/*` on the backend.

### 4. `analytics/` — Participation dashboard

Read-only dashboard for quiz reach across Gujarat (state → district → taluka). It is a standalone Next.js app with in-repo sample/mock data today; it does not need the backend to run.

---

## Prerequisites

- Node.js 18+
- npm
- MySQL listening on **3307** (database `g3q_backend`; optional legacy `g3q` as an import source)

---

## Master admin login

Created automatically when the backend starts (or when you run `npm run prisma:seed`), from `backend/.env`:

| Field | Value |
| --- | --- |
| URL | http://localhost:3001/login |
| Username | `admin` |
| Password | `G3Q@Admin2026` |

Override with `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `backend/.env`.

---

## How to run

Copy env examples where they exist, then run each app in its own terminal. **Start the backend first** for client and admin.

### 1. Backend — port 4000

```bash
cd backend
cp .env.example .env          # DATABASE_URL, PORT=4000, JWT, admin bootstrap
npm install
npm run prisma:migrate
npm run prisma:seed           # optional demo users / modules
npm run dev                   # http://localhost:4000
```

Health check: `GET http://localhost:4000/api/v1/health`.

`PORT` defaults to `4000`. CORS allows `http://localhost:3000` (client) and `http://localhost:3001` (admin).

### 2. Client (quiz app) — port 3000

```bash
cd client
npm install
npm run dev                   # http://localhost:3000
```

The client already defaults to the REST backend. Optional overrides in `client/.env.local`:

```
NEXT_PUBLIC_DATA_SOURCE=rest
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

Dev OTP is `1234`. Demo identities are in `client/README.md`.

### 3. Admin console — port 3001

```bash
cd admin
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://127.0.0.1:4000
npm install
npm run dev                   # http://localhost:3001
```

Open http://localhost:3001/login and use the master admin credentials above.

### 4. Analytics — port 3003

```bash
cd analytics
npm install
npm run dev                   # http://localhost:3003
```

No backend or `.env` required.

---

## Typical local stack

```bash
# Terminal 1
cd backend && npm run dev          # :4000

# Terminal 2
cd client && npm run dev           # :3000

# Terminal 3
cd admin && npm run dev            # :3001

# Terminal 4 (optional)
cd analytics && npm run dev        # :3003
```

| URL | App |
| --- | --- |
| http://localhost:4000 | API |
| http://localhost:3000 | Quiz client |
| http://localhost:3001 | Admin console |
| http://localhost:3003 | Analytics dashboard |
