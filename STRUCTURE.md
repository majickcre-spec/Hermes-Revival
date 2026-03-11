# Hermes Revival - Refactored Structure

```
hermes-revival/
├── 📄 README.md                    # Main documentation
├── 📄 MIGRATION.md                 # Step-by-step migration guide
├── 📄 RAILWAY.md                   # Railway deployment reference
├── 📄 package.json                 # Root orchestration (run both services)
├── 📄 .gitignore                   # Git ignore rules
│
├── backend/                        # Express API Service
│   ├── src/
│   │   ├── index.ts               # Main server entry (Express setup)
│   │   └── routes.ts              # API route definitions
│   ├── package.json               # Backend dependencies
│   ├── tsconfig.json              # Backend TypeScript config
│   ├── railway.json               # Railway build/deploy config
│   ├── .env.example               # Environment template
│   └── .tsconfigpaths.json        # Path alias resolution
│
├── frontend/                       # React + Vite UI Service
│   ├── src/
│   │   └── lib/
│   │       └── api.ts             # API client for backend calls
│   ├── public/                    # Static assets (create this)
│   ├── index.html                 # HTML entry point
│   ├── package.json               # Frontend dependencies
│   ├── vite.config.ts             # Vite config (with API proxy)
│   ├── tsconfig.json              # Frontend TypeScript config
│   ├── tsconfig.node.json         # Vite build TypeScript config
│   ├── railway.json               # Railway build/deploy config
│   └── .env.example               # Environment template
│
└── shared/                         # Shared types/schemas (you'll create)
    └── types.ts                   # Shared TypeScript types

```

## File Purposes

### Root Level
- **README.md**: Complete setup, development, and deployment guide
- **MIGRATION.md**: Step-by-step guide to move from old structure
- **RAILWAY.md**: Quick reference for Railway deployment
- **package.json**: Scripts to run/build both services together
- **.gitignore**: Ignores node_modules, .env, dist, etc.

### Backend (Express API)
- **src/index.ts**: Express server setup, CORS, middleware, error handling
- **src/routes.ts**: API endpoint definitions (health check, API info)
- **package.json**: Express, CORS, Drizzle ORM, TypeScript deps
- **tsconfig.json**: TypeScript config with path aliases (@/, @shared/)
- **railway.json**: Build and start commands for Railway
- **.env.example**: Template for PORT, NODE_ENV, DATABASE_URL, FRONTEND_URL

### Frontend (React + Vite)
- **src/lib/api.ts**: Centralized API client for backend calls
- **index.html**: Entry HTML file
- **vite.config.ts**: Vite config with proxy to backend (dev mode)
- **package.json**: React, React Router, Tailwind, shadcn/ui deps
- **tsconfig.json**: TypeScript config with path aliases
- **railway.json**: Build (Vite) and serve (static) commands
- **.env.example**: Template for VITE_API_URL

### Shared
- **types.ts**: TypeScript types/interfaces used by both services
- Import as `@shared/types` in both frontend and backend

## Key Differences from Old Structure

| Old | New | Why |
|-----|-----|-----|
| Single package.json | Three package.json files | Separate deps per service |
| server/ serves static files | frontend/ serves itself | Independent deployment |
| Direct fetch('/api') | api.getModules() | Centralized API client |
| No environment separation | Separate .env per service | Different configs needed |
| Single Railway service | Two Railway services | Independent scaling |

## Scripts Overview

**Root (run from project root):**
```bash
npm run dev              # Run both services together
npm run dev:backend      # Backend only (port 3001)
npm run dev:frontend     # Frontend only (port 5173)
npm run build            # Build both services
npm run typecheck        # Type check both services
npm run install:all      # Install all dependencies
```

**Backend (run from backend/):**
```bash
npm run dev              # Dev server with hot reload (tsx watch)
npm run build            # Build to dist/
npm start                # Run production build
npm run typecheck        # Check types only
```

**Frontend (run from frontend/):**
```bash
npm run dev              # Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run typecheck        # Check types only
```

## Environment Variables

**Backend (.env):**
```env
PORT=3001                          # Server port
NODE_ENV=development               # Environment
FRONTEND_URL=http://localhost:5173 # For CORS (prod: Railway URL)
DATABASE_URL=postgresql://...      # Database connection
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:3001 # Backend URL (prod: Railway URL)
```

## How Services Communicate

**Development:**
```
Browser → localhost:5173 (Vite)
           ↓
       /api requests proxied to
           ↓
       localhost:3001 (Express)
```

**Production:**
```
Browser → frontend.railway.app
           ↓
       Fetch to VITE_API_URL
           ↓
       backend.railway.app
```

## Railway Deployment

**Two separate services:**

1. **Backend Service:**
   - Root: `backend/`
   - Builds and runs Express server
   - Generates public domain
   
2. **Frontend Service:**
   - Root: `frontend/`
   - Builds Vite, serves static files
   - Generates public domain

**Environment setup:**
- Backend needs: `FRONTEND_URL` (frontend's Railway URL)
- Frontend needs: `VITE_API_URL` (backend's Railway URL)

## Migration Checklist

- [ ] Copy `shared/` directory
- [ ] Move `server/` files to `backend/src/`
- [ ] Move `client/` files to `frontend/src/`
- [ ] Move `attached_assets/` to `frontend/public/`
- [ ] Update import paths (use @ and @shared aliases)
- [ ] Copy config files (drizzle, components, postcss)
- [ ] Set up environment files
- [ ] Install dependencies (`npm run install:all`)
- [ ] Test locally (`npm run dev`)
- [ ] Deploy to Railway (two services)
- [ ] Verify production works

## Next Actions

1. **Review** this structure
2. **Follow MIGRATION.md** to move your code
3. **Test locally** before deploying
4. **Deploy to Railway** following RAILWAY.md
5. **Start building** new features!
