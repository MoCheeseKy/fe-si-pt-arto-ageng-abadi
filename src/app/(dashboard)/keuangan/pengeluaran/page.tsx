'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Receipt,
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

// 1. Schema Validasi Lokal untuk Expense (Mengacu pada DTO Backend)
const localExpenseSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  expense_type: z.string().optional(),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0).optional(),
  unit_price: z.coerce.number().min(0).optional(),
  total: z.coerce.number().min(0).optional(),
  account: z.string().optional(),
  payment_method: z.string().optional(),
  bank_account: z.string().optional(),
});

type LocalExpenseFormValues = z.infer<typeof localExpenseSchema>;

export interface ExpenseRow extends LocalExpenseFormValues {
  id: string;
  customer_name?: string;
}

const columnHelper = createColumnHelper<ExpenseRow>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function ExpensePage() {
  const [data, setData] = useState<ExpenseRow[]>([]);
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
  const emptyFilters = { customer_id: 'ALL', expense_type: 'ALL' };
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<ExpenseRow | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<LocalExpenseFormValues>({
    resolver: zodResolver(localExpenseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      customer_id: '',
      expense_type: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
      account: '',
      payment_method: 'Transfer',
      bank_account: '',
    },
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.customer_id !== 'ALL') count++;
    if (appliedFilters.expense_type !== 'ALL') count++;
    return count;
  }, [appliedFilters]);

  // Kalkulasi Otomatis Total Harga (Qty * Unit Price)
  const qty = form.watch('quantity');
  const price = form.watch('unit_price');
  useEffect(() => {
    const calcTotal = Number(qty || 0) * Number(price || 0);
    form.setValue('total', calcTotal);
  }, [qty, price, form]);

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
        appliedFilters.expense_type &&
        appliedFilters.expense_type !== 'ALL'
      ) {
        params.append('expense_type', appliedFilters.expense_type);
      }

      // Fetch Expense dan Customers secara paralel
      const [expenseRes, customerRes] = await Promise.all([
        api.get<any>(`/v1/expenses?${params.toString()}`),
        api.get<any>('/v1/customers?pageSize=1000'),
      ]);

      const customerList = Array.isArray(customerRes.data)
        ? customerRes.data
        : customerRes.data?.rows || [];
      setCustomers(
        customerList.map((c: any) => ({ label: c.company_name, value: c.id })),
      );

      const expenseList = Array.isArray(expenseRes.data)
        ? expenseRes.data
        : expenseRes.data?.rows || [];

      const mappedData: ExpenseRow[] = expenseList.map((item: any) => ({
        ...item,
        customer_name:
          customerList.find((c: any) => c.id === item.customer_id)
            ?.company_name || 'Unknown Customer',
      }));

      setData(mappedData);

      if (expenseRes.meta?.pagination) {
        setMeta(expenseRes.meta.pagination);
      } else {
        setMeta({
          total: expenseList.length,
          pageCount: 1,
          page: 1,
          pageSize: 10,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data pengeluaran dari server.');
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

  const handleOpenDetail = (expense: ExpenseRow) => {
    setSelectedData(expense);
    setIsDetailOpen(true);
  };

  const handleOpenDialog = (expense?: ExpenseRow) => {
    if (expense) {
      setEditingId(expense.id);
      form.reset({
        date: expense.date
          ? new Date(expense.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        customer_id: expense.customer_id,
        expense_type: expense.expense_type || '',
        description: expense.description || '',
        quantity: expense.quantity || 1,
        unit_price: expense.unit_price || 0,
        total: expense.total || 0,
        account: expense.account || '',
        payment_method: expense.payment_method || 'Transfer',
        bank_account: expense.bank_account || '',
      });
    } else {
      setEditingId(null);
      form.reset({
        date: new Date().toISOString().split('T')[0],
        customer_id: '',
        expense_type: '',
        description: '',
        quantity: 1,
        unit_price: 0,
        total: 0,
        account: '',
        payment_method: 'Transfer',
        bank_account: '',
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: LocalExpenseFormValues) => {
    try {
      if (editingId) {
        await api.put(`/v1/expenses/${editingId}`, values);
        toast.success('Data pengeluaran berhasil diperbarui.');
      } else {
        await api.post('/v1/expenses', values);
        toast.success('Pengeluaran baru berhasil dicatat.');
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
      await api.delete(`/v1/expenses/${deletingId}`);
      toast.success('Pengeluaran berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus pengeluaran.');
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
      columnHelper.accessor('expense_type', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('expense_type')}
          >
            Tipe Pengeluaran <SortIcon columnId='expense_type' />
          </Button>
        ),
        cell: (info) => (
          <Badge
            variant='outline'
            className='bg-muted text-muted-foreground border-border font-medium'
          >
            {info.getValue() || 'Umum'}
          </Badge>
        ),
      }),
      columnHelper.accessor('customer_name', {
        header: 'Customer',
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('total', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('total')}
          >
            Total (Rp) <SortIcon columnId='total' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-bold text-destructive'>
            Rp {(info.getValue() || 0).toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper.accessor('payment_method', {
        header: 'Metode Bayar',
        cell: (info) => (
          <span className='text-muted-foreground text-sm'>
            {info.getValue() || '-'}
          </span>
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

  const expenseTypeOptions = [
    { label: 'Operasional', value: 'Operasional' },
    { label: 'Marketing', value: 'Marketing' },
    { label: 'Pajak & Legal', value: 'Pajak & Legal' },
    { label: 'Lainnya', value: 'Lainnya' },
  ];

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2'>
            <Receipt className='w-6 h-6 text-primary' /> Pengeluaran (Expenses)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan biaya pengeluaran operasional yang ditautkan ke Customer.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Catat Pengeluaran
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
            Pengeluaran
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
                    Pencarian data pengeluaran.
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
                  <Select
                    label='Tipe Pengeluaran'
                    options={[
                      { label: 'Semua Tipe', value: 'ALL' },
                      ...expenseTypeOptions,
                    ]}
                    value={filterInput.expense_type}
                    onChange={(val) =>
                      setFilterInput({ ...filterInput, expense_type: val })
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
          emptyMessage='Belum ada data pengeluaran yang dicatat.'
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
        title='Detail Pengeluaran (Expense)'
        size='md'
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
              <div className='mx-auto h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-2'>
                <Receipt className='h-6 w-6' />
              </div>
              <p className='text-sm text-muted-foreground'>Total Pengeluaran</p>
              <p className='text-2xl font-bold font-mono text-destructive'>
                Rp {(selectedData.total || 0).toLocaleString('id-ID')}
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
                <p className='text-xs text-muted-foreground'>
                  Tipe Pengeluaran
                </p>
                <p className='font-medium text-sm'>
                  {selectedData.expense_type || '-'}
                </p>
              </div>
              <div className='col-span-2'>
                <p className='text-xs text-muted-foreground'>
                  Customer Terkait
                </p>
                <p className='font-bold text-base'>
                  {selectedData.customer_name}
                </p>
              </div>
              <div className='col-span-2'>
                <p className='text-xs text-muted-foreground'>
                  Deskripsi / Keterangan
                </p>
                <p className='text-sm text-muted-foreground'>
                  {selectedData.description || '-'}
                </p>
              </div>
            </div>

            <div className='bg-muted/20 p-4 rounded-xl border border-border/50 space-y-3'>
              <h4 className='text-xs font-bold uppercase text-muted-foreground mb-2'>
                Rincian Pembayaran
              </h4>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-xs text-muted-foreground'>Quantity</p>
                  <p className='font-mono text-sm'>
                    {selectedData.quantity || 0}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Unit Price</p>
                  <p className='font-mono text-sm'>
                    Rp {(selectedData.unit_price || 0).toLocaleString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>
                    Payment Method
                  </p>
                  <p className='text-sm'>
                    {selectedData.payment_method || '-'}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Bank Account</p>
                  <p className='font-mono text-sm'>
                    {selectedData.bank_account || '-'}
                  </p>
                </div>
                <div className='col-span-2'>
                  <p className='text-xs text-muted-foreground'>
                    Chart of Account (CoA)
                  </p>
                  <p className='font-mono text-sm'>
                    {selectedData.account || '-'}
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
        title={editingId ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru'}
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
              form='expense-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        }
      >
        <form
          id='expense-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6 py-2'
        >
          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <Select
              label='Customer Terkait'
              required
              options={customers}
              value={form.watch('customer_id')}
              onChange={(val) => form.setValue('customer_id', val)}
              error={form.formState.errors.customer_id?.message}
            />
            <DatePicker
              label='Tanggal Pencatatan'
              required
              value={form.watch('date')}
              onChange={(val) => form.setValue('date', val)}
              error={form.formState.errors.date?.message}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <Select
              label='Tipe Pengeluaran'
              options={expenseTypeOptions}
              value={form.watch('expense_type') || ''}
              onChange={(val) => form.setValue('expense_type', val)}
            />
            <Input
              label='Deskripsi Pengeluaran'
              placeholder='Contoh: Biaya administrasi'
              {...form.register('description')}
            />
          </div>

          <div className='bg-muted/30 p-4 rounded-xl border border-border/60 space-y-4'>
            <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider mb-1'>
              Rincian Nominal & Akun
            </h3>
            <div className='grid grid-cols-2 gap-4'>
              <NumberInput
                label='Quantity'
                value={form.watch('quantity')}
                onChange={(val) => form.setValue('quantity', val)}
              />
              <NumberInput
                label='Harga Satuan (Unit Price)'
                value={form.watch('unit_price')}
                onChange={(val) => form.setValue('unit_price', val)}
              />
            </div>

            <div className='pt-3 border-t border-border flex justify-between items-center'>
              <span className='text-sm font-semibold text-muted-foreground'>
                Total Pengeluaran
              </span>
              <span className='text-lg font-mono font-bold text-destructive bg-destructive/10 px-3 py-1 rounded-lg border border-destructive/20'>
                Rp {form.watch('total').toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Select
              label='Metode Pembayaran'
              options={[
                { label: 'Cash', value: 'Cash' },
                { label: 'Transfer', value: 'Transfer' },
              ]}
              value={form.watch('payment_method') || ''}
              onChange={(val) => form.setValue('payment_method', val)}
            />
            <Input
              label='Bank Account'
              placeholder='Contoh: BCA 123...'
              {...form.register('bank_account')}
            />
            <Input
              label='Chart of Account (CoA)'
              placeholder='Contoh: 510-100'
              {...form.register('account')}
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
              Apakah Anda yakin ingin menghapus catatan pengeluaran ini? Laporan
              arus kas akan diperbarui secara otomatis.
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
