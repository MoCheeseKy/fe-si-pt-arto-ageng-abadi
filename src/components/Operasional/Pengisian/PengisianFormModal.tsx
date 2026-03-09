// src/components/Operasional/Pengisian/PengisianFormModal.tsx
import * as React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
import { Modal } from '@/components/_shared/Modal';
import { LocalPurchaseFormValues } from './schema';

interface PengisianFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: UseFormReturn<LocalPurchaseFormValues>;
  onSubmit: (values: LocalPurchaseFormValues) => void;
  isEditing: boolean;
  suppliers: { label: string; value: string }[];
  drivers: { label: string; value: string }[];
}

export function PengisianFormModal({
  isOpen,
  onClose,
  form,
  onSubmit,
  isEditing,
  suppliers,
  drivers,
}: PengisianFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Transaksi Pengisian' : 'Catat Pengisian Baru'}
      size='xl'
      footer={
        <div className='flex justify-end gap-3 w-full'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Batal
          </Button>
          <Button
            type='submit'
            form='purchase-form'
            className='bg-primary hover:bg-primary/90 text-white'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
          </Button>
        </div>
      }
    >
      <form
        id='purchase-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-6 py-2'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          <DatePicker
            label='Tanggal Pengisian'
            required
            value={form.watch('date')}
            onChange={(val) => form.setValue('date', val)}
            error={form.formState.errors.date?.message}
          />
          <Input
            label='Nomor DO (Delivery Order)'
            required
            placeholder='Contoh: DO-2025-001'
            error={form.formState.errors.do_number?.message}
            {...form.register('do_number')}
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          <Select
            label='Pilih Supplier (Mother Station)'
            required
            options={suppliers}
            value={form.watch('supplier_id')}
            onChange={(val) => form.setValue('supplier_id', val)}
            error={form.formState.errors.supplier_id?.message}
          />
          <Select
            label='Pilih Driver'
            required
            options={drivers}
            value={form.watch('driver_id')}
            onChange={(val) => form.setValue('driver_id', val)}
            error={form.formState.errors.driver_id?.message}
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          <Input
            label='Plat Nomor GTM'
            required
            placeholder='Contoh: B 1234 CD'
            error={form.formState.errors.license_plate?.message}
            {...form.register('license_plate')}
          />
          <Input
            label='Tipe GTM'
            required
            placeholder='Contoh: Type A'
            error={form.formState.errors.gtm_type?.message}
            {...form.register('gtm_type')}
          />
        </div>

        <div className='bg-muted/30 p-4 rounded-xl border border-border/60 space-y-4'>
          <h3 className='text-sm font-bold uppercase text-primary tracking-wider mb-2'>
            Data Pengukuran (Teknis)
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
            <NumberInput
              label='GHC'
              required
              value={form.watch('ghc')}
              onChange={(val) => form.setValue('ghc', val)}
              error={form.formState.errors.ghc?.message}
            />
            <NumberInput
              label='Pressure Start'
              required
              value={form.watch('pressure_start')}
              onChange={(val) => form.setValue('pressure_start', val)}
              error={form.formState.errors.pressure_start?.message}
            />
            <NumberInput
              label='Pressure Finish'
              required
              value={form.watch('pressure_finish')}
              onChange={(val) => form.setValue('pressure_finish', val)}
              error={form.formState.errors.pressure_finish?.message}
            />
            <NumberInput
              label='Meter Start'
              required
              value={form.watch('meter_start')}
              onChange={(val) => form.setValue('meter_start', val)}
              error={form.formState.errors.meter_start?.message}
            />
            <NumberInput
              label='Meter Finish'
              required
              value={form.watch('meter_finish')}
              onChange={(val) => form.setValue('meter_finish', val)}
              error={form.formState.errors.meter_finish?.message}
            />
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-2'>
            <NumberInput
              label='Volume (MMSCF)'
              required
              value={form.watch('volume_mmscf')}
              onChange={(val) => form.setValue('volume_mmscf', val)}
              error={form.formState.errors.volume_mmscf?.message}
            />
            <NumberInput
              label='Volume (MMBTU)'
              required
              value={form.watch('volume_mmbtu')}
              onChange={(val) => form.setValue('volume_mmbtu', val)}
              error={form.formState.errors.volume_mmbtu?.message}
            />
          </div>
        </div>

        <div className='bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-4'>
          <h3 className='text-sm font-bold uppercase text-primary tracking-wider mb-2'>
            Data Finansial
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <Select
              label='Mata Uang'
              options={[
                { label: 'IDR', value: 'IDR' },
                { label: 'USD', value: 'USD' },
              ]}
              value={form.watch('currency')}
              onChange={(val) => form.setValue('currency', val)}
            />
            <NumberInput
              label='Kurs (Exchange Rate)'
              required
              value={form.watch('exchange_rate')}
              onChange={(val) => form.setValue('exchange_rate', val)}
            />
            <NumberInput
              label='Harga per SM3'
              required
              value={form.watch('price_per_sm3')}
              onChange={(val) => form.setValue('price_per_sm3', val)}
              error={form.formState.errors.price_per_sm3?.message}
            />
            <NumberInput
              label='Total Penjualan'
              required
              value={form.watch('total_sales')}
              onChange={(val) => form.setValue('total_sales', val)}
              error={form.formState.errors.total_sales?.message}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
