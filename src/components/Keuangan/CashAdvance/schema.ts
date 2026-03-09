// src/components/Keuangan/Kasbon/schema.ts
import { z } from 'zod';

export const localCashAdvanceSchema = z.object({
  employee_id: z.string().min(1, 'Karyawan wajib dipilih'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  amount: z.coerce.number().min(0, 'Nominal tidak boleh negatif'),
  description: z.string().optional(),
  status: z.string().optional(),
});

export type LocalCashAdvanceFormValues = z.infer<typeof localCashAdvanceSchema>;

export interface CashAdvanceRow extends LocalCashAdvanceFormValues {
  id: string;
  employee_name?: string;
}

export const statusOptions = [
  { label: 'Belum Lunas', value: 'Belum Lunas' },
  { label: 'Lunas', value: 'Lunas' },
];
