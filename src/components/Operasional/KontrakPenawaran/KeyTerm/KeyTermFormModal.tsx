import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
import { Modal } from '@/components/_shared/Modal';
import { keyTermSchema, KeyTermFormValues } from '../schema';

export function KeyTermFormModal({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  customers,
}: any) {
  const form = useForm<KeyTermFormValues>({
    resolver: zodResolver(keyTermSchema as any),
    defaultValues: {
      customer_id: '',
      offer_date: new Date().toISOString().split('T')[0],
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset(
        initialData || {
          customer_id: '',
          offer_date: new Date().toISOString().split('T')[0],
        },
      );
    }
  }, [isOpen, initialData, form]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Key Term' : 'Buat Key Term Baru'}
      size='md'
      footer={
        <div className='flex justify-end gap-3 w-full'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            className='bg-primary text-white'
            disabled={form.formState.isSubmitting}
          >
            Simpan Data
          </Button>
        </div>
      }
    >
      <div className='space-y-5 py-2'>
        <Select
          label='Pilih Customer'
          required
          options={customers}
          value={form.watch('customer_id')}
          onChange={(val) => form.setValue('customer_id', val)}
          error={form.formState.errors.customer_id?.message}
        />
        <div className='grid grid-cols-2 gap-4'>
          <Input
            label='Nomor Penawaran Referensi'
            required
            {...form.register('offer_number')}
          />
          <DatePicker
            label='Tanggal Referensi'
            value={form.watch('offer_date')}
            onChange={(val) => form.setValue('offer_date', val)}
          />
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <NumberInput
            label='Volume Kesepakatan'
            value={form.watch('volume')}
            onChange={(val) => form.setValue('volume', val)}
          />
          <NumberInput
            label='Minimum Order Qty (MOQ)'
            value={form.watch('moq')}
            onChange={(val) => form.setValue('moq', val)}
          />
        </div>
        <div className='grid grid-cols-2 gap-4'>
          <Input
            label='Durasi Kontrak'
            required
            placeholder='Cth: 1 Tahun'
            {...form.register('duration')}
          />
          <Input
            label='Tipe Penagihan'
            placeholder='Cth: Bulanan'
            {...form.register('billing_type')}
          />
        </div>
        <Input
          label='Tipe Harga'
          placeholder='Cth: Fixed'
          {...form.register('price_type')}
        />
      </div>
    </Modal>
  );
}
