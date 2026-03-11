# Hermes Revival - Monorepo Architecture

Clean separation of frontend and backend services for Railway deployment.

## 📁 Project Structure

```
hermes-revival/
├── frontend/          # React + Vite UI
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── railway.json
├── backend/           # Express API
│   ├── src/
│   ├── package.json
│   ├── tsconfig.json
│   └── railway.json
├── shared/            # Shared types/schemas
├── package.json       # Root orchestration
└── README.md
```

## 🚀 Local Development

### First-time setup

```bash
# Install all dependencies (root + frontend + backend)
npm run install:all

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit backend/.env and frontend/.env with your values
```

### Running the app

```bash
# Run both frontend and backend together
npm run dev

# Or run individually:
npm run dev:backend   # Backend on http://localhost:3001
npm run dev:frontend  # Frontend on http://localhost:5173
```

The frontend Vite proxy automatically routes `/api` and `/health` requests to the backend.

### Building for production

```bash
# Build both services
npm run build

# Or build individually:
npm run build:backend
npm run build:frontend
```

## 🚄 Railway Deployment

### Setup

1. **Create Railway project** with two services:
   - `backend` service
   - `frontend` service

2. **Configure backend service:**
   - **Root Directory**: `backend`
   - **Build Command**: (auto-detected from railway.json)
   - **Start Command**: (auto-detected from railway.json)
   - **Environment Variables**:
     ```
     NODE_ENV=production
     DATABASE_URL=${{Postgres.DATABASE_URL}}  # if using Railway Postgres
     PORT=${{PORT}}  # Railway auto-assigns
     FRONTEND_URL=https://your-frontend.up.railway.app
     ```
   - **Public Networking**: Generate Domain → note this URL

3. **Configure frontend service:**
   - **Root Directory**: `frontend`
   - **Build Command**: (auto-detected from railway.json)
   - **Start Command**: (auto-detected from railway.json)
   - **Environment Variables**:
     ```
     VITE_API_URL=https://your-backend.up.railway.app
     ```
   - **Public Networking**: Generate Domain

4. **Deploy:**
   - Push to GitHub
   - Railway auto-deploys both services
   - Frontend routes API calls to backend URL

### Important Notes

- **CORS**: Backend allows requests from `FRONTEND_URL` in production
- **API calls**: Frontend uses `VITE_API_URL` to reach backend
- **Database**: Set `DATABASE_URL` on backend service when ready to connect
- **Order**: Deploy backend first, then use its URL in frontend env vars

## 🔧 Development Workflow

### Adding new API endpoints

1. Add route in `backend/src/routes.ts`
2. Add corresponding method in `frontend/src/lib/api.ts`
3. Use in frontend components: `import { api } from '@/lib/api'`

Example:
```typescript
// backend/src/routes.ts
app.get('/api/modules', (req, res) => {
  res.json({ modules: [...] });
});

// frontend/src/lib/api.ts
export const api = {
  getModules: () => fetchAPI<Module[]>('/api/modules'),
};

// frontend component
const modules = await api.getModules();
```

### Sharing types between frontend/backend

Use the `shared/` directory:
```typescript
// shared/types.ts
export interface Module {
  id: string;
  title: string;
}

// Import in backend
import type { Module } from '@shared/types';

// Import in frontend
import type { Module } from '@shared/types';
```

### Database integration

When ready to connect the database:

1. Add Postgres plugin to backend service in Railway
2. Use `DATABASE_URL` env var (automatically provided)
3. Run migrations: `npm run db:push` (add this script)
4. Backend will connect on startup

## 📝 Migration from Single Service

Your current files should be moved as follows:

```
OLD LOCATION              → NEW LOCATION
─────────────────────────────────────────────────
client/                   → frontend/src/
server/index.ts           → backend/src/index.ts
server/routes.ts          → backend/src/routes.ts
server/storage.ts         → backend/src/storage.ts (when implementing)
shared/                   → shared/ (stays the same)
drizzle.config.ts         → backend/drizzle.config.ts
components.json           → frontend/components.json
postcss.config.js         → frontend/postcss.config.js
vite.config.ts            → frontend/vite.config.ts
attached_assets/          → frontend/public/
```

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Test backend health
curl http://localhost:3001/health

# Test API through frontend proxy
curl http://localhost:5173/api
```

## 🐛 Troubleshooting

### CORS errors in development
- Ensure backend is running on port 3001
- Check Vite proxy config in `frontend/vite.config.ts`

### CORS errors in production
- Verify `FRONTEND_URL` is set correctly on backend
- Check Railway logs for CORS origin mismatch

### API calls failing
- Development: Check Vite proxy is routing to localhost:3001
- Production: Verify `VITE_API_URL` points to backend Railway domain

### Module resolution errors
- Run `npm run install:all` to ensure all dependencies installed
- Check tsconfig.json `paths` are correct

## 📦 Package Scripts Reference

**Root level:**
- `npm run dev` - Run both services
- `npm run build` - Build both services
- `npm run install:all` - Install all dependencies

**Backend:**
- `npm run dev` - Start dev server with hot reload
- `npm run build` - Build TypeScript to dist/
- `npm start` - Run production build

**Frontend:**
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 🎯 Next Steps

1. **Move existing code** from current structure to new monorepo
2. **Test locally** with `npm run dev`
3. **Set up Railway** services as described above
4. **Deploy and verify** both services work together
5. **Start building** new API endpoints and features!
