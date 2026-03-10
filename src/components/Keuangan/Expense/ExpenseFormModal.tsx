// src/components/Keuangan/Pengeluaran/ExpenseFormModal.tsx
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
import { Modal } from '@/components/_shared/Modal';
import {
  localExpenseSchema,
  LocalExpenseFormValues,
  expenseTypeOptions,
  ExpenseRow,
} from './schema';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: ExpenseRow | null;
  onSubmit: (values: LocalExpenseFormValues) => void;
  customers: { label: string; value: string }[];
}

export function ExpenseFormModal({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  customers,
}: ExpenseFormModalProps) {
  const form = useForm<LocalExpenseFormValues>({
    resolver: zodResolver(localExpenseSchema as any),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      customer_id: '',
      expense_type: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
      account: '',
      payment_method: 'Transfer',
      bank_account: '',
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
          expense_type: initialData.expense_type || '',
          description: initialData.description || '',
          quantity: initialData.quantity || 1,
          unit_price: initialData.unit_price || 0,
          total: initialData.total || 0,
          account: initialData.account || '',
          payment_method: initialData.payment_method || 'Transfer',
          bank_account: initialData.bank_account || '',
        });
      } else {
        form.reset({
          date: new Date().toISOString().split('T')[0],
          customer_id: '',
          expense_type: '',
          description: '',
          quantity: 1,
          unit_price: 0,
          total: 0,
          account: '',
          payment_method: 'Transfer',
          bank_account: '',
        });
      }
    }
  }, [isOpen, initialData, form]);

  // Kalkulasi Otomatis Total Harga (Qty * Unit Price)
  const qty = form.watch('quantity');
  const price = form.watch('unit_price');
  React.useEffect(() => {
    const calcTotal = Number(qty || 0) * Number(price || 0);
    form.setValue('total', calcTotal);
  }, [qty, price, form]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}
      size='lg'
      footer={
        <div className='flex justify-end gap-3 w-full'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Batal
          </Button>
          <Button
            type='submit'
            form='expense-form'
            className='bg-primary hover:bg-primary/90 text-white'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
          </Button>
        </div>
      }
    >
      <form
        id='expense-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-6 py-2'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          <Select
            label='Customer Terkait'
            required
            options={customers}
            value={form.watch('customer_id')}
            onChange={(val) => form.setValue('customer_id', val)}
            error={form.formState.errors.customer_id?.message}
          />
          <DatePicker
            label='Tanggal Pencatatan'
            required
            value={form.watch('date')}
            onChange={(val) => form.setValue('date', val)}
            error={form.formState.errors.date?.message}
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          <Select
            label='Tipe Pengeluaran'
            options={expenseTypeOptions}
            value={form.watch('expense_type') || ''}
            onChange={(val) => form.setValue('expense_type', val)}
          />
          <Input
            label='Deskripsi Pengeluaran'
            placeholder='Contoh: Biaya administrasi'
            {...form.register('description')}
          />
        </div>

        <div className='bg-muted/30 p-4 rounded-xl border border-border/60 space-y-4'>
          <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider mb-1'>
            Rincian Nominal & Akun
          </h3>
          <div className='grid grid-cols-2 gap-4'>
            <NumberInput
              label='Quantity'
              value={form.watch('quantity')}
              onChange={(val) => form.setValue('quantity', val)}
            />
            <NumberInput
              label='Harga Satuan (Unit Price)'
              value={form.watch('unit_price')}
              onChange={(val) => form.setValue('unit_price', val)}
            />
          </div>

          <div className='pt-3 border-t border-border flex justify-between items-center'>
            <span className='text-sm font-semibold text-muted-foreground'>
              Total Pengeluaran
            </span>
            <span className='text-lg font-mono font-bold text-destructive bg-destructive/10 px-3 py-1 rounded-lg border border-destructive/20'>
              Rp {form.watch('total')?.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Select
            label='Metode Pembayaran'
            options={[
              { label: 'Cash', value: 'Cash' },
              { label: 'Transfer', value: 'Transfer' },
            ]}
            value={form.watch('payment_method') || ''}
            onChange={(val) => form.setValue('payment_method', val)}
          />
          <Input
            label='Bank Account'
            placeholder='Contoh: BCA 123...'
            {...form.register('bank_account')}
          />
          <Input
            label='Chart of Account (CoA)'
            placeholder='Contoh: 510-100'
            {...form.register('account')}
          />
        </div>
      </form>
    </Modal>
  );
}
