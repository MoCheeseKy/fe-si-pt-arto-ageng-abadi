// src/app/(dashboard)/operasional/kontrak-penawaran/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createColumnHelper, ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  FileSignature,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { DataTable, PaginationMeta } from '@/components/_shared/DataTable';
import { TableActions } from '@/components/_shared/TableActions';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

// Import Types
import { TabTypes } from '@/components/Operasional/KontrakPenawaran/schema';

// --- OFFERS ---
import { OfferFilter } from '@/components/Operasional/KontrakPenawaran/Offer/OfferFilter';
import { OfferFormModal } from '@/components/Operasional/KontrakPenawaran/Offer/OfferFormModal';
import { OfferDetailModal } from '@/components/Operasional/KontrakPenawaran/Offer/OfferDetailModal';

// --- KEY TERMS ---
import { KeyTermFilter } from '@/components/Operasional/KontrakPenawaran/KeyTerm/KeyTermFilter';
import { KeyTermFormModal } from '@/components/Operasional/KontrakPenawaran/KeyTerm/KeyTermFormModal';
import { KeyTermDetailModal } from '@/components/Operasional/KontrakPenawaran/KeyTerm/KeyTermDetailModal';

// --- PJBG ---
import { PJBGFilter } from '@/components/Operasional/KontrakPenawaran/PJBG/PJBGFilter';
import { PJBGFormModal } from '@/components/Operasional/KontrakPenawaran/PJBG/PJBGFormModal';
import { PJBGDetailModal } from '@/components/Operasional/KontrakPenawaran/PJBG/PJBGDetailModal';

const columnHelper = createColumnHelper<any>();

