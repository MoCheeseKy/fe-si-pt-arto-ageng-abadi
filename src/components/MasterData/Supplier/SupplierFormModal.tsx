// src/components/MasterData/Supplier/SupplierFormModal.tsx
import * as React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { SupplierFormValues } from '@/types/master';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { Modal } from '@/components/_shared/Modal';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: UseFormReturn<SupplierFormValues>;
  onSubmit: (values: SupplierFormValues) => void;
  isEditing: boolean;
}

/**
 * Merender Modal Form untuk memfasilitasi Create dan Update entitas Supplier.
 * Melakukan binding otomatis ke React Hook Form yang diinisiasi di parent.
 * * @param {SupplierFormModalProps} props - Properti kontrol form dan modal
 */
export function SupplierFormModal({
  isOpen,
  onClose,
  form,
  onSubmit,
  isEditing,
}: SupplierFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Data Supplier' : 'Tambah Supplier Baru'}
      size='md'
      footer={
        <div className='flex justify-end gap-3 w-full'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Batal
          </Button>
          <Button
            type='submit'
            form='supplier-form'
            className='bg-primary hover:bg-primary/90 text-white'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
          </Button>
        </div>
      }
    >
      <form
        id='supplier-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-4 py-2'
      >
        <Input
          label='Nama Supplier'
          required
          placeholder='PT. Pemasok Gas'
          error={form.formState.errors.company_name?.message}
          {...form.register('company_name')}
        />
        <Input
          label='Alamat Lengkap'
          placeholder='Jl. Raya Industri No. 45'
          error={form.formState.errors.address?.message}
          {...form.register('address')}
        />
        <Input
          label='Nomor Telepon Kantor'
          placeholder='021-xxxxxxx'
          error={form.formState.errors.phone_number?.message}
          {...form.register('phone_number')}
        />
        <div className='grid grid-cols-2 gap-4 pt-2 border-t border-border/50'>
          <Input
            label='Nama PIC'
            placeholder='Nama Narahubung'
            error={form.formState.errors.pic_name?.message}
            {...form.register('pic_name')}
          />
          <Input
            label='No. Telepon PIC'
            placeholder='08xxxxxxxxxx'
            error={form.formState.errors.pic_phone_number?.message}
            {...form.register('pic_phone_number')}
          />
        </div>
      </form>
    </Modal>
  );
}
