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
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { api } from '@/lib/api';
import { Supplier, supplierSchema, SupplierFormValues } from '@/types/master';
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

const columnHelper = createColumnHelper<Supplier>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

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

  // Filter States
  const emptyFilters = {
    company_name: '',
    address: '',
    phone_number: '',
    pic_name: '',
    pic_phone_number: '',
  };
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const activeFilterCount = useMemo(() => {
    return Object.values(appliedFilters).filter((val) => val !== '').length;
  }, [appliedFilters]);

  /**
   * Fetch data dengan parameter Server-Side (Pagination, Sorting, Filtering)
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

      if (appliedFilters.company_name)
        params.append('company_name', appliedFilters.company_name);
      if (appliedFilters.address)
        params.append('address', appliedFilters.address);
      if (appliedFilters.phone_number)
        params.append('phone_number', appliedFilters.phone_number);
      if (appliedFilters.pic_name)
        params.append('pic_name', appliedFilters.pic_name);
      if (appliedFilters.pic_phone_number)
        params.append('pic_phone_number', appliedFilters.pic_phone_number);

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
  }, [page, pageSize, sort, appliedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Handle Server-Side Sorting Trigger
   */
  const handleSort = (columnId: string) => {
    setSort((prev) => {
      if (prev?.id === columnId) {
        if (prev.desc) return null; // Reset sort
        return { id: columnId, desc: true };
      }
      return { id: columnId, desc: false }; // Default to ASC when clicked
    });
    setPage(1); // Reset ke halaman 1 saat sort berubah
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

  // UI Sort Icon Indicator
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
        {/* ACTION BAR */}
        <div className='p-4 border-b border-border flex justify-between items-center bg-muted/20'>
          <div className='text-sm font-medium text-muted-foreground'>
            Total <span className='text-primary font-bold'>{meta.total}</span>{' '}
            Suppliers
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

                <div className='space-y-3 max-h-[50vh] overflow-y-auto pr-2 pb-2'>
                  <Input
                    label='Nama Supplier'
                    placeholder='Ketik nama...'
                    value={filterInput.company_name}
                    onChange={(e) =>
                      setFilterInput({
                        ...filterInput,
                        company_name: e.target.value,
                      })
                    }
                  />
                  <Input
                    label='Alamat Supplier'
                    placeholder='Ketik alamat...'
                    value={filterInput.address}
                    onChange={(e) =>
                      setFilterInput({
                        ...filterInput,
                        address: e.target.value,
                      })
                    }
                  />
                  <Input
                    label='No. Telepon Kantor'
                    placeholder='Ketik no. telp...'
                    value={filterInput.phone_number}
                    onChange={(e) =>
                      setFilterInput({
                        ...filterInput,
                        phone_number: e.target.value,
                      })
                    }
                  />
                  <Input
                    label='Nama PIC'
                    placeholder='Ketik nama PIC...'
                    value={filterInput.pic_name}
                    onChange={(e) =>
                      setFilterInput({
                        ...filterInput,
                        pic_name: e.target.value,
                      })
                    }
                  />
                  <Input
                    label='No. Telepon PIC'
                    placeholder='Ketik no. telp PIC...'
                    value={filterInput.pic_phone_number}
                    onChange={(e) =>
                      setFilterInput({
                        ...filterInput,
                        pic_phone_number: e.target.value,
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

        {/* DATATABLE */}
        <DataTable
          columns={columns as any}
          data={data}
          isLoading={isLoading}
          emptyMessage='Tidak ada data supplier yang ditemukan.'
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

      {/* MODAL FORM SUPPLIER */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Data Supplier' : 'Tambah Supplier Baru'}
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
              form='supplier-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        }
      >
        <form
          id='supplier-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4 py-2'
        >
          <Input
            label='Nama Supplier'
            required
            placeholder='PT. Pemasok Gas'
            error={form.formState.errors.company_name?.message}
            {...form.register('company_name')}
          />
          <Input
            label='Alamat Lengkap'
            placeholder='Jl. Raya Industri No. 45'
            error={form.formState.errors.address?.message}
            {...form.register('address')}
          />
          <Input
            label='Nomor Telepon Kantor'
            placeholder='021-xxxxxxx'
            error={form.formState.errors.phone_number?.message}
            {...form.register('phone_number')}
          />
          <div className='grid grid-cols-2 gap-4 pt-2 border-t border-border/50'>
            <Input
              label='Nama PIC'
              placeholder='Nama Narahubung'
              error={form.formState.errors.pic_name?.message}
              {...form.register('pic_name')}
            />
            <Input
              label='No. Telepon PIC'
              placeholder='08xxxxxxxxxx'
              error={form.formState.errors.pic_phone_number?.message}
              {...form.register('pic_phone_number')}
            />
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
