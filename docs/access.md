# Infrastructure & CLI Access Policy (`docs/access.md`)

This document outlines deployment infrastructure, configured CLIs, and mandatory agent execution policies for Vercel, Azure, and GitHub.

---

## 1. Environment & Deployments

| Project | Environment / Target | Access / CLI Tool |
| --- | --- | --- |
| `backend/` | **Azure Portal** (Azure App Service & MySQL) | Azure CLI (`az`) |
| `client/` | **Vercel** | Vercel CLI (`vercel`) |
| `admin/` | **Vercel** | Vercel CLI (`vercel`) |
| `analytics/` | **Vercel** | Vercel CLI (`vercel`) |
| Repository | **GitHub** (`chiragjoshi12/g3q`) | GitHub CLI (`gh`) |

---

## 2. Configured CLI Tools

The following command-line interface tools are installed and configured on the machine:
- **Vercel CLI (`vercel`)**: Access and deployment management for `client`, `admin`, and `analytics`.
- **Azure CLI (`az`)**: Access to Azure App Service (`g3q-backend`), Azure MySQL (`edutor-mysql`), and subscription resources (refer to `docs/g3q-azure.md`).
- **GitHub CLI (`gh`)**: Access to repository workflows, PRs, issues, and deployments.

---

## 3. Mandatory Agent Policy

> [!IMPORTANT]
> **ALWAYS ASK BEFORE PROCESSING ANYTHING via CLI**
> 
> Agents are allowed to interact with **Vercel**, **Azure**, and **GitHub** via CLI tools (`vercel`, `az`, `gh`), but **MUST ALWAYS ask for explicit user permission** before performing any operations, triggering deployments, modifying remote configurations, running scripts, or executing any commands on these services.
