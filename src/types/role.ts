// src/types/role.ts
import { z } from 'zod';

export interface Role {
  id: string;
  name: string;
  description: string;
  total_users: number; // Computed: Jumlah user yang memiliki role ini
}

export const roleSchema = z.object({
  name: z.string().min(3, 'Nama Jabatan (Role) minimal 3 karakter'),
  description: z.string().optional(),
  // Menyimpan array ID menu/modul yang diizinkan
  permissions: z.array(z.string()).min(1, 'Pilih minimal 1 hak akses modul'),
});

export type RoleFormValues = z.infer<typeof roleSchema>;
