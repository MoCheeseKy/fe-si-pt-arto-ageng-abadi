// src/components/Keuangan/Pengeluaran/schema.ts
import { z } from 'zod';

export const localExpenseSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  expense_type: z.string().optional(),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0).optional(),
  unit_price: z.coerce.number().min(0).optional(),
  total: z.coerce.number().min(0).optional(),
  account: z.string().optional(),
  payment_method: z.string().optional(),
  bank_account: z.string().optional(),
});

export type LocalExpenseFormValues = z.infer<typeof localExpenseSchema>;

export interface ExpenseRow extends LocalExpenseFormValues {
  id: string;
  customer_name?: string;
}

export const expenseTypeOptions = [
  { label: 'Operasional', value: 'Operasional' },
  { label: 'Marketing', value: 'Marketing' },
  { label: 'Pajak & Legal', value: 'Pajak & Legal' },
  { label: 'Lainnya', value: 'Lainnya' },
];
