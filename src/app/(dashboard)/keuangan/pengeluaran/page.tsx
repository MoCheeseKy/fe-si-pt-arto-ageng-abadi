'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  CreditCard,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { format } from 'date-fns';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { SearchInput } from '@/components/form/SearchInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
import { NumberInput } from '@/components/form/NumberInput';
import { Textarea } from '@/components/form/Textarea';
import { DataTable } from '@/components/_shared/DataTable';
import { Modal } from '@/components/_shared/Modal';
import { TableActions } from '@/components/_shared/TableActions';
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

const expenseSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  expense_type: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
  quantity: z.coerce.number().optional(),
  unit_price: z.coerce.number().optional(),
  total: z.coerce.number().optional(),
  account: z.string().optional(),
  payment_method: z.string().optional(),
  bank_account: z.string().optional(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

export interface ExpenseRow extends ExpenseFormValues {
  id: string;
  customer_name?: string;
}

const columnHelper = createColumnHelper<ExpenseRow>();

/**
 * Halaman manajemen operasional Pengeluaran (Expenses).
 * Terintegrasi dengan endpoint /v1/expenses dan /v1/customers.
 *
 * @returns {JSX.Element} Komponen UI halaman Pengeluaran
 */
export default function PengeluaranPage() {
  const [data, setData] = useState<ExpenseRow[]>([]);
  const [customers, setCustomers] = useState<
    { label: string; value: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema as any),
    defaultValues: {
      customer_id: '',
      expense_type: 'Operasional',
      date: new Date().toISOString().split('T')[0],
      description: '',
      quantity: 1,
      unit_price: 0,
      total: 0,
      account: '',
      payment_method: 'Transfer Bank',
      bank_account: '',
    },
  });

  const watchQuantity =
    useWatch({ control: form.control, name: 'quantity' }) || 0;
  const watchUnitPrice =
    useWatch({ control: form.control, name: 'unit_price' }) || 0;

  const calculatedTotal = useMemo(() => {
    return watchQuantity * watchUnitPrice;
  }, [watchQuantity, watchUnitPrice]);

  useEffect(() => {
    form.setValue('total', calculatedTotal);
  }, [calculatedTotal, form]);

  /**
   * Mengambil data pengeluaran dan daftar customer secara paralel.
   *
   * @returns {Promise<void>}
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [expenseRes, custRes] = await Promise.all([
        api.get<any>('/v1/expenses'),
        api.get<any>('/v1/customers'),
      ]);

      const expenseList = Array.isArray(expenseRes.data)
        ? expenseRes.data
        : expenseRes.data?.rows || [];
      const custList = Array.isArray(custRes.data)
        ? custRes.data
        : custRes.data?.rows || [];

      setCustomers(
        custList.map((c: any) => ({ label: c.company_name, value: c.id })),
      );

      const getCustomerName = (id: string) =>
        custList.find((c: any) => c.id === id)?.company_name ||
        'Unknown Customer';

      const mappedData: ExpenseRow[] = expenseList.map((item: any) => ({
        ...item,
        customer_name: getCustomerName(item.customer_id),
      }));

      setData(
        mappedData.sort(
          (a, b) =>
            new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
        ),
      );
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data dari server.');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Membuka modal form untuk mode penambahan data atau pembaruan.
   *
   * @param {ExpenseRow} [expense] - Data pengeluaran jika dalam mode edit
   */
  const handleOpenDialog = (expense?: ExpenseRow) => {
    if (expense) {
      setEditingId(expense.id);
      form.reset({
        ...expense,
        date: expense.date
          ? new Date(expense.date).toISOString().split('T')[0]
          : '',
      });
    } else {
      setEditingId(null);
      form.reset({
        customer_id: '',
        expense_type: 'Operasional',
        date: new Date().toISOString().split('T')[0],
        description: '',
        quantity: 1,
        unit_price: 0,
        total: 0,
        account: '',
        payment_method: 'Transfer Bank',
        bank_account: '',
      });
    }
    setIsDialogOpen(true);
  };

  /**
   * Menangani pengiriman data form ke backend.
   *
   * @param {ExpenseFormValues} values - Nilai input dari form
   */
  const onSubmit = async (values: ExpenseFormValues) => {
    try {
      const payload = {
        ...values,
        date: values.date || undefined,
      };

      if (editingId) {
        await api.put(`/v1/expenses/${editingId}`, payload);
        toast.success('Pengeluaran berhasil diperbarui.');
      } else {
        await api.post('/v1/expenses', payload);
        toast.success('Pengeluaran baru berhasil dicatat.');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan data.');
    }
  };

  /**
   * Mengirim request DELETE ke backend untuk menghapus data pengeluaran.
   */
  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/expenses/${deletingId}`);
      toast.success('Pengeluaran berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data.');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        (item.description || '')
          .toLowerCase()
          .includes(globalFilter.toLowerCase()) ||
        (item.customer_name || '')
          .toLowerCase()
          .includes(globalFilter.toLowerCase()),
    );
  }, [data, globalFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('date', {
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
          <span className='text-muted-foreground'>
            {info.getValue()
              ? format(new Date(info.getValue()!), 'dd MMM yyyy')
              : '-'}
          </span>
        ),
      }),
      columnHelper.accessor('expense_type', {
        header: 'Tipe',
        cell: (info) => (
          <span className='font-semibold text-primary'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('description', {
        header: 'Deskripsi',
        cell: (info) => (
          <div className='flex flex-col max-w-[200px] truncate'>
            <span
              className='font-medium text-foreground truncate'
              title={info.getValue()}
            >
              {info.getValue() || '-'}
            </span>
            <span className='text-xs text-muted-foreground truncate'>
              {info.row.original.customer_name}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('total', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Total (Rp) <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-bold text-amber-600'>
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
            onEdit={() => handleOpenDialog(info.row.original)}
            onDelete={() => setDeletingId(info.row.original.id)}
          />
        ),
      }),
    ],
    [],
  );

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-heading font-bold text-foreground tracking-tight'>
            Pengeluaran (Expenses)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan biaya operasional, tagihan, dan pengeluaran kas lainnya.
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

      <div className='bg-card border border-border rounded-xl shadow-soft-depth overflow-hidden'>
        <div className='p-4 border-b border-border bg-muted/20'>
          <SearchInput
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder='Cari deskripsi pengeluaran atau customer...'
            className='w-full sm:max-w-sm'
          />
        </div>

        <DataTable
          columns={columns as any}
          data={filteredData}
          isLoading={isLoading}
          emptyMessage='Tidak ada data pengeluaran.'
        />
      </div>

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
              label='Terkait Customer'
              required
              options={customers}
              value={form.watch('customer_id')}
              onChange={(val) => form.setValue('customer_id', val)}
              error={form.formState.errors.customer_id?.message}
            />
            <Select
              label='Tipe Pengeluaran'
              options={[
                { label: 'Operasional', value: 'Operasional' },
                { label: 'Administrasi', value: 'Administrasi' },
                { label: 'Marketing', value: 'Marketing' },
                { label: 'Lainnya', value: 'Lainnya' },
              ]}
              value={form.watch('expense_type')}
              onChange={(val) => form.setValue('expense_type', val)}
            />
            <DatePicker
              label='Tanggal Pengeluaran'
              value={form.watch('date')}
              onChange={(val) => form.setValue('date', val)}
            />
            <Input
              label='Akun (CoA)'
              placeholder='Contoh: Biaya Transport'
              {...form.register('account')}
            />
          </div>

          <Textarea
            label='Deskripsi Pengeluaran'
            placeholder='Rincian biaya atau keperluan...'
            rows={2}
            {...form.register('description')}
          />

          <div className='space-y-4'>
            <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider border-b border-border/60 pb-2'>
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
              <NumberInput
                label='Total (Rp)'
                value={form.watch('total')}
                onChange={(val) => form.setValue('total', val)}
                className='text-amber-600 font-bold bg-amber-500/5'
                disabled
              />
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider border-b border-border/60 pb-2'>
              Informasi Pembayaran
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
              <Select
                label='Metode Pembayaran'
                options={[
                  { label: 'Transfer Bank', value: 'Transfer Bank' },
                  { label: 'Cash', value: 'Cash' },
                  { label: 'Cek / Giro', value: 'Cek/Giro' },
                ]}
                value={form.watch('payment_method')}
                onChange={(val) => form.setValue('payment_method', val)}
              />
              <Input
                label='Rekening / Kas Tujuan'
                placeholder='Contoh: BCA 12345678'
                {...form.register('bank_account')}
              />
            </div>
          </div>
        </form>
      </Modal>

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
              Apakah Anda yakin ingin menghapus riwayat pengeluaran ini?
              Tindakan ini akan memengaruhi laporan keuangan.
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
