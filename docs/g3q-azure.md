# G3Q Azure Notes

This file is the quick reference for the live G3Q setup on Azure.

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

## Live Services

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
- G3Q database name: `g3q_backend`

## What Runs Where

- `backend/`
  - Deployed to Azure App Service: `g3q-backend`
  - Source repo: `main` branch of this repository
  - GitHub Actions deploys the `backend/` folder

- `client/`
  - Public quiz app
  - Frontend is deployed on Vercel
  - To use live backend:
    - `NEXT_PUBLIC_DATA_SOURCE=rest`
    - `NEXT_PUBLIC_API_BASE_URL=https://g3q-backend.azurewebsites.net/api`

- `admin/frontend/`
  - Admin app
  - Local API URL:
    - `http://127.0.0.1:4000`
  - Production API URL:
    - `https://g3q-backend.azurewebsites.net`

## Deployment

### GitHub Repository

- Repo:
  - `https://github.com/chiragjoshi12/g3q`

### Backend CI/CD

- Workflow file:
  - `.github/workflows/deploy-backend.yml`
- Trigger:
  - Push to `main` when `backend/**` changes
- Deployment target:
  - Azure App Service `g3q-backend`

## Important App Settings

These are the important live backend settings. Do not store secret values in docs.

- `NODE_ENV=production`
- `DATABASE_URL=<set in Azure App Service>`
- `JWT_SECRET=<set in Azure App Service>`
- `GEMINI_API_KEY=<set in Azure App Service>`
- `AI_ENHANCEMENT_ENABLED=false` unless explicitly enabled
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
- The live Azure DB for G3Q is `g3q_backend`.
- Avoid putting passwords, publish profiles, or raw secrets into this file.
