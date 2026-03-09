// src/components/Keuangan/Deposit/schema.ts
import { z } from 'zod';

export const localDepositSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  amount: z.coerce.number().min(0, 'Nominal tidak boleh negatif'),
  chart_of_account: z.string().optional(),
});

export type LocalDepositFormValues = z.infer<typeof localDepositSchema>;

export interface DepositRow extends LocalDepositFormValues {
  id: string;
  customer_name?: string;
}
