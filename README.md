# G3Q — Gujarat Quiz

G3Q is a Gujarati-language quiz platform. Students and college users log in with a CTS number or ABC ID (OTP, no password), play bilingual quizzes drawn from a reviewed question bank, and see results and leaderboards. Admins review, enhance, and allocate that bank from a separate console.

The repo is three apps that talk to one MySQL database:

| App | Path | Role | Dev port |
| --- | --- | --- | --- |
| **Backend** | `backend/` | Express API (auth, quiz sessions, admin) | **4000** |
| **Client** | `client/` | Student / college quiz app (Next.js) | **3000** |
| **Admin** | `admin/frontend/` | Question-bank admin console (Next.js) | **3001** |

```
client  (:3000)  ─┐
                  ├──►  backend  (:4000)  ──►  MySQL  (:3307)
admin   (:3001)  ─┘
```

---

## Prerequisites

- Node.js (18+)
- npm
- MySQL listening on **3307** (databases `g3q_backend` for the app, optional `g3q` as a legacy import source)

---

## 1. Backend — port 4000

Express + Prisma API. Health check: `GET http://localhost:4000/api/v1/health`.

```bash
cd backend
cp .env.example .env          # DATABASE_URL, PORT=4000, JWT, admin bootstrap
npm install
npm run prisma:migrate
npm run prisma:seed           # optional demo users / modules
npm run dev                   # http://localhost:4000
```

`PORT` in `backend/.env` defaults to `4000`. CORS allows `http://localhost:3000` (client) and `http://localhost:3001` (admin).

Bootstrap admin (from `.env`): username `admin`, password `G3Q@Admin2026`.

---

## 2. Client (quiz app) — port 3000

Next.js 16 student/college UI. Default Next.js port is **3000**.

```bash
cd client
npm install
npm run dev                   # http://localhost:3000
```

To talk to the live backend (instead of bundled JSON), create `client/.env.local`:

```
NEXT_PUBLIC_DATA_SOURCE=rest
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api
```

Then restart `npm run dev`.

In development, OTP `123456` is accepted (no SMS gateway). Demo identities are in the client README.

---

## 3. Admin console — port 3001

Next.js admin UI for bilingual bank review, work allocation, and analytics. Scripts pin the port to **3001**.

```bash
cd admin/frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://127.0.0.1:4000
npm install
npm run dev                   # http://localhost:3001
```

Open `http://localhost:3001/login`. The admin app calls `/api/v1/admin/*` on the backend.

---

## Typical local stack

Run each in its own terminal (backend first):

```bash
# Terminal 1
cd backend && npm run dev          # :4000

# Terminal 2
cd client && npm run dev           # :3000

# Terminal 3
cd admin/frontend && npm run dev   # :3001
```

| URL | App |
| --- | --- |
| http://localhost:4000 | API |
| http://localhost:3000 | Quiz client |
| http://localhost:3001 | Admin console |
