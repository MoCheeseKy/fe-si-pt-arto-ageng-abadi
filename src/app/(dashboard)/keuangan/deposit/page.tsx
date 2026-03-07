'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Wallet,
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

const depositSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  date: z.string().optional(),
  amount: z.coerce
    .number()
    .min(1, 'Nominal deposit harus lebih dari 0')
    .optional(),
  chart_of_account: z.string().optional(),
});

type DepositFormValues = z.infer<typeof depositSchema>;

export interface DepositRow extends DepositFormValues {
  id: string;
  customer_name?: string;
}

const columnHelper = createColumnHelper<DepositRow>();

/**
 * Halaman manajemen operasional Deposit Wallet Customer.
 * Terintegrasi dengan endpoint GET, POST, PUT, DELETE /v1/deposits dan GET /v1/customers.
 *
 * @returns {JSX.Element} Komponen UI halaman Deposit
 */
export default function DepositPage() {
  const [data, setData] = useState<DepositRow[]>([]);
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

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      customer_id: '',
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      chart_of_account: '',
    },
  });

  /**
   * Mengambil data deposit dan referensi customer secara paralel.
   *
   * @returns {Promise<void>}
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [depositRes, custRes] = await Promise.all([
        api.get<any>('/v1/deposits'),
        api.get<any>('/v1/customers'),
      ]);

      const depositList = Array.isArray(depositRes.data)
        ? depositRes.data
        : depositRes.data?.rows || [];
      const custList = Array.isArray(custRes.data)
        ? custRes.data
        : custRes.data?.rows || [];

      setCustomers(
        custList.map((c: any) => ({ label: c.company_name, value: c.id })),
      );

      const getCustomerName = (id: string) =>
        custList.find((c: any) => c.id === id)?.company_name ||
        'Unknown Customer';

      const mappedData: DepositRow[] = depositList.map((item: any) => ({
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
      toast.error('Gagal memuat data deposit');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Menyiapkan form modal untuk pembuatan deposit baru atau mengedit deposit yang sudah ada.
   *
   * @param {DepositRow} [deposit] - Objek deposit yang akan diedit (opsional)
   */
  const handleOpenDialog = (deposit?: DepositRow) => {
    if (deposit) {
      setEditingId(deposit.id);
      form.reset({
        customer_id: deposit.customer_id,
        amount: deposit.amount,
        chart_of_account: deposit.chart_of_account || '',
        date: deposit.date
          ? new Date(deposit.date).toISOString().split('T')[0]
          : '',
      });
    } else {
      setEditingId(null);
      form.reset({
        customer_id: '',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        chart_of_account: '',
      });
    }
    setIsDialogOpen(true);
  };

  /**
   * Menangani pengiriman data form ke backend untuk proses simpan (POST/PUT).
   *
   * @param {DepositFormValues} values - Nilai terverifikasi dari form
   */
  const onSubmit = async (values: DepositFormValues) => {
    try {
      const payload = {
        ...values,
        date: values.date || undefined,
      };

      if (editingId) {
        await api.put(`/v1/deposits/${editingId}`, payload);
        toast.success('Deposit berhasil diperbarui.');
      } else {
        await api.post('/v1/deposits', payload);
        toast.success('Deposit baru berhasil ditambahkan.');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan deposit.');
    }
  };

  /**
   * Menghapus catatan deposit yang dipilih berdasarkan ID ke endpoint DELETE.
   */
  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/deposits/${deletingId}`);
      toast.success('Deposit berhasil dihapus.');
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
        (item.customer_name || '')
          .toLowerCase()
          .includes(globalFilter.toLowerCase()) ||
        (item.chart_of_account || '')
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
      columnHelper.accessor('customer_name', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Customer <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <div className='flex items-center gap-2'>
            <Wallet className='w-4 h-4 text-muted-foreground' />
            <span className='font-medium text-foreground'>
              {info.getValue()}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('chart_of_account', {
        header: 'Akun (CoA)',
        cell: (info) => <span>{info.getValue() || '-'}</span>,
      }),
      columnHelper.accessor('amount', {
        header: 'Nominal Deposit',
        cell: (info) => (
          <span className='font-mono font-bold text-emerald-500'>
            Rp {(info.getValue() || 0).toLocaleString('id-ID')}
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
            Deposit Wallet
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan dana jaminan dan saldo titipan dari customer.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Top-up Deposit
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
            placeholder='Cari customer atau CoA...'
            className='w-full sm:max-w-sm'
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
          emptyMessage='Tidak ada histori deposit.'
        />
      </div>

      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Transaksi Deposit' : 'Top-up Deposit Customer'}
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
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Deposit'}
            </Button>
          </div>
        }
      >
        <form
          id='deposit-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-5 py-2'
        >
          <Select
            label='Customer'
            required
            options={customers}
            value={form.watch('customer_id')}
            onChange={(val) => form.setValue('customer_id', val)}
            error={form.formState.errors.customer_id?.message}
          />
          <DatePicker
            label='Tanggal Transaksi'
            value={form.watch('date')}
            onChange={(val) => form.setValue('date', val)}
          />
          <NumberInput
            label='Nominal (Rp)'
            required
            value={form.watch('amount')}
            onChange={(val) => form.setValue('amount', val)}
            error={form.formState.errors.amount?.message}
            className='text-emerald-500 font-bold text-lg'
          />
          <Input
            label='Chart of Account (Opsional)'
            placeholder='Contoh: Kas Bank Mandiri'
            error={form.formState.errors.chart_of_account?.message}
            {...form.register('chart_of_account')}
          />
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
              Apakah Anda yakin ingin menghapus data deposit ini? Saldo customer
              terkait akan terpengaruh.
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
