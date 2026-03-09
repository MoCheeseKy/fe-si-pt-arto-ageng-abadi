// src/components/Keuangan/Payroll/PayrollFormModal.tsx
import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { Modal } from '@/components/_shared/Modal';
import {
  localPayrollSchema,
  LocalPayrollFormValues,
  PayrollRow,
} from './schema';

interface PayrollFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: PayrollRow | null;
  onSubmit: (values: LocalPayrollFormValues) => void;
  employees: { label: string; value: string }[];
}

export function PayrollFormModal({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  employees,
}: PayrollFormModalProps) {
  const form = useForm<LocalPayrollFormValues>({
    resolver: zodResolver(localPayrollSchema),
    defaultValues: {
      employee_id: '',
      period: '',
      basic_salary: 0,
      allowance: 0,
      overtime: 0,
      incentive_bonus: 0,
      others_income: 0,
      pph21: 0,
      bpjs: 0,
      debt_deduction: 0,
      others_deduction: 0,
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          employee_id: initialData.employee_id,
          period: initialData.period || '',
          basic_salary: initialData.basic_salary || 0,
          allowance: initialData.allowance || 0,
          overtime: initialData.overtime || 0,
          incentive_bonus: initialData.incentive_bonus || 0,
          others_income: initialData.others_income || 0,
          pph21: initialData.pph21 || 0,
          bpjs: initialData.bpjs || 0,
          debt_deduction: initialData.debt_deduction || 0,
          others_deduction: initialData.others_deduction || 0,
        });
      } else {
        form.reset({
          employee_id: '',
          period: '',
          basic_salary: 0,
          allowance: 0,
          overtime: 0,
          incentive_bonus: 0,
          others_income: 0,
          pph21: 0,
          bpjs: 0,
          debt_deduction: 0,
          others_deduction: 0,
        });
      }
    }
  }, [isOpen, initialData, form]);

  const watchedValues = useWatch({ control: form.control });
  const calculatedForm = React.useMemo(() => {
    const income =
      (Number(watchedValues.basic_salary) || 0) +
      (Number(watchedValues.allowance) || 0) +
      (Number(watchedValues.overtime) || 0) +
      (Number(watchedValues.incentive_bonus) || 0) +
      (Number(watchedValues.others_income) || 0);
    const deduction =
      (Number(watchedValues.pph21) || 0) +
      (Number(watchedValues.bpjs) || 0) +
      (Number(watchedValues.debt_deduction) || 0) +
      (Number(watchedValues.others_deduction) || 0);
    return { income, deduction, net: income - deduction };
  }, [watchedValues]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Slip Gaji' : 'Buat Slip Gaji Baru'}
      size='xl'
      footer={
        <div className='flex justify-end gap-3 w-full'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Batal
          </Button>
          <Button
            type='submit'
            form='payroll-form'
            className='bg-primary hover:bg-primary/90 text-white'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Slip Gaji'}
          </Button>
        </div>
      }
    >
      <form
        id='payroll-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-6 py-2'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          <Select
            label='Pilih Karyawan'
            required
            options={employees}
            value={form.watch('employee_id')}
            onChange={(val) => form.setValue('employee_id', val)}
            error={form.formState.errors.employee_id?.message}
          />
          <Input
            label='Periode (Bulan & Tahun)'
            required
            placeholder='Contoh: Januari 2025'
            error={form.formState.errors.period?.message}
            {...form.register('period')}
          />
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='bg-muted/20 p-4 rounded-xl border border-border/50 space-y-4'>
            <h3 className='text-xs font-bold uppercase text-emerald-600 mb-2'>
              Rincian Pendapatan (+)
            </h3>
            <NumberInput
              label='Gaji Pokok'
              value={form.watch('basic_salary')}
              onChange={(val) => form.setValue('basic_salary', val)}
            />
            <NumberInput
              label='Tunjangan'
              value={form.watch('allowance')}
              onChange={(val) => form.setValue('allowance', val)}
            />
            <NumberInput
              label='Uang Lembur (Overtime)'
              value={form.watch('overtime')}
              onChange={(val) => form.setValue('overtime', val)}
            />
            <NumberInput
              label='Bonus / Insentif'
              value={form.watch('incentive_bonus')}
              onChange={(val) => form.setValue('incentive_bonus', val)}
            />
            <NumberInput
              label='Pendapatan Lainnya'
              value={form.watch('others_income')}
              onChange={(val) => form.setValue('others_income', val)}
            />
          </div>

          <div className='bg-muted/20 p-4 rounded-xl border border-border/50 space-y-4'>
            <h3 className='text-xs font-bold uppercase text-destructive mb-2'>
              Rincian Potongan (-)
            </h3>
            <NumberInput
              label='Potongan PPh21'
              value={form.watch('pph21')}
              onChange={(val) => form.setValue('pph21', val)}
            />
            <NumberInput
              label='Potongan BPJS'
              value={form.watch('bpjs')}
              onChange={(val) => form.setValue('bpjs', val)}
            />
            <NumberInput
              label='Potongan Kasbon (Debt)'
              value={form.watch('debt_deduction')}
              onChange={(val) => form.setValue('debt_deduction', val)}
            />
            <NumberInput
              label='Potongan Lainnya'
              value={form.watch('others_deduction')}
              onChange={(val) => form.setValue('others_deduction', val)}
            />
          </div>
        </div>

        <div className='bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3'>
          <h3 className='text-xs font-bold uppercase text-primary tracking-wider border-b border-primary/20 pb-2'>
            Ringkasan Kalkulasi (Otomatis)
          </h3>
          <div className='grid grid-cols-3 gap-4 text-center pt-1'>
            <div>
              <p className='text-[11px] text-muted-foreground uppercase'>
                Total Pendapatan
              </p>
              <p className='font-mono font-semibold text-emerald-600'>
                Rp {calculatedForm.income.toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className='text-[11px] text-muted-foreground uppercase'>
                Total Potongan
              </p>
              <p className='font-mono font-semibold text-destructive'>
                Rp {calculatedForm.deduction.toLocaleString('id-ID')}
              </p>
            </div>
            <div className='bg-background rounded-md border py-1 shadow-sm'>
              <p className='text-[11px] text-muted-foreground uppercase font-bold'>
                Gaji Bersih
              </p>
              <p className='font-mono font-bold text-primary'>
                Rp {calculatedForm.net.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
