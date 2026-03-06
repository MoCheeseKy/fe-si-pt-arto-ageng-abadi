// src/types/accounting.ts
import { z } from 'zod';

// --- CHART OF ACCOUNT (CoA) ---
export interface Coa {
  id: string;
  account_code: string; // contoh: "1110"
  account_name: string; // contoh: "Kas Besar"
  category: 'Aset' | 'Kewajiban' | 'Ekuitas' | 'Pendapatan' | 'Beban';
  balance: number;
  status: 'Aktif' | 'Nonaktif';
}

export const coaSchema = z.object({
  account_code: z.string().min(3, 'Kode akun minimal 3 karakter'),
  account_name: z.string().min(3, 'Nama akun wajib diisi'),
  category: z.enum(['Aset', 'Kewajiban', 'Ekuitas', 'Pendapatan', 'Beban']),
  description: z.string().optional(),
});
export type CoaFormValues = z.infer<typeof coaSchema>;

// --- JURNAL UMUM ---
export interface JournalEntry {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
}

export interface Journal {
  id: string;
  transaction_date: string;
  reference_id: string; // cth: "INV-001" atau "DEP-002"
  description: string;
  entries: JournalEntry[];
  total_debit: number;
  total_credit: number;
  source_module: 'Invoice' | 'Pengisian' | 'Pengeluaran' | 'Gaji' | 'Manual';
}

export const manualJournalSchema = z
  .object({
    transaction_date: z.string().min(1, 'Tanggal wajib diisi'),
    description: z.string().min(3, 'Deskripsi wajib diisi'),
    entries: z
      .array(
        z.object({
          account_code: z.string().min(1, 'Akun wajib dipilih'),
          debit: z.coerce.number().min(0),
          credit: z.coerce.number().min(0),
        }),
      )
      .min(2, 'Jurnal minimal harus memiliki 2 baris (Debit & Kredit)'),
  })
  .superRefine((data, ctx) => {
    const totalDebit = data.entries.reduce((sum, item) => sum + item.debit, 0);
    const totalCredit = data.entries.reduce(
      (sum, item) => sum + item.credit,
      0,
    );
    if (totalDebit !== totalCredit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Total Debit dan Kredit harus seimbang (Balance)',
        path: ['entries'],
      });
    }
  });
export type ManualJournalFormValues = z.infer<typeof manualJournalSchema>;
