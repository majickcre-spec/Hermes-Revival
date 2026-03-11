/**
 * Shared types between frontend and backend
 * Import as: import type { Module } from '@shared/types';
 */

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  order: number;
}

export interface ReaderContent {
  id: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

export interface EditorData {
  id?: string;
  content: string;
  title: string;
  lastSaved: Date;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
  service: string;
}

// Add your Hermetic study domain types here:
// export interface HermeticText { ... }
// export interface StudyModule { ... }
// etc.
