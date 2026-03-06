// src/types/keuangan.ts
import { z } from 'zod';

// --- INVOICE ---
export interface Invoice {
  id: string;
  invoice_number: string;
  date: string;
  customer_name: string;
  po_number: string;
  total_amount: number;
  deposit_deduction: number;
  final_amount: number;
  status: 'Unpaid' | 'Paid' | 'Overdue';
}

export const invoiceSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  invoice_number: z.string().min(1, 'Nomor Invoice wajib diisi'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  po_number: z.string().min(1, 'Nomor PO wajib diisi'),
  po_date: z.string().min(1, 'Tanggal PO wajib diisi'),
  period_start: z.string().min(1, 'Periode mulai wajib diisi'),
  period_end: z.string().min(1, 'Periode akhir wajib diisi'),
  note: z.string().optional(),

  // Array ID pemakaian yang dipilih
  selected_usages: z
    .array(z.string())
    .min(1, 'Minimal pilih 1 riwayat pemakaian untuk ditagih'),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export interface Deposit {
  id: string;
  date: string;
  customer_name: string;
  amount: number;
  type: 'Top Up' | 'Deduction'; // Deduction = dipotong oleh invoice
  reference_id?: string; // ID Invoice jika deduction
}

export interface Deposit {
  id: string;
  date: string;
  customer_name: string;
  amount: number;
  type: 'Top Up' | 'Deduction'; // Deduction terjadi otomatis dari Invoice
  reference_id?: string; // ID Invoice jika deduction
}

export const depositSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  amount: z.coerce.number().min(1, 'Jumlah deposit wajib diisi dan > 0'),
  note: z.string().optional(),
});
export type DepositFormValues = z.infer<typeof depositSchema>;

// --- PENGELUARAN (EXPENSE) ---
export const expenseSchema = z
  .object({
    date: z.string().min(1, 'Tanggal wajib diisi'),
    jenis_biaya: z.enum(['Biaya Operasional', 'Biaya Customer']),
    customer_id: z.string().optional(),
    deskripsi: z.string().min(3, 'Deskripsi wajib diisi'),
    jumlah_qty: z.coerce.number().min(1, 'Qty wajib diisi'),
    harga_satuan: z.coerce.number().min(1, 'Harga satuan wajib diisi'),
    akun: z.string().min(1, 'Akun CoA wajib dipilih'),
    jenis_pembayaran: z.enum(['Cash', 'Bank']),
    rekening_bank: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Kondisional: Jika Biaya Customer, Customer wajib dipilih
    if (data.jenis_biaya === 'Biaya Customer' && !data.customer_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Customer wajib dipilih untuk biaya customer',
        path: ['customer_id'],
      });
    }
    // Kondisional: Jika via Bank, Rekening wajib dipilih
    if (data.jenis_pembayaran === 'Bank' && !data.rekening_bank) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Rekening wajib dipilih jika via Bank',
        path: ['rekening_bank'],
      });
    }
  });
export type ExpenseFormValues = z.infer<typeof expenseSchema>;

// --- PETTY CASH ---
export const pettyCashSchema = z
  .object({
    date: z.string().min(1, 'Tanggal wajib diisi'),
    jenis_biaya: z.enum(['Biaya Operasional', 'Biaya Customer']),
    customer_id: z.string().optional(),
    deskripsi: z.string().min(3, 'Deskripsi wajib diisi'),
    jumlah_qty: z.coerce.number().min(1, 'Qty wajib diisi'),
    harga_satuan: z.coerce.number().min(1, 'Harga satuan wajib diisi'),
    tipe_mutasi: z.enum(['Debit', 'Kredit']),
  })
  .superRefine((data, ctx) => {
    if (data.jenis_biaya === 'Biaya Customer' && !data.customer_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Customer wajib dipilih',
        path: ['customer_id'],
      });
    }
  });
export type PettyCashFormValues = z.infer<typeof pettyCashSchema>;

export interface Kasbon {
  id: string;
  date: string;
  employee_name: string;
  description: string;
  amount: number;
  monthly_deduction: number;
  status: 'Aktif' | 'Lunas';
}

export const kasbonSchema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
  employee_id: z.string().min(1, 'Karyawan wajib dipilih'),
  description: z.string().min(3, 'Deskripsi wajib diisi'),
  amount: z.coerce.number().min(1, 'Jumlah kasbon wajib diisi'),
  monthly_deduction: z.coerce.number().min(1, 'Potongan per bulan wajib diisi'),
});
export type KasbonFormValues = z.infer<typeof kasbonSchema>;

// --- GAJI (PAYROLL) ---
export interface Payroll {
  id: string;
  period: string;
  employee_name: string;
  nik: string;
  total_income: number;
  total_deduction: number;
  take_home_pay: number;
  status: 'Draft' | 'Paid';
}

export const payrollSchema = z.object({
  period: z.string().min(1, 'Periode wajib diisi'),
  employee_id: z.string().min(1, 'Karyawan wajib dipilih'),

  // Penghasilan
  gaji_pokok: z.coerce.number().min(0),
  tunjangan: z.coerce.number().min(0),
  lembur: z.coerce.number().min(0),
  insentif: z.coerce.number().min(0),
  lain_penghasilan: z.coerce.number().min(0),

  // Potongan
  pph21: z.coerce.number().min(0),
  bpjs: z.coerce.number().min(0),
  potongan_hutang: z.coerce.number().min(0), // Bisa di-fetch otomatis dari Kasbon
  lain_potongan: z.coerce.number().min(0),
});
export type PayrollFormValues = z.infer<typeof payrollSchema>;
