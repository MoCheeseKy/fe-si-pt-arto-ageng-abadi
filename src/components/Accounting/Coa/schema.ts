// src/components/Accounting/Coa/schema.ts
import { z } from 'zod';

export const localCoaSchema = z.object({
  code: z.string().min(1, 'Kode Akun wajib diisi'),
  name: z.string().min(1, 'Nama Akun wajib diisi'),
  CoACategoryId: z.string().min(1, 'Kategori Akun wajib dipilih'),
  initialBalance: z.coerce.number().min(0, 'Saldo awal tidak boleh negatif'),
});

export type LocalCoaFormValues = z.infer<typeof localCoaSchema>;

export interface CoaRow extends LocalCoaFormValues {
  id: string;
  category_name?: string;
  AccountingCoACategory?: { name: string };
  CoACategory?: { name: string };
}
