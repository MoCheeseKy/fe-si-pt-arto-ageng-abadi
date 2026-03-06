// src/types/auth.ts
import { z } from 'zod';

export interface User {
  id: string;
  name: string;
  username: string;
  role: string; // Jabatan / Role (Admin, User, dll)
  status: 'Aktif' | 'Nonaktif';
}

export const userSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z
    .string()
    .min(6, 'Password minimal 6 karakter')
    .optional()
    .or(z.literal('')),
  role: z.string().min(1, 'Jabatan wajib dipilih'),
});

export type UserFormValues = z.infer<typeof userSchema>;
