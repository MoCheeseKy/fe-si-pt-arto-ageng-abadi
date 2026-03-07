'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Truck,
  RefreshCcw,
  AlertCircle,
  ArrowUpDown,
  Calculator,
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
import { CurrencyInput } from '@/components/form/CurrencyInput';
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

const purchaseSchema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
  supplier_id: z.string().min(1, 'Supplier wajib dipilih'),
  driver_id: z.string().min(1, 'Driver wajib dipilih'),
  license_plate: z.string().optional(),
  gtm_type: z.string().optional(),
  do_number: z.string().optional(),
  ghc: z.coerce.number().optional(),
  pressure_start: z.coerce.number().optional(),
  pressure_finish: z.coerce.number().optional(),
  meter_start: z.coerce.number().optional(),
  meter_finish: z.coerce.number().optional(),
  metering_fill_post: z.coerce.number().optional(),
  volume_mmscf: z.coerce.number().optional(),
  volume_mmbtu: z.coerce.number().optional(),
  currency: z.enum(['IDR', 'USD']).default('IDR'),
  exchange_rate: z.coerce.number().optional(),
  price_per_sm3: z.coerce.number().optional(),
  total_sales: z.coerce.number().optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

export interface Purchase extends Omit<PurchaseFormValues, 'date'> {
  id: string;
  date: Date;
  supplier?: { company_name: string };
  driver?: { name: string };
}

const columnHelper = createColumnHelper<Purchase>();

/**
 * Halaman manajemen operasional Pengisian Gas (Purchases).
 * Terintegrasi dengan endpoint /v1/purchases, /v1/suppliers, dan /v1/drivers.
 *
 * @returns {JSX.Element} Komponen UI halaman Pengisian Gas
 */
