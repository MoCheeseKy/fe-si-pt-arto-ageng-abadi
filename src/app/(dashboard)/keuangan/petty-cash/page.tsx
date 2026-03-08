'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Coins,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
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

// 1. Schema Validasi Lokal untuk Petty Cash
const localPettyCashSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  transaction_type: z.string().min(1, 'Tipe transaksi wajib dipilih'),
  expense_type: z.string().optional(),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0).optional(),
  unit_price: z.coerce.number().min(0).optional(),
  total: z.coerce.number().min(0).optional(),
});

type LocalPettyCashFormValues = z.infer<typeof localPettyCashSchema>;

export interface PettyCashRow extends LocalPettyCashFormValues {
  id: string;
  customer_name?: string;
}

const columnHelper = createColumnHelper<PettyCashRow>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function PettyCashPage() {
  const [data, setData] = useState<PettyCashRow[]>([]);
  const [customers, setCustomers] = useState<
    { label: string; value: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Server-Side States ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<{ id: string; desc: boolean } | null>({
    id: 'date',
    desc: true,
  });
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    pageCount: 0,
    total: 0,
  });

  // Filter States (Gunakan "ALL" untuk Select All)
  const emptyFilters = {
    customer_id: 'ALL',
    transaction_type: 'ALL',
    expense_type: '',
  };
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<PettyCashRow | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<LocalPettyCashFormValues>({
    resolver: zodResolver(localPettyCashSchema as any),
    defaultValues: {
      customer_id: '',
      transaction_type: 'Pengeluaran',
      expense_type: 'Operasional',
      date: new Date().toISOString().split('T')[0],
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
    },
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.customer_id !== 'ALL') count++;
    if (appliedFilters.transaction_type !== 'ALL') count++;
    if (appliedFilters.expense_type !== '') count++;
    return count;
  }, [appliedFilters]);

  // Kalkulasi Otomatis Total
  const watchQuantity =
    useWatch({ control: form.control, name: 'quantity' }) || 0;
  const watchUnitPrice =
    useWatch({ control: form.control, name: 'unit_price' }) || 0;

  useEffect(() => {
    form.setValue('total', Number(watchQuantity) * Number(watchUnitPrice));
  }, [watchQuantity, watchUnitPrice, form]);

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

      if (appliedFilters.customer_id && appliedFilters.customer_id !== 'ALL') {
        params.append('customer_id', appliedFilters.customer_id);
      }
      if (
        appliedFilters.transaction_type &&
        appliedFilters.transaction_type !== 'ALL'
      ) {
        params.append('transaction_type', appliedFilters.transaction_type);
      }
      if (appliedFilters.expense_type) {
        params.append('expense_type', appliedFilters.expense_type);
      }

      // Fetch Petty Cash dan Customers secara paralel
      const [pettyCashRes, customerRes] = await Promise.all([
        api.get<any>(`/v1/petty-cashes?${params.toString()}`),
        api.get<any>('/v1/customers?pageSize=1000'),
      ]);

      const customerList = Array.isArray(customerRes.data)
        ? customerRes.data
        : customerRes.data?.rows || [];
      setCustomers(
        customerList.map((c: any) => ({ label: c.company_name, value: c.id })),
      );

      const pettyCashList = Array.isArray(pettyCashRes.data)
        ? pettyCashRes.data
        : pettyCashRes.data?.rows || [];

      const mappedData: PettyCashRow[] = pettyCashList.map((item: any) => ({
        ...item,
        customer_name:
          customerList.find((c: any) => c.id === item.customer_id)
            ?.company_name || 'Unknown Customer',
      }));

      setData(mappedData);

      if (pettyCashRes.meta?.pagination) {
        setMeta(pettyCashRes.meta.pagination);
      } else {
        setMeta({
          total: pettyCashList.length,
          pageCount: 1,
          page: 1,
          pageSize: 10,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data kas kecil dari server.');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sort, appliedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const handleOpenDetail = (pettyCash: PettyCashRow) => {
    setSelectedData(pettyCash);
    setIsDetailOpen(true);
  };

  const handleOpenDialog = (pettyCash?: PettyCashRow) => {
    if (pettyCash) {
      setEditingId(pettyCash.id);
      form.reset({
        date: pettyCash.date
          ? new Date(pettyCash.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        customer_id: pettyCash.customer_id,
        transaction_type: pettyCash.transaction_type || 'Pengeluaran',
        expense_type: pettyCash.expense_type || 'Operasional',
        description: pettyCash.description || '',
        quantity: pettyCash.quantity || 1,
        unit_price: pettyCash.unit_price || 0,
        total: pettyCash.total || 0,
      });
    } else {
      setEditingId(null);
      form.reset({
        date: new Date().toISOString().split('T')[0],
        customer_id: '',
        transaction_type: 'Pengeluaran',
        expense_type: 'Operasional',
        description: '',
        quantity: 1,
        unit_price: 0,
        total: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: LocalPettyCashFormValues) => {
    try {
      if (editingId) {
        await api.put(`/v1/petty-cashes/${editingId}`, values);
        toast.success('Catatan kas kecil berhasil diperbarui.');
      } else {
        await api.post('/v1/petty-cashes', values);
        toast.success('Catatan kas kecil baru berhasil ditambahkan.');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan data.');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/petty-cashes/${deletingId}`);
      toast.success('Catatan kas kecil berhasil dihapus.');
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
      columnHelper.accessor('date', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('date')}
          >
            Tanggal <SortIcon columnId='date' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-medium text-foreground'>
            {info.getValue()
              ? format(new Date(info.getValue()!), 'dd MMM yyyy')
              : '-'}
          </span>
        ),
      }),
      columnHelper.accessor('transaction_type', {
        header: 'Tipe Transaksi',
        cell: (info) => (
          <Badge
            variant='outline'
            className={
              info.getValue() === 'Pemasukan'
                ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
                : 'text-amber-500 border-amber-500/30 bg-amber-500/10'
            }
          >
            {info.getValue() || '-'}
          </Badge>
        ),
      }),
      columnHelper.accessor('customer_name', {
        header: 'Customer',
        cell: (info) => (
          <div className='flex flex-col'>
            <span className='font-semibold text-foreground truncate max-w-[180px]'>
              {info.getValue()}
            </span>
            <span className='text-[10px] uppercase font-bold tracking-wider text-muted-foreground'>
              {info.row.original.expense_type}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('total', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('total')}
          >
            Nominal (Rp) <SortIcon columnId='total' />
          </Button>
        ),
        cell: (info) => {
          const isIncome = info.row.original.transaction_type === 'Pemasukan';
          return (
            <span
              className={`font-mono font-bold ${isIncome ? 'text-emerald-600' : 'text-foreground'}`}
            >
              {isIncome ? '+' : '-'}{' '}
              {(info.getValue() || 0).toLocaleString('id-ID')}
            </span>
          );
        },
      }),
      columnHelper?.display({
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
            <Coins className='w-6 h-6 text-primary' /> Petty Cash
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan kas kecil harian, pemasukan, dan pengeluaran minor.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Catat Kas Kecil
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
            Catatan
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
                    Pencarian data petty cash.
                  </p>
                </div>

                <div className='space-y-3'>
                  <Select
                    label='Tipe Transaksi'
                    options={[
                      { label: 'Semua Tipe', value: 'ALL' },
                      { label: 'Pemasukan', value: 'Pemasukan' },
                      { label: 'Pengeluaran', value: 'Pengeluaran' },
                    ]}
                    value={filterInput.transaction_type}
                    onChange={(val) =>
                      setFilterInput({ ...filterInput, transaction_type: val })
                    }
                  />
                  <Select
                    label='Filter Customer'
                    options={[
                      { label: 'Semua Customer', value: 'ALL' },
                      ...customers,
                    ]}
                    value={filterInput.customer_id}
                    onChange={(val) =>
                      setFilterInput({ ...filterInput, customer_id: val })
                    }
                  />
                  <Input
                    label='Kategori Beban/Dana'
                    placeholder='Contoh: Operasional...'
                    value={filterInput.expense_type}
                    onChange={(e) =>
                      setFilterInput({
                        ...filterInput,
                        expense_type: e.target.value,
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
          columns={columns as any}
          data={data}
          isLoading={isLoading}
          emptyMessage='Belum ada catatan kas kecil.'
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
                  Baris per hal:
                </span>
                <select
                  className='h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary'
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[5, 10, 20, 50].map((size) => (
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

      {/* MODAL VIEW DETAIL */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title='Detail Petty Cash'
        size='sm'
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
            <div className='flex flex-col gap-1 pb-4 border-b border-border/50 text-center'>
              <div
                className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-2 ${selectedData.transaction_type === 'Pemasukan' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}
              >
                <FileText className='h-6 w-6' />
              </div>
              <p className='text-sm text-muted-foreground'>Total Nominal</p>
              <p
                className={`text-2xl font-bold font-mono ${selectedData.transaction_type === 'Pemasukan' ? 'text-emerald-600' : 'text-foreground'}`}
              >
                {selectedData.transaction_type === 'Pemasukan' ? '+' : '-'} Rp{' '}
                {(selectedData.total || 0).toLocaleString('id-ID')}
              </p>
            </div>

            <div className='grid grid-cols-2 gap-y-4 gap-x-6'>
              <div>
                <p className='text-xs text-muted-foreground'>Tanggal</p>
                <p className='font-medium text-sm'>
                  {selectedData.date
                    ? format(new Date(selectedData.date), 'dd MMM yyyy')
                    : '-'}
                </p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Tipe Transaksi</p>
                <Badge
                  variant='outline'
                  className={
                    selectedData.transaction_type === 'Pemasukan'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }
                >
                  {selectedData.transaction_type || '-'}
                </Badge>
              </div>
              <div className='col-span-2'>
                <p className='text-xs text-muted-foreground'>
                  Terkait Customer
                </p>
                <p className='font-bold text-base'>
                  {selectedData.customer_name}
                </p>
              </div>
              <div className='col-span-2'>
                <p className='text-xs text-muted-foreground'>
                  Kategori Beban/Dana
                </p>
                <p className='font-medium text-sm'>
                  {selectedData.expense_type || '-'}
                </p>
              </div>
            </div>

            <div className='bg-muted/20 p-4 rounded-xl border border-border/50 space-y-3'>
              <h4 className='text-xs font-bold uppercase text-muted-foreground mb-2'>
                Rincian Perhitungan
              </h4>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-xs text-muted-foreground'>Kuantitas</p>
                  <p className='font-mono text-sm'>
                    {selectedData.quantity || 0}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Harga Satuan</p>
                  <p className='font-mono text-sm'>
                    Rp {(selectedData.unit_price || 0).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className='col-span-2'>
                  <p className='text-xs text-muted-foreground'>
                    Deskripsi / Catatan
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    {selectedData.description || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL FORM CREATE / EDIT */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Kas Kecil' : 'Catat Kas Kecil Baru'}
        size='lg'
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
              form='pettycash-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        }
      >
        <form
          id='pettycash-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6 py-2'
        >
          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <Select
              label='Tipe Transaksi'
              required
              options={[
                { label: 'Pengeluaran Kas', value: 'Pengeluaran' },
                { label: 'Pemasukan Kas', value: 'Pemasukan' },
              ]}
              value={form.watch('transaction_type')}
              onChange={(val) => form.setValue('transaction_type', val)}
              error={form.formState.errors.transaction_type?.message}
            />
            <DatePicker
              label='Tanggal Transaksi'
              required
              value={form.watch('date')}
              onChange={(val) => form.setValue('date', val)}
              error={form.formState.errors.date?.message}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <Select
              label='Customer Terkait'
              required
              options={customers}
              value={form.watch('customer_id')}
              onChange={(val) => form.setValue('customer_id', val)}
              error={form.formState.errors.customer_id?.message}
            />
            <Input
              label='Kategori Beban/Dana'
              placeholder='Contoh: Konsumsi / Bensin'
              {...form.register('expense_type')}
            />
          </div>

          <Textarea
            label='Deskripsi Detail'
            placeholder='Catatan atau rincian transaksi kas kecil...'
            rows={2}
            {...form.register('description')}
          />

          <div className='bg-muted/30 p-4 rounded-xl border border-border/60 space-y-4'>
            <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider mb-1'>
              Rincian Nominal
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
              <NumberInput
                label='Kuantitas'
                value={form.watch('quantity')}
                onChange={(val) => form.setValue('quantity', val)}
              />
              <NumberInput
                label='Harga Satuan (Rp)'
                value={form.watch('unit_price')}
                onChange={(val) => form.setValue('unit_price', val)}
              />

              <div className='flex flex-col gap-2'>
                <span className='text-sm font-medium text-muted-foreground'>
                  Total (Otomatis)
                </span>
                <div
                  className={`h-10 px-3 rounded-md border flex items-center justify-between font-mono font-bold ${form.watch('transaction_type') === 'Pemasukan' ? 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-600 bg-amber-500/10 border-amber-500/20'}`}
                >
                  <span>Rp</span>
                  <span>{form?.watch('total')?.toLocaleString('id-ID')}</span>
                </div>
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
              Apakah Anda yakin ingin menghapus data kas kecil ini? Saldo akhir
              petty cash akan menyesuaikan ulang secara otomatis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
