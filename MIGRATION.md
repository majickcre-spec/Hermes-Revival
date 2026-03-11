# Migration Guide: Single Service → Monorepo

This guide walks you through migrating your existing Hermes-Revival codebase to the new two-service architecture.

## Overview

You're moving from:
```
Hermes-Revival/           (single service)
├── client/               (React frontend)
├── server/               (Express backend)
└── shared/
```

To:
```
hermes-revival/           (monorepo)
├── frontend/             (React service)
├── backend/              (Express service)
└── shared/
```

## Step-by-Step Migration

### 1. Backup Current Project

```bash
# Create a backup
cp -r Hermes-Revival Hermes-Revival-backup
```

### 2. Set Up New Structure

```bash
# In the new refactored directory
cd hermes-revival-refactor

# Install all dependencies
npm run install:all

# Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Move Shared Code

```bash
# Copy your shared types/schemas
cp -r /path/to/Hermes-Revival/shared/* ./shared/
```

### 4. Migrate Backend

```bash
# Copy server files
cp -r /path/to/Hermes-Revival/server/* ./backend/src/

# Move database config
cp /path/to/Hermes-Revival/drizzle.config.ts ./backend/

# Important: Update imports in backend files
# Change: import { ... } from '../shared/...'
# To:     import { ... } from '@shared/...'
```

**Backend files to migrate:**
- `server/index.ts` → Already replaced with new structure
- `server/routes.ts` → Merge your routes into `backend/src/routes.ts`
- `server/storage.ts` → Move to `backend/src/storage.ts`
- `server/static.ts` → Delete (no longer needed, frontend serves itself)

**Update backend/src/routes.ts:**
```typescript
// Add your existing route logic here
// The new file already has health check, just add your app routes
```

### 5. Migrate Frontend

```bash
# Copy client source files
cp -r /path/to/Hermes-Revival/client/* ./frontend/src/

# Copy public assets
mkdir -p ./frontend/public
cp -r /path/to/Hermes-Revival/attached_assets/* ./frontend/public/

# Copy config files
cp /path/to/Hermes-Revival/components.json ./frontend/
cp /path/to/Hermes-Revival/postcss.config.js ./frontend/

# Important: The new vite.config.ts already has proxy setup
# Compare with your old one and merge any custom config
```

**Frontend files to migrate:**
- `client/*` → `frontend/src/*`
- `vite.config.ts` → Already created with proxy, merge your customizations
- `components.json` → Copy to `frontend/`
- `postcss.config.js` → Copy to `frontend/`
- `attached_assets/` → Move to `frontend/public/`

### 6. Update Frontend API Calls

Your frontend likely has fetch calls directly to endpoints. Update them:

**Before (old approach):**
```typescript
// Direct fetch in components
const response = await fetch('/api/modules');
const data = await response.json();
```

**After (new approach):**
```typescript
// Use the API client
import { api } from '@/lib/api';

const modules = await api.getModules();
```

**Update frontend/src/lib/api.ts** with your endpoints:
```typescript
export const api = {
  health: () => fetchAPI<{ status: string }>('/health'),
  
  // Add your actual endpoints:
  getModules: () => fetchAPI<Module[]>('/api/modules'),
  getReader: (id: string) => fetchAPI<ReaderContent>(`/api/reader/${id}`),
  saveEditor: (data: EditorData) => 
    fetchAPI('/api/editor/save', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
};
```

### 7. Update Import Paths

Both frontend and backend now use path aliases:

**Before:**
```typescript
import { User } from '../../shared/schema';
import { Button } from '../../components/ui/button';
```

**After:**
```typescript
import { User } from '@shared/schema';
import { Button } from '@/components/ui/button';
```

Use find-and-replace:
- `from '../shared` → `from '@shared`
- `from '../../shared` → `from '@shared`
- `from '../components` → `from '@/components`
- `from '../../components` → `from '@/components`

### 8. Environment Variables

**Backend (.env):**
```bash
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://...  # Your existing DB URL
```

**Frontend (.env):**
```bash
VITE_API_URL=http://localhost:3001
```

### 9. Update Drizzle Config

Edit `backend/drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './src/db/schema.ts',  // Update path
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

### 10. Test Locally

```bash
# From root directory
npm run dev

# You should see:
# Backend: http://localhost:3001
# Frontend: http://localhost:5173
```

**Test checklist:**
- [ ] Frontend loads at localhost:5173
- [ ] Backend health check: `curl localhost:3001/health`
- [ ] API calls work through frontend
- [ ] No CORS errors in browser console
- [ ] Existing pages/routes still work
- [ ] localStorage features still work (editor saves, etc.)

### 11. Common Issues & Fixes

**Issue: CORS errors**
```typescript
// backend/src/index.ts should have:
app.use(cors({
  origin: 'http://localhost:5173',  // Dev
  credentials: true
}));
```

**Issue: Module not found errors**
```bash
# Ensure all deps installed
npm run install:all

# Check tsconfig.json paths are correct
```

**Issue: API calls fail**
```typescript
// Check frontend/vite.config.ts proxy:
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true
  }
}
```

**Issue: Static assets not loading**
```bash
# Move to frontend/public/
# Update imports from /attached_assets/ to /
```

### 12. Update Scripts

Your old `package.json` scripts won't work. Use new ones:

```bash
# Old way
npm run dev          # Single service

# New way
npm run dev          # Runs both services
npm run dev:backend  # Backend only
npm run dev:frontend # Frontend only
```

### 13. Git Migration

```bash
# In your new refactored repo
git init
git add .
git commit -m "Migrate to monorepo architecture"

# Push to GitHub
git remote add origin <your-repo-url>
git push -u origin main
```

### 14. Railway Setup

Follow the Railway deployment section in the main README.md.

Key points:
1. Create TWO services in Railway
2. Set `backend` and `frontend` as root directories
3. Configure env vars for each service
4. Deploy backend first, get its URL
5. Use backend URL in frontend's VITE_API_URL
6. Deploy frontend

## Verification Checklist

Before considering migration complete:

- [ ] All existing pages render correctly
- [ ] Navigation works (react-router)
- [ ] API endpoints respond (even if returning mock data)
- [ ] No console errors in browser
- [ ] Backend logs show requests
- [ ] Environment variables load correctly
- [ ] TypeScript compiles without errors: `npm run typecheck`
- [ ] Both services build: `npm run build`
- [ ] Production build works locally (serve from dist/)

## Rollback Plan

If you need to rollback:

```bash
# Go back to backup
cd Hermes-Revival-backup

# Continue working in old structure
# The backup is unchanged
```

## Next Steps After Migration

1. **Test thoroughly** in development
2. **Deploy to Railway** following deployment guide
3. **Verify production** deployment works
4. **Start building** new features with clean architecture
5. **Archive old repo** once confident in new setup

## Need Help?

Common migration questions:

**Q: Do I need to rewrite my components?**
A: No! Just move them and update import paths.

**Q: What about my localStorage code?**
A: Works as-is. Frontend code is unchanged functionally.

**Q: Do I need to change my React Router setup?**
A: No, routing is client-side and works the same.

**Q: What about my Tailwind/shadcn setup?**
A: Copy components.json and postcss.config.js to frontend/, should work as-is.

**Q: When should I connect the database?**
A: After migration is complete and tested locally. Add DB as separate step.
