// src/lib/api.ts
import { GenericResponse } from '@/types';

// Base URL diarahkan ke internal API route Next.js secara default untuk menghandle httpOnly cookie
// Atau langsung ke backend jika env diatur demikian
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<GenericResponse<T>> {
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  // Handle respons 204 No Content (biasanya untuk DELETE)
  if (response.status === 204) {
    return { statusCode: 204, message: 'Success', data: {} as T };
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Terjadi kesalahan pada sistem server.');
  }

  return data as GenericResponse<T>;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    fetchAPI<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body: any, options?: RequestInit) =>
    fetchAPI<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body: any, options?: RequestInit) =>
    fetchAPI<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    fetchAPI<T>(endpoint, { ...options, method: 'DELETE' }),
};
