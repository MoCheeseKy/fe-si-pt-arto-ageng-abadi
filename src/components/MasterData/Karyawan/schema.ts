// src/components/MasterData/Karyawan/schema.ts
import { z } from 'zod';

/**
 * Schema validasi lokal untuk Form Karyawan.
 * Menggunakan Zod untuk memastikan input tidak kosong.
 */
export const localEmployeeSchema = z.object({
  name: z.string().min(1, 'Nama Karyawan wajib diisi'),
  nik: z.string().min(1, 'NIK wajib diisi'),
});

/** Tipe data inferensi dari schema validasi karyawan */
export type LocalEmployeeFormValues = z.infer<typeof localEmployeeSchema>;
