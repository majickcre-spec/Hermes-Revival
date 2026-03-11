# Railway Deployment Quick Reference

## Creating Services

### Backend Service
1. **New Service** → **Empty Service** → Name: `backend`
2. **Settings**:
   - Root Directory: `backend`
   - Watch Paths: `backend/**` (optional)
3. **Variables**:
   ```
   NODE_ENV=production
   PORT=${{PORT}}
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   FRONTEND_URL=https://your-frontend.up.railway.app
   ```
4. **Networking**: Generate Domain → Copy URL
5. **Deploy**: Connect GitHub repo → Auto-deploys

### Frontend Service
1. **New Service** → **Empty Service** → Name: `frontend`
2. **Settings**:
   - Root Directory: `frontend`
   - Watch Paths: `frontend/**` (optional)
3. **Variables**:
   ```
   VITE_API_URL=https://your-backend.up.railway.app
   ```
4. **Networking**: Generate Domain → This is your app URL
5. **Deploy**: Auto-deploys with backend

## Service Configuration

Both services auto-detect from `railway.json`:
- Build commands
- Start commands
- Restart policies

No manual configuration needed if railway.json is present.

## Environment Variable Strategy

**Backend needs:**
- `FRONTEND_URL` - For CORS (frontend's Railway domain)
- `DATABASE_URL` - Auto-provided if using Railway Postgres
- `PORT` - Auto-provided by Railway
- `NODE_ENV` - Set to "production"

**Frontend needs:**
- `VITE_API_URL` - Backend's Railway domain

**Local development:**
- Backend: `FRONTEND_URL=http://localhost:5173`
- Frontend: `VITE_API_URL=http://localhost:3001`

## Deployment Flow

```
Push to GitHub
       ↓
Railway detects changes
       ↓
Backend builds (cd backend && npm ci && npm run build)
       ↓
Backend starts (cd backend && npm start)
       ↓
Frontend builds (cd frontend && npm ci && npm run build)
       ↓
Frontend starts (cd frontend && npx serve -s dist)
       ↓
Both services running ✓
```

## Common Railway Commands

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs (backend)
railway logs --service backend

# View logs (frontend)
railway logs --service frontend

# Set env var
railway variables set KEY=value --service backend

# Run command in Railway environment
railway run npm run db:push --service backend
```

## Debugging Deployment

**Build fails:**
```bash
# Check Railway logs
railway logs --service [backend|frontend]

# Common issues:
- Wrong root directory
- Missing dependencies in package.json
- TypeScript errors
```

**Runtime fails:**
```bash
# Check service logs
railway logs --service backend

# Common issues:
- Missing environment variables
- Wrong PORT binding
- Database connection errors
```

**CORS errors:**
```bash
# Backend logs will show:
"CORS origin mismatch: got X, expected Y"

# Fix:
railway variables set FRONTEND_URL=https://correct-url.railway.app --service backend
```

## Service URLs

After deployment, you get:
- Backend: `https://backend-production-xxxx.up.railway.app`
- Frontend: `https://frontend-production-yyyy.up.railway.app`

Users access: **Frontend URL only**
Frontend internally calls: **Backend URL**

## Database Setup (When Ready)

1. **Add Postgres**:
   - Railway Dashboard → New → Database → PostgreSQL
2. **Connect to Backend**:
   - `DATABASE_URL` automatically set on backend service
3. **Run Migrations**:
   ```bash
   railway run npm run db:push --service backend
   ```

## Monitoring

**Railway Dashboard shows:**
- CPU/Memory usage
- Request counts
- Deployment history
- Build times
- Crash logs

**Set up alerts** for:
- Service crashes
- High resource usage
- Build failures

## Cost Optimization

**Free Tier:**
- $5 credit/month
- Enough for small projects

**Tips:**
- Use sleep mode for dev environments
- Monitor resource usage
- Scale down when not needed

## Redeploy Triggers

Changes to these trigger redeploy:
- Code in `backend/**` → backend redeploys
- Code in `frontend/**` → frontend redeploys  
- Code in `shared/**` → BOTH redeploy
- Root files → BOTH redeploy (careful!)

Set **Watch Paths** to limit this.

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | Check logs, verify package.json |
| Can't access service | Check Public Networking enabled |
| CORS errors | Update FRONTEND_URL on backend |
| 404 on routes | Frontend: serve needs -s flag for SPA |
| DB connection fails | Check DATABASE_URL is set |
| Slow builds | Check build cache settings |
| Out of memory | Upgrade plan or optimize build |

## Best Practices

✅ **Do:**
- Use environment variables for URLs
- Enable Public Networking per service
- Monitor logs during first deploy
- Test locally before deploying
- Use Watch Paths to limit rebuilds

❌ **Don't:**
- Hardcode URLs in code
- Commit .env files
- Forget to set CORS origin
- Deploy without testing locally
- Ignore build warnings
