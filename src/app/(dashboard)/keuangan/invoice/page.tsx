// src/app/(dashboard)/keuangan/invoice/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  Receipt,
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

// Import Komponen Terpisah
import {
  InvoiceRow,
  LocalInvoiceFormValues,
} from '@/components/Keuangan/Invoice/schema';
import {
  InvoiceFilter,
  InvoiceFilterState,
} from '@/components/Keuangan/Invoice/InvoiceFilter';
import { InvoiceDetailModal } from '@/components/Keuangan/Invoice/InvoiceDetailModal';
import { InvoiceFormModal } from '@/components/Keuangan/Invoice/InvoiceFormModal';

const columnHelper = createColumnHelper<InvoiceRow>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function InvoicePage() {
  const [data, setData] = useState<InvoiceRow[]>([]);
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

  // Main Search State (Invoice Number)
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Filter States (Status, Customer & Date)
  const emptyFilters: InvoiceFilterState = {
    status: 'ALL',
    customer_id: 'ALL',
    date: '',
  };
  const [filterInput, setFilterInput] =
    useState<InvoiceFilterState>(emptyFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<InvoiceFilterState>(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<InvoiceRow | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Search Debounce Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.status !== 'ALL') count++;
    if (appliedFilters.customer_id !== 'ALL') count++;
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

      if (debouncedSearch) params.append('invoice_number', debouncedSearch);
      if (appliedFilters.status && appliedFilters.status !== 'ALL')
        params.append('status', appliedFilters.status);
      if (appliedFilters.customer_id && appliedFilters.customer_id !== 'ALL')
        params.append('customer_id', appliedFilters.customer_id);
      if (appliedFilters.date) params.append('date', appliedFilters.date);

      const [invoiceRes, customerRes] = await Promise.all([
        api.get<any>(`/v1/invoices?${params.toString()}`),
        api.get<any>('/v1/customers?pageSize=1000'),
      ]);

      const customerList = Array.isArray(customerRes.data)
        ? customerRes.data
        : customerRes.data?.rows || [];
      setCustomers(
        customerList.map((c: any) => ({ label: c.company_name, value: c.id })),
      );

      const invoiceList = Array.isArray(invoiceRes.data)
        ? invoiceRes.data
        : invoiceRes.data?.rows || [];

      const mappedData: InvoiceRow[] = invoiceList.map((item: any) => ({
        ...item,
        customer_name:
          customerList.find((c: any) => c.id === item.customer_id)
            ?.company_name || 'Unknown Customer',
      }));

      setData(mappedData);
      setMeta(
        invoiceRes.meta?.pagination || {
          total: invoiceList.length,
          pageCount: 1,
          page: 1,
          pageSize: 10,
        },
      );
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data invoice dari server.');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sort, appliedFilters, debouncedSearch]);

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

  const handleOpenDetail = (invoice: InvoiceRow) => {
    setSelectedData(invoice);
    setIsDetailOpen(true);
  };
  const handleOpenDialog = (invoice?: InvoiceRow) => {
    setSelectedData(invoice || null);
    setIsDialogOpen(true);
  };

  const handleSubmitForm = async (values: LocalInvoiceFormValues) => {
    try {
      if (selectedData?.id) {
        await api.put(`/v1/invoices/${selectedData.id}`, values);
        toast.success('Data invoice berhasil diperbarui.');
      } else {
        await api.post('/v1/invoices', values);
        toast.success('Invoice baru berhasil dibuat.');
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
      await api.delete(`/v1/invoices/${deletingId}`);
      toast.success('Invoice berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus invoice.');
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
      columnHelper.accessor('invoice_number', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('invoice_number')}
          >
            Nomor Invoice <SortIcon columnId='invoice_number' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-bold text-primary'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
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
          <span className='font-medium'>
            {info.getValue()
              ? format(new Date(info.getValue()), 'dd MMM yyyy')
              : '-'}
          </span>
        ),
      }),
      columnHelper.accessor('customer_name', {
        header: 'Customer',
        cell: (info) => (
          <span className='font-semibold'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('total_bill', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('total_bill')}
          >
            Total Tagihan <SortIcon columnId='total_bill' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-bold text-emerald-600'>
            Rp {(info.getValue() || 0).toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          let badgeClass = 'bg-muted text-muted-foreground border-border';
          if (status === 'Paid')
            badgeClass =
              'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
          if (status === 'Unpaid')
            badgeClass =
              'bg-destructive/10 text-destructive border-destructive/20';
          if (status === 'Draft')
            badgeClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20';
          return (
            <Badge variant='outline' className={badgeClass}>
              {status || 'Draft'}
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
            <Receipt className='w-6 h-6 text-primary' /> Invoice
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pusat pengelolaan tagihan (Invoice) kepada pelanggan.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Buat Invoice
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
              placeholder='Cari No Invoice...'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className='w-full sm:w-64'
            />
          </div>

          <InvoiceFilter
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
            debouncedSearch || activeFilterCount > 0
              ? 'Tidak ada invoice yang cocok.'
              : 'Belum ada data invoice.'
          }
          meta={meta}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
        />
      </div>

      <InvoiceDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        selectedData={selectedData}
      />
      <InvoiceFormModal
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
              Apakah Anda yakin ingin menghapus data invoice ini? Data ini
              terkait dengan pencatatan akuntansi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Invoice'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
