// src/components/Keuangan/PettyCash/schema.ts
import { z } from 'zod';

export const localPettyCashSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  transaction_type: z.string().min(1, 'Tipe transaksi wajib dipilih'),
  expense_type: z.string().optional(),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0).optional(),
  unit_price: z.coerce.number().min(0).optional(),
  total: z.coerce.number().min(0).optional(),
});

export type LocalPettyCashFormValues = z.infer<typeof localPettyCashSchema>;

export interface PettyCashRow extends LocalPettyCashFormValues {
  id: string;
  customer_name?: string;
}

export const transactionTypeOptions = [
  { label: 'Pengeluaran Kas', value: 'Pengeluaran' },
  { label: 'Pemasukan Kas', value: 'Pemasukan' },
];
