import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { Select } from '@/components/form/Select';
import { Modal } from '@/components/_shared/Modal';
import { pjbgSchema, PjbgFormValues } from '../schema';

export function PJBGFormModal({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  customers,
}: any) {
  const form = useForm<PjbgFormValues>({
    resolver: zodResolver(pjbgSchema as any),
    defaultValues: { customer_id: '' },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset(initialData || { customer_id: '' });
    }
  }, [isOpen, initialData, form]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Kontrak PJBG' : 'Buat Kontrak PJBG'}
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
        <Input
          label='Nomor Kontrak Resmi (PJBG)'
          required
          {...form.register('contract_number')}
        />
        <Input
          label='Durasi Kontrak'
          required
          placeholder='Cth: 2 Tahun'
          {...form.register('duration')}
        />
      </div>
    </Modal>
  );
}
