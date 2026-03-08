// src/lib/api.ts
import { GenericResponse } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Helper untuk mengambil token dari Zustand (localStorage) di sisi Client
function getAuthTokenFromStore(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const storageData = localStorage.getItem('auth-storage');
    if (storageData) {
      const parsed = JSON.parse(storageData);
      return parsed.state?.user?.token || null;
    }
  } catch (error) {
    console.error('Gagal membaca token dari storage', error);
  }
  return null;
}

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<GenericResponse<T>> {
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // 1. Ambil token dari store dan set sebagai Authorization header
  const token = getAuthTokenFromStore();
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
      // Clear token dari Client Store agar request selanjutnya tidak membawa token invalid
      localStorage.removeItem('auth-storage');

      // Panggil route handler Next.js untuk menghapus httpOnly cookie secara server-side
      fetch('/api/auth/signout', { method: 'POST' }).finally(() => {
        window.location.href = '/login';
      });
    }
    throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
  }

  // Handle respons 204 No Content
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
