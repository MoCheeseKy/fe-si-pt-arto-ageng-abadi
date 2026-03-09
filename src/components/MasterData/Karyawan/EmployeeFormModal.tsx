// src/components/MasterData/Karyawan/EmployeeFormModal.tsx
import * as React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { LocalEmployeeFormValues } from './schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { Modal } from '@/components/_shared/Modal';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: UseFormReturn<LocalEmployeeFormValues>;
  onSubmit: (values: LocalEmployeeFormValues) => void;
  isEditing: boolean;
}

/**
 * Merender Modal Form untuk memfasilitasi Create dan Update entitas Karyawan.
 * * @param {EmployeeFormModalProps} props - Properti kontrol form dan modal
 */
export function EmployeeFormModal({
  isOpen,
  onClose,
  form,
  onSubmit,
  isEditing,
}: EmployeeFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
      size='sm'
      footer={
        <div className='flex justify-end gap-3 w-full'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Batal
          </Button>
          <Button
            type='submit'
            form='employee-form'
            className='bg-primary hover:bg-primary/90 text-white'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
          </Button>
        </div>
      }
    >
      <form
        id='employee-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-4 py-2'
      >
        <Input
          label='Nama Lengkap'
          required
          placeholder='Nama Karyawan'
          error={form.formState.errors.name?.message}
          {...form.register('name')}
        />
        <Input
          label='Nomor Induk Karyawan (NIK)'
          required
          placeholder='Contoh: 12345678'
          error={form.formState.errors.nik?.message}
          {...form.register('nik')}
        />
      </form>
    </Modal>
  );
}
