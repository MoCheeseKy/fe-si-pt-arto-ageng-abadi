// src/app/(dashboard)/master-data/driver/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Truck,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Driver, driverSchema, DriverFormValues } from '@/types/master';
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

// Import komponen-komponen terpisah
import {
  DriverFilter,
  DriverFilterState,
} from '@/components/MasterData/Driver/DriverFilter';
import { DriverFormModal } from '@/components/MasterData/Driver/DriverFormModal';

const columnHelper = createColumnHelper<Driver>();

/**
 * Mengelola state pagination, sorting, pencarian debounced, dan interaksi CRUD (Create, Read, Update, Delete)
 * untuk entitas Driver melalui komunikasi API `/v1/drivers`.
 */
export default function MasterDriverPage() {
  const [data, setData] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Server-Side States ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<{ id: string; desc: boolean } | null>({
    id: 'createdAt',
    desc: true,
  });
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    pageCount: 0,
    total: 0,
  });

  // Main Search State (Pisah dari Filter Popover)
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Secondary Filter States
  const emptyFilters: DriverFilterState = { phone_number: '', nik: '' };
  const [filterInput, setFilterInput] =
    useState<DriverFilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<DriverFilterState>(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // React Hook Form
  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema as any),
    defaultValues: { name: '', phone_number: '', nik: '' },
  });

  /**
   * Mengatur delay 500ms setelah user berhenti mengetik pada main search.
   * Mencegah pemanggilan API bertubi-tubi saat user sedang mengetik.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // Reset ke page 1 tiap kali parameter search berubah
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const activeFilterCount = useMemo(() => {
    return Object.values(appliedFilters).filter((val) => val !== '').length;
  }, [appliedFilters]);

  /**
   * Melakukan request GET ke endpoint `/v1/drivers`
   * dengan menyertakan URLSearchParams berdasarkan state terkini.
   */
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

      // Append Global Search
      if (debouncedSearch) {
        params.append('name', debouncedSearch);
      }

      // Append Secondary Filters
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await api.get<any>(`/v1/drivers?${params.toString()}`);
      const list = Array.isArray(res.data) ? res.data : res.data?.rows || [];

      setData(list);

      if (res.meta?.pagination) {
        const pagination = res.meta.pagination;
        setMeta({
          ...pagination,
          pageCount: Math.ceil(pagination.total / pagination.pageSize),
        });
      } else {
        setMeta({
          total: list.length,
          pageCount: Math.ceil(list.length / pageSize) || 1,
          page: 1,
          pageSize,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data dari server.');
      toast.error('Gagal memuat data driver');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sort, appliedFilters, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Mengubah orientasi sorting (ASC / DESC) atau me-reset-nya,
   * dan mengembalikan posisi pagination ke halaman pertama.
   */
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

  /** Memindahkan filter lokal ke filter aplikatif dan me-reset page */
  const applyFilters = () => {
    setAppliedFilters(filterInput);
    setPage(1);
    setIsFilterOpen(false);
  };

  /** Mengosongkan secondary filter dan me-reset filter aplikatif */
  const resetFilters = () => {
    setFilterInput(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
    setIsFilterOpen(false);
  };

  /** Melakukan inject initial values ke react-hook-form sebelum merender Form Modal */
  const handleOpenDialog = (driver?: Driver) => {
    if (driver) {
      setEditingId(driver.id);
      form.reset({
        name: driver.name,
        phone_number: driver.phone_number,
        nik: driver.nik,
      });
    } else {
      setEditingId(null);
      form.reset({ name: '', phone_number: '', nik: '' });
    }
    setIsDialogOpen(true);
  };

  /** Melakukan dispatch request POST / PUT ke backend tergantung state editingId */
  const onSubmit = async (values: DriverFormValues) => {
    try {
      if (editingId) {
        await api.put(`/v1/drivers/${editingId}`, values);
        toast.success('Data driver berhasil diperbarui.');
      } else {
        await api.post('/v1/drivers', values);
        toast.success('Driver baru berhasil ditambahkan.');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan data.');
    }
  };

  /** Men-trigger request DELETE berdasarkan ID yang ditampung dalam state deletingId */
  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/drivers/${deletingId}`);
      toast.success('Data driver berhasil dihapus.');
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
      columnHelper.accessor('name', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('name')}
          >
            Nama Driver <SortIcon columnId='name' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('phone_number', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('phone_number')}
          >
            No. Telepon <SortIcon columnId='phone_number' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono text-muted-foreground'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('nik', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('nik')}
          >
            Nomor NIK <SortIcon columnId='nik' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono text-muted-foreground'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper?.display({
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
    [sort],
  );

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2'>
            <Truck className='w-6 h-6 text-primary' /> Driver
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Kelola data pengemudi operasional untuk pengangkutan Gas CNG.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah Driver
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
        <div className='p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20'>
          {/* BAGIAN KIRI: Info Total & Search Bar */}
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto'>
            <SearchInput
              placeholder='Cari nama driver...'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className='w-full sm:w-64'
            />

            <div className='text-sm font-medium text-muted-foreground whitespace-nowrap hidden lg:block'>
              Total <span className='text-primary font-bold'>{meta.total}</span>{' '}
              Drivers
            </div>
          </div>

          {/* BAGIAN KANAN: Advanced Filter */}
          <DriverFilter
            filterInput={filterInput}
            setFilterInput={setFilterInput}
            activeFilterCount={activeFilterCount}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            applyFilters={applyFilters}
            resetFilters={resetFilters}
          />
        </div>

        <DataTable
          columns={columns as any}
          data={data}
          isLoading={isLoading}
          emptyMessage={
            debouncedSearch || activeFilterCount > 0
              ? 'Tidak ada data driver yang cocok dengan filter.'
              : 'Tidak ada data driver yang ditemukan.'
          }
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </div>

      <DriverFormModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        form={form}
        onSubmit={onSubmit}
        isEditing={!!editingId}
      />

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
              Apakah Anda yakin ingin menghapus data driver ini?
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
