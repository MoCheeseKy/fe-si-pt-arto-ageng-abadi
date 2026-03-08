'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  BookOpen,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { DataTable } from '@/components/_shared/DataTable';
import { Modal } from '@/components/_shared/Modal';
import { TableActions } from '@/components/_shared/TableActions';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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

// 1. FIX: Gunakan initialBalance (huruf B besar) sesuai pesan error database
const localCoaSchema = z.object({
  code: z.string().min(1, 'Kode Akun wajib diisi'),
  name: z.string().min(1, 'Nama Akun wajib diisi'),
  CoACategoryId: z.string().min(1, 'Kategori Akun wajib dipilih'),
  initialBalance: z.coerce.number().min(0, 'Saldo awal tidak boleh negatif'),
});

type LocalCoaFormValues = z.infer<typeof localCoaSchema>;

export interface CoaRow extends LocalCoaFormValues {
  id: string;
  category_name?: string;
}

const columnHelper = createColumnHelper<CoaRow>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function CoaPage() {
  const [data, setData] = useState<CoaRow[]>([]);
  const [categories, setCategories] = useState<
    { label: string; value: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Server-Side States ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<{ id: string; desc: boolean } | null>({
    id: 'code',
    desc: false,
  });
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    pageCount: 0,
    total: 0,
  });

  // Filter States
  const emptyFilters = { code: '', CoACategoryId: 'ALL' };
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal CoA & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Combobox & Modal Category States
  const [openCategoryCombobox, setOpenCategoryCombobox] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const form = useForm<LocalCoaFormValues>({
    resolver: zodResolver(localCoaSchema as any),
    defaultValues: {
      code: '',
      name: '',
      CoACategoryId: '',
      initialBalance: 0, // FIX: Gunakan initialBalance
    },
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.code !== '') count++;
    if (appliedFilters.CoACategoryId !== 'ALL') count++;
    return count;
  }, [appliedFilters]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await api.get<any>('/v1/coa-categories?pageSize=1000');
      const list = Array.isArray(res.data) ? res.data : res.data?.rows || [];
      setCategories(list.map((c: any) => ({ label: c.name, value: c.id })));
    } catch (err) {
      console.error('Gagal memuat kategori CoA', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      if (sort) {
        let dbSortColumn = sort.id;
        if (dbSortColumn === 'account_code') dbSortColumn = 'code';
        if (dbSortColumn === 'account_name') dbSortColumn = 'name';
        params.append(
          'order',
          JSON.stringify([[dbSortColumn, sort.desc ? 'DESC' : 'ASC']]),
        );
      }

      if (appliedFilters.code) {
        params.append('code', appliedFilters.code);
      }
      if (
        appliedFilters.CoACategoryId &&
        appliedFilters.CoACategoryId !== 'ALL'
      ) {
        params.append('CoACategoryId', appliedFilters.CoACategoryId);
      }

      const res = await api.get<any>(`/v1/accounting-coa?${params.toString()}`);

      const list = Array.isArray(res.data) ? res.data : res.data?.rows || [];
      setData(list);

      if (res.meta?.pagination) {
        setMeta(res.meta.pagination);
      } else {
        setMeta({ total: list.length, pageCount: 1, page: 1, pageSize: 10 });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data Master Akun dari server.');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sort, appliedFilters]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error('Nama kategori tidak boleh kosong.');
      return;
    }

    setIsSavingCategory(true);
    try {
      const res = await api.post<{ id: string; name: string }>(
        '/v1/coa-categories',
        {
          name: newCategoryName,
        },
      );
      toast.success('Kategori baru berhasil ditambahkan.');
      setNewCategoryName('');
      setIsCategoryModalOpen(false);

      await fetchCategories();
      if (res.data?.id) {
        form.setValue('CoACategoryId', res.data.id);
        form.clearErrors('CoACategoryId');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan kategori.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleOpenDialog = (coa?: CoaRow) => {
    if (coa) {
      setEditingId(coa.id);
      form.reset({
        code: coa.code,
        name: coa.name,
        CoACategoryId: coa.CoACategoryId || '',
        initialBalance: coa.initialBalance || 0, // FIX: Gunakan initialBalance
      });
    } else {
      setEditingId(null);
      form.reset({
        code: '',
        name: '',
        CoACategoryId: '',
        initialBalance: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: LocalCoaFormValues) => {
    try {
      // 🎯 FIX: Pastikan payload persis menggunakan key initialBalance (B besar)
      const payload = {
        code: values.code,
        name: values.name,
        CoACategoryId: values.CoACategoryId,
        initialBalance: Number(values.initialBalance),
      };

      if (editingId) {
        await api.put(`/v1/accounting-coa/${editingId}`, payload);
        toast.success('Data Akun berhasil diperbarui.');
      } else {
        await api.post('/v1/accounting-coa', payload);
        toast.success('Master Akun baru berhasil ditambahkan.');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Terjadi kesalahan saat menyimpan data.';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/accounting-coa/${deletingId}`);
      toast.success('Data Akun berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(
        err.message ||
          'Gagal menghapus data. Akun mungkin sedang digunakan di Jurnal Umum.',
      );
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
      columnHelper.accessor('code', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('code')}
          >
            Kode Akun <SortIcon columnId='code' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-bold text-primary'>
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
            Nama Akun <SortIcon columnId='name' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('CoACategoryId', {
        header: 'Kategori Akun',
        cell: (info) => {
          const rowData = info.row.original as any;
          const catName =
            rowData.AccountingCoACategory?.name ||
            rowData.CoACategory?.name ||
            categories.find((c) => c.value === info.getValue())?.label ||
            '-';
          return (
            <Badge
              variant='outline'
              className='bg-muted text-muted-foreground font-medium border-border'
            >
              {catName}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('initialBalance', {
        header: 'Saldo Awal',
        cell: (info) => (
          <span className='font-mono text-muted-foreground'>
            Rp {(info.getValue() || 0).toLocaleString('id-ID')}
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
    [sort, categories],
  );

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2'>
            <BookOpen className='w-6 h-6 text-primary' /> Chart of Accounts
            (CoA)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Kelola daftar master akun dan saldo awal pembukuan akuntansi.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah Akun
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
        <div className='p-4 border-b border-border flex justify-between items-center bg-muted/20'>
          <div className='text-sm font-medium text-muted-foreground'>
            Total <span className='text-primary font-bold'>{meta.total}</span>{' '}
            Akun
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
                    Pencarian data master akun.
                  </p>
                </div>

                <div className='space-y-3'>
                  <Input
                    label='Kode / Awalan Akun'
                    placeholder='Contoh: 110'
                    value={filterInput.code}
                    onChange={(e) =>
                      setFilterInput({ ...filterInput, code: e.target.value })
                    }
                  />
                  <Select
                    label='Kategori Akun'
                    options={[
                      { label: 'Semua Kategori', value: 'ALL' },
                      ...categories,
                    ]}
                    value={filterInput.CoACategoryId}
                    onChange={(val) =>
                      setFilterInput({ ...filterInput, CoACategoryId: val })
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
          emptyMessage='Belum ada data Chart of Accounts.'
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
                  {[10, 20, 50, 100].map((size) => (
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

      {/* MODAL FORM CREATE / EDIT COA */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Akun (CoA)' : 'Tambah Akun Baru'}
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
              form='coa-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        }
      >
        <form
          id='coa-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-5 py-2'
        >
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <Input
              label='Kode Akun'
              required
              placeholder='Contoh: 110-100'
              error={form.formState.errors.code?.message}
              {...form.register('code')}
            />
            <Input
              label='Nama Akun'
              required
              placeholder='Contoh: Kas Bebas'
              error={form.formState.errors.name?.message}
              {...form.register('name')}
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium leading-none'>
              Kategori Akun <span className='text-destructive'>*</span>
            </label>
            <Popover
              open={openCategoryCombobox}
              onOpenChange={setOpenCategoryCombobox}
            >
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  role='combobox'
                  aria-expanded={openCategoryCombobox}
                  className={cn(
                    'w-full justify-between font-normal h-10 px-3 border-input bg-background',
                    !form.watch('CoACategoryId') && 'text-muted-foreground',
                  )}
                >
                  {form.watch('CoACategoryId')
                    ? categories.find(
                        (c) => c.value === form.watch('CoACategoryId'),
                      )?.label
                    : 'Pilih atau cari kategori...'}
                  <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className='w-[--radix-popover-trigger-width] p-0'
                align='start'
              >
                <Command>
                  <CommandInput placeholder='Cari kategori...' />
                  <CommandList>
                    <CommandEmpty>Kategori tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {categories.map((category) => (
                        <CommandItem
                          key={category.value}
                          value={category.label}
                          onSelect={() => {
                            form.setValue('CoACategoryId', category.value);
                            form.clearErrors('CoACategoryId');
                            setOpenCategoryCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              form.watch('CoACategoryId') === category.value
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          {category.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <div className='border-t border-border p-1'>
                      <CommandItem
                        onSelect={() => {
                          setOpenCategoryCombobox(false);
                          setIsCategoryModalOpen(true);
                        }}
                        className='flex cursor-pointer items-center justify-center font-medium text-primary aria-selected:bg-primary/10 aria-selected:text-primary'
                      >
                        <Plus className='mr-2 h-4 w-4' />
                        Tambah Kategori Baru...
                      </CommandItem>
                    </div>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {form.formState.errors.CoACategoryId && (
              <p className='text-[0.8rem] font-medium text-destructive'>
                {form.formState.errors.CoACategoryId.message}
              </p>
            )}
          </div>

          <div className='grid grid-cols-1'>
            <NumberInput
              label='Saldo Awal (Initial Balance)'
              required
              value={form.watch('initialBalance')}
              onChange={(val) => form.setValue('initialBalance', val)}
              error={form.formState.errors.initialBalance?.message}
            />
          </div>
        </form>
      </Modal>

      {/* MODAL FORM TAMBAH KATEGORI (SUB-MODAL) */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title='Tambah Kategori Akun Baru'
        size='sm'
        footer={
          <div className='flex justify-end gap-2 w-full'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setIsCategoryModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type='button'
              onClick={handleAddCategory}
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={isSavingCategory}
            >
              {isSavingCategory ? 'Menyimpan...' : 'Simpan Kategori'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleAddCategory} className='space-y-4 py-2'>
          <Input
            label='Nama Kategori'
            required
            placeholder='Contoh: Aset Lancar, Modal...'
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
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
              Apakah Anda yakin ingin menghapus akun ini? Pastikan akun ini
              belum digunakan pada transaksi Jurnal Umum manapun.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Akun'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
