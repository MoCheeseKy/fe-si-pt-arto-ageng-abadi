// src/app/(dashboard)/accounting/coa/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  BookOpen,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/_shared/DataTable';
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
import { CoaRow, LocalCoaFormValues } from '@/components/Accounting/Coa/schema';
import {
  CoaFilter,
  CoaFilterState,
} from '@/components/Accounting/Coa/CoaFilter';
import { CoaFormModal } from '@/components/Accounting/Coa/CoaFormModal';

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

  // Main Search State (Code Akun)
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filter States (Category)
  const emptyFilters: CoaFilterState = { CoACategoryId: 'ALL' };
  const [filterInput, setFilterInput] = useState<CoaFilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<CoaFilterState>(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<CoaRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
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

      if (debouncedSearch) {
        params.append('code', debouncedSearch);
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
  }, [page, pageSize, sort, appliedFilters, debouncedSearch]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (columnId: string) => {
    setSort((prev) => {
      if (prev?.id === columnId) return { id: columnId, desc: !prev.desc };
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

  const handleOpenDialog = (coa?: CoaRow) => {
    setSelectedData(coa || null);
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: LocalCoaFormValues) => {
    try {
      const payload = {
        code: values.code,
        name: values.name,
        CoACategoryId: values.CoACategoryId,
        initialBalance: Number(values.initialBalance),
      };

      if (selectedData?.id) {
        await api.put(`/v1/accounting-coa/${selectedData.id}`, payload);
        toast.success('Data Akun berhasil diperbarui.');
      } else {
        await api.post('/v1/accounting-coa', payload);
        toast.success('Master Akun baru berhasil ditambahkan.');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Terjadi kesalahan saat menyimpan data.',
      );
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
        err.message || 'Gagal menghapus data. Akun mungkin sedang digunakan.',
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
          const rowData = info.row.original;
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
        <div className='p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto'>
            <SearchInput
              placeholder='Cari Kode Akun...'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className='w-full sm:w-64'
            />
          </div>

          <CoaFilter
            filterInput={filterInput}
            setFilterInput={setFilterInput}
            activeFilterCount={activeFilterCount}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            applyFilters={applyFilters}
            resetFilters={resetFilters}
            categories={categories}
          />
        </div>

        <DataTable
          columns={columns as any}
          data={data}
          isLoading={isLoading}
          emptyMessage={
            debouncedSearch || activeFilterCount > 0
              ? 'Tidak ada akun yang cocok dengan pencarian/filter.'
              : 'Belum ada data Chart of Accounts.'
          }
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </div>

      <CoaFormModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialData={selectedData}
        onSubmit={onSubmit}
        categories={categories}
        refreshCategories={fetchCategories}
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
