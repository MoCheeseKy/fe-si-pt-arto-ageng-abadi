// src/app/(dashboard)/accounting/jurnal/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  BookText,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
import {
  JournalRow,
  LocalJournalFormValues,
} from '@/components/Accounting/Jurnal/schema';
import {
  JurnalFilter,
  JurnalFilterState,
} from '@/components/Accounting/Jurnal/JurnalFilter';
import { JurnalDetailModal } from '@/components/Accounting/Jurnal/JurnalDetailModal';
import { JurnalFormModal } from '@/components/Accounting/Jurnal/JurnalFormModal';

const columnHelper = createColumnHelper<JournalRow>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function JurnalUmumPage() {
  const [data, setData] = useState<JournalRow[]>([]);
  const [coaList, setCoaList] = useState<{ label: string; value: string }[]>(
    [],
  );

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Server-Side States ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<{ id: string; desc: boolean } | null>({
    id: 'transaction_date',
    desc: true,
  });
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    pageCount: 0,
    total: 0,
  });

  // Main Search State (SEKARANG: Source Module)
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filter States (SEKARANG: Month & Year)
  const emptyFilters: JurnalFilterState = { month: 'ALL', year: 'ALL' };
  const [filterInput, setFilterInput] =
    useState<JurnalFilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<JurnalFilterState>(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<JournalRow | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Efek Debounce Pencarian Source Module
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.month !== 'ALL') count++;
    if (appliedFilters.year !== 'ALL') count++;
    return count;
  }, [appliedFilters]);

  const fetchCoa = useCallback(async () => {
    try {
      const res = await api.get<any>('/v1/accounting-coa?pageSize=1000');
      const list = Array.isArray(res.data) ? res.data : res.data?.rows || [];
      setCoaList(
        list.map((c: any) => ({
          label: `${c.code} - ${c.name}`,
          value: c.code,
        })),
      );
    } catch (err) {
      console.error('Gagal memuat CoA', err);
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
        params.append(
          'order',
          JSON.stringify([[sort.id, sort.desc ? 'DESC' : 'ASC']]),
        );
      }

      // Inject Global Search sebagai Source Module
      if (debouncedSearch) {
        params.append('source_module', debouncedSearch);
      }

      // Inject Filters Month & Year
      if (appliedFilters.month && appliedFilters.month !== 'ALL') {
        params.append('month', appliedFilters.month);
      }
      if (appliedFilters.year && appliedFilters.year !== 'ALL') {
        params.append('year', appliedFilters.year);
      }

      const res = await api.get<any>(
        `/v1/accounting-journals?${params.toString()}`,
      );
      const list = Array.isArray(res.data) ? res.data : res.data?.rows || [];

      setData(list);
      setMeta(
        res.meta?.pagination || {
          total: list.length,
          pageCount: 1,
          page: 1,
          pageSize: 10,
        },
      );
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data jurnal dari server.');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sort, appliedFilters, debouncedSearch]);

  useEffect(() => {
    fetchCoa();
  }, [fetchCoa]);
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

  const handleOpenDetail = (journal: JournalRow) => {
    setSelectedData(journal);
    setIsDetailOpen(true);
  };

  const handleOpenDialog = (journal?: JournalRow) => {
    setSelectedData(journal || null);
    setIsDialogOpen(true);
  };

  const handleSubmitForm = async (values: LocalJournalFormValues) => {
    try {
      const payload = {
        transaction_date: values.transaction_date,
        description: values.description,
        source_module: values.source_module,
        entries: values.entries.map((e) => ({
          account_code: e.account_code,
          debit: Number(e.debit),
          credit: Number(e.credit),
        })),
      };

      if (selectedData?.id) {
        await api.put(`/v1/accounting-journals/${selectedData.id}`, payload);
        toast.success('Jurnal berhasil diperbarui.');
      } else {
        await api.post('/v1/accounting-journals', payload);
        toast.success('Jurnal Umum baru berhasil diposting.');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          'Terjadi kesalahan saat menyimpan jurnal.',
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/accounting-journals/${deletingId}`);
      toast.success('Data jurnal berhasil dihapus.');
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
      columnHelper.accessor('transaction_date', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('transaction_date')}
          >
            Tanggal <SortIcon columnId='transaction_date' />
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
      columnHelper.accessor('description', {
        header: 'Keterangan',
        cell: (info) => (
          <span className='text-muted-foreground'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('source_module', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('source_module')}
          >
            Sumber <SortIcon columnId='source_module' />
          </Button>
        ),
        cell: (info) => (
          <Badge
            variant='outline'
            className='bg-muted text-muted-foreground border-border uppercase text-[10px] tracking-wider'
          >
            {info.getValue() || 'Manual'}
          </Badge>
        ),
      }),
      columnHelper?.display({
        id: 'actions',
        header: () => <div className='text-right'>Aksi</div>,
        cell: (info) => (
          <TableActions
            onView={() => handleOpenDetail(info.row.original)}
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
            <BookText className='w-6 h-6 text-primary' /> Jurnal Umum (General
            Journal)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan transaksi akuntansi *double-entry* (Debit & Kredit).
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Posting Jurnal
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
              placeholder='Cari Sumber Modul...'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className='w-full sm:w-64'
            />
          </div>

          <JurnalFilter
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
              ? 'Tidak ada jurnal yang cocok dengan pencarian.'
              : 'Belum ada data Jurnal Umum yang diposting.'
          }
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </div>

      <JurnalDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        selectedData={selectedData}
      />

      <JurnalFormModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialData={selectedData}
        onSubmit={handleSubmitForm}
        coaList={coaList}
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
              Apakah Anda yakin ingin menghapus data jurnal ini secara permanen?
              Perhitungan buku besar dan neraca akan terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Jurnal'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
