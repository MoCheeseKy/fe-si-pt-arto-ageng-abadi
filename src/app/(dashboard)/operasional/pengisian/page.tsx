'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Droplets,
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
import { Purchase } from '@/types/operasional';
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

// 1. Schema lokal yang disesuaikan persis dengan ekspektasi Backend
const localPurchaseSchema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
  supplier_id: z.string().min(1, 'Supplier wajib dipilih'),
  driver_id: z.string().min(1, 'Driver wajib dipilih'),
  license_plate: z.string().min(1, 'Plat nomor wajib diisi'),
  gtm_type: z.string().min(1, 'Tipe GTM wajib diisi'),
  do_number: z.string().min(1, 'Nomor DO wajib diisi'),
  ghc: z.coerce.number().min(0),
  pressure_start: z.coerce.number().min(0),
  pressure_finish: z.coerce.number().min(0),
  meter_start: z.coerce.number().min(0),
  meter_finish: z.coerce.number().min(0),
  volume_mmscf: z.coerce.number().min(0),
  volume_mmbtu: z.coerce.number().min(0),
  currency: z.string().min(1),
  exchange_rate: z.coerce.number().min(1),
  price_per_sm3: z.coerce.number().min(0),
  total_sales: z.coerce.number().min(0),
});

type LocalPurchaseFormValues = z.infer<typeof localPurchaseSchema>;

export type PurchaseRow = Omit<Purchase, 'supplier_name'> &
  Partial<LocalPurchaseFormValues> & {
    supplier_name?: string;
    driver_name?: string;
  };

