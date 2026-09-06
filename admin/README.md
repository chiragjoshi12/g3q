# G3Q Admin Console

Next.js UI for reviewing the bilingual MCQ bank. All APIs live in the shared Node backend (`../backend`). The app lives in this folder (`admin/`), not in a nested `frontend/` directory.

## Databases

| DB | Port | Role |
|----|------|------|
| `g3q` | 3307 | **Legacy bank — left untouched** |
| `g3q_backend` | 3307 | App DB used by `backend/` (Prisma) |

Copy legacy → new (safe to re-run):

```bash
cd ../backend
npm run import:legacy-bank
```

## Setup

```bash
# 1) Backend
cd ../backend
cp .env.example .env   # DATABASE_URL → g3q_backend on :3307
npm install
npm run prisma:migrate
npm run import:legacy-bank
npm run prisma:seed    # optional quiz demo users/modules
npm run dev            # http://localhost:4000

# 2) Admin UI
cd ../admin
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://127.0.0.1:4000
npm install
npm run dev                  # http://localhost:3001
```

Login: username `admin`, password `G3Q@Admin2026` (or `ADMIN_USERNAME` / `ADMIN_PASSWORD` from backend `.env`).

## API

Base URL: `NEXT_PUBLIC_API_URL` → `/api/v1/admin/*` on the Node backend.

Student roster sample kept here for reference: `students.json`.
