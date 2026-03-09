// src/components/Keuangan/Invoice/schema.ts
import { z } from 'zod';

export const localInvoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Nomor Invoice wajib diisi'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  po_number: z.string().optional(),
  po_date: z.string().optional(),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  total_usage: z.coerce.number().min(0).optional(),
  deposit_deduction: z.coerce.number().min(0).optional(),
  total_bill: z.coerce.number().min(0).optional(),
  note: z.string().optional(),
  status: z.string().optional(),
});

export type LocalInvoiceFormValues = z.infer<typeof localInvoiceSchema>;

export interface InvoiceRow extends LocalInvoiceFormValues {
  id: string;
  customer_name?: string;
}

export const statusOptions = [
  { label: 'Draft', value: 'Draft' },
  { label: 'Unpaid', value: 'Unpaid' },
  { label: 'Paid', value: 'Paid' },
];
