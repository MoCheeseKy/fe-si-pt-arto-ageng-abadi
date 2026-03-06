// src/types/operasional.ts
import { z } from 'zod';

export interface Purchase {
  id: string;
  date: string;
  supplier_name: string;
  nomor_do: string;
  plat_nomor: string;
  jenis_gtm: '10FT' | '20FT' | '40FT';
  volume_mmbtu: number;
  total_penjualan: number;
  currency: 'IDR' | 'USD';
  status: 'Selesai' | 'Pending';
}

export const purchaseSchema = z
  .object({
    date: z.string().min(1, { message: 'Tanggal wajib diisi' }),
    supplier_id: z.string().min(1, { message: 'Supplier wajib dipilih' }),
    driver_id: z.string().min(1, { message: 'Driver wajib dipilih' }),
    plat_nomor: z.string().min(2, { message: 'Plat nomor wajib diisi' }),
    jenis_gtm: z.enum(['10FT', '20FT', '40FT']),
    nomor_do: z.string().min(3, { message: 'Nomor DO wajib diisi' }),

    // Parameter Teknis
    ghc: z.coerce.number().min(0),
    pressure_start: z.coerce.number().min(0),
    pressure_finish: z.coerce.number().min(0),
    meter_awal: z.coerce.number().min(0),
    meter_akhir: z.coerce.number().min(0),

    // Keuangan
    currency: z.enum(['IDR', 'USD']),
    exchange_rate: z.coerce.number().optional(),
    price_per_sm3: z.coerce
      .number()
      .min(1, { message: 'Harga per Sm3 wajib diisi' }),
  })
  .superRefine((data, ctx) => {
    // Validasi Kondisional: Jika USD, Kurs wajib diisi dan > 0
    if (
      data.currency === 'USD' &&
      (!data.exchange_rate || data.exchange_rate <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Kurs wajib diisi jika memilih Dolar',
        path: ['exchange_rate'],
      });
    }
  });

export type PurchaseFormValues = z.infer<typeof purchaseSchema>;

// Tambahkan di bawah kode purchaseSchema di src/types/operasional.ts

// --- PEMAKAIAN GAS ---
export type UsageMethod = 'Delta Pressure' | 'EVC' | 'Turbin';

export interface Usage {
  id: string;
  date: string;
  customer_name: string;
  metode: UsageMethod;
  plat_nomor: string;
  jenis_gtm: string;
  total_sm3: number;
  total_mmbtu: number;
  total_penjualan: number;
  currency: 'IDR' | 'USD';
  status: 'Selesai' | 'Pending';
}

export const usageSchema = z
  .object({
    date: z.string().min(1, { message: 'Tanggal wajib diisi' }),
    customer_id: z.string().min(1, { message: 'Customer wajib dipilih' }),
    metode: z.enum(['Delta Pressure', 'EVC', 'Turbin']),

    // Umum
    plat_nomor: z.string().optional(),
    jenis_gtm: z.string().optional(),
    no_gtm: z.string().optional(),

    // Field Delta Pressure
    lwc: z.coerce.number().optional(),
    vol_nm3_200: z.coerce.number().optional(),
    tekanan_awal: z.coerce.number().optional(),
    tekanan_akhir: z.coerce.number().optional(),

    // Field EVC & Turbin
    turbin_awal: z.coerce.number().optional(),
    turbin_akhir: z.coerce.number().optional(),
    evc_awal: z.coerce.number().optional(),
    evc_akhir: z.coerce.number().optional(),

    // Field Khusus Turbin
    supply_pressure: z.coerce.number().optional(),
    temp_avg_prs: z.coerce.number().optional(),
    faktor_kompresi: z.coerce.number().optional(),
    temp_base: z.coerce.number().optional(),
    pressure_standar: z.coerce.number().optional(),
    pressure_atm_standar: z.coerce.number().optional(),

    // Parameter Umum (GHV dll)
    ghv: z.coerce.number().optional(),
    standar_1_sm3: z.coerce.number().optional(),

    // Keuangan
    currency: z.enum(['IDR', 'USD']),
    exchange_rate: z.coerce.number().optional(),
    price_per_sm3: z.coerce.number().min(1, { message: 'Harga wajib diisi' }),
  })
  .superRefine((data, ctx) => {
    if (
      data.currency === 'USD' &&
      (!data.exchange_rate || data.exchange_rate <= 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Kurs wajib diisi',
        path: ['exchange_rate'],
      });
    }
    if (data.metode === 'Delta Pressure' && !data.tekanan_awal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Wajib diisi',
        path: ['tekanan_awal'],
      });
    }
    // Validasi spesifik metode lain bisa ditambahkan di sini...
  });

export type UsageFormValues = z.infer<typeof usageSchema>;