export default function KontrakPenawaranPage() {
  const [activeTab, setActiveTab] = useState<TabTypes>('offer');

  const [data, setData] = useState<any[]>([]);
  const [customers, setCustomers] = useState<
    { label: string; value: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Sort
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

  // Generic Filter State (Menyimpan kombinasi dari semua filter yang mungkin)
  const emptyFilters = { customer_id: '', date: '', offer_date: '' };
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any | null>(null);

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
    return Object.values(appliedFilters).filter((val) => val !== '').length;
  }, [appliedFilters]);

  const endpointMap = {
    offer: '/v1/offers',
    key_term: '/v1/contract-key-terms',
    pjbg: '/v1/contract-pjbgs',
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get<any>('/v1/customers?pageSize=1000');
      const list = Array.isArray(res.data) ? res.data : res.data?.rows || [];
      setCustomers(
        list.map((c: any) => ({ label: c.company_name, value: c.id })),
      );
    } catch (err) {
      console.error('Gagal load customer', err);
    }
  };

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

      // Inject Filter Parameters secara dinamis berdasarkan Tab
      if (activeTab === 'offer') {
        if (debouncedSearch) params.append('offer_number', debouncedSearch);
        if (appliedFilters.customer_id)
          params.append('customer_id', appliedFilters.customer_id);
        if (appliedFilters.date) params.append('date', appliedFilters.date);
      } else if (activeTab === 'key_term') {
        if (debouncedSearch) params.append('offer_number', debouncedSearch);
        if (appliedFilters.customer_id)
          params.append('customer_id', appliedFilters.customer_id);
        if (appliedFilters.offer_date)
          params.append('offer_date', appliedFilters.offer_date);
      } else if (activeTab === 'pjbg') {
        if (debouncedSearch) params.append('contract_number', debouncedSearch);
        if (appliedFilters.customer_id)
          params.append('customer_id', appliedFilters.customer_id);
      }

      const res = await api.get<any>(
        `${endpointMap[activeTab]}?${params.toString()}`,
      );
      const list = Array.isArray(res.data) ? res.data : res.data?.rows || [];

      const enrichedData = list.map((item: any) => ({
        ...item,
        customer_name:
          customers.find((c) => c.value === item.customer_id)?.label ||
          'Unknown Customer',
      }));

      setData(enrichedData);
      setMeta(
        res.meta?.pagination || {
          total: list.length,
          pageCount: 1,
          page: 1,
          pageSize: 10,
        },
      );
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data dari server.');
      toast.error('Gagal memuat data kontrak');
    } finally {
      setIsLoading(false);
    }
  }, [
    activeTab,
    page,
    pageSize,
    sort,
    appliedFilters,
    debouncedSearch,
    customers,
  ]);

  useEffect(() => {
    fetchCustomers();
  }, []);
  useEffect(() => {
    if (customers.length > 0) fetchData();
  }, [fetchData, customers]);

  const handleTabChange = (val: string) => {
    setActiveTab(val as TabTypes);
    setPage(1);
    setSort({ id: 'createdAt', desc: true });
    setAppliedFilters(emptyFilters);
    setFilterInput(emptyFilters);
    setSearchInput('');
  };

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

  const handleOpenDetail = (row: any) => {
    setSelectedData(row);
    setIsDetailOpen(true);
  };
  const handleOpenDialog = (row?: any) => {
    setSelectedData(row || null);
    setIsDialogOpen(true);
  };

  const handleSubmitForm = async (values: any) => {
    try {
      const endpoint = endpointMap[activeTab];
      if (selectedData?.id) {
        await api.put(`${endpoint}/${selectedData.id}`, values);
        toast.success('Data berhasil diperbarui.');
      } else {
        await api.post(endpoint, values);
        toast.success('Data baru berhasil ditambahkan.');
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
      await api.delete(`${endpointMap[activeTab]}/${deletingId}`);
      toast.success('Data berhasil dihapus.');
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

  const getColumns = () => {
    const baseCols: ColumnDef<any, any>[] = [
      columnHelper.accessor('customer_name', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('customer_id')}
          >
            Customer <SortIcon columnId='customer_id' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-semibold'>{info.getValue()}</span>
        ),
      }),
    ];

    if (activeTab === 'offer') {
      baseCols.push(
        columnHelper.accessor('offer_number', {
          header: 'No. Penawaran',
          cell: (info) => (
            <span className='font-mono text-primary font-medium'>
              {info.getValue() || '-'}
            </span>
          ),
        }),
        columnHelper.accessor('date', {
          header: 'Tanggal',
          cell: (info) => (
            <span>
              {info.getValue()
                ? format(new Date(info.getValue()), 'dd MMM yyyy')
                : '-'}
            </span>
          ),
        }),
        columnHelper.accessor('monthly_cng_usage_volume', {
          header: 'Vol Bulanan',
          cell: (info) => (
            <span className='font-mono'>{info.getValue() || 0}</span>
          ),
        }),
        columnHelper.accessor('cng_gas_price_per_sm3', {
          header: 'Harga/SM3',
          cell: (info) => (
            <span className='font-mono text-emerald-600'>
              Rp {(info.getValue() || 0).toLocaleString('id-ID')}
            </span>
          ),
        }),
      );
    } else if (activeTab === 'key_term') {
      baseCols.push(
        columnHelper.accessor('offer_number', {
          header: 'No. Penawaran',
          cell: (info) => (
            <span className='font-mono text-primary font-medium'>
              {info.getValue() || '-'}
            </span>
          ),
        }),
        columnHelper.accessor('offer_date', {
          header: 'Tgl Penawaran',
          cell: (info) => (
            <span>
              {info.getValue()
                ? format(new Date(info.getValue()), 'dd MMM yyyy')
                : '-'}
            </span>
          ),
        }),
        columnHelper.accessor('volume', {
          header: 'Volume',
          cell: (info) => (
            <span className='font-mono'>{info.getValue() || 0}</span>
          ),
        }),
        columnHelper.accessor('duration', {
          header: 'Durasi',
          cell: (info) => <span>{info.getValue() || '-'}</span>,
        }),
      );
    } else if (activeTab === 'pjbg') {
      baseCols.push(
        columnHelper.accessor('contract_number', {
          header: 'No. Kontrak',
          cell: (info) => (
            <span className='font-mono text-primary font-medium'>
              {info.getValue() || '-'}
            </span>
          ),
        }),
        columnHelper.accessor('duration', {
          header: 'Durasi',
          cell: (info) => <span>{info.getValue() || '-'}</span>,
        }),
      );
    }

    baseCols.push(
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
    );
    return baseCols;
  };

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2'>
            <FileSignature className='w-6 h-6 text-primary' /> Kontrak &
            Penawaran
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Kelola dokumen penawaran harga, Key Terms, dan kontrak PJBG
            pelanggan.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Buat Baru
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

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className='w-full bg-card border border-border rounded-xl shadow-soft-depth overflow-hidden flex flex-col'
      >
        <div className='p-4 border-b border-border flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-muted/20'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto'>
            <div className='text-sm font-medium text-muted-foreground whitespace-nowrap hidden xl:block'>
              Total <span className='text-primary font-bold'>{meta.total}</span>{' '}
              Data
            </div>

            <SearchInput
              placeholder={
                activeTab === 'pjbg'
                  ? 'Cari No Kontrak...'
                  : 'Cari No Penawaran...'
              }
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className='w-full sm:w-64'
            />
          </div>

          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto justify-end'>
            <TabsList className='bg-background border border-border w-full sm:w-auto'>
              <TabsTrigger value='offer'>Penawaran (Offers)</TabsTrigger>
              <TabsTrigger value='key_term'>Key Terms</TabsTrigger>
              <TabsTrigger value='pjbg'>Kontrak PJBG</TabsTrigger>
            </TabsList>

            {activeTab === 'offer' && (
              <OfferFilter
                filterInput={filterInput}
                setFilterInput={setFilterInput}
                activeFilterCount={activeFilterCount}
                isFilterOpen={isFilterOpen}
                setIsFilterOpen={setIsFilterOpen}
                applyFilters={applyFilters}
                resetFilters={resetFilters}
                customers={customers}
              />
            )}
            {activeTab === 'key_term' && (
              <KeyTermFilter
                filterInput={filterInput}
                setFilterInput={setFilterInput}
                activeFilterCount={activeFilterCount}
                isFilterOpen={isFilterOpen}
                setIsFilterOpen={setIsFilterOpen}
                applyFilters={applyFilters}
                resetFilters={resetFilters}
                customers={customers}
              />
            )}
            {activeTab === 'pjbg' && (
              <PJBGFilter
                filterInput={filterInput}
                setFilterInput={setFilterInput}
                activeFilterCount={activeFilterCount}
                isFilterOpen={isFilterOpen}
                setIsFilterOpen={setIsFilterOpen}
                applyFilters={applyFilters}
                resetFilters={resetFilters}
                customers={customers}
              />
            )}
          </div>
        </div>

        <TabsContent value={activeTab} className='m-0 border-none outline-none'>
          <DataTable
            columns={getColumns()}
            data={data}
            isLoading={isLoading}
            emptyMessage={
              debouncedSearch || activeFilterCount > 0
                ? 'Tidak ada dokumen yang cocok dengan pencarian/filter.'
                : `Belum ada data untuk kategori ${activeTab}.`
            }
            meta={meta}
            onPageChange={(newPage) => setPage(newPage)}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Dynamic Detail Modal (Terisolasi per kategori) */}
      {activeTab === 'offer' && (
        <OfferDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          selectedData={selectedData}
        />
      )}
      {activeTab === 'key_term' && (
        <KeyTermDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          selectedData={selectedData}
        />
      )}
      {activeTab === 'pjbg' && (
        <PJBGDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          selectedData={selectedData}
        />
      )}

      {/* Dynamic Form Modal (Terisolasi per kategori) */}
      {activeTab === 'offer' && (
        <OfferFormModal
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          initialData={selectedData}
          onSubmit={handleSubmitForm}
          customers={customers}
        />
      )}
      {activeTab === 'key_term' && (
        <KeyTermFormModal
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          initialData={selectedData}
          onSubmit={handleSubmitForm}
          customers={customers}
        />
      )}
      {activeTab === 'pjbg' && (
        <PJBGFormModal
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          initialData={selectedData}
          onSubmit={handleSubmitForm}
          customers={customers}
        />
      )}

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
              Apakah Anda yakin ingin menghapus data dokumen kontrak ini?
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
