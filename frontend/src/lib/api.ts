/**
 * API client for communicating with the backend
 * In development: Uses Vite proxy to backend (localhost:3001)
 * In production: Uses VITE_API_URL env var
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function fetchAPI<T>(
  endpoint: string, 
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // Health check
  health: () => fetchAPI<{ status: string; timestamp: string }>('/health'),
  
  // Add your API methods here as you build them:
  // getModules: () => fetchAPI<Module[]>('/api/modules'),
  // getReader: (id: string) => fetchAPI<ReaderContent>(`/api/reader/${id}`),
  // saveEditor: (data: EditorData) => fetchAPI('/api/editor/save', {
  //   method: 'POST',
  //   body: JSON.stringify(data)
  // }),
};
