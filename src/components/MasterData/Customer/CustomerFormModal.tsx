// src/components/MasterData/Customer/CustomerFormModal.tsx
import * as React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { CustomerFormValues } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { Modal } from '@/components/_shared/Modal';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: UseFormReturn<CustomerFormValues>;
  onSubmit: (values: CustomerFormValues) => void;
  isEditing: boolean;
}

/**
 * Menghandle perenderan UI Form Modal Customer dan melakukan validasi input
 * menggunakan React Hook Form yang di-passing dari parent component.
 * Meneruskan payload ke fungsi onSubmit saat form valid.
 * * @param {CustomerFormModalProps} props - Konfigurasi form, kontrol modal, dan submission handler
 */
export function CustomerFormModal({
  isOpen,
  onClose,
  form,
  onSubmit,
  isEditing,
}: CustomerFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Data Customer' : 'Tambah Customer Baru'}
      size='md'
      footer={
        <div className='flex justify-end gap-3 w-full'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Batal
          </Button>
          <Button
            type='submit'
            form='customer-form'
            className='bg-primary hover:bg-primary/90 text-white'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
          </Button>
        </div>
      }
    >
      <form
        id='customer-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-4 py-2'
      >
        <Input
          label='Nama Perusahaan'
          required
          placeholder='PT. Nama Perusahaan'
          error={form.formState.errors.company_name?.message}
          {...form.register('company_name')}
        />
        <Input
          label='NPWP'
          required
          placeholder='00.000.000.0-000.000'
          error={form.formState.errors.npwp?.message}
          {...form.register('npwp')}
        />
        <Input
          label='Alamat Lengkap'
          required
          placeholder='Jl. Raya Contoh No. 123'
          error={form.formState.errors.address?.message}
          {...form.register('address')}
        />
        <Input
          label='Nomor Telepon Kantor'
          required
          placeholder='021-xxxxxxx'
          error={form.formState.errors.phone_number?.message}
          {...form.register('phone_number')}
        />
        <div className='grid grid-cols-2 gap-4 pt-2 border-t border-border/50'>
          <Input
            label='Nama PIC'
            required
            placeholder='Nama Penanggung Jawab'
            error={form.formState.errors.pic_name?.message}
            {...form.register('pic_name')}
          />
          <Input
            label='No. Telepon PIC'
            required
            placeholder='08xxxxxxxxxx'
            error={form.formState.errors.pic_phone_number?.message}
            {...form.register('pic_phone_number')}
          />
        </div>
      </form>
    </Modal>
  );
}
