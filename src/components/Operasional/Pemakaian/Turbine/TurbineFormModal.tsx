import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
import { Modal } from '@/components/_shared/Modal';
import { turbineSchema, TurbineFormValues } from '../schema';

export function TurbineFormModal({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  customers,
}: any) {
  const form = useForm<TurbineFormValues>({
    resolver: zodResolver(turbineSchema) as any,
    defaultValues: {
      customer_id: '',
      date: new Date().toISOString().split('T')[0],
      currency: 'IDR',
      exchange_rate: 1,
    },
  });

  React.useEffect(() => {
    if (isOpen)
      form.reset(
        initialData || {
          customer_id: '',
          date: new Date().toISOString().split('T')[0],
          currency: 'IDR',
          exchange_rate: 1,
        },
      );
  }, [isOpen, initialData, form]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Turbin' : 'Catat Turbin'}
      size='xl'
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
      <div className='space-y-6 py-2'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          <DatePicker
            label='Tanggal Pengisian'
            required
            value={form.watch('date')}
            onChange={(val) => form.setValue('date', val)}
            error={form.formState.errors.date?.message}
          />
          <Select
            label='Pilih Customer'
            required
            options={customers}
            value={form.watch('customer_id')}
            onChange={(val) => form.setValue('customer_id', val)}
            error={form.formState.errors.customer_id?.message}
          />
        </div>

        <div className='bg-muted/30 p-4 rounded-xl border border-border/60 space-y-4'>
          <h3 className='text-sm font-bold uppercase text-primary tracking-wider mb-2'>
            Data Pengukuran
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <Input label='GTM Number' {...form.register('gtm_number')} />
            <NumberInput
              label='Turbine Start'
              value={form.watch('turbine_start')}
              onChange={(val) => form.setValue('turbine_start', val)}
            />
            <NumberInput
              label='Turbine Finish'
              value={form.watch('turbine_finish')}
              onChange={(val) => form.setValue('turbine_finish', val)}
            />
            <NumberInput
              label='Turbine Diff'
              value={form.watch('turbine_difference')}
              onChange={(val) => form.setValue('turbine_difference', val)}
            />
            <NumberInput
              label='Supply Pressure'
              value={form.watch('supply_pressure')}
              onChange={(val) => form.setValue('supply_pressure', val)}
            />
            <NumberInput
              label='Temp Avg PRS'
              value={form.watch('temp_avg_prs')}
              onChange={(val) => form.setValue('temp_avg_prs', val)}
            />
            <NumberInput
              label='Comp Factor'
              value={form.watch('compression_factor')}
              onChange={(val) => form.setValue('compression_factor', val)}
            />
            <NumberInput
              label='Temp Base'
              value={form.watch('temp_base')}
              onChange={(val) => form.setValue('temp_base', val)}
            />
            <NumberInput
              label='Pressure Std'
              value={form.watch('pressure_standard')}
              onChange={(val) => form.setValue('pressure_standard', val)}
            />
            <NumberInput
              label='Press Atm Std'
              value={form.watch('pressure_atm_standard')}
              onChange={(val) => form.setValue('pressure_atm_standard', val)}
            />
            <NumberInput
              label='Total SM3'
              value={form.watch('total_sm3')}
              onChange={(val) => form.setValue('total_sm3', val)}
            />
            <NumberInput
              label='GHV'
              value={form.watch('ghv')}
              onChange={(val) => form.setValue('ghv', val)}
            />
            <NumberInput
              label='Std 1 SM3'
              value={form.watch('standard_1_sm3')}
              onChange={(val) => form.setValue('standard_1_sm3', val)}
            />
            <NumberInput
              label='MMBTU'
              value={form.watch('mmbtu')}
              onChange={(val) => form.setValue('mmbtu', val)}
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
              label='Kurs'
              required
              value={form.watch('exchange_rate')}
              onChange={(val) => form.setValue('exchange_rate', val)}
            />
            <NumberInput
              label='Harga per SM3'
              required
              value={form.watch('price_per_sm3')}
              onChange={(val) => form.setValue('price_per_sm3', val)}
            />
            <NumberInput
              label='Total Sales'
              required
              value={form.watch('total_sales')}
              onChange={(val) => form.setValue('total_sales', val)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
