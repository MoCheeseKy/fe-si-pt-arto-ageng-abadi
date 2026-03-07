'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  FileText,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { api } from '@/lib/api';
import {
  Journal,
  manualJournalSchema,
  ManualJournalFormValues,
  Coa,
} from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/form/Input';
import { SearchInput } from '@/components/form/SearchInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
import { NumberInput } from '@/components/form/NumberInput';
import { DataTable } from '@/components/_shared/DataTable';
import { Modal } from '@/components/_shared/Modal';
import { TableActions } from '@/components/_shared/TableActions';

const columnHelper = createColumnHelper<Journal>();

/**
 * Halaman administrasi Jurnal Umum (General Journal).
 * Menampilkan ringkasan transaksi akuntansi double-entry dan memfasilitasi entri jurnal manual.
 *
 * @returns {JSX.Element} Komponen UI halaman Jurnal Umum
 */
export default function JurnalPage() {
  const [data, setData] = useState<Journal[]>([]);
  const [coas, setCoas] = useState<{ label: string; value: string }[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('Semua');

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [viewingJournal, setViewingJournal] = useState<Journal | null>(null);

  const form = useForm<ManualJournalFormValues>({
    resolver: zodResolver(manualJournalSchema),
    defaultValues: {
      transaction_date: new Date().toISOString().split('T')[0],
      description: '',
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

  const watchEntries =
    useWatch({ control: form.control, name: 'entries' }) || [];

  const totalDebit = useMemo(
    () => watchEntries.reduce((sum, e) => sum + (Number(e.debit) || 0), 0),
    [watchEntries],
  );
  const totalCredit = useMemo(
    () => watchEntries.reduce((sum, e) => sum + (Number(e.credit) || 0), 0),
    [watchEntries],
  );
  const isBalanced = totalDebit === totalCredit && totalDebit > 0;

  /**
   * Mengambil daftar jurnal dan Chart of Account (CoA) secara paralel dari API.
   *
   * @returns {Promise<void>}
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [journalRes, coaRes] = await Promise.all([
        api.get<any>('/v1/journals'),
        api.get<any>('/v1/coas'),
      ]);

      const journalList = Array.isArray(journalRes.data)
        ? journalRes.data
        : journalRes.data?.rows || [];
      const coaList = Array.isArray(coaRes.data)
        ? coaRes.data
        : coaRes.data?.rows || [];

      setCoas(
        coaList.map((c: Coa) => ({
          label: `${c.account_code} - ${c.account_name}`,
          value: c.account_code,
        })),
      );
      setData(
        journalList.sort(
          (a: Journal, b: Journal) =>
            new Date(b.transaction_date).getTime() -
            new Date(a.transaction_date).getTime(),
        ),
      );
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data jurnal dari server.');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Menangani pengiriman data untuk entri jurnal manual ke backend.
   * Memastikan bahwa nilai debit dan kredit balance sebelum dikirim.
   *
   * @param {ManualJournalFormValues} values - Data form jurnal manual
   */
  const onSubmitManual = async (values: ManualJournalFormValues) => {
    if (!isBalanced) {
      toast.error(
        'Jurnal tidak seimbang (Unbalanced). Pastikan total Debit sama dengan total Kredit.',
      );
      return;
    }

    try {
      const payload = {
        ...values,
        source_module: 'Manual',
        total_debit: totalDebit,
        total_credit: totalCredit,
      };

      await api.post('/v1/journals', payload);
      toast.success('Entri jurnal manual berhasil dicatat.');
      setIsManualModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(
        err.message || 'Terjadi kesalahan saat menyimpan jurnal manual.',
      );
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        (item.description || '')
          .toLowerCase()
          .includes(globalFilter.toLowerCase()) ||
        (item.reference_id || '')
          .toLowerCase()
          .includes(globalFilter.toLowerCase());
      const matchModule =
        moduleFilter === 'Semua' ? true : item.source_module === moduleFilter;
      return matchSearch && matchModule;
    });
  }, [data, globalFilter, moduleFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('transaction_date', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tanggal <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='text-muted-foreground font-medium'>
            {format(new Date(info.getValue()), 'dd MMM yyyy')}
          </span>
        ),
      }),
      columnHelper.accessor('reference_id', {
        header: 'No. Referensi',
        cell: (info) => (
          <span className='font-mono text-primary font-semibold'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('description', {
        header: 'Deskripsi Transaksi',
        cell: (info) => (
          <span
            className='font-medium text-foreground truncate max-w-[250px] inline-block'
            title={info.getValue()}
          >
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('source_module', {
        header: 'Sumber',
        cell: (info) => (
          <Badge variant='outline' className='bg-background text-xs'>
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.accessor('total_debit', {
        header: 'Total Nominal',
        cell: (info) => (
          <span className='font-mono font-bold text-emerald-600'>
            Rp {(info.getValue() || 0).toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className='text-right'>Aksi</div>,
        cell: (info) => (
          <TableActions onView={() => setViewingJournal(info.row.original)} />
        ),
      }),
    ],
    [],
  );

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2'>
            <FileText className='w-6 h-6 text-primary' /> Jurnal Umum
            (Auto-Journal)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan double-entry yang ditarik otomatis dari seluruh modul
            operasional.
          </p>
        </div>
        <Button
          onClick={() => {
            form.reset({
              transaction_date: new Date().toISOString().split('T')[0],
              description: '',
              entries: [
                { account_code: '', debit: 0, credit: 0 },
                { account_code: '', debit: 0, credit: 0 },
              ],
            });
            setIsManualModalOpen(true);
          }}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Entri Manual
        </Button>
      </div>

      {error && !isLoading && (
        <div className='bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center justify-between shadow-sm'>
          <div className='flex items-center gap-3'>
            <AlertCircle className='h-5 w-5 text-destructive' />
            <p className='text-sm font-medium text-destructive'>{error}</p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchData}
            className='border-destructive/30 text-destructive hover:bg-destructive/10'
          >
            <RefreshCcw className='h-4 w-4 mr-2' /> Coba Lagi
          </Button>
        </div>
      )}

      <div className='bg-card border border-border rounded-xl shadow-soft-depth overflow-hidden'>
        <div className='p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20'>
          <SearchInput
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder='Cari deskripsi atau referensi...'
            className='w-full sm:max-w-sm'
          />

          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
              Modul:
            </span>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className='flex h-9 w-full sm:w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary'
            >
              <option value='Semua'>Semua Sumber</option>
              <option value='Invoice'>Invoice</option>
              <option value='Pengisian'>Pengisian (Purchases)</option>
              <option value='Pengeluaran'>Pengeluaran</option>
              <option value='Gaji'>Gaji (Payroll)</option>
              <option value='Manual'>Entri Manual</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
          emptyMessage='Tidak ada riwayat jurnal.'
        />
      </div>

      {/* MODAL VIEW DETAIL JURNAL */}
      <Modal
        isOpen={!!viewingJournal}
        onClose={() => setViewingJournal(null)}
        title='Detail Jurnal Transaksi'
        size='lg'
      >
        {viewingJournal && (
          <div className='space-y-6 py-2'>
            <div className='bg-muted/40 p-4 rounded-xl border border-border flex flex-col sm:flex-row justify-between gap-4'>
              <div>
                <p className='text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1'>
                  Deskripsi Transaksi
                </p>
                <p className='font-semibold text-foreground text-base'>
                  {viewingJournal.description}
                </p>
              </div>
              <div className='flex flex-col sm:items-end gap-1'>
                <Badge variant='outline' className='bg-background w-fit'>
                  {viewingJournal.source_module}
                </Badge>
                <p className='text-xs text-muted-foreground mt-1'>
                  Ref:{' '}
                  <span className='font-mono text-primary font-bold'>
                    {viewingJournal.reference_id || '-'}
                  </span>
                </p>
                <p className='text-xs text-muted-foreground'>
                  Tgl:{' '}
                  {format(
                    new Date(viewingJournal.transaction_date),
                    'dd MMM yyyy',
                  )}
                </p>
              </div>
            </div>

            <div className='border border-border rounded-xl overflow-hidden bg-background'>
              <table className='w-full text-sm text-left'>
                <thead className='bg-muted/50 border-b border-border'>
                  <tr>
                    <th className='px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider'>
                      Kode Akun
                    </th>
                    <th className='px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider'>
                      Nama Akun
                    </th>
                    <th className='px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider text-right'>
                      Debit
                    </th>
                    <th className='px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider text-right'>
                      Kredit
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border/50'>
                  {viewingJournal.entries.map((entry, idx) => (
                    <tr
                      key={idx}
                      className='hover:bg-muted/10 transition-colors'
                    >
                      <td className='px-4 py-3 font-mono text-muted-foreground'>
                        {entry.account_code}
                      </td>
                      <td
                        className={`px-4 py-3 ${entry.credit > 0 ? 'pl-8 text-muted-foreground' : 'font-semibold text-foreground'}`}
                      >
                        {entry.account_name}
                      </td>
                      <td className='px-4 py-3 font-mono text-right'>
                        {entry.debit > 0
                          ? entry.debit.toLocaleString('id-ID')
                          : '-'}
                      </td>
                      <td className='px-4 py-3 font-mono text-right'>
                        {entry.credit > 0
                          ? entry.credit.toLocaleString('id-ID')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className='bg-muted/30 border-t-2 border-border/80'>
                  <tr>
                    <td
                      colSpan={2}
                      className='px-4 py-3 text-right font-bold text-xs uppercase tracking-wider text-muted-foreground'
                    >
                      Total Transaksi
                    </td>
                    <td className='px-4 py-3 font-mono font-bold text-right text-emerald-600'>
                      Rp {viewingJournal.total_debit.toLocaleString('id-ID')}
                    </td>
                    <td className='px-4 py-3 font-mono font-bold text-right text-emerald-600'>
                      Rp {viewingJournal.total_credit.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL ENTRI JURNAL MANUAL */}
      <Modal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        title='Entri Jurnal Manual'
        size='xl'
        footer={
          <div className='flex justify-between items-center w-full'>
            <div className='flex items-center gap-4'>
              <div className='flex flex-col'>
                <span className='text-[10px] uppercase font-bold text-muted-foreground tracking-wider'>
                  Total Debit
                </span>
                <span className='font-mono font-bold text-sm'>
                  Rp {totalDebit.toLocaleString('id-ID')}
                </span>
              </div>
              <div className='flex flex-col'>
                <span className='text-[10px] uppercase font-bold text-muted-foreground tracking-wider'>
                  Total Kredit
                </span>
                <span className='font-mono font-bold text-sm'>
                  Rp {totalCredit.toLocaleString('id-ID')}
                </span>
              </div>
              <Badge
                variant={isBalanced ? 'default' : 'destructive'}
                className={isBalanced ? 'bg-emerald-500' : ''}
              >
                {isBalanced ? 'Balanced' : 'Unbalanced'}
              </Badge>
            </div>
            <div className='flex gap-3'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsManualModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type='button'
                onClick={form.handleSubmit(onSubmitManual)}
                className='bg-primary hover:bg-primary/90 text-white'
                disabled={!isBalanced || form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? 'Menyimpan...'
                  : 'Posting Jurnal'}
              </Button>
            </div>
          </div>
        }
      >
        <form id='manual-journal-form' className='space-y-6 py-2'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <DatePicker
              label='Tanggal Transaksi'
              required
              value={form.watch('transaction_date')}
              onChange={(val) => form.setValue('transaction_date', val)}
              error={form.formState.errors.transaction_date?.message}
            />
            <Input
              label='Deskripsi / Keterangan'
              required
              placeholder='Penyesuaian kas...'
              error={form.formState.errors.description?.message}
              {...form.register('description')}
            />
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between border-b border-border/60 pb-2'>
              <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider'>
                Baris Jurnal (Entries)
              </h3>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() =>
                  append({ account_code: '', debit: 0, credit: 0 })
                }
                className='h-8 text-xs'
              >
                <Plus className='w-3 h-3 mr-1' /> Tambah Baris
              </Button>
            </div>

            {form.formState.errors.entries?.root && (
              <p className='text-xs text-destructive font-medium'>
                {form.formState.errors.entries.root.message}
              </p>
            )}

            <div className='space-y-3'>
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className='flex flex-col sm:flex-row items-start gap-3 bg-muted/10 p-3 rounded-lg border border-border/50 relative group'
                >
                  <div className='w-full sm:w-[40%]'>
                    <Select
                      label='Akun (CoA)'
                      options={coas}
                      value={form.watch(`entries.${index}.account_code`)}
                      onChange={(val) =>
                        form.setValue(`entries.${index}.account_code`, val)
                      }
                    />
                  </div>
                  <div className='w-full sm:w-[25%]'>
                    <NumberInput
                      label='Debit (Rp)'
                      value={form.watch(`entries.${index}.debit`)}
                      onChange={(val) => {
                        form.setValue(`entries.${index}.debit`, val);
                        if (val > 0)
                          form.setValue(`entries.${index}.credit`, 0);
                      }}
                    />
                  </div>
                  <div className='w-full sm:w-[25%]'>
                    <NumberInput
                      label='Kredit (Rp)'
                      value={form.watch(`entries.${index}.credit`)}
                      onChange={(val) => {
                        form.setValue(`entries.${index}.credit`, val);
                        if (val > 0) form.setValue(`entries.${index}.debit`, 0);
                      }}
                    />
                  </div>
                  <div className='w-full sm:w-[10%] flex justify-end sm:pt-6'>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => remove(index)}
                      disabled={fields.length <= 2}
                      className='text-destructive hover:bg-destructive/10'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
