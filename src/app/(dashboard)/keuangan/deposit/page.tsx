'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Wallet,
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
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
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

// 1. Schema Validasi Lokal untuk Deposit (Berdasarkan DTO Backend)
const localDepositSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  amount: z.coerce.number().min(0, 'Nominal tidak boleh negatif'),
  chart_of_account: z.string().optional(),
});

type LocalDepositFormValues = z.infer<typeof localDepositSchema>;

export interface DepositRow extends LocalDepositFormValues {
  id: string;
  customer_name?: string;
}

const columnHelper = createColumnHelper<DepositRow>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function DepositPage() {
  const [data, setData] = useState<DepositRow[]>([]);
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

  // Filter States (Hindari empty string "" untuk Select Radix UI, gunakan "ALL")
  const emptyFilters = { customer_id: 'ALL', chart_of_account: '' };
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<DepositRow | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<LocalDepositFormValues>({
    resolver: zodResolver(localDepositSchema as any),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      customer_id: '',
      amount: 0,
      chart_of_account: '',
    },
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.customer_id !== 'ALL') count++;
    if (appliedFilters.chart_of_account !== '') count++;
    return count;
  }, [appliedFilters]);

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
      if (appliedFilters.chart_of_account) {
        params.append('chart_of_account', appliedFilters.chart_of_account);
      }

      // Fetch Deposit dan Customers secara paralel
      const [depositRes, customerRes] = await Promise.all([
        api.get<any>(`/v1/deposits?${params.toString()}`),
        api.get<any>('/v1/customers?pageSize=1000'),
      ]);

      const customerList = Array.isArray(customerRes.data)
        ? customerRes.data
        : customerRes.data?.rows || [];
      setCustomers(
        customerList.map((c: any) => ({ label: c.company_name, value: c.id })),
      );

      const depositList = Array.isArray(depositRes.data)
        ? depositRes.data
        : depositRes.data?.rows || [];

      const mappedData: DepositRow[] = depositList.map((item: any) => ({
        ...item,
        customer_name:
          customerList.find((c: any) => c.id === item.customer_id)
            ?.company_name || 'Unknown Customer',
      }));

      setData(mappedData);

      if (depositRes.meta?.pagination) {
        setMeta(depositRes.meta.pagination);
      } else {
        setMeta({
          total: depositList.length,
          pageCount: 1,
          page: 1,
          pageSize: 10,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data deposit dari server.');
      toast.error('Gagal memuat data deposit');
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

  const handleOpenDetail = (deposit: DepositRow) => {
    setSelectedData(deposit);
    setIsDetailOpen(true);
  };

  const handleOpenDialog = (deposit?: DepositRow) => {
    if (deposit) {
      setEditingId(deposit.id);
      form.reset({
        date: deposit.date
          ? new Date(deposit.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        customer_id: deposit.customer_id,
        amount: deposit.amount || 0,
        chart_of_account: deposit.chart_of_account || '',
      });
    } else {
      setEditingId(null);
      form.reset({
        date: new Date().toISOString().split('T')[0],
        customer_id: '',
        amount: 0,
        chart_of_account: '',
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: LocalDepositFormValues) => {
    try {
      if (editingId) {
        await api.put(`/v1/deposits/${editingId}`, values);
        toast.success('Data deposit berhasil diperbarui.');
      } else {
        await api.post('/v1/deposits', values);
        toast.success('Deposit baru berhasil dicatat.');
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
      await api.delete(`/v1/deposits/${deletingId}`);
      toast.success('Deposit berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data deposit.');
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
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className='font-medium text-foreground'>
              {val ? format(new Date(val), 'dd MMM yyyy') : '-'}
            </span>
          );
        },
      }),
      columnHelper.accessor('customer_name', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('customer_id')}
          >
            Nama Customer <SortIcon columnId='customer_id' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('chart_of_account', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('chart_of_account')}
          >
            Chart of Account (CoA) <SortIcon columnId='chart_of_account' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono text-muted-foreground'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('amount', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('amount')}
          >
            Nominal Deposit <SortIcon columnId='amount' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-bold text-emerald-600'>
            Rp {(info.getValue() || 0).toLocaleString('id-ID')}
          </span>
        ),
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
            <Wallet className='w-6 h-6 text-primary' /> Deposit
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan uang muka atau saldo deposit dari pelanggan (Customer).
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Catat Deposit
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
            Data Deposit
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
                    Pencarian data deposit.
                  </p>
                </div>

                <div className='space-y-3'>
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
                    label='Kode Chart of Account (CoA)'
                    placeholder='Ketik CoA...'
                    value={filterInput.chart_of_account}
                    onChange={(e) =>
                      setFilterInput({
                        ...filterInput,
                        chart_of_account: e.target.value,
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
          emptyMessage='Belum ada data deposit uang muka.'
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
        title='Detail Transaksi Deposit'
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
              <div className='mx-auto h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 mb-2'>
                <Wallet className='h-6 w-6' />
              </div>
              <p className='text-sm text-muted-foreground'>Nominal Deposit</p>
              <p className='text-2xl font-bold font-mono text-emerald-600'>
                Rp {(selectedData.amount || 0).toLocaleString('id-ID')}
              </p>
            </div>

            <div className='grid grid-cols-2 gap-y-4 gap-x-6'>
              <div>
                <p className='text-xs text-muted-foreground'>
                  Tanggal Pencatatan
                </p>
                <p className='font-medium text-sm'>
                  {selectedData.date
                    ? format(new Date(selectedData.date), 'dd MMM yyyy')
                    : '-'}
                </p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>
                  Chart of Account (CoA)
                </p>
                <p className='font-mono text-sm'>
                  {selectedData.chart_of_account || '-'}
                </p>
              </div>
              <div className='col-span-2'>
                <p className='text-xs text-muted-foreground'>
                  Nama Pelanggan (Customer)
                </p>
                <p className='font-bold text-base'>
                  {selectedData.customer_name}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL FORM CREATE / EDIT */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Deposit' : 'Catat Deposit Baru'}
        size='md'
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
              form='deposit-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        }
      >
        <form
          id='deposit-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-5 py-2'
        >
          <DatePicker
            label='Tanggal Deposit'
            required
            value={form.watch('date')}
            onChange={(val) => form.setValue('date', val)}
            error={form.formState.errors.date?.message}
          />

          <Select
            label='Pilih Customer (Pelanggan)'
            required
            options={customers}
            value={form.watch('customer_id')}
            onChange={(val) => form.setValue('customer_id', val)}
            error={form.formState.errors.customer_id?.message}
          />

          <div className='pt-2 border-t border-border/50 grid grid-cols-1 gap-4'>
            <NumberInput
              label='Nominal Uang (Amount)'
              required
              value={form.watch('amount')}
              onChange={(val) => form.setValue('amount', val)}
              error={form.formState.errors.amount?.message}
            />
            <Input
              label='Chart of Account (Kode Akun)'
              placeholder='Contoh: 110-200'
              error={form.formState.errors.chart_of_account?.message}
              {...form.register('chart_of_account')}
            />
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
              Apakah Anda yakin ingin menghapus data deposit ini? Aksi ini dapat
              memengaruhi pencatatan saldo pelanggan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Deposit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
