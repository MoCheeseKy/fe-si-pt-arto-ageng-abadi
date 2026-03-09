// src/components/Operasional/Kontrak/schema.ts
import { z } from 'zod';

export type TabTypes = 'offer' | 'key_term' | 'pjbg';

// 1. Schema untuk Penawaran (Offer)
export const offerSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  offer_number: z.string().min(1, 'Nomor Penawaran wajib diisi'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  implementation: z.string().optional(),
  monthly_cng_usage_volume: z.coerce.number().min(0),
  standard_ghv_specification: z.string().optional(),
  cng_mother_station_location: z.string().optional(),
  cng_gas_price_per_sm3: z.coerce.number().min(0),
  payment_method: z.string().optional(),
  price_includes: z.string().optional(),
  contract_period: z.string().optional(),
  preparation_time: z.string().optional(),
  validity: z.string().optional(),
});
export type OfferFormValues = z.infer<typeof offerSchema>;

// 2. Schema untuk Key Term
export const keyTermSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  offer_number: z.string().min(1, 'Nomor Penawaran wajib diisi'),
  offer_date: z.string().min(1, 'Tanggal Penawaran wajib diisi'),
  volume: z.coerce.number().min(0),
  duration: z.string().min(1, 'Durasi wajib diisi'),
  price_type: z.string().optional(),
  moq: z.coerce.number().min(0),
  billing_type: z.string().optional(),
});
export type KeyTermFormValues = z.infer<typeof keyTermSchema>;

// 3. Schema untuk Kontrak PJBG
export const pjbgSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  contract_number: z.string().min(1, 'Nomor Kontrak wajib diisi'),
  duration: z.string().min(1, 'Durasi wajib diisi'),
});
export type PjbgFormValues = z.infer<typeof pjbgSchema>;
