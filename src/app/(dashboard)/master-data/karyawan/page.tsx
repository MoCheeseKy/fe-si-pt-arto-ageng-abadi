'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Users,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { api } from '@/lib/api';
import { Employee } from '@/types/master';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
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

const columnHelper = createColumnHelper<Employee>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

// 1. Buat Schema Validasi Lokal yang HANYA mewajibkan name dan nik
const localEmployeeSchema = z.object({
  name: z.string().min(1, 'Nama Karyawan wajib diisi'),
  nik: z.string().min(1, 'NIK wajib diisi'),
});

type LocalEmployeeFormValues = z.infer<typeof localEmployeeSchema>;

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

  // Filter States
  const emptyFilters = { name: '', nik: '' };
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 2. Gunakan schema lokal di sini, bukan schema bawaan dari types/master
  const form = useForm<LocalEmployeeFormValues>({
    resolver: zodResolver(localEmployeeSchema as any),
    defaultValues: { name: '', nik: '' },
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

      if (appliedFilters.name) params.append('name', appliedFilters.name);
      if (appliedFilters.nik) params.append('nik', appliedFilters.nik);

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
            <Users className='w-6 h-6 text-primary' /> Master Karyawan
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
        {/* ACTION BAR */}
        <div className='p-4 border-b border-border flex justify-between items-center bg-muted/20'>
          <div className='text-sm font-medium text-muted-foreground'>
            Total <span className='text-primary font-bold'>{meta.total}</span>{' '}
            Employees
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
                    Isi parameter pencarian di bawah ini.
                  </p>
                </div>

                <div className='space-y-3'>
                  <Input
                    label='Nama Karyawan'
                    placeholder='Ketik nama...'
                    value={filterInput.name}
                    onChange={(e) =>
                      setFilterInput({ ...filterInput, name: e.target.value })
                    }
                  />
                  <Input
                    label='Nomor Induk Karyawan (NIK)'
                    placeholder='Ketik NIK...'
                    value={filterInput.nik}
                    onChange={(e) =>
                      setFilterInput({ ...filterInput, nik: e.target.value })
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

        {/* DATATABLE */}
        <DataTable
          columns={columns as any}
          data={data}
          isLoading={isLoading}
          emptyMessage='Tidak ada data karyawan yang ditemukan.'
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

      {/* MODAL FORM KARYAWAN */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
        size='sm'
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
              form='employee-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        }
      >
        <form
          id='employee-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4 py-2'
        >
          <Input
            label='Nama Lengkap'
            required
            placeholder='Nama Karyawan'
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />
          <Input
            label='Nomor Induk Karyawan (NIK)'
            required
            placeholder='Contoh: 12345678'
            error={form.formState.errors.nik?.message}
            {...form.register('nik')}
          />
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
