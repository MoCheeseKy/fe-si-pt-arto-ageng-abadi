// src/components/MasterData/Driver/DriverFormModal.tsx
import * as React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { DriverFormValues } from '@/types/master';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { Modal } from '@/components/_shared/Modal';

interface DriverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: UseFormReturn<DriverFormValues>;
  onSubmit: (values: DriverFormValues) => void;
  isEditing: boolean;
}

/**
 * Menghandle perenderan UI Form Modal Driver dan melakukan validasi input
 * menggunakan React Hook Form yang di-passing dari parent component.
 * Meneruskan payload ke fungsi onSubmit saat form valid.
 * * @param {DriverFormModalProps} props - Konfigurasi form, kontrol modal, dan submission handler
 */
export function DriverFormModal({
  isOpen,
  onClose,
  form,
  onSubmit,
  isEditing,
}: DriverFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Data Driver' : 'Tambah Driver Baru'}
      size='sm'
      footer={
        <div className='flex justify-end gap-3 w-full'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Batal
          </Button>
          <Button
            type='submit'
            form='driver-form'
            className='bg-primary hover:bg-primary/90 text-white'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
          </Button>
        </div>
      }
    >
      <form
        id='driver-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-4 py-2'
      >
        <Input
          label='Nama Lengkap'
          required
          placeholder='Nama Driver'
          error={form.formState.errors.name?.message}
          {...form.register('name')}
        />
        <Input
          label='Nomor Telepon'
          placeholder='08xxxxxxxxxx'
          error={form.formState.errors.phone_number?.message}
          {...form.register('phone_number')}
        />
        <Input
          label='Nomor NIK'
          placeholder='Nomor Induk Kependudukan'
          error={form.formState.errors.nik?.message}
          {...form.register('nik')}
        />
      </form>
    </Modal>
  );
}
