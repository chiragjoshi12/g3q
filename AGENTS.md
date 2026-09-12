# G3Q — agent notes

Use this file as the map of the repo. Prefer it over guessing app roles, ports, or stack.

## What this product is

G3Q (Gujarat Gyan Guru Quiz) is a Gujarati-language quiz platform. End users (school students, college students, citizens) authenticate with OTP, play bilingual quizzes drawn from a reviewed question bank, and see results and leaderboards. Staff use a separate admin console to review and allocate that bank. A fourth app visualizes participation by geography.

## Four projects

| Path | Role | Port | Talks to backend? |
| --- | --- | --- | --- |
| `backend/` | Express REST API | 4000 | — (owns the DB) |
| `client/` | Public quiz app | 3000 | Yes (`/api/*`) |
| `admin/` | Question-bank admin console | 3001 | Yes (`/api/v1/admin/*`) |
| `analytics/` | Participation dashboard | 3003 | No (local mock data) |

Do not nest a `frontend/` folder under `admin/`. The Next.js admin app lives at `admin/` itself.

There is a single root `.gitignore`. Do not add per-app `.gitignore` files for these four projects. Admin keeps only `admin/.env.example`; local secrets go in gitignored `.env.local`.

## Deployments & CLI Access Policy

- **`backend/`**: Deployed on Azure Portal (Azure App Service). Staging is live as `g3q-backend-staging` / `g3q_backend_staging` (see [`docs/g3q-azure.md`](file:///Users/chiragjoshi/Documents/GitHub-chirguz/g3q/docs/g3q-azure.md)).
- **`client/`**: Staging on Vercel project `g3q-staging` (`https://g3q-staging.vercel.app`, Git branch `staging` → Azure staging API). **`admin/`**, **`analytics/`**: also on Vercel.
- **CLI Access & Permission Rules**: Refer to [`docs/access.md`](file:///Users/chiragjoshi/Documents/GitHub-chirguz/g3q/docs/access.md). Agents can access Vercel, Azure, and GitHub through CLI (`vercel`, `az`, `gh`), but **MUST ALWAYS ask for explicit user permission before processing or executing anything** on these platforms.
- **Capacitor Mobile Builds**: Refer to [`docs/capacitor-build.md`](file:///Users/chiragjoshi/Documents/GitHub-chirguz/g3q/docs/capacitor-build.md) for Android APK and iOS iPhone build commands and output artifact locations.


## Tech stack

### `backend/`

- Node.js, Express 4, ESM (`"type": "module"`)
- Prisma 6 + MySQL (`mysql2`)
- JWT (`jsonwebtoken`), bcryptjs, Zod validation
- Optional Gemini (`@google/genai`) for question personalisation
- Entry: `backend/index.js` → `backend/src/app.js`
- Config: `backend/src/config/index.js` (loads `backend/.env`)
- Schema: `backend/src/prisma/schema.prisma`

API prefixes:

- Client/public: `/api/auth`, `/api/sessions`, `/api/quizzes/practice/bundle`, `/api/users`, `/api/leaderboard`, `/api/landing`, `/api/geography`, `/api/g3q-ai`
- Admin console: `/api/v1/admin`
- Health: `GET /api/v1/health`

### `client/`

- Next.js 16 (App Router), React 19, JavaScript (JSX)
- Tailwind CSS v4, Zustand
- Capacitor for Android/iOS wrappers
- Layered data access: views → stores → controllers → domain → repositories → JSON or REST sources
- Config: `client/config/app.config.js`
- REST base defaults to `http://localhost:4000/api` (rewrites / `NEXT_PUBLIC_API_BASE_URL`)

### `admin/`

- Next.js 15 (App Router), React 19, TypeScript
- Tailwind CSS v4
- Env: `NEXT_PUBLIC_API_URL` (see `admin/.env.example`), default `http://127.0.0.1:4000`
- UI: question review, work allocation, admin user management
- Master admin is bootstrapped by the backend, not by this app

### `analytics/`

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4
- Data is generated in `analytics/src/lib/g3q-data.ts` (not live MySQL)
- Routes: `/`, `/district/[district]`, `/district/[district]/taluka/[taluka]`

## Database

- Engine: **MySQL**, typically on port **3307** locally
- App database: **`g3q_backend`** via Prisma `DATABASE_URL`
- Optional legacy database: **`g3q`** (read-only source for `npm run import:legacy-bank`)
- Connection example (see `backend/.env.example`):  
  `mysql://g3q:g3q_local_pass@127.0.0.1:3307/g3q_backend`

Core Prisma models (`backend/src/prisma/schema.prisma`):

- `User` — student / college / citizen identities
- `AdminUser` — console logins (master + allocated reviewers)
- `QuestionRoot` / `QuestionVariant` — bilingual question bank (scope/district/caste on root; type + JSON payload + review on variant)
- `QuizSession` / `QuizSessionQuestion` / `UserQuestionExposure` — live bank-backed play
- `District` / `Taluka` — geography
- `OtpRequest` — login OTP

Migrations: `cd backend && npm run prisma:migrate`. Seed: `npm run prisma:seed`.

## Auth to remember

- **Quiz users:** OTP, no password. Dev bypass OTP is `1234` (`OTP_DEV_BYPASS_CODE`).
- **Master admin (console):** username `admin`, password `G3Q@Admin2026` (`ADMIN_USERNAME` / `ADMIN_PASSWORD` in `backend/.env`). Created on backend start by `adminAuthService.ensureMasterAdmin()`.

## Conventions

- Client APIs are unversioned under `/api`. Admin APIs stay under `/api/v1/admin`.
- Gujarati is the primary UI language in `client/`.
- CORS origins: `http://localhost:3000` and `http://localhost:3001` (see `FRONTEND_ORIGINS` in backend env).
- Do not introduce FastAPI or a second database layer; the Node backend is the API.
