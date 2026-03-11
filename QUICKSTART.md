# Quick Start Guide

Get Hermes Revival running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- Git installed
- Railway account (for deployment)

## Local Development (Fast Track)

```bash
# 1. Clone and enter directory
git clone <your-repo>
cd hermes-revival

# 2. Install everything
npm run install:all

# 3. Set up environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env:
# PORT=3001
# NODE_ENV=development
# FRONTEND_URL=http://localhost:5173
# DATABASE_URL=<your-db-url-when-ready>

# Edit frontend/.env:
# VITE_API_URL=http://localhost:3001

# 4. Start development servers
npm run dev

# ✅ Done! 
# - Frontend: http://localhost:5173
# - Backend: http://localhost:3001
# - Health check: http://localhost:3001/health
```

## Verify It Works

```bash
# Test backend health
curl http://localhost:3001/health

# Should return:
# {"status":"ok","timestamp":"...","service":"hermes-revival-backend"}

# Open browser to http://localhost:5173
# Your React app should load
```

## Railway Deployment (Fast Track)

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial monorepo setup"
git push origin main
```

### 2. Create Backend Service

1. Railway Dashboard → New Project → Deploy from GitHub
2. Select your repo
3. **Add service** → Select repo
4. **Settings**:
   - Name: `backend`
   - Root Directory: `backend`
5. **Variables** tab:
   ```
   NODE_ENV=production
   PORT=${{PORT}}
   FRONTEND_URL=<will-set-after-frontend-deploys>
   DATABASE_URL=<optional-for-now>
   ```
6. **Networking** tab → Generate Domain
7. **Copy the domain** (e.g., `backend-production-xxxx.up.railway.app`)

### 3. Create Frontend Service

1. Same project → **Add service** → Select same repo
2. **Settings**:
   - Name: `frontend`
   - Root Directory: `frontend`
3. **Variables** tab:
   ```
   VITE_API_URL=https://backend-production-xxxx.up.railway.app
   ```
   (Use the backend domain from step 2.7)
4. **Networking** tab → Generate Domain
5. **Copy this domain** - this is your app URL!

### 4. Update Backend CORS

1. Go to backend service
2. **Variables** tab
3. Update `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://frontend-production-yyyy.up.railway.app
   ```
   (Use the frontend domain from step 3.5)
4. Backend will auto-redeploy

### 5. Test Production

1. Visit your frontend URL
2. Should load your React app
3. Check browser console - no CORS errors
4. API calls should work

## Common Issues

### Local Development

**CORS errors:**
```bash
# Ensure backend .env has:
FRONTEND_URL=http://localhost:5173

# Ensure frontend vite.config.ts has proxy setup
```

**API calls fail:**
```bash
# Ensure both services are running:
npm run dev

# Check backend is on :3001
# Check frontend is on :5173
```

**Module not found:**
```bash
# Reinstall dependencies
npm run install:all
```

### Production (Railway)

**Build fails:**
- Check Railway logs
- Ensure root directory is set correctly
- Verify package.json has all dependencies

**CORS errors:**
- Update `FRONTEND_URL` on backend to match frontend domain
- Update `VITE_API_URL` on frontend to match backend domain
- Redeploy if needed

**404 on routes:**
- Frontend uses `serve -s` flag for SPA routing (already in railway.json)

## Next Steps

After setup:

1. **Migrate your code**: Follow `MIGRATION.md`
2. **Add API endpoints**: Edit `backend/src/routes.ts`
3. **Update API client**: Edit `frontend/src/lib/api.ts`
4. **Connect database**: When ready, add Postgres in Railway
5. **Build features**: Start developing!

## Useful Commands

```bash
# Development
npm run dev                    # Run both services
npm run dev:backend            # Backend only
npm run dev:frontend           # Frontend only

# Type checking
npm run typecheck              # Check both services

# Building
npm run build                  # Build both for production

# Railway CLI (after installing)
railway login                  # Authenticate
railway logs --service backend # View backend logs
railway logs --service frontend # View frontend logs
```

## File Structure Quick Reference

```
hermes-revival/
├── backend/           # Express API (port 3001)
│   ├── src/
│   │   ├── index.ts   # Main server
│   │   └── routes.ts  # API routes
│   └── .env           # PORT, NODE_ENV, FRONTEND_URL, DATABASE_URL
│
├── frontend/          # React + Vite (port 5173)
│   ├── src/
│   │   └── lib/
│   │       └── api.ts # API client
│   └── .env           # VITE_API_URL
│
└── shared/            # Shared TypeScript types
    └── types.ts
```

## Get Help

- **README.md**: Full documentation
- **MIGRATION.md**: Moving from old structure
- **RAILWAY.md**: Railway deployment details
- **STRUCTURE.md**: Complete file structure explanation

## Pro Tips

✅ **Always**:
- Run `npm run dev` from root (not in backend/frontend dirs)
- Set environment variables before deploying
- Test locally before pushing to Railway
- Check Railway logs if deployment fails

❌ **Never**:
- Commit `.env` files (they're gitignored)
- Hardcode URLs in code (use env vars)
- Skip the `npm run install:all` step
- Deploy without testing locally first

---

**That's it!** You should be up and running. 🚀

For detailed explanations, see the other documentation files.
