import type { Express, Request, Response } from 'express';
import { storage } from './storage';

export function registerRoutes(app: Express) {
  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'hermes-revival-backend'
    });
  });

  // API info endpoint
  app.get('/api', (req: Request, res: Response) => {
    res.json({
      name: 'Hermes Revival API',
      version: '1.0.0',
      endpoints: [
        { path: '/health', method: 'GET', description: 'Health check' },
        { path: '/api', method: 'GET', description: 'API information' }
      ]
    });
  });

  // Add your application routes here
  // Prefix with /api
  // Use storage for CRUD operations:
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)
}
