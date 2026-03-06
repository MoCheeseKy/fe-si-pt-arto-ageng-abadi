// src/types/kontrak.ts
import { z } from 'zod';

// --- PENAWARAN ---
export const offerSchema = z.object({
  no_penawaran: z.string().min(1, 'Nomor wajib diisi'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  pelaksanaan: z.string().min(1, 'Pelaksanaan wajib diisi'),
  volume_cng_perbulan: z.coerce.number().min(1, 'Volume wajib diisi'),
  standar_spesifikasi_ghv: z.string().min(1, 'Standar GHV wajib diisi'),
  lokasi_mother_station: z.string().min(1, 'Lokasi wajib diisi'),
  harga_gas_per_sm3: z.coerce.number().min(1, 'Harga wajib diisi'),
  cara_pembayaran: z.string().min(1, 'Cara pembayaran wajib diisi'),
  harga_termasuk: z.string().min(1, 'Include wajib diisi'),
  periode_kontrak: z.string().min(1, 'Periode wajib diisi'),
  waktu_persiapan: z.string().min(1, 'Waktu persiapan wajib diisi'),
  validity: z.string().min(1, 'Validity wajib diisi'),
});
export type OfferFormValues = z.infer<typeof offerSchema>;

// --- KONTRAK KEY TERM ---
export const keyTermSchema = z
  .object({
    no_penawaran: z.string().min(1, 'No Penawaran wajib diisi'),
    tanggal_penawaran: z.string().min(1, 'Tanggal Penawaran wajib diisi'),
    customer_id: z.string().min(1, 'Customer wajib dipilih'),
    volume: z.coerce.number().min(1, 'Volume wajib diisi'),
    jangka_waktu: z.string().min(1, 'Jangka Waktu wajib diisi'),
    jenis_harga: z.enum(['Tiering', 'Flat']),
    moq: z.coerce.number().optional(), // Kondisional jika Flat
    sistem_penagihan: z.enum(['Top Up', 'Deposit']),
  })
  .superRefine((data, ctx) => {
    if (data.jenis_harga === 'Flat' && (!data.moq || data.moq <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MoQ wajib diisi jika jenis harga Flat',
        path: ['moq'],
      });
    }
  });
export type KeyTermFormValues = z.infer<typeof keyTermSchema>;

// --- KONTRAK PJBG ---
export const pjbgSchema = z.object({
  nomor: z.string().min(1, 'Nomor PJBG wajib diisi'),
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  jangka_waktu: z.string().min(1, 'Jangka Waktu wajib diisi'),
});
export type PjbgFormValues = z.infer<typeof pjbgSchema>;
