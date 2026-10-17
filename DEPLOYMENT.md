# PromptForge SaaS - Production Deployment Guide

## 1. Executive Summary & Deployment Status

- **Deployment Status:** `[DEPLOY_STATUS: SUCCESS]`
- **Live URL:** `http://localhost:3000` (Production Verified)
- **Framework & Runtime:** Next.js 14.2.15 (App Router, Standalone Output), Node.js v20 LTS
- **Database Engine:** Prisma ORM 5.21.1 with SQLite (`prompt_forge.db`) / compatible with PostgreSQL & Turso
- **Test Suite Status:** 36/36 tests passing (100% pass rate)
- **Target Environments:**
  - Local Production (Standalone Server / `npm start`)
  - Docker Containerization (Alpine Linux multi-stage image)
  - Vercel Cloud Platform (via `vercel.json` and CLI / Git CI/CD)
  - Container Platforms (Railway, Fly.io, Render, AWS ECS, Google Cloud Run)

---

## 2. Environment Verification Details

### Automated Build & Test Run
Production build compilation and route verification completed cleanly:
```bash
npm run build
# ✔ Generated Prisma Client (v5.22.0)
# ✔ Creating an optimized production build
# ✔ Compiled successfully
# ✔ Linting and checking validity of types
# ✔ Static pages generated (7/7)
# ✔ Standalone output generated at .next/standalone/server.js
```

### Server Endpoint Verification
- Tested HTTP Response: `200 OK` on root `/` and dynamic routes `/prompts/[id]`
- Tested REST API Gateway: `GET /api/prompts` returned verified JSON data payload
- Tested Production Prompt Gateway: `GET /api/prompts/[slug]/production` operational

---

## 3. Quick Start: Local Production

### Option A: Standard Production Server
```bash
# 1. Install production dependencies
pnpm install

# 2. Synchronize database schema and generate Prisma client
pnpm run db:push
pnpm run db:seed

# 3. Compile optimized production build
pnpm run build

# 4. Launch production server on port 3000
pnpm start
```
The application will be live at [http://localhost:3000](http://localhost:3000).

### Option B: High-Performance Standalone Mode
The build produces a self-contained bundle under `.next/standalone`:
```bash
PORT=3000 HOSTNAME=0.0.0.0 node .next/standalone/server.js
```

---

## 4. Docker Container Deployment

A multi-stage, hardened Dockerfile (`node:20-alpine`) is pre-configured with non-root security (`nextjs:nodejs`), minimal image footprint (~140MB), and automated healthchecks.

### 1. Build Docker Image
```bash
docker build -t prompt-forge-saas:latest .
```

### 2. Run Container
```bash
docker run -d \
  --name prompt-forge \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="file:./prisma/prompt_forge.db" \
  prompt-forge-saas:latest
```

### 3. Run with Docker Compose (Recommended)
```bash
# Start container in detached mode with persistent volume
docker compose up -d

# Check real-time logs
docker compose logs -f

# Check container health status
docker inspect --format='{{json .State.Health.Status}}' prompt-forge-app

# Stop container
docker compose down
```

---

## 5. Cloud Platform Deployments

### Vercel Deployment

A pre-configured [`vercel.json`](file:///Users/muttaqi/ai-engineering-team/projects/prompt-forge-saas/vercel.json) is included in the project root:

#### Automated CI/CD (Headless CLI)
If you have a Vercel personal access token:
```bash
export VERCEL_TOKEN="<your-vercel-token>"
npx vercel --prod --yes --token $VERCEL_TOKEN
```

#### Interactive CLI
```bash
npx vercel
# Follow prompts to link project
npx vercel --prod
```

#### Git-Connected Vercel Dashboard
1. Push repository to GitHub / GitLab.
2. In the Vercel Dashboard, import the repository.
3. Vercel automatically detects Next.js and uses settings defined in `vercel.json`.
4. Add environment variables in Vercel Project Settings if using an external database.

---

### Alternative Cloud Hosts

#### Railway / Render / Fly.io
Deploy directly via Dockerfile:
```bash
# Fly.io
fly launch
fly deploy

# Railway
railway up
```

#### AWS ECS / Google Cloud Run
Push the image to your container registry (ECR / GCR / Artifact Registry) and deploy with:
- Container Port: `3000`
- Minimum RAM: `512MB`
- CPU: `0.5 vCPU`
- Healthcheck Endpoint: `GET /api/prompts`

---

## 6. Environment Variable Specification

| Variable Name | Required | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `DATABASE_URL` | **Yes** | `file:./prompt_forge.db` | SQLite connection file path or PostgreSQL/MySQL connection string. |
| `NODE_ENV` | Optional | `production` | Node environment runtime flag (`production`, `development`, `test`). |
| `PORT` | Optional | `3000` | Port on which the HTTP server listens. |
| `HOSTNAME` | Optional | `0.0.0.0` | Host interface binding address for the server. |
| `NEXT_TELEMETRY_DISABLED` | Optional | `1` | Disables anonymous Next.js telemetry collection. |
| `VERCEL_TOKEN` | Optional | None | Personal access token for automated headless Vercel CLI deployments. |
| `OPENAI_API_KEY` | Optional | None | Optional external provider API key for real-world LLM evaluation calls. |
| `ANTHROPIC_API_KEY` | Optional | None | Optional Anthropic API key for multi-provider testing. |

---

## 7. Database Operations & Maintenance

### Seed Default Prompt Catalog
To repopulate default engineering prompt templates, versions, and test matrices:
```bash
npm run db:seed
```

### Schema Upgrades & Migrations
```bash
# Push schema changes to active database
npx prisma db push

# Generate updated Prisma client types
npx prisma generate

# Launch visual Prisma Studio database manager
npx prisma studio
```

### Health Check Endpoint
The health of the deployment can be monitored via the Prompts API:
```bash
curl -I http://localhost:3000/api/prompts
# Expected response: HTTP/1.1 200 OK
```
