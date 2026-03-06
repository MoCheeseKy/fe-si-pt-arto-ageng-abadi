'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Search,
  Plus,
  Coins,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { PettyCashFormValues, pettyCashSchema } from '@/types/keuangan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function PettyCashPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<PettyCashFormValues>({
    resolver: zodResolver(pettyCashSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      jenis_biaya: 'Biaya Operasional',
      customer_id: '',
      deskripsi: '',
      jumlah_qty: 1,
      harga_satuan: 0,
      tipe_mutasi: 'Kredit',
    },
  });

  const watchValues = useWatch({ control: form.control });
  const calculatedTotal =
    (watchValues.jumlah_qty || 0) * (watchValues.harga_satuan || 0);

  const onSubmit = async (values: PettyCashFormValues) => {
    await new Promise((res) => setTimeout(res, 600));
    toast.success(
      `Transaksi Petty Cash (${values.tipe_mutasi}) berhasil disimpan.`,
    );
    setIsDialogOpen(false);
  };

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-heading font-bold flex items-center gap-2'>
            <Coins className='w-6 h-6 text-primary' /> Petty Cash (Kas Kecil)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan dana tunai harian (Debit/Kredit).
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className='bg-primary text-white'
        >
          <Plus className='w-4 h-4 mr-2' /> Catat Kas Kecil
        </Button>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
        <div className='bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm'>
          <div>
            <p className='text-sm text-muted-foreground'>Saldo Petty Cash</p>
            <p className='text-2xl font-mono font-bold text-foreground'>
              Rp 5.250.000
            </p>
          </div>
          <div className='p-3 bg-primary/10 rounded-full'>
            <Coins className='w-6 h-6 text-primary' />
          </div>
        </div>
        <div className='bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm'>
          <div>
            <p className='text-sm text-muted-foreground'>
              Total Pengisian (Debit)
            </p>
            <p className='text-xl font-mono font-bold text-emerald-500'>
              + Rp 10.000.000
            </p>
          </div>
        </div>
        <div className='bg-card border border-border p-4 rounded-xl flex items-center justify-between shadow-sm'>
          <div>
            <p className='text-sm text-muted-foreground'>
              Total Terpakai (Kredit)
            </p>
            <p className='text-xl font-mono font-bold text-rose-500'>
              - Rp 4.750.000
            </p>
          </div>
        </div>
      </div>

      <div className='bg-card border border-border rounded-xl shadow-sm p-12 text-center text-muted-foreground'>
        <Coins className='w-12 h-12 mx-auto mb-4 opacity-20' />
        <p>Belum ada transaksi petty cash minggu ini.</p>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-2xl bg-card'>
          <DialogHeader>
            <DialogTitle>Catat Mutasi Petty Cash</DialogTitle>
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
                Tipe Mutasi
              </label>
              <select
                {...form.register('tipe_mutasi')}
                className={`flex h-9 w-full rounded-md border-2 font-semibold px-3 py-1 text-sm bg-background ${watchValues.tipe_mutasi === 'Debit' ? 'border-emerald-500 text-emerald-500' : 'border-rose-500 text-rose-500'}`}
              >
                <option value='Debit'>Debit (Dana Masuk/Isi Kas)</option>
                <option value='Kredit'>Kredit (Dana Keluar/Terpakai)</option>
              </select>
            </div>

            <div className='space-y-1 col-span-2'>
              <label className='text-xs font-bold text-primary'>
                Kategori Peruntukan
              </label>
              <select
                {...form.register('jenis_biaya')}
                className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm'
              >
                <option value='Biaya Operasional'>
                  Operasional Internal (ATK, Bensin, dll)
                </option>
                <option value='Biaya Customer'>
                  Biaya Customer (Reimburse Proyek)
                </option>
              </select>
            </div>

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
              <label className='text-xs'>Deskripsi Mutasi</label>
              <Input
                {...form.register('deskripsi')}
                placeholder='Beli materai dan spidol...'
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

            <div
              className={`col-span-2 flex items-center justify-between p-3 rounded-md border ${watchValues.tipe_mutasi === 'Debit' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}
            >
              <span className='text-sm font-medium flex items-center gap-2'>
                <Calculator className='w-4 h-4' /> Total Nominal
              </span>
              <span
                className={`text-xl font-mono font-bold ${watchValues.tipe_mutasi === 'Debit' ? 'text-emerald-500' : 'text-rose-500'}`}
              >
                {watchValues.tipe_mutasi === 'Debit' ? '+' : '-'} Rp{' '}
                {calculatedTotal.toLocaleString('id-ID')}
              </span>
            </div>

            <DialogFooter className='col-span-2 pt-4'>
              <Button type='submit' className='w-full bg-primary text-white'>
                Simpan Mutasi
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
