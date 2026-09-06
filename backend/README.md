# G3Q Backend

Express + Prisma API for the quiz client and admin console. App database is MySQL `g3q_backend` on port 3307.

```bash
cp .env.example .env
npm install
npm run prisma:migrate
npm run prisma:seed    # optional
npm run dev            # http://localhost:4000
```

Health check: `GET http://localhost:4000/api/v1/health`.

Master admin (bootstrapped on start): username `admin`, password `G3Q@Admin2026`.
