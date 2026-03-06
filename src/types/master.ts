// src/types/master.ts
import { z } from 'zod';

// --- SUPPLIER ---
export interface Supplier {
  id: string;
  company_name: string;
  address?: string | null;
  phone_number?: string | null;
  pic_name?: string | null;
  pic_phone_number?: string | null;
}

export const supplierSchema = z.object({
  company_name: z
    .string()
    .min(3, { message: 'Nama Perusahaan minimal 3 karakter' }),
  address: z.string().optional(),
  phone_number: z.string().optional(),
  pic_name: z.string().min(2, { message: 'Nama PIC wajib diisi' }),
  pic_phone_number: z.string().min(9, { message: 'Nomor HP PIC tidak valid' }),
});

export type SupplierFormValues = z.infer<typeof supplierSchema>;

// --- DRIVER ---
export interface Driver {
  id: string;
  name: string;
  nik: string;
  phone_number: string;
}

export const driverSchema = z.object({
  name: z.string().min(3, { message: 'Nama Driver minimal 3 karakter' }),
  nik: z.string().length(16, { message: 'NIK harus 16 digit angka' }),
  phone_number: z.string().min(9, { message: 'Nomor HP tidak valid' }),
});

export type DriverFormValues = z.infer<typeof driverSchema>;

export interface Employee {
  id: string;
  name: string;
  nik: string;
  position: string;
  phone_number: string;
  status: 'Aktif' | 'Nonaktif';
}

export const employeeSchema = z.object({
  name: z.string().min(3, { message: 'Nama Karyawan minimal 3 karakter' }),
  nik: z.string().length(16, { message: 'NIK harus 16 digit angka' }),
  position: z.string().min(2, { message: 'Jabatan wajib diisi' }),
  phone_number: z.string().min(9, { message: 'Nomor HP tidak valid' }),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;
