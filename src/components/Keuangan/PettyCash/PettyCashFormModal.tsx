// src/components/Keuangan/PettyCash/PettyCashFormModal.tsx
import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
import { Textarea } from '@/components/form/Textarea';
import { Modal } from '@/components/_shared/Modal';
import {
  localPettyCashSchema,
  LocalPettyCashFormValues,
  transactionTypeOptions,
  PettyCashRow,
} from './schema';

interface PettyCashFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: PettyCashRow | null;
  onSubmit: (values: LocalPettyCashFormValues) => void;
  customers: { label: string; value: string }[];
}

export function PettyCashFormModal({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  customers,
}: PettyCashFormModalProps) {
  const form = useForm<LocalPettyCashFormValues>({
    resolver: zodResolver(localPettyCashSchema),
    defaultValues: {
      customer_id: '',
      transaction_type: 'Pengeluaran',
      expense_type: 'Operasional',
      date: new Date().toISOString().split('T')[0],
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          date: initialData.date
            ? new Date(initialData.date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          customer_id: initialData.customer_id,
          transaction_type: initialData.transaction_type || 'Pengeluaran',
          expense_type: initialData.expense_type || 'Operasional',
          description: initialData.description || '',
          quantity: initialData.quantity || 1,
          unit_price: initialData.unit_price || 0,
          total: initialData.total || 0,
        });
      } else {
        form.reset({
          date: new Date().toISOString().split('T')[0],
          customer_id: '',
          transaction_type: 'Pengeluaran',
          expense_type: 'Operasional',
          description: '',
          quantity: 1,
          unit_price: 0,
          total: 0,
        });
      }
    }
  }, [isOpen, initialData, form]);

  const watchQuantity =
    useWatch({ control: form.control, name: 'quantity' }) || 0;
  const watchUnitPrice =
    useWatch({ control: form.control, name: 'unit_price' }) || 0;

  React.useEffect(() => {
    form.setValue('total', Number(watchQuantity) * Number(watchUnitPrice));
  }, [watchQuantity, watchUnitPrice, form]);

  const isIncome = form.watch('transaction_type') === 'Pemasukan';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Kas Kecil' : 'Catat Kas Kecil Baru'}
      size='lg'
      footer={
        <div className='flex justify-end gap-3 w-full'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Batal
          </Button>
          <Button
            type='submit'
            form='pettycash-form'
            className='bg-primary hover:bg-primary/90 text-white'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
          </Button>
        </div>
      }
    >
      <form
        id='pettycash-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-6 py-2'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          <Select
            label='Tipe Transaksi'
            required
            options={transactionTypeOptions}
            value={form.watch('transaction_type')}
            onChange={(val) => form.setValue('transaction_type', val)}
            error={form.formState.errors.transaction_type?.message}
          />
          <DatePicker
            label='Tanggal Transaksi'
            required
            value={form.watch('date')}
            onChange={(val) => form.setValue('date', val)}
            error={form.formState.errors.date?.message}
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          <Select
            label='Customer Terkait'
            required
            options={customers}
            value={form.watch('customer_id')}
            onChange={(val) => form.setValue('customer_id', val)}
            error={form.formState.errors.customer_id?.message}
          />
          <Input
            label='Kategori Beban/Dana'
            placeholder='Contoh: Konsumsi / Bensin'
            {...form.register('expense_type')}
          />
        </div>

        <Textarea
          label='Deskripsi Detail'
          placeholder='Catatan atau rincian transaksi kas kecil...'
          rows={2}
          {...form.register('description')}
        />

        <div className='bg-muted/30 p-4 rounded-xl border border-border/60 space-y-4'>
          <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider mb-1'>
            Rincian Nominal
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
            <NumberInput
              label='Kuantitas'
              value={form.watch('quantity')}
              onChange={(val) => form.setValue('quantity', val)}
            />
            <NumberInput
              label='Harga Satuan (Rp)'
              value={form.watch('unit_price')}
              onChange={(val) => form.setValue('unit_price', val)}
            />

            <div className='flex flex-col gap-2'>
              <span className='text-sm font-medium text-muted-foreground'>
                Total (Otomatis)
              </span>
              <div
                className={`h-10 px-3 rounded-md border flex items-center justify-between font-mono font-bold ${isIncome ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}`}
              >
                <span>Rp</span>
                <span>{form.watch('total')?.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