export default function PengisianPage() {
  const [data, setData] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<
    { label: string; value: string }[]
  >([]);
  const [drivers, setDrivers] = useState<{ label: string; value: string }[]>(
    [],
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('Semua');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema as any),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      supplier_id: '',
      driver_id: '',
      license_plate: '',
      gtm_type: '',
      do_number: '',
      ghc: 0,
      pressure_start: 0,
      pressure_finish: 0,
      meter_start: 0,
      meter_finish: 0,
      metering_fill_post: 0,
      volume_mmscf: 0,
      volume_mmbtu: 0,
      currency: 'IDR',
      exchange_rate: 0,
      price_per_sm3: 0,
      total_sales: 0,
    },
  });

  const watchCurrency = useWatch({ control: form.control, name: 'currency' });
  const watchPrice =
    useWatch({ control: form.control, name: 'price_per_sm3' }) || 0;
  const watchVolumeMMBTU =
    useWatch({ control: form.control, name: 'volume_mmbtu' }) || 0;
  const watchVolumeMMSCF =
    useWatch({ control: form.control, name: 'volume_mmscf' }) || 0;

  const calculatedTotal =
    watchCurrency === 'USD'
      ? watchVolumeMMBTU * watchPrice
      : watchVolumeMMSCF * watchPrice;

  /**
   * Mengambil data pembelian, supplier, dan driver secara paralel untuk efisiensi render.
   *
   * @returns {Promise<void>}
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [purchasesRes, suppliersRes, driversRes] = await Promise.all([
        api.get<any>('/v1/purchases'),
        api.get<any>('/v1/suppliers'),
        api.get<any>('/v1/drivers'),
      ]);

      const purchasesData = Array.isArray(purchasesRes.data)
        ? purchasesRes.data
        : purchasesRes.data?.rows || [];
      const suppliersData = Array.isArray(suppliersRes.data)
        ? suppliersRes.data
        : suppliersRes.data?.rows || [];
      const driversData = Array.isArray(driversRes.data)
        ? driversRes.data
        : driversRes.data?.rows || [];

      setData(purchasesData);
      setSuppliers(
        suppliersData.map((s: any) => ({ label: s.company_name, value: s.id })),
      );
      setDrivers(driversData.map((d: any) => ({ label: d.name, value: d.id })));
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
   * Mempersiapkan payload dan membuka modal form.
   *
   * @param {Purchase} [purchase] - Data entitas jika dalam mode edit
   */
  const handleOpenDialog = (purchase?: Purchase) => {
    if (purchase) {
      setEditingId(purchase.id);
      form.reset({
        ...purchase,
        date: new Date(purchase.date).toISOString().split('T')[0],
      });
    } else {
      setEditingId(null);
      form.reset({
        date: new Date().toISOString().split('T')[0],
        supplier_id: '',
        driver_id: '',
        currency: 'IDR',
        ghc: 0,
        pressure_start: 0,
        pressure_finish: 0,
        meter_start: 0,
        meter_finish: 0,
        metering_fill_post: 0,
        volume_mmscf: 0,
        volume_mmbtu: 0,
        exchange_rate: 0,
        price_per_sm3: 0,
      });
    }
    setIsDialogOpen(true);
  };

  /**
   * Menangani proses penambahan atau pembaruan data transaksi pembelian.
   *
   * @param {PurchaseFormValues} values - Payload dari react-hook-form
   */
  const onSubmit = async (values: PurchaseFormValues) => {
    try {
      const payload = {
        ...values,
        total_sales: calculatedTotal,
      };

      if (editingId) {
        await api.put(`/v1/purchases/${editingId}`, payload);
        toast.success('Transaksi pengisian berhasil diperbarui.');
      } else {
        await api.post('/v1/purchases', payload);
        toast.success('Transaksi pengisian baru berhasil dicatat.');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan transaksi.');
    }
  };

  /**
   * Menghapus transaksi pembelian berdasarkan ID.
   */
  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/purchases/${deletingId}`);
      toast.success('Transaksi pengisian berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus transaksi.');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const filteredData = useMemo(() => {
    if (currencyFilter === 'Semua') return data;
    return data.filter((item) => item.currency === currencyFilter);
  }, [data, currencyFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('do_number', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            No. DO <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-semibold text-primary'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('date', {
        header: 'Tanggal',
        cell: (info) => (
          <span className='text-muted-foreground'>
            {format(new Date(info.getValue()), 'dd MMM yyyy')}
          </span>
        ),
      }),
      columnHelper.accessor('supplier_id', {
        header: 'Supplier',
        cell: (info) => (
          <span className='font-medium text-foreground'>
            {info.row.original.supplier?.company_name || 'Unknown Supplier'}
          </span>
        ),
      }),
      columnHelper.accessor('volume_mmbtu', {
        header: 'Vol. MMBTU',
        cell: (info) => (
          <span className='font-mono text-emerald-500'>
            {info.getValue()?.toLocaleString('id-ID') || 0}
          </span>
        ),
      }),
      columnHelper.accessor('total_sales', {
        header: 'Total Nilai',
        cell: (info) => {
          const val = info.getValue() || 0;
          const cur = info.row.original.currency;
          return (
            <span className='font-mono font-bold'>
              {cur === 'USD' ? '$' : 'Rp'} {val.toLocaleString('id-ID')}
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
            Pengisian Gas (Purchases)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan pembelian dan loading gas CNG dari Mother Station.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Input Pengisian
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
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder='Cari No. DO...'
            className='w-full sm:max-w-sm'
          />

          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
              Mata Uang:
            </span>
            <select
              value={currencyFilter}
              onChange={(e) => setCurrencyFilter(e.target.value)}
              className='flex h-9 w-full sm:w-32 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary'
            >
              <option value='Semua'>Semua</option>
              <option value='IDR'>IDR</option>
              <option value='USD'>USD</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns as any}
          data={filteredData}
          isLoading={isLoading}
          emptyMessage='Belum ada riwayat transaksi pengisian.'
        />
      </div>

      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Transaksi Pengisian' : 'Input Pengisian Baru'}
        size='xl'
        footer={
          <div className='flex justify-between w-full items-center'>
            <div className='flex items-center gap-2 text-sm'>
              <Calculator className='w-4 h-4 text-muted-foreground' />
              <span className='text-muted-foreground'>Estimasi Total:</span>
              <span
                className={`font-mono font-bold text-lg ${watchCurrency === 'USD' ? 'text-amber-500' : 'text-emerald-500'}`}
              >
                {watchCurrency === 'USD' ? '$' : 'Rp'}{' '}
                {calculatedTotal.toLocaleString('id-ID')}
              </span>
            </div>
            <div className='flex gap-3'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                type='submit'
                form='purchase-form'
                className='bg-primary hover:bg-primary/90 text-white'
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? 'Menyimpan...'
                  : 'Simpan Transaksi'}
              </Button>
            </div>
          </div>
        }
      >
        <form
          id='purchase-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6 py-2'
        >
          <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
            <DatePicker
              label='Tanggal Pengisian'
              required
              value={form.watch('date')}
              onChange={(val) => form.setValue('date', val)}
              error={form.formState.errors.date?.message}
            />
            <Select
              label='Supplier (Mother Station)'
              required
              options={suppliers}
              value={form.watch('supplier_id')}
              onChange={(val) => form.setValue('supplier_id', val)}
              error={form.formState.errors.supplier_id?.message}
            />
            <Input
              label='Nomor DO'
              placeholder='DO/XXX/...'
              error={form.formState.errors.do_number?.message}
              {...form.register('do_number')}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
            <Select
              label='Driver GTM'
              required
              options={drivers}
              value={form.watch('driver_id')}
              onChange={(val) => form.setValue('driver_id', val)}
              error={form.formState.errors.driver_id?.message}
            />
            <Input
              label='Plat Nomor'
              placeholder='B 1234 XXX'
              error={form.formState.errors.license_plate?.message}
              {...form.register('license_plate')}
            />
            <Input
              label='Jenis GTM'
              placeholder='10FT / 20FT / 40FT'
              error={form.formState.errors.gtm_type?.message}
              {...form.register('gtm_type')}
            />
          </div>

          <div className='border-t border-border/50 pt-4 mt-2'>
            <h4 className='text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4'>
              Parameter Teknis & Volume
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-5'>
              <NumberInput
                label='GHC'
                value={form.watch('ghc')}
                onChange={(val) => form.setValue('ghc', val)}
              />
              <NumberInput
                label='Pressure Start'
                value={form.watch('pressure_start')}
                onChange={(val) => form.setValue('pressure_start', val)}
              />
              <NumberInput
                label='Pressure Finish'
                value={form.watch('pressure_finish')}
                onChange={(val) => form.setValue('pressure_finish', val)}
              />
              <NumberInput
                label='Metering Fill Post'
                value={form.watch('metering_fill_post')}
                onChange={(val) => form.setValue('metering_fill_post', val)}
              />
              <NumberInput
                label='Meter Start'
                value={form.watch('meter_start')}
                onChange={(val) => form.setValue('meter_start', val)}
              />
              <NumberInput
                label='Meter Finish'
                value={form.watch('meter_finish')}
                onChange={(val) => form.setValue('meter_finish', val)}
              />
              <NumberInput
                label='Volume (MMSCF)'
                value={form.watch('volume_mmscf')}
                onChange={(val) => form.setValue('volume_mmscf', val)}
              />
              <NumberInput
                label='Volume (MMBTU)'
                value={form.watch('volume_mmbtu')}
                onChange={(val) => form.setValue('volume_mmbtu', val)}
              />
            </div>
          </div>

          <div className='border-t border-border/50 pt-4 mt-2'>
            <h4 className='text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4'>
              Komersial
            </h4>
            <CurrencyInput
              label='Harga per Sm3 / MMBTU'
              amount={form.watch('price_per_sm3') || 0}
              onAmountChange={(val) => form.setValue('price_per_sm3', val)}
              currency={form.watch('currency')}
              onCurrencyChange={(val) => form.setValue('currency', val)}
              exchangeRate={form.watch('exchange_rate')}
              onExchangeRateChange={(val) =>
                form.setValue('exchange_rate', val)
              }
            />
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
              Apakah Anda yakin ingin menghapus transaksi pengisian ini? Laporan
              keuangan terkait mungkin akan terpengaruh.
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
