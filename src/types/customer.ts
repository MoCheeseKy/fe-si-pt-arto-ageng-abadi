import { z } from 'zod';

// Interface menyesuaikan response dari Backend (termasuk computed fields)
export interface Customer {
  id: string;
  company_name: string;
  npwp?: string | null;
  address?: string | null;
  phone_number?: string | null;
  pic_name?: string | null;
  pic_phone_number?: string | null;
  // Computed fields dari backend
  status: 'Aktif' | 'Nonaktif';
  saldo_deposit: number;
}

// Skema validasi Form menggunakan Zod
export const customerSchema = z.object({
  company_name: z
    .string()
    .min(3, { message: 'Nama Perusahaan minimal 3 karakter' }),
  npwp: z.string().optional(),
  address: z.string().optional(),
  phone_number: z.string().optional(),
  pic_name: z.string().min(2, { message: 'Nama PIC wajib diisi' }),
  pic_phone_number: z.string().min(9, { message: 'Nomor HP PIC tidak valid' }),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
