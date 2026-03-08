'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  BookText,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { z } from 'zod';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
import { Textarea } from '@/components/form/Textarea';
import { DataTable } from '@/components/_shared/DataTable';
import { Modal } from '@/components/_shared/Modal';
import { TableActions } from '@/components/_shared/TableActions';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// 1. Schema Validasi Lokal untuk Jurnal Umum
const entrySchema = z
  .object({
    account_code: z.string().min(1, 'Akun wajib dipilih'),
    debit: z.coerce.number().min(0),
    credit: z.coerce.number().min(0),
  })
  .refine((data) => data.debit > 0 || data.credit > 0, {
    message: 'Pilih salah satu (Debit atau Kredit)',
    path: ['debit'],
  });

const localJournalSchema = z
  .object({
    transaction_date: z.string().min(1, 'Tanggal wajib diisi'),
    description: z.string().min(1, 'Keterangan wajib diisi'),
    source_module: z.string().optional(),
    entries: z
      .array(entrySchema)
      .min(2, 'Minimal harus ada 2 baris (Debit & Kredit)'),
  })
  .refine(
    (data) => {
      // Validasi Balance (Debit == Kredit)
      const totalDebit = data.entries.reduce(
        (sum, item) => sum + (item.debit || 0),
        0,
      );
      const totalCredit = data.entries.reduce(
        (sum, item) => sum + (item.credit || 0),
        0,
      );
      return totalDebit === totalCredit;
    },
    {
      message: 'Total Debit dan Kredit harus Balance (Seimbang).',
      path: ['entries'],
    },
  );

type LocalJournalFormValues = z.infer<typeof localJournalSchema>;

export interface JournalRow {
  id: string;
  transaction_date: string;
  description: string;
  source_module: string;
  entries: any[];
}

