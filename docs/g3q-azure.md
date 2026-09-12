# G3Q Azure Notes

This file is the quick reference for the live G3Q setup on Azure.

## Staging vs production

Same codebase and schema. Environments differ by branch, App Service, and database.

| Layer | Staging (live now) | Production |
| --- | --- | --- |
| Git branch | `staging` | `main` (when provisioned) |
| Backend App Service | `g3q-backend-staging` | *not provisioned yet* |
| Backend URL | `https://g3q-backend-staging.azurewebsites.net` | — |
| MySQL database | `g3q_backend_staging` | *not provisioned yet* |
| Client / admin | Vercel `g3q-staging` (`https://g3q-staging.vercel.app`, branch `staging`) | Vercel production |


**Cutover note:** The previous App Service `g3q-backend` still exists and points at `g3q_backend_staging` so older clients keep working during the rename. Prefer `g3q-backend-staging` for all new staging frontend config.

GitHub Actions (`.github/workflows/deploy-backend.yml`):

- Push to `staging` → migrate + deploy with `AZURE_DATABASE_URL_STAGING` / `AZURE_WEBAPP_PUBLISH_PROFILE_STAGING`
- Push to `main` → production job is reserved until a separate prod App Service/DB exist

Quiz session knobs and other non-secret app defaults live in `backend/src/config/settings.js`, not in App Service env.

## Azure Access

- Sign in with Azure CLI:

```bash
az login
az account show
```

- Current subscription:
  - Subscription name: `Azure subscription 1`
  - Subscription ID: `f7a40807-b51a-4853-b126-34b457936c0e`
  - Tenant: `Default Directory`
- Main resource group:
  - `edutor-resource-group`

## Live Services (staging)

### Backend API

- App Service name: `g3q-backend-staging`
- URL: `https://g3q-backend-staging.azurewebsites.net`
- Health check:
  - `https://g3q-backend-staging.azurewebsites.net/api/v1/health`
- Runtime:
  - Linux App Service
  - Node.js `24-lts`
  - Startup command: `node index.js`
- Env marker: `G3Q_ENV=staging`

### Legacy alias (temporary)

- App Service name: `g3q-backend`
- URL: `https://g3q-backend.azurewebsites.net`
- Same database as staging (`g3q_backend_staging`). Do not treat this as production.

### App Service Plan

- Plan name: `g3q-plan-s1`
- SKU: `Standard S1`
- Location: Central India

### Database

- Server name: `edutor-mysql`
- FQDN: `edutor-mysql.mysql.database.azure.com`
- Engine: MySQL Flexible Server
- Version: `8.0.21`
- G3Q staging database name: `g3q_backend_staging`
- Empty leftover schema `g3q_backend` may still exist after the rename (tables moved into staging).

## What Runs Where

- `backend/`
  - Staging: Azure App Service `g3q-backend-staging` from branch `staging`
  - Production: create later (`g3q-backend` / `g3q_backend` or new names)
  - GitHub Actions deploys the `backend/` folder

- `client/`
  - Staging: Vercel project `g3q-staging` → `https://g3q-staging.vercel.app`
    - Git production branch: `staging`
    - `BACKEND_ORIGIN=https://g3q-backend-staging.azurewebsites.net`
    - Deploys automatically on push to `staging` (non-staging branches are ignored)
  - Default Azure origin in `client/config/backend-origin.mjs` is the staging App Service

- `admin/`
  - Admin app on Vercel
  - Staging API URL: `https://g3q-backend-staging.azurewebsites.net`

## Deployment

### GitHub Repository

- Repo:
  - `https://github.com/chiragjoshi12/g3q`

### Backend CI/CD

- Workflow file:
  - `.github/workflows/deploy-backend.yml`
- Triggers:
  - Push to `staging` when `backend/**` changes → staging App Service
  - Push to `main` when `backend/**` changes → production (skipped until prod resources exist)

## Important App Settings

These are the important live backend settings. Do not store secret values in docs.

- `NODE_ENV=production` (Azure runtime; use `G3Q_ENV=staging` for environment identity)
- `DATABASE_URL=<set in Azure App Service → g3q_backend_staging>`
- `JWT_SECRET=<set in Azure App Service>`
- `GEMINI_API_KEY=<set in Azure App Service>`
- `CORS_ALLOW_ALL=true`
- `AZURE_STORAGE_ACCOUNT_NAME` / `AZURE_STORAGE_ACCOUNT_KEY` / `AZURE_STORAGE_CONTAINER`

## Useful Azure CLI Commands

### Check current account

```bash
az account show
```

### List web apps

```bash
az webapp list -o table
```

### Show staging backend app

```bash
az webapp show --name g3q-backend-staging --resource-group edutor-resource-group -o json
```

### Restart staging backend

```bash
az webapp restart --name g3q-backend-staging --resource-group edutor-resource-group
```

### List app settings

```bash
az webapp config appsettings list --name g3q-backend-staging --resource-group edutor-resource-group
```

### Show MySQL server

```bash
az mysql flexible-server show --name edutor-mysql --resource-group edutor-resource-group -o json
```

### List MySQL databases

```bash
az mysql flexible-server db list --server-name edutor-mysql --resource-group edutor-resource-group -o table
```

## Notes

- Local MySQL and Azure MySQL are separate.
- The live Azure DB for G3Q staging is `g3q_backend_staging`.
- Avoid putting passwords, publish profiles, or raw secrets into this file.
