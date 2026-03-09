// src/components/Operasional/Pengisian/schema.ts
import { z } from 'zod';
import { Purchase } from '@/types/operasional';

export const localPurchaseSchema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
  supplier_id: z.string().min(1, 'Supplier wajib dipilih'),
  driver_id: z.string().min(1, 'Driver wajib dipilih'),
  license_plate: z.string().min(1, 'Plat nomor wajib diisi'),
  gtm_type: z.string().min(1, 'Tipe GTM wajib diisi'),
  do_number: z.string().min(1, 'Nomor DO wajib diisi'),
  ghc: z.coerce.number().min(0),
  pressure_start: z.coerce.number().min(0),
  pressure_finish: z.coerce.number().min(0),
  meter_start: z.coerce.number().min(0),
  meter_finish: z.coerce.number().min(0),
  volume_mmscf: z.coerce.number().min(0),
  volume_mmbtu: z.coerce.number().min(0),
  currency: z.string().min(1),
  exchange_rate: z.coerce.number().min(1),
  price_per_sm3: z.coerce.number().min(0),
  total_sales: z.coerce.number().min(0),
});

export type LocalPurchaseFormValues = z.infer<typeof localPurchaseSchema>;

export type PurchaseRow = Omit<Purchase, 'supplier_name'> &
  Partial<LocalPurchaseFormValues> & {
    supplier_name?: string;
    driver_name?: string;
  };
