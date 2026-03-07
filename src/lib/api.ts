import { GenericResponse } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper untuk mengambil token dari cookie di sisi Client
function getAuthTokenFromCookie(): string | null {
  if (typeof window === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; auth_token=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<GenericResponse<T>> {
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // 1. Ambil token dan set sebagai Authorization header jika ada
  const token = getAuthTokenFromCookie();
  if (token) {
    (defaultHeaders as Record<string, string>)['Authorization'] =
      `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  // 2. Handle Unauthorized (401)
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      // Clear cookie di sisi client & redirect ke login
      document.cookie =
        'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
      window.location.href = '/login';
    }
    throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
  }

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
