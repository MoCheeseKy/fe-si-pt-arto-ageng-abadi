// src/app/(dashboard)/master-data/karyawan/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  UserCircle,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Employee } from '@/types/master';
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
  localEmployeeSchema,
  LocalEmployeeFormValues,
} from '@/components/MasterData/Karyawan/schema';
import {
  EmployeeFilter,
  EmployeeFilterState,
} from '@/components/MasterData/Karyawan/EmployeeFilter';
import { EmployeeFormModal } from '@/components/MasterData/Karyawan/EmployeeFormModal';

const columnHelper = createColumnHelper<Employee>();

/**
 * Controller Component untuk halaman Master Karyawan.
 * Mengelola logic Fetching Data, Debounced Global Search, Sorting,
 * Pagination, dan dispatching aksi CRUD (Create, Update, Delete) ke API.
 */
export default function MasterKaryawanPage() {
  const [data, setData] = useState<Employee[]>([]);
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
  const emptyFilters: EmployeeFilterState = { nik: '' };
  const [filterInput, setFilterInput] =
    useState<EmployeeFilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<EmployeeFilterState>(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // React Hook Form (menggunakan local schema)
  const form = useForm<LocalEmployeeFormValues>({
    resolver: zodResolver(localEmployeeSchema as any),
    defaultValues: { name: '', nik: '' },
  });

  /** Debouncing main search input (Nama Karyawan) untuk mencegah spam API */
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

  /** Fetch data ke backend menggunakan payload search & filter aktif */
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
        params.append('name', debouncedSearch);
      }

      if (appliedFilters.nik) {
        params.append('nik', appliedFilters.nik);
      }

      const res = await api.get<any>(`/v1/employees?${params.toString()}`);
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
      toast.error('Gagal memuat data karyawan');
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
  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingId(employee.id);
      form.reset({
        name: employee.name,
        nik: employee.nik || '',
      });
    } else {
      setEditingId(null);
      form.reset({ name: '', nik: '' });
    }
    setIsDialogOpen(true);
  };

  /** Memanggil API Create/Update dari data validasi React Hook Form */
  const onSubmit = async (values: LocalEmployeeFormValues) => {
    try {
      if (editingId) {
        await api.put(`/v1/employees/${editingId}`, values);
        toast.success('Data karyawan berhasil diperbarui.');
      } else {
        await api.post('/v1/employees', values);
        toast.success('Karyawan baru berhasil ditambahkan.');
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
      await api.delete(`/v1/employees/${deletingId}`);
      toast.success('Data karyawan berhasil dihapus.');
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
      columnHelper.accessor('nik', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('nik')}
          >
            NIK <SortIcon columnId='nik' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono text-muted-foreground'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('name', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('name')}
          >
            Nama Karyawan <SortIcon columnId='name' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-semibold text-foreground'>
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
            <UserCircle className='w-6 h-6 text-primary' /> Karyawan
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Kelola data seluruh staff dan pegawai internal perusahaan.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah Karyawan
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
              placeholder='Cari nama karyawan...'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className='w-full sm:w-64'
            />

            <div className='text-sm font-medium text-muted-foreground whitespace-nowrap hidden lg:block'>
              Total <span className='text-primary font-bold'>{meta.total}</span>{' '}
              Employees
            </div>
          </div>

          {/* BAGIAN KANAN: Advanced Filter */}
          <EmployeeFilter
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
              ? 'Tidak ada data karyawan yang cocok dengan filter.'
              : 'Tidak ada data karyawan yang ditemukan.'
          }
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </div>

      <EmployeeFormModal
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
              Apakah Anda yakin ingin menghapus data karyawan ini?
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
