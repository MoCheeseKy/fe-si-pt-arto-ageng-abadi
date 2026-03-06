'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Search, Plus, CreditCard, Calculator } from 'lucide-react';
import { toast } from 'sonner';

import { ExpenseFormValues, expenseSchema } from '@/types/keuangan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export default function PengeluaranPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      jenis_biaya: 'Biaya Operasional',
      customer_id: '',
      deskripsi: '',
      jumlah_qty: 1,
      harga_satuan: 0,
      akun: '',
      jenis_pembayaran: 'Cash',
      rekening_bank: '',
    },
  });

  const watchValues = useWatch({ control: form.control });

  // Auto kalkulasi total
  const calculatedTotal =
    (watchValues.jumlah_qty || 0) * (watchValues.harga_satuan || 0);

  const onSubmit = async (values: ExpenseFormValues) => {
    await new Promise((res) => setTimeout(res, 600));
    toast.success('Catatan pengeluaran berhasil disimpan.');
    setIsDialogOpen(false);
  };

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-heading font-bold flex items-center gap-2'>
            <CreditCard className='w-6 h-6 text-primary' /> Pengeluaran
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Catat arus kas keluar operasional dan biaya customer.
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className='bg-primary text-white'
        >
          <Plus className='w-4 h-4 mr-2' /> Catat Pengeluaran
        </Button>
      </div>

      <div className='bg-card border border-border rounded-xl shadow-sm p-12 text-center text-muted-foreground'>
        <CreditCard className='w-12 h-12 mx-auto mb-4 opacity-20' />
        <p>Belum ada transaksi pengeluaran bulan ini.</p>
      </div>

      {/* Dialog Form Pengeluaran */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-2xl bg-card'>
          <DialogHeader>
            <DialogTitle>Catat Pengeluaran Baru</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4 grid grid-cols-2 gap-4 mt-2'
          >
            <div className='space-y-1 col-span-2 sm:col-span-1'>
              <label className='text-xs'>Tanggal</label>
              <Input type='date' {...form.register('date')} />
            </div>

            <div className='space-y-1 col-span-2 sm:col-span-1'>
              <label className='text-xs font-bold text-primary'>
                Jenis Biaya
              </label>
              <select
                {...form.register('jenis_biaya')}
                className='flex h-9 w-full rounded-md border border-primary bg-background px-3 py-1 text-sm'
              >
                <option value='Biaya Operasional'>
                  Biaya Operasional (Umum)
                </option>
                <option value='Biaya Customer'>
                  Biaya Customer (Reimburse/Proyek)
                </option>
              </select>
            </div>

            {/* Render Dinamis: Jika Biaya Customer, muncul form pilih Customer */}
            {watchValues.jenis_biaya === 'Biaya Customer' && (
              <div className='space-y-1 col-span-2 p-3 bg-muted/30 border border-border rounded-md'>
                <label className='text-xs'>
                  Pilih Customer Referensi{' '}
                  <span className='text-destructive'>*</span>
                </label>
                <select
                  {...form.register('customer_id')}
                  className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm'
                >
                  <option value=''>-- Pilih Customer --</option>
                  <option value='1'>PT. Industri Maju Abadi</option>
                </select>
                {form.formState.errors.customer_id && (
                  <p className='text-[10px] text-destructive'>
                    {form.formState.errors.customer_id.message}
                  </p>
                )}
              </div>
            )}

            <div className='space-y-1 col-span-2'>
              <label className='text-xs'>Deskripsi Pengeluaran</label>
              <Input
                {...form.register('deskripsi')}
                placeholder='Beli sparepart GTM...'
              />
            </div>

            <div className='space-y-1'>
              <label className='text-xs'>Jumlah (Qty)</label>
              <Input type='number' {...form.register('jumlah_qty')} />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Harga Satuan (Rp)</label>
              <Input type='number' {...form.register('harga_satuan')} />
            </div>

            {/* Auto Calculate Display */}
            <div className='col-span-2 flex items-center justify-between p-3 bg-sidebar-gradient-dark border border-border rounded-md'>
              <span className='text-sm font-medium flex items-center gap-2 text-muted-foreground'>
                <Calculator className='w-4 h-4' /> Total Pengeluaran
              </span>
              <span className='text-xl font-mono font-bold text-rose-500'>
                Rp {calculatedTotal.toLocaleString('id-ID')}
              </span>
            </div>

            <div className='space-y-1 col-span-2'>
              <label className='text-xs'>Akun Biaya (CoA)</label>
              <Input
                {...form.register('akun')}
                placeholder='Contoh: 5100-Biaya Transport'
              />
            </div>

            <div className='space-y-1'>
              <label className='text-xs'>Jenis Pembayaran</label>
              <select
                {...form.register('jenis_pembayaran')}
                className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm'
              >
                <option value='Cash'>Cash / Tunai</option>
                <option value='Bank'>Transfer Bank</option>
              </select>
            </div>

            {/* Render Dinamis: Jika Bank, muncul form pilih Rekening */}
            {watchValues.jenis_pembayaran === 'Bank' && (
              <div className='space-y-1'>
                <label className='text-xs'>
                  Rekening Bank <span className='text-destructive'>*</span>
                </label>
                <select
                  {...form.register('rekening_bank')}
                  className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm'
                >
                  <option value=''>-- Pilih Rekening --</option>
                  <option value='BCA-123'>BCA - 123456789</option>
                  <option value='MANDIRI-987'>Mandiri - 987654321</option>
                </select>
                {form.formState.errors.rekening_bank && (
                  <p className='text-[10px] text-destructive'>
                    {form.formState.errors.rekening_bank.message}
                  </p>
                )}
              </div>
            )}

            <DialogFooter className='col-span-2 pt-4'>
              <Button type='submit' className='w-full bg-primary text-white'>
                Simpan Pengeluaran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
