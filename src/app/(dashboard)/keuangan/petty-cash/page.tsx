'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Coins,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { format } from 'date-fns';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

const pettyCashSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  expense_type: z.string().optional(),
  date: z.string().optional(),
  description: z.string().optional(),
  quantity: z.coerce.number().optional(),
  unit_price: z.coerce.number().optional(),
  total: z.coerce.number().optional(),
  transaction_type: z.string().min(1, 'Tipe transaksi wajib dipilih'),
});

type PettyCashFormValues = z.infer<typeof pettyCashSchema>;

export interface PettyCashRow extends PettyCashFormValues {
  id: string;
  customer_name?: string;
}

const columnHelper = createColumnHelper<PettyCashRow>();

/**
 * Halaman manajemen operasional Petty Cash (Kas Kecil).
 * Terintegrasi dengan endpoint /v1/petty-cashes dan /v1/customers.
 *
 * @returns {JSX.Element} Komponen UI halaman Petty Cash
 */
export default function PettyCashPage() {
  const [data, setData] = useState<PettyCashRow[]>([]);
  const [customers, setCustomers] = useState<
    { label: string; value: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('Semua');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<PettyCashFormValues>({
    resolver: zodResolver(pettyCashSchema as any),
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
   * Mengambil data riwayat kas kecil dan daftar customer secara paralel.
   * Memetakan nama customer ke setiap baris data petty cash.
   *
   * @returns {Promise<void>}
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pettyCashRes, custRes] = await Promise.all([
        api.get<any>('/v1/petty-cashes'),
        api.get<any>('/v1/customers'),
      ]);

      const pettyCashList = Array.isArray(pettyCashRes.data)
        ? pettyCashRes.data
        : pettyCashRes.data?.rows || [];
      const custList = Array.isArray(custRes.data)
        ? custRes.data
        : custRes.data?.rows || [];

      setCustomers(
        custList.map((c: any) => ({ label: c.company_name, value: c.id })),
      );

      const getCustomerName = (id: string) =>
        custList.find((c: any) => c.id === id)?.company_name ||
        'Unknown Customer';

      const mappedData: PettyCashRow[] = pettyCashList.map((item: any) => ({
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
      toast.error('Gagal memuat data kas kecil');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Menginisialisasi nilai form dan menampilkan modal untuk entri baru atau pembaruan data.
   *
   * @param {PettyCashRow} [pettyCash] - Data petty cash yang akan diedit (opsional)
   */
  const handleOpenDialog = (pettyCash?: PettyCashRow) => {
    if (pettyCash) {
      setEditingId(pettyCash.id);
      form.reset({
        ...pettyCash,
        date: pettyCash.date
          ? new Date(pettyCash.date).toISOString().split('T')[0]
          : '',
      });
    } else {
      setEditingId(null);
      form.reset({
        customer_id: '',
        transaction_type: 'Pengeluaran',
        expense_type: 'Operasional',
        date: new Date().toISOString().split('T')[0],
        description: '',
        quantity: 1,
        unit_price: 0,
        total: 0,
      });
    }
    setIsDialogOpen(true);
  };

  /**
   * Mengeksekusi penambahan (POST) atau pembaruan (PUT) data petty cash.
   *
   * @param {PettyCashFormValues} values - Data form kas kecil
   */
  const onSubmit = async (values: PettyCashFormValues) => {
    try {
      const payload = {
        ...values,
        date: values.date || undefined,
      };

      if (editingId) {
        await api.put(`/v1/petty-cashes/${editingId}`, payload);
        toast.success('Catatan petty cash berhasil diperbarui.');
      } else {
        await api.post('/v1/petty-cashes', payload);
        toast.success('Catatan petty cash baru berhasil ditambahkan.');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan data.');
    }
  };

  /**
   * Mengirim permintaan penghapusan data petty cash (DELETE).
   */
  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/petty-cashes/${deletingId}`);
      toast.success('Catatan petty cash berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data.');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        (item.description || '')
          .toLowerCase()
          .includes(globalFilter.toLowerCase()) ||
        (item.customer_name || '')
          .toLowerCase()
          .includes(globalFilter.toLowerCase());
      const matchType =
        typeFilter === 'Semua' ? true : item.transaction_type === typeFilter;
      return matchSearch && matchType;
    });
  }, [data, globalFilter, typeFilter]);

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
      columnHelper.accessor('transaction_type', {
        header: 'Tipe Transaksi',
        cell: (info) => (
          <Badge
            variant='outline'
            className={
              info.getValue() === 'Pemasukan'
                ? 'text-emerald-500 border-emerald-500/30'
                : 'text-amber-500 border-amber-500/30'
            }
          >
            {info.getValue() || '-'}
          </Badge>
        ),
      }),
      columnHelper.accessor('description', {
        header: 'Deskripsi',
        cell: (info) => (
          <div className='flex flex-col max-w-[220px] truncate'>
            <span
              className='font-medium text-foreground truncate'
              title={info.getValue()}
            >
              {info.getValue() || '-'}
            </span>
            <span className='text-[10px] uppercase font-bold tracking-wider text-muted-foreground'>
              {info.row.original.expense_type}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('customer_name', {
        header: 'Terkait Customer',
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('total', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nominal (Rp) <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => {
          const isIncome = info.row.original.transaction_type === 'Pemasukan';
          return (
            <span
              className={`font-mono font-bold ${isIncome ? 'text-emerald-500' : 'text-foreground'}`}
            >
              {isIncome ? '+' : '-'}{' '}
              {(info.getValue() || 0).toLocaleString('id-ID')}
            </span>
          );
        },
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
            Petty Cash
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

      <div className='bg-card border border-border rounded-xl shadow-soft-depth overflow-hidden'>
        <div className='p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20'>
          <SearchInput
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder='Cari deskripsi atau customer...'
            className='w-full sm:max-w-sm'
          />

          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
              Tipe:
            </span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className='flex h-9 w-full sm:w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary'
            >
              <option value='Semua'>Semua Transaksi</option>
              <option value='Pemasukan'>Pemasukan</option>
              <option value='Pengeluaran'>Pengeluaran</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns as any}
          data={filteredData}
          isLoading={isLoading}
          emptyMessage='Tidak ada catatan kas kecil.'
        />
      </div>

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
              value={form.watch('date')}
              onChange={(val) => form.setValue('date', val)}
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
                className={`font-bold ${form.watch('transaction_type') === 'Pemasukan' ? 'text-emerald-600 bg-emerald-500/5' : 'text-amber-600 bg-amber-500/5'}`}
                disabled
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
