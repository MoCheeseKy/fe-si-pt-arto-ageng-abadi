// src/components/Keuangan/Deposit/DepositFormModal.tsx
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
  localDepositSchema,
  LocalDepositFormValues,
  DepositRow,
} from './schema';

interface DepositFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: DepositRow | null;
  onSubmit: (values: LocalDepositFormValues) => void;
  customers: { label: string; value: string }[];
}

export function DepositFormModal({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  customers,
}: DepositFormModalProps) {
  const form = useForm<LocalDepositFormValues>({
    resolver: zodResolver(localDepositSchema as any),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      customer_id: '',
      amount: 0,
      chart_of_account: '',
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
          amount: initialData.amount || 0,
          chart_of_account: initialData.chart_of_account || '',
        });
      } else {
        form.reset({
          date: new Date().toISOString().split('T')[0],
          customer_id: '',
          amount: 0,
          chart_of_account: '',
        });
      }
    }
  }, [isOpen, initialData, form]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Deposit' : 'Catat Deposit Baru'}
      size='md'
      footer={
        <div className='flex justify-end gap-3 w-full'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Batal
          </Button>
          <Button
            type='submit'
            form='deposit-form'
            className='bg-primary hover:bg-primary/90 text-white'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
          </Button>
        </div>
      }
    >
      <form
        id='deposit-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-5 py-2'
      >
        <DatePicker
          label='Tanggal Deposit'
          required
          value={form.watch('date')}
          onChange={(val) => form.setValue('date', val)}
          error={form.formState.errors.date?.message}
        />
        <Select
          label='Pilih Customer (Pelanggan)'
          required
          options={customers}
          value={form.watch('customer_id')}
          onChange={(val) => form.setValue('customer_id', val)}
          error={form.formState.errors.customer_id?.message}
        />
        <div className='pt-2 border-t border-border/50 grid grid-cols-1 gap-4'>
          <NumberInput
            label='Nominal Uang (Amount)'
            required
            value={form.watch('amount')}
            onChange={(val) => form.setValue('amount', val)}
            error={form.formState.errors.amount?.message}
          />
          <Input
            label='Chart of Account (Kode Akun)'
            placeholder='Contoh: 110-200'
            error={form.formState.errors.chart_of_account?.message}
            {...form.register('chart_of_account')}
          />
        </div>
      </form>
    </Modal>
  );
}
