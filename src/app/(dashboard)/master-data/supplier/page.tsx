// src/app/(dashboard)/master-data/supplier/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Container,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Supplier, supplierSchema, SupplierFormValues } from '@/types/master';
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

import {
  SupplierFilter,
  SupplierFilterState,
} from '@/components/MasterData/Supplier/SupplierFilter';
import { SupplierFormModal } from '@/components/MasterData/Supplier/SupplierFormModal';

const columnHelper = createColumnHelper<Supplier>();

/**
 * Controller Component untuk halaman Master Supplier.
 * Mengelola logic Fetching Data, Debounced Global Search, Sorting,
 * Pagination, dan dispatching aksi CRUD (Create, Update, Delete) ke API.
 */
export default function MasterSupplierPage() {
  const [data, setData] = useState<Supplier[]>([]);
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

  // Main Search State
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Secondary Filter States
  const emptyFilters: SupplierFilterState = {
    address: '',
    phone_number: '',
    pic_name: '',
    pic_phone_number: '',
  };
  const [filterInput, setFilterInput] =
    useState<SupplierFilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<SupplierFilterState>(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // React Hook Form
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema as any),
    defaultValues: {
      company_name: '',
      address: '',
      phone_number: '',
      pic_name: '',
      pic_phone_number: '',
    },
  });

  /** Debouncing main search input untuk mencegah spam ke API server */
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

  /** * Fetch data ke backend menggunakan payload search & filter aktif.
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

      if (debouncedSearch) {
        params.append('company_name', debouncedSearch);
      }

      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const res = await api.get<any>(`/v1/suppliers?${params.toString()}`);
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
      toast.error('Gagal memuat data supplier');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sort, appliedFilters, debouncedSearch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Men-toggle state sorting (ASC, DESC, atau null) */
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

  /** Sinkronisasi input form filter sekunder dan memicu API Fetching */
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

  /** Membuka Modal Form dan menginjeksikan initialValues saat Edit Mode */
  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingId(supplier.id);
      form.reset({
        company_name: supplier.company_name,
        address: supplier.address || undefined,
        phone_number: supplier.phone_number || undefined,
        pic_name: supplier.pic_name || undefined,
        pic_phone_number: supplier.pic_phone_number || undefined,
      });
    } else {
      setEditingId(null);
      form.reset({
        company_name: '',
        address: '',
        phone_number: '',
        pic_name: '',
        pic_phone_number: '',
      });
    }
    setIsDialogOpen(true);
  };

  /** Memanggil API Create/Update dari data validasi React Hook Form */
  const onSubmit = async (values: SupplierFormValues) => {
    try {
      if (editingId) {
        await api.put(`/v1/suppliers/${editingId}`, values);
        toast.success('Data supplier berhasil diperbarui.');
      } else {
        await api.post('/v1/suppliers', values);
        toast.success('Supplier baru berhasil ditambahkan.');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan data.');
    }
  };

  /** Mengeksekusi API Delete Data */
  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/suppliers/${deletingId}`);
      toast.success('Data supplier berhasil dihapus.');
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
      columnHelper.accessor('company_name', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('company_name')}
          >
            Nama Supplier <SortIcon columnId='company_name' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('address', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('address')}
          >
            Alamat <SortIcon columnId='address' />
          </Button>
        ),
        cell: (info) => (
          <span
            className='text-muted-foreground truncate max-w-[200px] inline-block'
            title={info.getValue() || ''}
          >
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
      columnHelper.accessor('pic_name', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('pic_name')}
          >
            PIC <SortIcon columnId='pic_name' />
          </Button>
        ),
        cell: (info) => (
          <div className='flex flex-col'>
            <span className='font-medium text-foreground'>
              {info.getValue() || '-'}
            </span>
            <span className='text-xs text-muted-foreground'>
              {info.row.original.pic_phone_number || '-'}
            </span>
          </div>
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
            <Container className='w-6 h-6 text-primary' /> Supplier
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Kelola data vendor dan penyedia Mother Station Gas CNG.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah Supplier
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
              placeholder='Cari nama supplier...'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className='w-full sm:w-64'
            />

            <div className='text-sm font-medium text-muted-foreground whitespace-nowrap hidden lg:block'>
              Total <span className='text-primary font-bold'>{meta.total}</span>{' '}
              Suppliers
            </div>
          </div>

          {/* BAGIAN KANAN: Advanced Filter */}
          <SupplierFilter
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
              ? 'Tidak ada data supplier yang cocok dengan filter.'
              : 'Tidak ada data supplier yang ditemukan.'
          }
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </div>

      <SupplierFormModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        form={form}
        onSubmit={onSubmit}
        isEditing={!!editingId}
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
              Apakah Anda yakin ingin menghapus data supplier ini? Tindakan ini
              tidak dapat dibatalkan.
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
