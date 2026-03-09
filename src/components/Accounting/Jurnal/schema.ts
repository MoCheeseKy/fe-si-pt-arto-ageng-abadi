// src/components/Accounting/Jurnal/schema.ts
import { z } from 'zod';

export const entrySchema = z
  .object({
    account_code: z.string().min(1, 'Akun wajib dipilih'),
    debit: z.coerce.number().min(0),
    credit: z.coerce.number().min(0),
  })
  .refine((data) => data.debit > 0 || data.credit > 0, {
    message: 'Pilih salah satu (Debit atau Kredit)',
    path: ['debit'],
  });

export const localJournalSchema = z
  .object({
    transaction_date: z.string().min(1, 'Tanggal wajib diisi'),
    description: z.string().min(1, 'Keterangan wajib diisi'),
    source_module: z.string().optional(),
    entries: z
      .array(entrySchema)
      .min(2, 'Minimal harus ada 2 baris (Debit & Kredit)'),
  })
  .refine(
    (data) => {
      const totalDebit = data.entries.reduce(
        (sum, item) => sum + (item.debit || 0),
        0,
      );
      const totalCredit = data.entries.reduce(
        (sum, item) => sum + (item.credit || 0),
        0,
      );
      return totalDebit === totalCredit;
    },
    {
      message: 'Total Debit dan Kredit harus Balance (Seimbang).',
      path: ['entries'],
    },
  );

export type LocalJournalFormValues = z.infer<typeof localJournalSchema>;

export interface JournalRow {
  id: string;
  transaction_date: string;
  description: string;
  source_module: string;
  entries: any[];
}
