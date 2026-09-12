# G3Q Azure Notes

This file is the quick reference for the live G3Q setup on Azure.

## Staging vs production (target topology)

Same codebase and schema. Environments differ only by branch, App Service, and database.

| Layer | Staging | Production |
| --- | --- | --- |
| Git branch | `staging` | `main` |
| Backend App Service | `g3q-backend-staging` (create later) | `g3q-backend` |
| MySQL database | `g3q_backend_staging` (create later) | `g3q_backend` |
| Client / admin | Vercel staging / Preview (configure later) | Vercel production |

GitHub Actions (`.github/workflows/deploy-backend.yml`):

- Push to `main` → migrate + deploy with `AZURE_DATABASE_URL` / `AZURE_WEBAPP_PUBLISH_PROFILE`
- Push to `staging` → migrate + deploy with `AZURE_DATABASE_URL_STAGING` / `AZURE_WEBAPP_PUBLISH_PROFILE_STAGING`

Staging secrets and Azure resources are **not** provisioned by the repo; add them before the staging job can succeed.

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

## Live Services (production)

### Backend API

- App Service name: `g3q-backend`
- URL: `https://g3q-backend.azurewebsites.net`
- Health check:
  - `https://g3q-backend.azurewebsites.net/api/v1/health`
- Runtime:
  - Linux App Service
  - Node.js `24-lts`

### App Service Plan

- Plan name: `plan-f1`
- SKU: `Basic B3`
- Notes:
  - `g3q-backend` runs on Azure App Service
  - This plan is shared with some other apps in the same resource group

### Database

- Server name: `edutor-mysql`
- FQDN: `edutor-mysql.mysql.database.azure.com`
- Engine: MySQL Flexible Server
- Version: `8.0.21`
- SKU: `Standard_B2s`
- G3Q production database name: `g3q_backend`

## What Runs Where

- `backend/`
  - Production: Azure App Service `g3q-backend` from `main`
  - Staging (when wired): Azure App Service `g3q-backend-staging` from `staging`
  - GitHub Actions deploys the `backend/` folder

- `client/`
  - Public quiz app on Vercel
  - Production backend:
    - `NEXT_PUBLIC_DATA_SOURCE=rest`
    - `BACKEND_ORIGIN=https://g3q-backend.azurewebsites.net` (or `NEXT_PUBLIC_API_BASE_URL=.../api`)
  - Staging: set `BACKEND_ORIGIN` to the staging App Service URL when that env exists

- `admin/`
  - Admin app on Vercel
  - Local API URL: `http://127.0.0.1:4000`
  - Production API URL: `https://g3q-backend.azurewebsites.net`

## Deployment

### GitHub Repository

- Repo:
  - `https://github.com/chiragjoshi12/g3q`

### Backend CI/CD

- Workflow file:
  - `.github/workflows/deploy-backend.yml`
- Triggers:
  - Push to `main` when `backend/**` changes → production
  - Push to `staging` when `backend/**` changes → staging (needs staging secrets)

## Important App Settings

These are the important live backend settings. Do not store secret values in docs.

- `NODE_ENV=production`
- `DATABASE_URL=<set in Azure App Service>`
- `JWT_SECRET=<set in Azure App Service>`
- `GEMINI_API_KEY=<set in Azure App Service>`
- `CORS_ALLOW_ALL=true`

## Useful Azure CLI Commands

### Check current account

```bash
az account show
```

### List web apps

```bash
az webapp list -o table
```

### Show G3Q backend app

```bash
az webapp show --name g3q-backend --resource-group edutor-resource-group -o json
```

### Restart backend

```bash
az webapp restart --name g3q-backend --resource-group edutor-resource-group
```

### List app settings

```bash
az webapp config appsettings list --name g3q-backend --resource-group edutor-resource-group
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
- The live Azure DB for G3Q production is `g3q_backend`.
- Avoid putting passwords, publish profiles, or raw secrets into this file.
