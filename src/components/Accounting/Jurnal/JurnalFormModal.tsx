// src/components/Accounting/Jurnal/JurnalFormModal.tsx
import * as React from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, Check, Info, AlertCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
import { Textarea } from '@/components/form/Textarea';
import { Modal } from '@/components/_shared/Modal';
import {
  localJournalSchema,
  LocalJournalFormValues,
  JournalRow,
} from './schema';

interface JurnalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: JournalRow | null;
  onSubmit: (values: LocalJournalFormValues) => void;
  coaList: { label: string; value: string }[];
}

export function JurnalFormModal({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  coaList,
}: JurnalFormModalProps) {
  const form = useForm<LocalJournalFormValues>({
    resolver: zodResolver(localJournalSchema as any),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
      source_module: 'Manual',
      entries: [
        { account_code: '', debit: 0, credit: 0 },
        { account_code: '', debit: 0, credit: 0 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'entries',
  });

  // Watch entries untuk perhitungan balance real-time yang terisolasi
  const watchEntries = useWatch({ control: form.control, name: 'entries' });
  const { totalDebit, totalCredit, isBalanced } = React.useMemo(() => {
    const td = (watchEntries || []).reduce(
      (sum, item) => sum + (Number(item.debit) || 0),
      0,
    );
    const tc = (watchEntries || []).reduce(
      (sum, item) => sum + (Number(item.credit) || 0),
      0,
    );
    return { totalDebit: td, totalCredit: tc, isBalanced: td === tc && td > 0 };
  }, [watchEntries]);

  // Efek untuk binding initialData saat Modal dibuka
  React.useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset({
          transaction_date: initialData.transaction_date
            ? new Date(initialData.transaction_date).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0],
          description: initialData.description || '',
          source_module: initialData.source_module || 'Manual',
          entries:
            initialData.entries?.length > 0
              ? initialData.entries.map((e: any) => ({
                  account_code: e.account_code,
                  debit: e.debit || 0,
                  credit: e.credit || 0,
                }))
              : [
                  { account_code: '', debit: 0, credit: 0 },
                  { account_code: '', debit: 0, credit: 0 },
                ],
        });
      } else {
        form.reset({
          transaction_date: new Date().toISOString().split('T')[0],
          description: '',
          source_module: 'Manual',
          entries: [
            { account_code: '', debit: 0, credit: 0 },
            { account_code: '', debit: 0, credit: 0 },
          ],
        });
      }
    }
  }, [isOpen, initialData, form]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Jurnal Umum' : 'Posting Jurnal Umum'}
      size='xl'
      footer={
        <div className='flex justify-end gap-3 w-full'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Batal
          </Button>
          <Button
            type='submit'
            form='journal-form'
            className='bg-primary hover:bg-primary/90 text-white'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Jurnal'}
          </Button>
        </div>
      }
    >
      <form
        id='journal-form'
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-6 py-2'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          <DatePicker
            label='Tanggal Jurnal'
            required
            value={form.watch('transaction_date')}
            onChange={(val) => form.setValue('transaction_date', val)}
            error={form.formState.errors.transaction_date?.message}
          />
          <Input
            label='Sumber Modul'
            placeholder='Contoh: manual, koreksi...'
            {...form.register('source_module')}
          />
        </div>
        <Textarea
          label='Keterangan Transaksi'
          required
          placeholder='Catatan atau bukti pendukung transaksi ini...'
          rows={2}
          error={form.formState.errors.description?.message}
          {...form.register('description')}
        />

        <div className='space-y-3'>
          <div className='flex items-center justify-between pb-2 border-b border-border'>
            <h3 className='text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2'>
              Rincian Ayat Jurnal
            </h3>
          </div>

          {form.formState.errors.entries?.root && (
            <div className='p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2'>
              <AlertCircle className='h-4 w-4 text-destructive shrink-0 mt-0.5' />
              <p className='text-xs font-semibold text-destructive'>
                {form.formState.errors.entries.root.message}
              </p>
            </div>
          )}

          <div className='space-y-3'>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className='flex flex-col sm:flex-row items-start sm:items-end gap-3 bg-muted/20 p-3 rounded-lg border border-border/50'
              >
                <div className='flex-1 w-full'>
                  <Select
                    label={index === 0 ? 'Pilih Akun' : ''}
                    options={coaList}
                    value={form.watch(`entries.${index}.account_code`)}
                    onChange={(val) =>
                      form.setValue(`entries.${index}.account_code`, val)
                    }
                    error={
                      form.formState.errors.entries?.[index]?.account_code
                        ?.message
                    }
                  />
                </div>
                <div className='w-full sm:w-40'>
                  <NumberInput
                    label={index === 0 ? 'Debit (Rp)' : ''}
                    value={form.watch(`entries.${index}.debit`)}
                    onChange={(val) => {
                      form.setValue(`entries.${index}.debit`, val);
                      if (val > 0) form.setValue(`entries.${index}.credit`, 0);
                    }}
                  />
                </div>
                <div className='w-full sm:w-40'>
                  <NumberInput
                    label={index === 0 ? 'Kredit (Rp)' : ''}
                    value={form.watch(`entries.${index}.credit`)}
                    onChange={(val) => {
                      form.setValue(`entries.${index}.credit`, val);
                      if (val > 0) form.setValue(`entries.${index}.debit`, 0);
                    }}
                  />
                </div>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={() => remove(index)}
                  className='h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                  disabled={fields.length <= 2}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => append({ account_code: '', debit: 0, credit: 0 })}
            className='mt-2 w-full border-dashed border-2 bg-transparent text-primary hover:bg-primary/5 hover:text-primary'
          >
            <Plus className='h-4 w-4 mr-2' /> Tambah Baris Akun
          </Button>
        </div>

        {/* FOOTER CALCULATION */}
        <div
          className={`p-4 rounded-xl border flex items-center justify-between transition-colors duration-300 ${isBalanced ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}
        >
          <div className='flex items-center gap-2'>
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center ${isBalanced ? 'bg-emerald-500/20 text-emerald-600' : 'bg-amber-500/20 text-amber-600'}`}
            >
              {isBalanced ? (
                <Check className='h-4 w-4' />
              ) : (
                <Info className='h-4 w-4' />
              )}
            </div>
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-wider ${isBalanced ? 'text-emerald-600' : 'text-amber-600'}`}
              >
                {isBalanced ? 'Jurnal Balance' : 'Jurnal Belum Balance'}
              </p>
              {!isBalanced && (
                <p className='text-[10px] text-amber-600/80'>
                  Total Debit & Kredit harus sama.
                </p>
              )}
            </div>
          </div>
          <div className='flex gap-6 text-right'>
            <div>
              <p className='text-[10px] uppercase text-muted-foreground font-semibold'>
                Total Debit
              </p>
              <p className='font-mono font-bold text-base text-foreground'>
                {totalDebit.toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className='text-[10px] uppercase text-muted-foreground font-semibold'>
                Total Kredit
              </p>
              <p className='font-mono font-bold text-base text-foreground'>
                {totalCredit.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