const columnHelper = createColumnHelper<JournalRow>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function JurnalUmumPage() {
  const [data, setData] = useState<JournalRow[]>([]);
  const [coaList, setCoaList] = useState<{ label: string; value: string }[]>(
    [],
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Server-Side States ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<{ id: string; desc: boolean } | null>({
    id: 'transaction_date',
    desc: true,
  });
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    pageCount: 0,
    total: 0,
  });

  // Filter States
  const emptyFilters = { description: '', source_module: 'ALL' };
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<JournalRow | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<LocalJournalFormValues>({
    resolver: zodResolver(localJournalSchema),
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

  // Watch entries to calculate total real-time
  const watchEntries = useWatch({ control: form.control, name: 'entries' });
  const { totalDebit, totalCredit, isBalanced } = useMemo(() => {
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.description !== '') count++;
    if (appliedFilters.source_module !== 'ALL') count++;
    return count;
  }, [appliedFilters]);

  // Mengambil daftar CoA untuk dropdown (PERHATIKAN VALUE-NYA ADALAH CODE, BUKAN ID)
  const fetchCoa = useCallback(async () => {
    try {
      const res = await api.get<any>('/v1/accounting-coa?pageSize=1000');
      const list = Array.isArray(res.data) ? res.data : res.data?.rows || [];
      // Value menggunakan `code` karena payload Jurnal membutuhkan `account_code`
      setCoaList(
        list.map((c: any) => ({
          label: `${c.code} - ${c.name}`,
          value: c.code,
        })),
      );
    } catch (err) {
      console.error('Gagal memuat CoA', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      if (sort) {
        params.append(
          'order',
          JSON.stringify([[sort.id, sort.desc ? 'DESC' : 'ASC']]),
        );
      }

      if (appliedFilters.description) {
        params.append('description', appliedFilters.description);
      }
      if (
        appliedFilters.source_module &&
        appliedFilters.source_module !== 'ALL'
      ) {
        params.append('source_module', appliedFilters.source_module);
      }

      const res = await api.get<any>(
        `/v1/accounting-journals?${params.toString()}`,
      );

      const list = Array.isArray(res.data) ? res.data : res.data?.rows || [];
      setData(list);

      if (res.meta?.pagination) {
        setMeta(res.meta.pagination);
      } else {
        setMeta({ total: list.length, pageCount: 1, page: 1, pageSize: 10 });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data jurnal dari server.');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sort, appliedFilters]);

  useEffect(() => {
    fetchCoa();
    fetchData();
  }, [fetchCoa, fetchData]);

  const handleSort = (columnId: string) => {
    setSort((prev) => {
      if (prev?.id === columnId) {
        if (prev.desc) return null;
        return { id: columnId, desc: true };
      }
      return { id: columnId, desc: false };
    });
    setPage(1);
  };

  const applyFilters = () => {
    setAppliedFilters(filterInput);
    setPage(1);
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    setFilterInput(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
    setIsFilterOpen(false);
  };

  const handleOpenDetail = (journal: JournalRow) => {
    setSelectedData(journal);
    setIsDetailOpen(true);
  };

  const handleOpenDialog = (journal?: JournalRow) => {
    if (journal) {
      setEditingId(journal.id);
      form.reset({
        transaction_date: journal.transaction_date
          ? new Date(journal.transaction_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        description: journal.description || '',
        source_module: journal.source_module || 'Manual',
        entries:
          journal.entries?.length > 0
            ? journal.entries.map((e: any) => ({
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
      setEditingId(null);
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
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: LocalJournalFormValues) => {
    try {
      const payload = {
        transaction_date: values.transaction_date,
        description: values.description,
        source_module: values.source_module,
        entries: values.entries.map((e) => ({
          account_code: e.account_code,
          debit: Number(e.debit),
          credit: Number(e.credit),
        })),
      };

      if (editingId) {
        await api.put(`/v1/accounting-journals/${editingId}`, payload);
        toast.success('Jurnal berhasil diperbarui.');
      } else {
        await api.post('/v1/accounting-journals', payload);
        toast.success('Jurnal Umum baru berhasil diposting.');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Terjadi kesalahan saat menyimpan jurnal.';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/accounting-journals/${deletingId}`);
      toast.success('Data jurnal berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data.');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const SortIcon = ({ columnId }: { columnId: string }) => (
    <ArrowUpDown
      className={`ml-2 h-3 w-3 ${sort?.id === columnId ? 'text-primary' : 'text-muted-foreground/50'}`}
    />
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor('transaction_date', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('transaction_date')}
          >
            Tanggal <SortIcon columnId='transaction_date' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-medium text-foreground'>
            {info.getValue()
              ? format(new Date(info.getValue()), 'dd MMM yyyy')
              : '-'}
          </span>
        ),
      }),
      columnHelper.accessor('description', {
        header: 'Keterangan',
        cell: (info) => (
          <span className='text-muted-foreground'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('source_module', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('source_module')}
          >
            Sumber <SortIcon columnId='source_module' />
          </Button>
        ),
        cell: (info) => (
          <Badge
            variant='outline'
            className='bg-muted text-muted-foreground border-border uppercase text-[10px] tracking-wider'
          >
            {info.getValue() || 'Manual'}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className='text-right'>Aksi</div>,
        cell: (info) => (
          <TableActions
            onView={() => handleOpenDetail(info.row.original)}
            onEdit={() => handleOpenDialog(info.row.original)}
            onDelete={() => setDeletingId(info.row.original.id)}
          />
        ),
      }),
    ],
    [sort],
  );

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2'>
            <BookText className='w-6 h-6 text-primary' /> Jurnal Umum (General
            Journal)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan transaksi akuntansi *double-entry* (Debit & Kredit).
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Posting Jurnal
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

      <div className='bg-card border border-border rounded-xl shadow-soft-depth overflow-hidden flex flex-col'>
        {/* ACTION BAR */}
        <div className='p-4 border-b border-border flex justify-between items-center bg-muted/20'>
          <div className='text-sm font-medium text-muted-foreground'>
            Total <span className='text-primary font-bold'>{meta.total}</span>{' '}
            Entri Jurnal
          </div>

          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='border-border shadow-sm flex items-center gap-2 relative bg-background'
              >
                <Filter className='w-4 h-4 text-muted-foreground' />
                Filter Data
                {activeFilterCount > 0 && (
                  <span className='absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white'>
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className='w-80 p-4 rounded-xl border-border shadow-lg'
              align='end'
            >
              <div className='space-y-4'>
                <div>
                  <h4 className='font-heading font-bold text-sm text-foreground'>
                    Filter Spesifik
                  </h4>
                  <p className='text-xs text-muted-foreground'>
                    Pencarian riwayat jurnal.
                  </p>
                </div>

                <div className='space-y-3'>
                  <Input
                    label='Cari Keterangan'
                    placeholder='Ketikan deskripsi...'
                    value={filterInput.description}
                    onChange={(e) =>
                      setFilterInput({
                        ...filterInput,
                        description: e.target.value,
                      })
                    }
                  />
                  <Input
                    label='Sumber Modul'
                    placeholder='Contoh: invoice, payroll, manual...'
                    value={filterInput.source_module}
                    onChange={(e) =>
                      setFilterInput({
                        ...filterInput,
                        source_module: e.target.value,
                      })
                    }
                  />
                </div>

                <div className='flex justify-end gap-2 pt-3 border-t border-border/50'>
                  <Button variant='ghost' size='sm' onClick={resetFilters}>
                    Reset
                  </Button>
                  <Button
                    size='sm'
                    onClick={applyFilters}
                    className='bg-primary text-white'
                  >
                    Terapkan Filter
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <DataTable
          columns={columns}
          data={data}
          isLoading={isLoading}
          emptyMessage='Belum ada data Jurnal Umum yang diposting.'
        />

        {/* CUSTOM PAGINATION FOOTER */}
        {!isLoading && meta.total > 0 && (
          <div className='flex items-center justify-between px-6 py-4 border-t border-border bg-background'>
            <div className='text-sm text-muted-foreground'>
              Menampilkan{' '}
              <span className='font-semibold text-foreground'>
                {(page - 1) * pageSize + 1}
              </span>{' '}
              -{' '}
              <span className='font-semibold text-foreground'>
                {Math.min(page * pageSize, meta.total)}
              </span>{' '}
              dari{' '}
              <span className='font-semibold text-foreground'>
                {meta.total}
              </span>{' '}
              data
            </div>

            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <span className='text-xs text-muted-foreground'>
                  Baris per halaman:
                </span>
                <select
                  className='h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary'
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className='flex items-center gap-1'>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-8 w-8'
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <div className='flex items-center justify-center w-12 text-sm font-medium'>
                  {page} / {meta.pageCount || 1}
                </div>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-8 w-8'
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= (meta.pageCount || 1)}
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL VIEW DETAIL JURNAL */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title='Rincian Jurnal Umum'
        size='lg'
        footer={
          <div className='flex justify-end w-full'>
            <Button variant='outline' onClick={() => setIsDetailOpen(false)}>
              Tutup
            </Button>
          </div>
        }
      >
        {selectedData && (
          <div className='space-y-6 py-2'>
            <div className='grid grid-cols-2 gap-4 pb-4 border-b border-border/50'>
              <div>
                <p className='text-xs text-muted-foreground'>
                  Tanggal Transaksi
                </p>
                <p className='font-semibold text-foreground'>
                  {selectedData.transaction_date
                    ? format(
                        new Date(selectedData.transaction_date),
                        'dd MMMM yyyy',
                      )
                    : '-'}
                </p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Sumber Modul</p>
                <Badge
                  variant='outline'
                  className='uppercase text-[10px] tracking-wider mt-1'
                >
                  {selectedData.source_module || 'Manual'}
                </Badge>
              </div>
              <div className='col-span-2'>
                <p className='text-xs text-muted-foreground'>
                  Keterangan Jurnal
                </p>
                <p className='text-sm bg-muted/30 p-3 rounded-lg mt-1 border border-border/50'>
                  {selectedData.description || '-'}
                </p>
              </div>
            </div>

            <div className='space-y-3'>
              <h4 className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>
                Rincian Ayat Jurnal (Lines)
              </h4>
              <div className='border border-border rounded-xl overflow-hidden'>
                <table className='w-full text-sm text-left'>
                  <thead className='bg-muted/50 text-xs uppercase text-muted-foreground'>
                    <tr>
                      <th className='px-4 py-3 font-semibold'>Kode Akun</th>
                      <th className='px-4 py-3 font-semibold text-right'>
                        Debit
                      </th>
                      <th className='px-4 py-3 font-semibold text-right'>
                        Kredit
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border'>
                    {selectedData.entries?.map((entry: any, index: number) => {
                      // Trik UI Akuntansi: Baris kredit di-indentasi ke dalam sedikit agar lebih rapi
                      const isCredit = entry.credit > 0;
                      return (
                        <tr key={index} className='hover:bg-muted/20'>
                          <td
                            className={`px-4 py-3 font-mono ${isCredit ? 'pl-8 text-muted-foreground' : 'text-foreground'}`}
                          >
                            {entry.account_code}
                          </td>
                          <td className='px-4 py-3 font-mono text-right text-emerald-600'>
                            {entry.debit > 0
                              ? entry.debit.toLocaleString('id-ID')
                              : '-'}
                          </td>
                          <td className='px-4 py-3 font-mono text-right text-destructive'>
                            {entry.credit > 0
                              ? entry.credit.toLocaleString('id-ID')
                              : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className='bg-primary/5 font-bold'>
                    <tr>
                      <td className='px-4 py-3 text-right'>Total</td>
                      <td className='px-4 py-3 text-right font-mono text-emerald-600'>
                        {(
                          selectedData.entries?.reduce(
                            (a, b) => a + (b.debit || 0),
                            0,
                          ) || 0
                        ).toLocaleString('id-ID')}
                      </td>
                      <td className='px-4 py-3 text-right font-mono text-destructive'>
                        {(
                          selectedData.entries?.reduce(
                            (a, b) => a + (b.credit || 0),
                            0,
                          ) || 0
                        ).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL FORM CREATE / EDIT JURNAL (MASTER-DETAIL) */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Jurnal Umum' : 'Posting Jurnal Umum'}
        size='xl'
        footer={
          <div className='flex justify-end gap-3 w-full'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setIsDialogOpen(false)}
            >
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
          {/* HEADER SECTION */}
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

          {/* DETAIL ENTRIES SECTION */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between pb-2 border-b border-border'>
              <h3 className='text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2'>
                Rincian Ayat Jurnal
              </h3>
            </div>

            {/* Tampilkan Error Form Array jika tidak balance */}
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
                        if (val > 0)
                          form.setValue(`entries.${index}.credit`, 0);
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

      {/* ALERT DIALOG DELETE */}
      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent className='bg-card border-border'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-destructive flex items-center gap-2'>
              <AlertCircle className='h-5 w-5' /> Konfirmasi Penghapusan
            </AlertDialogTitle>
            <AlertDialogDescription className='text-muted-foreground'>
              Apakah Anda yakin ingin menghapus data jurnal ini secara permanen?
              Perhitungan buku besar dan neraca akan terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Jurnal'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