const columnHelper = createColumnHelper<PurchaseRow>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function PengisianPage() {
  const [data, setData] = useState<PurchaseRow[]>([]);
  const [suppliers, setSuppliers] = useState<
    { label: string; value: string }[]
  >([]);
  const [drivers, setDrivers] = useState<{ label: string; value: string }[]>(
    [],
  );

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

  // Filter States
  const emptyFilters = { do_number: '', license_plate: '' };
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false); // State untuk Modal Detail
  const [selectedData, setSelectedData] = useState<PurchaseRow | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<LocalPurchaseFormValues>({
    resolver: zodResolver(localPurchaseSchema as any),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      do_number: '',
      supplier_id: '',
      driver_id: '',
      license_plate: '',
      gtm_type: 'Type A',
      ghc: 0,
      pressure_start: 0,
      pressure_finish: 0,
      meter_start: 0,
      meter_finish: 0,
      volume_mmscf: 0,
      volume_mmbtu: 0,
      price_per_sm3: 0,
      total_sales: 0,
      currency: 'IDR',
      exchange_rate: 1,
    },
  });

  const activeFilterCount = useMemo(() => {
    return Object.values(appliedFilters).filter((val) => val !== '').length;
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

      if (appliedFilters.do_number)
        params.append('do_number', appliedFilters.do_number);
      if (appliedFilters.license_plate)
        params.append('license_plate', appliedFilters.license_plate);

      // Fetch Purchases, Suppliers, dan Drivers secara bersamaan
      const [purchaseRes, supplierRes, driverRes] = await Promise.all([
        api.get<any>(`/v1/purchases?${params.toString()}`),
        api.get<any>('/v1/suppliers?pageSize=1000'),
        api.get<any>('/v1/drivers?pageSize=1000'),
      ]);

      const supplierList = Array.isArray(supplierRes.data)
        ? supplierRes.data
        : supplierRes.data?.rows || [];
      setSuppliers(
        supplierList.map((s: any) => ({ label: s.company_name, value: s.id })),
      );

      const driverList = Array.isArray(driverRes.data)
        ? driverRes.data
        : driverRes.data?.rows || [];
      setDrivers(driverList.map((d: any) => ({ label: d.name, value: d.id })));

      const purchaseList = Array.isArray(purchaseRes.data)
        ? purchaseRes.data
        : purchaseRes.data?.rows || [];

      const mappedData: PurchaseRow[] = purchaseList.map((item: any) => ({
        ...item,
        supplier_name:
          supplierList.find((s: any) => s.id === item.supplier_id)
            ?.company_name || 'Unknown Supplier',
        driver_name:
          driverList.find((d: any) => d.id === item.driver_id)?.name ||
          'Unknown Driver',
      }));

      setData(mappedData);

      if (purchaseRes.meta?.pagination) {
        setMeta(purchaseRes.meta.pagination);
      } else {
        setMeta({
          total: purchaseList.length,
          pageCount: 1,
          page: 1,
          pageSize: 10,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data pengisian dari server.');
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

  // --- Handlers for Modals ---
  const handleOpenDetail = (purchase: PurchaseRow) => {
    setSelectedData(purchase);
    setIsDetailOpen(true);
  };

  const handleOpenDialog = (purchase?: PurchaseRow) => {
    if (purchase) {
      setEditingId(purchase.id!);
      form.reset({
        date: purchase.date
          ? new Date(purchase.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        do_number: purchase.do_number || '',
        supplier_id: purchase.supplier_id,
        driver_id: purchase.driver_id,
        license_plate: purchase.license_plate,
        gtm_type: purchase.gtm_type || 'Type A',
        ghc: purchase.ghc || 0,
        pressure_start: purchase.pressure_start || 0,
        pressure_finish: purchase.pressure_finish || 0,
        meter_start: purchase.meter_start || 0,
        meter_finish: purchase.meter_finish || 0,
        volume_mmscf: purchase.volume_mmscf || 0,
        volume_mmbtu: purchase.volume_mmbtu || 0,
        price_per_sm3: purchase.price_per_sm3 || 0,
        total_sales: purchase.total_sales || 0,
        currency: purchase.currency || 'IDR',
        exchange_rate: purchase.exchange_rate || 1,
      } as any);
    } else {
      setEditingId(null);
      form.reset({
        date: new Date().toISOString().split('T')[0],
        do_number: '',
        supplier_id: '',
        driver_id: '',
        license_plate: '',
        gtm_type: 'Type A',
        ghc: 0,
        pressure_start: 0,
        pressure_finish: 0,
        meter_start: 0,
        meter_finish: 0,
        volume_mmscf: 0,
        volume_mmbtu: 0,
        price_per_sm3: 0,
        total_sales: 0,
        currency: 'IDR',
        exchange_rate: 1,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: LocalPurchaseFormValues) => {
    try {
      if (editingId) {
        await api.put(`/v1/purchases/${editingId}`, values);
        toast.success('Data pengisian berhasil diperbarui.');
      } else {
        await api.post('/v1/purchases', values);
        toast.success('Data pengisian baru berhasil dicatat.');
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
      await api.delete(`/v1/purchases/${deletingId}`);
      toast.success('Data pengisian berhasil dihapus.');
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

  // --- Kolom Tabel (Hanya Data Esensial) ---
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
      columnHelper.accessor('do_number', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('do_number')}
          >
            Nomor DO <SortIcon columnId='do_number' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-bold text-primary'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('supplier_name', {
        header: 'Supplier / Driver',
        cell: (info) => (
          <div className='flex flex-col'>
            <span className='font-semibold text-foreground'>
              {info.getValue()}
            </span>
            <span className='text-xs text-muted-foreground'>
              {info.row.original.driver_name}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('volume_mmscf', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('volume_mmscf')}
          >
            Vol (MMSCF) <SortIcon columnId='volume_mmscf' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-semibold'>
            {info.getValue() || 0}
          </span>
        ),
      }),
      columnHelper.accessor('total_sales', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('total_sales')}
          >
            Total Tagihan <SortIcon columnId='total_sales' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-semibold text-emerald-600'>
            Rp {(info.getValue() || 0).toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper?.display({
        id: 'actions',
        header: () => <div className='text-right'>Aksi</div>,
        cell: (info) => (
          <TableActions
            onView={() => handleOpenDetail(info.row.original)} // Tambahkan fungsi onView di sini
            onEdit={() => handleOpenDialog(info.row.original)}
            onDelete={() => setDeletingId(info.row.original.id!)}
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
            <Droplets className='w-6 h-6 text-primary' /> Pengisian Gas
            (Purchases)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan aktivitas pengisian Gas CNG dari Mother Station
            (Supplier).
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Catat Pengisian Baru
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
            Transaksi Pengisian
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
                    Pencarian data pengisian.
                  </p>
                </div>

                <div className='space-y-3'>
                  <Input
                    label='Nomor DO (Delivery Order)'
                    placeholder='Ketik No DO...'
                    value={filterInput.do_number}
                    onChange={(e) =>
                      setFilterInput({
                        ...filterInput,
                        do_number: e.target.value,
                      })
                    }
                  />
                  <Input
                    label='Plat Nomor Kendaraan'
                    placeholder='Ketik Plat Nomor...'
                    value={filterInput.license_plate}
                    onChange={(e) =>
                      setFilterInput({
                        ...filterInput,
                        license_plate: e.target.value,
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
          emptyMessage='Belum ada riwayat pengisian gas.'
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
        title='Detail Transaksi Pengisian'
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
            <div className='flex items-center gap-3 pb-4 border-b border-border/50'>
              <div className='h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary'>
                <FileText className='h-5 w-5' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Nomor Delivery Order
                </p>
                <p className='text-lg font-bold font-mono text-foreground'>
                  {selectedData.do_number || '-'}
                </p>
              </div>
            </div>

            {/* Informasi Umum */}
            <div>
              <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3'>
                Informasi Umum
              </h4>
              <div className='grid grid-cols-2 gap-y-4 gap-x-6 bg-muted/20 p-4 rounded-lg border border-border/50'>
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
                    Supplier (Mother Station)
                  </p>
                  <p className='font-medium text-sm'>
                    {selectedData.supplier_name}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Nama Driver</p>
                  <p className='font-medium text-sm'>
                    {selectedData.driver_name}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>
                    Tipe GTM / Kendaraan
                  </p>
                  <p className='font-medium text-sm'>
                    {selectedData.gtm_type || '-'}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Plat Nomor</p>
                  <p className='font-medium text-sm font-mono'>
                    {selectedData.license_plate || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Data Teknis Pengukuran */}
            <div>
              <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3'>
                Pengukuran Operasional
              </h4>
              <div className='grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 bg-primary/5 p-4 rounded-lg border border-primary/10'>
                <div>
                  <p className='text-xs text-muted-foreground'>GHC</p>
                  <p className='font-semibold text-sm font-mono'>
                    {selectedData.ghc || 0}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Volume MMSCF</p>
                  <p className='font-semibold text-sm font-mono text-primary'>
                    {selectedData.volume_mmscf || 0}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Volume MMBTU</p>
                  <p className='font-semibold text-sm font-mono text-primary'>
                    {selectedData.volume_mmbtu || 0}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Pressure Awal</p>
                  <p className='font-semibold text-sm font-mono'>
                    {selectedData.pressure_start || 0}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>
                    Pressure Akhir
                  </p>
                  <p className='font-semibold text-sm font-mono'>
                    {selectedData.pressure_finish || 0}
                  </p>
                </div>
                <div className='hidden sm:block'></div> {/* Spacer */}
                <div>
                  <p className='text-xs text-muted-foreground'>Meter Awal</p>
                  <p className='font-semibold text-sm font-mono'>
                    {selectedData.meter_start || 0}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-muted-foreground'>Meter Akhir</p>
                  <p className='font-semibold text-sm font-mono'>
                    {selectedData.meter_finish || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* Data Finansial */}
            <div>
              <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3'>
                Informasi Finansial
              </h4>
              <div className='flex flex-col gap-3 bg-muted/20 p-4 rounded-lg border border-border/50'>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-muted-foreground'>
                    Mata Uang & Kurs
                  </span>
                  <span className='text-sm font-medium'>
                    {selectedData.currency || 'IDR'} (Rate:{' '}
                    {selectedData.exchange_rate || 1})
                  </span>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-sm text-muted-foreground'>
                    Harga per SM3
                  </span>
                  <span className='text-sm font-mono font-medium'>
                    Rp{' '}
                    {(selectedData.price_per_sm3 || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className='flex justify-between items-center pt-3 border-t border-border/50 mt-1'>
                  <span className='text-sm font-bold text-foreground'>
                    Total Tagihan (Sales)
                  </span>
                  <span className='text-lg font-bold font-mono text-emerald-600'>
                    Rp {(selectedData.total_sales || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL FORM PENGISIAN (CREATE / EDIT) */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Transaksi Pengisian' : 'Catat Pengisian Baru'}
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
              form='purchase-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        }
      >
        <form
          id='purchase-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6 py-2'
        >
          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <DatePicker
              label='Tanggal Pengisian'
              required
              value={form.watch('date')}
              onChange={(val) => form.setValue('date', val)}
              error={form.formState.errors.date?.message}
            />
            <Input
              label='Nomor DO (Delivery Order)'
              required
              placeholder='Contoh: DO-2025-001'
              error={form.formState.errors.do_number?.message}
              {...form.register('do_number')}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <Select
              label='Pilih Supplier (Mother Station)'
              required
              options={suppliers}
              value={form.watch('supplier_id')}
              onChange={(val) => form.setValue('supplier_id', val)}
              error={form.formState.errors.supplier_id?.message}
            />
            <Select
              label='Pilih Driver'
              required
              options={drivers}
              value={form.watch('driver_id')}
              onChange={(val) => form.setValue('driver_id', val)}
              error={form.formState.errors.driver_id?.message}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <Input
              label='Plat Nomor GTM'
              required
              placeholder='Contoh: B 1234 CD'
              error={form.formState.errors.license_plate?.message}
              {...form.register('license_plate')}
            />
            <Input
              label='Tipe GTM'
              required
              placeholder='Contoh: Type A'
              error={form.formState.errors.gtm_type?.message}
              {...form.register('gtm_type')}
            />
          </div>

          <div className='bg-muted/30 p-4 rounded-xl border border-border/60 space-y-4'>
            <h3 className='text-sm font-bold uppercase text-primary tracking-wider mb-2'>
              Data Pengukuran (Teknis)
            </h3>
            <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
              <NumberInput
                label='GHC'
                required
                value={form.watch('ghc')}
                onChange={(val) => form.setValue('ghc', val)}
                error={form.formState.errors.ghc?.message}
              />
              <NumberInput
                label='Pressure Start'
                required
                value={form.watch('pressure_start')}
                onChange={(val) => form.setValue('pressure_start', val)}
                error={form.formState.errors.pressure_start?.message}
              />
              <NumberInput
                label='Pressure Finish'
                required
                value={form.watch('pressure_finish')}
                onChange={(val) => form.setValue('pressure_finish', val)}
                error={form.formState.errors.pressure_finish?.message}
              />
              <NumberInput
                label='Meter Start'
                required
                value={form.watch('meter_start')}
                onChange={(val) => form.setValue('meter_start', val)}
                error={form.formState.errors.meter_start?.message}
              />
              <NumberInput
                label='Meter Finish'
                required
                value={form.watch('meter_finish')}
                onChange={(val) => form.setValue('meter_finish', val)}
                error={form.formState.errors.meter_finish?.message}
              />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 pt-2'>
              <NumberInput
                label='Volume (MMSCF)'
                required
                value={form.watch('volume_mmscf')}
                onChange={(val) => form.setValue('volume_mmscf', val)}
                error={form.formState.errors.volume_mmscf?.message}
              />
              <NumberInput
                label='Volume (MMBTU)'
                required
                value={form.watch('volume_mmbtu')}
                onChange={(val) => form.setValue('volume_mmbtu', val)}
                error={form.formState.errors.volume_mmbtu?.message}
              />
            </div>
          </div>

          <div className='bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-4'>
            <h3 className='text-sm font-bold uppercase text-primary tracking-wider mb-2'>
              Data Finansial
            </h3>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <Select
                label='Mata Uang'
                options={[
                  { label: 'IDR', value: 'IDR' },
                  { label: 'USD', value: 'USD' },
                ]}
                value={form.watch('currency')}
                onChange={(val) => form.setValue('currency', val)}
              />
              <NumberInput
                label='Kurs (Exchange Rate)'
                required
                value={form.watch('exchange_rate')}
                onChange={(val) => form.setValue('exchange_rate', val)}
              />
              <NumberInput
                label='Harga per SM3'
                required
                value={form.watch('price_per_sm3')}
                onChange={(val) => form.setValue('price_per_sm3', val)}
                error={form.formState.errors.price_per_sm3?.message}
              />
              <NumberInput
                label='Total Penjualan'
                required
                value={form.watch('total_sales')}
                onChange={(val) => form.setValue('total_sales', val)}
                error={form.formState.errors.total_sales?.message}
              />
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
              Apakah Anda yakin ingin menghapus data pengisian ini? Laporan
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
