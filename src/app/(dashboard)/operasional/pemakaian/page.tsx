// src/app/(dashboard)/operasional/pemakaian/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  Gauge,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { DataTable, PaginationMeta } from '@/components/_shared/DataTable';
import { TableActions } from '@/components/_shared/TableActions';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

import { TabTypes } from '@/components/Operasional/Pemakaian/schema';

// Delta Pressure Components
import { DeltaPressureFilter } from '@/components/Operasional/Pemakaian/DeltaPressure/DeltaPressureFilter';
import { DeltaPressureDetailModal } from '@/components/Operasional/Pemakaian/DeltaPressure/DeltaPressureDetailModal';
import { DeltaPressureFormModal } from '@/components/Operasional/Pemakaian/DeltaPressure/DeltaPressureFormModal';

// EVC Components
import { EvcFilter } from '@/components/Operasional/Pemakaian/Evc/EvcFilter';
import { EvcDetailModal } from '@/components/Operasional/Pemakaian/Evc/EvcDetailModal';
import { EvcFormModal } from '@/components/Operasional/Pemakaian/Evc/EvcFormModal';

// Turbine Components
import { TurbineFilter } from '@/components/Operasional/Pemakaian/Turbine/TurbineFilter';
import { TurbineDetailModal } from '@/components/Operasional/Pemakaian/Turbine/TurbineDetailModal';
import { TurbineFormModal } from '@/components/Operasional/Pemakaian/Turbine/TurbineFormModal';

const columnHelper = createColumnHelper<any>();

