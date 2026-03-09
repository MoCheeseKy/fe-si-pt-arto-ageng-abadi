// src/app/(dashboard)/keuangan/petty-cash/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Coins,
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

// Import Komponen Terpisah
import {
  PettyCashRow,
  LocalPettyCashFormValues,
} from '@/components/Keuangan/PettyCash/schema';
import {
  PettyCashFilter,
  PettyCashFilterState,
} from '@/components/Keuangan/PettyCash/PettyCashFilter';
import { PettyCashDetailModal } from '@/components/Keuangan/PettyCash/PettyCashDetailModal';
import { PettyCashFormModal } from '@/components/Keuangan/PettyCash/PettyCashFormModal';

const columnHelper = createColumnHelper<PettyCashRow>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function PettyCashPage() {
  const [data, setData] = useState<PettyCashRow[]>([]);
  const [customers, setCustomers] = useState<
    { label: string; value: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Sort
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
  const emptyFilters: PettyCashFilterState = {
    customer_id: 'ALL',
    transaction_type: 'ALL',
    expense_type: '',
    date: '',
  };
  const [filterInput, setFilterInput] =
    useState<PettyCashFilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<PettyCashFilterState>(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<PettyCashRow | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.customer_id !== 'ALL') count++;
    if (appliedFilters.transaction_type !== 'ALL') count++;
    if (appliedFilters.expense_type !== '') count++;
    if (appliedFilters.date !== '') count++;
    return count;
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

      // Append API Filters
      if (appliedFilters.customer_id && appliedFilters.customer_id !== 'ALL')
        params.append('customer_id', appliedFilters.customer_id);
      if (
        appliedFilters.transaction_type &&
        appliedFilters.transaction_type !== 'ALL'
      )
        params.append('transaction_type', appliedFilters.transaction_type);
      if (appliedFilters.expense_type)
        params.append('expense_type', appliedFilters.expense_type);
      if (appliedFilters.date) params.append('date', appliedFilters.date);

      const [pettyCashRes, customerRes] = await Promise.all([
        api.get<any>(`/v1/petty-cashes?${params.toString()}`),
        api.get<any>('/v1/customers?pageSize=1000'),
      ]);

      const customerList = Array.isArray(customerRes.data)
        ? customerRes.data
        : customerRes.data?.rows || [];
      setCustomers(
        customerList.map((c: any) => ({ label: c.company_name, value: c.id })),
      );

      const pettyCashList = Array.isArray(pettyCashRes.data)
        ? pettyCashRes.data
        : pettyCashRes.data?.rows || [];

      const mappedData: PettyCashRow[] = pettyCashList.map((item: any) => ({
        ...item,
        customer_name:
          customerList.find((c: any) => c.id === item.customer_id)
            ?.company_name || 'Unknown Customer',
      }));

      setData(mappedData);
      setMeta(
        pettyCashRes.meta?.pagination || {
          total: pettyCashList.length,
          pageCount: 1,
          page: 1,
          pageSize: 10,
        },
      );
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data kas kecil dari server.');
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

  const handleOpenDetail = (pettyCash: PettyCashRow) => {
    setSelectedData(pettyCash);
    setIsDetailOpen(true);
  };
  const handleOpenDialog = (pettyCash?: PettyCashRow) => {
    setSelectedData(pettyCash || null);
    setIsDialogOpen(true);
  };

  const handleSubmitForm = async (values: LocalPettyCashFormValues) => {
    try {
      if (selectedData?.id) {
        await api.put(`/v1/petty-cashes/${selectedData.id}`, values);
        toast.success('Catatan kas kecil berhasil diperbarui.');
      } else {
        await api.post('/v1/petty-cashes', values);
        toast.success('Catatan kas kecil baru berhasil ditambahkan.');
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
      await api.delete(`/v1/petty-cashes/${deletingId}`);
      toast.success('Catatan kas kecil berhasil dihapus.');
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
            className='p-0 font-bold uppercase hover:bg-transparent'
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
      columnHelper.accessor('transaction_type', {
        header: 'Tipe Transaksi',
        cell: (info) => (
          <Badge
            variant='outline'
            className={
              info.getValue() === 'Pemasukan'
                ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10'
                : 'text-amber-500 border-amber-500/30 bg-amber-500/10'
            }
          >
            {info.getValue() || '-'}
          </Badge>
        ),
      }),
      columnHelper.accessor('customer_name', {
        header: 'Customer',
        cell: (info) => (
          <div className='flex flex-col'>
            <span className='font-semibold text-foreground truncate max-w-[180px]'>
              {info.getValue()}
            </span>
            <span className='text-[10px] uppercase font-bold tracking-wider text-muted-foreground'>
              {info.row.original.expense_type}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('total', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('total')}
          >
            Nominal (Rp) <SortIcon columnId='total' />
          </Button>
        ),
        cell: (info) => {
          const isIncome = info.row.original.transaction_type === 'Pemasukan';
          return (
            <span
              className={`font-mono font-bold ${isIncome ? 'text-emerald-600' : 'text-foreground'}`}
            >
              {isIncome ? '+' : '-'}{' '}
              {(info.getValue() || 0).toLocaleString('id-ID')}
            </span>
          );
        },
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
            <Coins className='w-6 h-6 text-primary' /> Petty Cash
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan kas kecil harian, pemasukan, dan pengeluaran minor.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Catat Kas Kecil
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
          <div />

          <PettyCashFilter
            filterInput={filterInput}
            setFilterInput={setFilterInput}
            activeFilterCount={activeFilterCount}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            applyFilters={applyFilters}
            resetFilters={resetFilters}
            customers={customers}
          />
        </div>

        <DataTable
          columns={columns as any}
          data={data}
          isLoading={isLoading}
          emptyMessage={
            activeFilterCount > 0
              ? 'Tidak ada data kas kecil yang cocok.'
              : 'Belum ada catatan kas kecil.'
          }
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </div>

      <PettyCashDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        selectedData={selectedData}
      />
      <PettyCashFormModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialData={selectedData}
        onSubmit={handleSubmitForm}
        customers={customers}
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
              Apakah Anda yakin ingin menghapus data kas kecil ini? Saldo akhir
              petty cash akan menyesuaikan ulang secara otomatis.
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
