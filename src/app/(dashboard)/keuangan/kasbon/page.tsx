// src/app/(dashboard)/keuangan/kasbon/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Banknote,
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
  CashAdvanceRow,
  LocalCashAdvanceFormValues,
} from '@/components/Keuangan/CashAdvance/schema';
import {
  CashAdvanceFilter,
  CashAdvanceFilterState,
} from '@/components/Keuangan/CashAdvance/CashAdvanceFilter';
import { CashAdvanceDetailModal } from '@/components/Keuangan/CashAdvance/CashAdvanceDetailModal';
import { CashAdvanceFormModal } from '@/components/Keuangan/CashAdvance/CashAdvanceFormModal';

const columnHelper = createColumnHelper<CashAdvanceRow>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function CashAdvancePage() {
  const [data, setData] = useState<CashAdvanceRow[]>([]);
  const [employees, setEmployees] = useState<
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

  // Filter States (Hanya Date & Employee)
  const emptyFilters: CashAdvanceFilterState = { employee_id: 'ALL', date: '' };
  const [filterInput, setFilterInput] =
    useState<CashAdvanceFilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<CashAdvanceFilterState>(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<CashAdvanceRow | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.employee_id !== 'ALL') count++;
    if (appliedFilters.date) count++;
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

      if (appliedFilters.employee_id && appliedFilters.employee_id !== 'ALL') {
        params.append('employee_id', appliedFilters.employee_id);
      }
      if (appliedFilters.date) {
        params.append('date', appliedFilters.date);
      }

      const [kasbonRes, employeeRes] = await Promise.all([
        api.get<any>(`/v1/cash-advances?${params.toString()}`),
        api.get<any>('/v1/employees?pageSize=1000'),
      ]);

      const employeeList = Array.isArray(employeeRes.data)
        ? employeeRes.data
        : employeeRes.data?.rows || [];
      setEmployees(
        employeeList.map((e: any) => ({ label: e.name, value: e.id })),
      );

      const kasbonList = Array.isArray(kasbonRes.data)
        ? kasbonRes.data
        : kasbonRes.data?.rows || [];

      const mappedData: CashAdvanceRow[] = kasbonList.map((item: any) => ({
        ...item,
        employee_name:
          employeeList.find((e: any) => e.id === item.employee_id)?.name ||
          'Unknown Employee',
      }));

      setData(mappedData);
      setMeta(
        kasbonRes.meta?.pagination || {
          total: kasbonList.length,
          pageCount: 1,
          page: 1,
          pageSize: 10,
        },
      );
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data kasbon dari server.');
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

  const handleOpenDetail = (kasbon: CashAdvanceRow) => {
    setSelectedData(kasbon);
    setIsDetailOpen(true);
  };
  const handleOpenDialog = (kasbon?: CashAdvanceRow) => {
    setSelectedData(kasbon || null);
    setIsDialogOpen(true);
  };

  const handleSubmitForm = async (values: LocalCashAdvanceFormValues) => {
    try {
      if (selectedData?.id) {
        await api.put(`/v1/cash-advances/${selectedData.id}`, values);
        toast.success('Data kasbon berhasil diperbarui.');
      } else {
        await api.post('/v1/cash-advances', values);
        toast.success('Kasbon baru berhasil dicatat.');
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
      await api.delete(`/v1/kasbons/${deletingId}`);
      toast.success('Kasbon berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data kasbon.');
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
      columnHelper.accessor('employee_name', {
        header: 'Nama Karyawan',
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('amount', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('amount')}
          >
            Nominal (Rp) <SortIcon columnId='amount' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-bold text-emerald-600'>
            Rp {(info.getValue() || 0).toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper.accessor('description', {
        header: 'Keterangan',
        cell: (info) => (
          <span className='text-sm text-muted-foreground truncate max-w-[200px] inline-block'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const isLunas = info.getValue() === 'Lunas';
          return (
            <Badge
              variant='outline'
              className={
                isLunas
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
              }
            >
              {info.getValue() || 'Belum Lunas'}
            </Badge>
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
            <Banknote className='w-6 h-6 text-primary' /> Kasbon
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan pinjaman (Cash Advance) karyawan dan rincian potongan
            gaji bulanan.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Catat Kasbon
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
          <div className='text-sm font-medium text-muted-foreground whitespace-nowrap hidden lg:block'>
            Total <span className='text-primary font-bold'>{meta.total}</span>{' '}
            Catatan
          </div>

          <CashAdvanceFilter
            filterInput={filterInput}
            setFilterInput={setFilterInput}
            activeFilterCount={activeFilterCount}
            isFilterOpen={isFilterOpen}
            setIsFilterOpen={setIsFilterOpen}
            applyFilters={applyFilters}
            resetFilters={resetFilters}
            employees={employees}
          />
        </div>

        <DataTable
          columns={columns as any}
          data={data}
          isLoading={isLoading}
          emptyMessage={
            activeFilterCount > 0
              ? 'Tidak ada data kasbon yang cocok dengan filter.'
              : 'Belum ada catatan kasbon.'
          }
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </div>

      <CashAdvanceDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        selectedData={selectedData}
      />
      <CashAdvanceFormModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialData={selectedData}
        onSubmit={handleSubmitForm}
        employees={employees}
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
              Apakah Anda yakin ingin menghapus data kasbon ini?
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