export default function PemakaianGasPage() {
  const [activeTab, setActiveTab] = useState<TabTypes>('delta_pressure');
  const [data, setData] = useState<any[]>([]);
  const [customers, setCustomers] = useState<
    { label: string; value: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Filter State (Tidak ada search input, hanya filter date dan customer_id)
  const emptyFilters = { customer_id: '', date: '' };
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeFilterCount = useMemo(() => {
    return Object.values(appliedFilters).filter((val) => val !== '').length;
  }, [appliedFilters]);

  const endpointMap = {
    delta_pressure: '/v1/usage-delta-pressures',
    evc: '/v1/usage-evcs',
    turbine: '/v1/usage-turbines',
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

      // Inject Filter (Berlaku seragam untuk ke 3 tab)
      if (appliedFilters.customer_id)
        params.append('customer_id', appliedFilters.customer_id);
      if (appliedFilters.date) params.append('date', appliedFilters.date);

      const endpoint = endpointMap[activeTab];
      const res = await api.get<any>(`${endpoint}?${params.toString()}`);
      const list = Array.isArray(res.data) ? res.data : res.data?.rows || [];

      // Inject Customer Name
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
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, pageSize, sort, appliedFilters, customers]);

  useEffect(() => {
    fetchCustomers();
  }, []);
  useEffect(() => {
    if (customers.length > 0) fetchData();
  }, [fetchData, customers]);

  const handleTabChange = (val: string) => {
    setActiveTab(val as TabTypes);
    setPage(1);
    setSort({ id: 'date', desc: true });
    setAppliedFilters(emptyFilters);
    setFilterInput(emptyFilters);
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
        toast.success('Data baru berhasil dicatat.');
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
    const baseCols: any[] = [
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
    ];

    if (activeTab === 'delta_pressure') {
      baseCols.push(
        columnHelper.accessor('license_plate', {
          header: 'Plat Kendaraan',
          cell: (info) => (
            <span className='font-mono'>{info.getValue() || '-'}</span>
          ),
        }),
        columnHelper.accessor('total_sm3', {
          header: 'Total SM³',
          cell: (info) => (
            <span className='font-mono text-emerald-600 font-semibold'>
              {(info.getValue() || 0).toLocaleString('id-ID')}
            </span>
          ),
        }),
        columnHelper.accessor('mmbtu', {
          header: 'MMBTU',
          cell: (info) => (
            <span className='font-mono text-primary font-semibold'>
              {(info.getValue() || 0).toLocaleString('id-ID')}
            </span>
          ),
        }),
      );
    } else if (activeTab === 'evc') {
      baseCols.push(
        columnHelper.accessor('gtm_number', {
          header: 'GTM Number',
          cell: (info) => (
            <span className='font-mono'>{info.getValue() || '-'}</span>
          ),
        }),
        columnHelper.accessor('evc_difference_sm3', {
          header: 'Selisih EVC',
          cell: (info) => (
            <span className='font-mono text-emerald-600 font-semibold'>
              {(info.getValue() || 0).toLocaleString('id-ID')}
            </span>
          ),
        }),
      );
    } else if (activeTab === 'turbine') {
      baseCols.push(
        columnHelper.accessor('gtm_number', {
          header: 'GTM Number',
          cell: (info) => (
            <span className='font-mono'>{info.getValue() || '-'}</span>
          ),
        }),
        columnHelper.accessor('total_sm3', {
          header: 'Total SM³',
          cell: (info) => (
            <span className='font-mono text-emerald-600 font-semibold'>
              {(info.getValue() || 0).toLocaleString('id-ID')}
            </span>
          ),
        }),
        columnHelper.accessor('mmbtu', {
          header: 'MMBTU',
          cell: (info) => (
            <span className='font-mono text-primary font-semibold'>
              {(info.getValue() || 0).toLocaleString('id-ID')}
            </span>
          ),
        }),
      );
    }

    baseCols.push(
      columnHelper.accessor('total_sales', {
        header: 'Total Sales',
        cell: (info) => (
          <span className='font-mono font-bold'>
            {info.row.original.currency === 'USD' ? '$' : 'Rp'}{' '}
            {(info.getValue() || 0).toLocaleString('id-ID')}
          </span>
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
    );
    return baseCols;
  };

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2'>
            <Gauge className='w-6 h-6 text-primary' /> Pemakaian Gas (Usages)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan distribusi gas ke pelanggan dengan metode yang berbeda.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Catat Pemakaian
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
        <div className='p-4 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/20'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto'></div>

          <div className='flex items-center gap-4 w-full md:w-auto justify-between'>
            <TabsList className='bg-background border border-border'>
              <TabsTrigger value='delta_pressure'>Delta Pressure</TabsTrigger>
              <TabsTrigger value='evc'>EVC</TabsTrigger>
              <TabsTrigger value='turbine'>Turbin</TabsTrigger>
            </TabsList>
            {activeTab === 'delta_pressure' && (
              <DeltaPressureFilter
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
            {activeTab === 'evc' && (
              <EvcFilter
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
            {activeTab === 'turbine' && (
              <TurbineFilter
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
              activeFilterCount > 0
                ? 'Tidak ada data yang cocok dengan filter.'
                : `Belum ada riwayat pemakaian untuk metode ${activeTab}.`
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

      {/* Dynamic Detail Modal */}
      {activeTab === 'delta_pressure' && (
        <DeltaPressureDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          selectedData={selectedData}
        />
      )}
      {activeTab === 'evc' && (
        <EvcDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          selectedData={selectedData}
        />
      )}
      {activeTab === 'turbine' && (
        <TurbineDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          selectedData={selectedData}
        />
      )}

      {/* Dynamic Form Modal */}
      {activeTab === 'delta_pressure' && (
        <DeltaPressureFormModal
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          initialData={selectedData}
          onSubmit={handleSubmitForm}
          customers={customers}
        />
      )}
      {activeTab === 'evc' && (
        <EvcFormModal
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          initialData={selectedData}
          onSubmit={handleSubmitForm}
          customers={customers}
        />
      )}
      {activeTab === 'turbine' && (
        <TurbineFormModal
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
              Apakah Anda yakin ingin menghapus data pemakaian ini?
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
