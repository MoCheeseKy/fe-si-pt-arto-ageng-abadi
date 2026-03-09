// src/components/Keuangan/Kasbon/KasbonFormModal.tsx
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
import { Textarea } from '@/components/form/Textarea';
import { Modal } from '@/components/_shared/Modal';
import {
  localCashAdvanceSchema,
  LocalCashAdvanceFormValues,
  statusOptions,
  CashAdvanceRow,
} from './schema';

interface CashAdvanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: CashAdvanceRow | null;
  onSubmit: (values: LocalCashAdvanceFormValues) => void;
  employees: { label: string; value: string }[];
}

export function CashAdvanceFormModal({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  employees,
}: CashAdvanceFormModalProps) {
  const form = useForm<LocalCashAdvanceFormValues>({
    resolver: zodResolver(localCashAdvanceSchema),
    defaultValues: {
      employee_id: '',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      description: '',
      status: 'Belum Lunas',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          date: initialData.date
            ? new Date(initialData.date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          employee_id: initialData.employee_id,
          amount: initialData.amount || 0,
          description: initialData.description || '',
          status: initialData.status || 'Belum Lunas',
        });
      } else {
        form.reset({
          date: new Date().toISOString().split('T')[0],
          employee_id: '',
          amount: 0,
          description: '',
          status: 'Belum Lunas',
        });
      }
    }
  }, [isOpen, initialData, form]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Kasbon' : 'Catat Kasbon Baru'}
      size='md'
      footer={
        <div className='flex justify-end gap-3 w-full'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Batal
          </Button>
          <Button
            type='submit'
            form='kasbon-form'
            className='bg-primary hover:bg-primary/90 text-white'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
          </Button>
        </div>
      }
    >
      <form
        id='kasbon-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-5 py-2'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <DatePicker
            label='Tanggal'
            required
            value={form.watch('date')}
            onChange={(val) => form.setValue('date', val)}
            error={form.formState.errors.date?.message}
          />
          <Select
            label='Status'
            required
            options={statusOptions}
            value={form.watch('status')}
            onChange={(val) => form.setValue('status', val)}
            error={form.formState.errors.status?.message}
          />
        </div>

        <Select
          label='Pilih Karyawan'
          required
          options={employees}
          value={form.watch('employee_id')}
          onChange={(val) => form.setValue('employee_id', val)}
          error={form.formState.errors.employee_id?.message}
        />

        <NumberInput
          label='Nominal Pinjaman (Rp)'
          required
          value={form.watch('amount')}
          onChange={(val) => form.setValue('amount', val)}
          error={form.formState.errors.amount?.message}
        />

        <Textarea
          label='Keterangan / Keperluan'
          placeholder='Catatan keperluan kasbon...'
          rows={2}
          {...form.register('description')}
        />
      </form>
    </Modal>
  );
}
