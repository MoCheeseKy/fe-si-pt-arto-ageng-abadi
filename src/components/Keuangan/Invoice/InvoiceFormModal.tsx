// src/components/Keuangan/Invoice/InvoiceFormModal.tsx
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
import { Textarea } from '@/components/form/Textarea';
import { Modal } from '@/components/_shared/Modal';
import {
  localInvoiceSchema,
  LocalInvoiceFormValues,
  statusOptions,
  InvoiceRow,
} from './schema';

interface InvoiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: InvoiceRow | null;
  onSubmit: (values: LocalInvoiceFormValues) => void;
  customers: { label: string; value: string }[];
}

export function InvoiceFormModal({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  customers,
}: InvoiceFormModalProps) {
  const form = useForm<LocalInvoiceFormValues>({
    resolver: zodResolver(localInvoiceSchema as any),
    defaultValues: {
      invoice_number: '',
      date: new Date().toISOString().split('T')[0],
      customer_id: '',
      po_number: '',
      po_date: '',
      period_start: '',
      period_end: '',
      total_usage: 0,
      deposit_deduction: 0,
      total_bill: 0,
      note: '',
      status: 'Draft',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          invoice_number: initialData.invoice_number || '',
          date: initialData.date
            ? new Date(initialData.date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          customer_id: initialData.customer_id,
          po_number: initialData.po_number || '',
          po_date: initialData.po_date
            ? new Date(initialData.po_date).toISOString().split('T')[0]
            : '',
          period_start: initialData.period_start
            ? new Date(initialData.period_start).toISOString().split('T')[0]
            : '',
          period_end: initialData.period_end
            ? new Date(initialData.period_end).toISOString().split('T')[0]
            : '',
          total_usage: initialData.total_usage || 0,
          deposit_deduction: initialData.deposit_deduction || 0,
          total_bill: initialData.total_bill || 0,
          note: initialData.note || '',
          status: initialData.status || 'Draft',
        });
      } else {
        form.reset({
          invoice_number: '',
          date: new Date().toISOString().split('T')[0],
          customer_id: '',
          po_number: '',
          po_date: '',
          period_start: '',
          period_end: '',
          total_usage: 0,
          deposit_deduction: 0,
          total_bill: 0,
          note: '',
          status: 'Draft',
        });
      }
    }
  }, [isOpen, initialData, form]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Invoice' : 'Buat Invoice Baru'}
      size='lg'
      footer={
        <div className='flex justify-end gap-3 w-full'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Batal
          </Button>
          <Button
            type='submit'
            form='invoice-form'
            className='bg-primary hover:bg-primary/90 text-white'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
          </Button>
        </div>
      }
    >
      <form
        id='invoice-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-6 py-2'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input
            label='Nomor Invoice'
            required
            placeholder='INV-2025-001'
            error={form.formState.errors.invoice_number?.message}
            {...form.register('invoice_number')}
          />
          <DatePicker
            label='Tanggal Invoice'
            required
            value={form.watch('date')}
            onChange={(val) => form.setValue('date', val)}
            error={form.formState.errors.date?.message}
          />
        </div>

        <Select
          label='Pilih Customer'
          required
          options={customers}
          value={form.watch('customer_id')}
          onChange={(val) => form.setValue('customer_id', val)}
          error={form.formState.errors.customer_id?.message}
        />

        <div className='bg-muted/30 p-4 rounded-xl border border-border/60 space-y-4'>
          <h3 className='text-sm font-bold uppercase text-primary tracking-wider'>
            Data Pendukung
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Input
              label='Nomor PO'
              placeholder='Contoh: PO-001'
              {...form.register('po_number')}
            />
            <DatePicker
              label='Tanggal PO'
              value={form.watch('po_date')}
              onChange={(val) => form.setValue('po_date', val)}
            />
            <DatePicker
              label='Periode Mulai (Start)'
              value={form.watch('period_start')}
              onChange={(val) => form.setValue('period_start', val)}
            />
            <DatePicker
              label='Periode Selesai (End)'
              value={form.watch('period_end')}
              onChange={(val) => form.setValue('period_end', val)}
            />
          </div>
        </div>

        <div className='bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-4'>
          <h3 className='text-sm font-bold uppercase text-primary tracking-wider'>
            Rincian Nominal
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <NumberInput
              label='Total Usage'
              value={form.watch('total_usage')}
              onChange={(val) => form.setValue('total_usage', val)}
            />
            <NumberInput
              label='Potongan Deposit (Rp)'
              value={form.watch('deposit_deduction')}
              onChange={(val) => form.setValue('deposit_deduction', val)}
            />
            <NumberInput
              label='Total Tagihan / Bill (Rp)'
              required
              value={form.watch('total_bill')}
              onChange={(val) => form.setValue('total_bill', val)}
              error={form.formState.errors.total_bill?.message}
            />
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Select
            label='Status Tagihan'
            required
            options={statusOptions}
            value={form.watch('status') || 'Draft'}
            onChange={(val) => form.setValue('status', val)}
          />
          <Textarea
            label='Catatan (Note)'
            placeholder='Tambahkan catatan penagihan...'
            {...form.register('note')}
          />
        </div>
      </form>
    </Modal>
  );
}
