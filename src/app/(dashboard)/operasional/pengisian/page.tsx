// src/app/(dashboard)/operasional/pengisian/page.tsx
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
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { DataTable, PaginationMeta } from '@/components/_shared/DataTable';
import { TableActions } from '@/components/_shared/TableActions';
import { SearchInput } from '@/components/form/SearchInput';
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

// Import Komponen Pecahan
import {
  localPurchaseSchema,
  LocalPurchaseFormValues,
  PurchaseRow,
} from '@/components/Operasional/Pengisian/schema';
import {
  PengisianFilter,
  PengisianFilterState,
} from '@/components/Operasional/Pengisian/PengisianFilter';
import { PengisianDetailModal } from '@/components/Operasional/Pengisian/PengisianDetailModal';
import { PengisianFormModal } from '@/components/Operasional/Pengisian/PengisianFormModal';

const columnHelper = createColumnHelper<PurchaseRow>();

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

  // Main Search State (DO Number)
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filter States (By Date)
  const emptyFilters: PengisianFilterState = { start_date: '', end_date: '' };
  const [filterInput, setFilterInput] =
    useState<PengisianFilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<PengisianFilterState>(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
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

  // Debouncing DO Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

      if (debouncedSearch) {
        params.append('do_number', debouncedSearch);
      }
      if (appliedFilters.start_date) {
        params.append('startDate', appliedFilters.start_date);
      }
      if (appliedFilters.end_date) {
        params.append('endDate', appliedFilters.end_date);
      }

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
  }, [page, pageSize, sort, appliedFilters, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (columnId: string) => {
    setSort((prev) => {
      if (prev?.id === columnId) return { id: columnId, desc: !prev.desc };
      return { id: columnId, desc: true };
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
              ? format(new Date(info.getValue()), 'dd MMM yyyy')
              : '-'}
          </span>
        ),
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
            onView={() => handleOpenDetail(info.row.original)}
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
        <div className='p-4 border-b border-border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-muted/20'>
          {/* BAGIAN KIRI: Info Total & Search */}
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto'>
            <div className='text-sm font-medium text-muted-foreground whitespace-nowrap hidden xl:block'>
              Total <span className='text-primary font-bold'>{meta.total}</span>{' '}
              Transaksi
            </div>

            <SearchInput
              placeholder='Cari Nomor DO...'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className='w-full sm:w-64'
            />
          </div>

          {/* BAGIAN KANAN: Advanced Filter By Date */}
          <div className='flex w-full lg:w-auto justify-end'>
            <PengisianFilter
              filterInput={filterInput}
              setFilterInput={setFilterInput}
              activeFilterCount={activeFilterCount}
              isFilterOpen={isFilterOpen}
              setIsFilterOpen={setIsFilterOpen}
              applyFilters={applyFilters}
              resetFilters={resetFilters}
            />
          </div>
        </div>

        <DataTable
          columns={columns as any}
          data={data}
          isLoading={isLoading}
          emptyMessage={
            debouncedSearch || activeFilterCount > 0
              ? 'Tidak ada data pengisian yang cocok dengan pencarian/filter.'
              : 'Belum ada riwayat pengisian gas.'
          }
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </div>

      <PengisianDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        selectedData={selectedData}
      />

      <PengisianFormModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        form={form}
        onSubmit={onSubmit}
        isEditing={!!editingId}
        suppliers={suppliers}
        drivers={drivers}
      />

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
