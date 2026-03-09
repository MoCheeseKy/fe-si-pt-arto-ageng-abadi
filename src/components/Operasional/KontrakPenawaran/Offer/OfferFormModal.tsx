import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
import { Modal } from '@/components/_shared/Modal';
import { offerSchema, OfferFormValues } from '../schema';

export function OfferFormModal({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  customers,
}: any) {
  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      customer_id: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      form.reset(
        initialData || {
          customer_id: '',
          date: new Date().toISOString().split('T')[0],
        },
      );
    }
  }, [isOpen, initialData, form]);

  const handleSubmit = async (values: OfferFormValues) => {
    await onSubmit(values);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Penawaran' : 'Buat Penawaran Baru'}
      size='lg'
      footer={
        <div className='flex justify-end gap-3 w-full'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Batal
          </Button>
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            className='bg-primary hover:bg-primary/90 text-white'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
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
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <Input
            label='Nomor Penawaran'
            required
            error={form.formState.errors.offer_number?.message}
            {...form.register('offer_number')}
          />
          <DatePicker
            label='Tanggal Penawaran'
            value={form.watch('date')}
            onChange={(val) => form.setValue('date', val)}
          />
          <NumberInput
            label='Volume Bulanan'
            value={form.watch('monthly_cng_usage_volume')}
            onChange={(val) => form.setValue('monthly_cng_usage_volume', val)}
          />
          <NumberInput
            label='Harga Gas (Rp/SM3)'
            value={form.watch('cng_gas_price_per_sm3')}
            onChange={(val) => form.setValue('cng_gas_price_per_sm3', val)}
          />
          <Input
            label='Pelaksanaan (Implementation)'
            {...form.register('implementation')}
          />
          <Input
            label='Spesifikasi GHV'
            {...form.register('standard_ghv_specification')}
          />
          <Input
            label='Lokasi Mother Station'
            {...form.register('cng_mother_station_location')}
          />
          <Input label='Harga Termasuk' {...form.register('price_includes')} />
          <Input
            label='Metode Pembayaran'
            {...form.register('payment_method')}
          />
          <Input
            label='Periode Kontrak'
            {...form.register('contract_period')}
          />
          <Input
            label='Waktu Persiapan'
            {...form.register('preparation_time')}
          />
          <Input label='Masa Berlaku' {...form.register('validity')} />
        </div>
      </div>
    </Modal>
  );
}
