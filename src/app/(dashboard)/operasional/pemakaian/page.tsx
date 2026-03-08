'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Droplets,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gauge,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { z } from 'zod';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
import { DataTable } from '@/components/_shared/DataTable';
import { Modal } from '@/components/_shared/Modal';
import { TableActions } from '@/components/_shared/TableActions';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

type TabTypes = 'delta_pressure' | 'evc' | 'turbine';

// Schema Master untuk mencakup ke-3 form (Validasi fleksibel di UI, di-filter saat hit API)
const usageSchema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  license_plate: z.string().optional(),
  gtm_type: z.string().optional(),
  gtm_number: z.string().optional(),

  lwc: z.coerce.number().optional(),
  vol_nm3_at_200_bar_g: z.coerce.number().optional(),
  pressure_start: z.coerce.number().optional(),
  pressure_finish: z.coerce.number().optional(),
  pressure_difference: z.coerce.number().optional(),

  turbine_start: z.coerce.number().optional(),
  turbine_finish: z.coerce.number().optional(),
  turbine_difference: z.coerce.number().optional(),

  evc_start: z.coerce.number().optional(),
  evc_finish: z.coerce.number().optional(),
  evc_difference_sm3: z.coerce.number().optional(),

  supply_pressure: z.coerce.number().optional(),
  temp_avg_prs: z.coerce.number().optional(),
  compression_factor: z.coerce.number().optional(),
  temp_base: z.coerce.number().optional(),
  pressure_standard: z.coerce.number().optional(),
  pressure_atm_standard: z.coerce.number().optional(),

  total_sm3: z.coerce.number().optional(),
  ghv: z.coerce.number().optional(),
  standard_1_sm3: z.coerce.number().optional(),
  mmbtu: z.coerce.number().optional(),
  mmbtu_per_sm3: z.coerce.number().optional(),

  currency: z.string().min(1),
  exchange_rate: z.coerce.number().optional(),
  price_per_sm3: z.coerce.number().optional(),
  total_sales: z.coerce.number().optional(),
});

type UsageFormValues = z.infer<typeof usageSchema>;

const columnHelper = createColumnHelper<any>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function PemakaianGasPage() {
  const [activeTab, setActiveTab] = useState<TabTypes>('delta_pressure');

  const [data, setData] = useState<any[]>([]);
  const [customers, setCustomers] = useState<
    { label: string; value: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Server-Side States ---
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
  const emptyFilters = { license_plate: '', gtm_number: '' };
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<UsageFormValues>({
    resolver: zodResolver(usageSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      currency: 'IDR',
      exchange_rate: 1,
    },
  });

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

      if (appliedFilters.license_plate && activeTab !== 'turbine')
        params.append('license_plate', appliedFilters.license_plate);
      if (appliedFilters.gtm_number && activeTab !== 'delta_pressure')
        params.append('gtm_number', appliedFilters.gtm_number);

      const endpoint = endpointMap[activeTab];
      const res = await api.get<any>(`${endpoint}?${params.toString()}`);

      const list = Array.isArray(res.data) ? res.data : res.data?.rows || [];

      // Inject Customer Name manually for UI
      const enrichedData = list.map((item: any) => ({
        ...item,
        customer_name:
          customers.find((c) => c.value === item.customer_id)?.label ||
          'Unknown Customer',
      }));

      setData(enrichedData);

      if (res.meta?.pagination) {
        setMeta(res.meta.pagination);
      } else {
        setMeta({ total: list.length, pageCount: 1, page: 1, pageSize: 10 });
      }
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
    if (row) {
      setEditingId(row.id);
      form.reset({
        ...row,
        date: row.date
          ? new Date(row.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
      });
    } else {
      setEditingId(null);
      form.reset({
        date: new Date().toISOString().split('T')[0],
        currency: 'IDR',
        exchange_rate: 1,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: UsageFormValues) => {
    try {
      const endpoint = endpointMap[activeTab];

      // Filter payload sesuai dengan DTO Backend per tabel
      let payload: any = {
        date: values.date,
        customer_id: values.customer_id,
        currency: values.currency,
        exchange_rate: values.exchange_rate,
        price_per_sm3: values.price_per_sm3,
        total_sales: values.total_sales,
      };

      if (activeTab === 'delta_pressure') {
        payload = {
          ...payload,
          license_plate: values.license_plate,
          gtm_type: values.gtm_type,
          lwc: values.lwc,
          vol_nm3_at_200_bar_g: values.vol_nm3_at_200_bar_g,
          pressure_start: values.pressure_start,
          pressure_finish: values.pressure_finish,
          pressure_difference: values.pressure_difference,
          total_sm3: values.total_sm3,
          ghv: values.ghv,
          standard_1_sm3: values.standard_1_sm3,
          mmbtu: values.mmbtu,
          mmbtu_per_sm3: values.mmbtu_per_sm3,
        };
      } else if (activeTab === 'evc') {
        payload = {
          ...payload,
          license_plate: values.license_plate,
          gtm_number: values.gtm_number,
          turbine_start: values.turbine_start,
          turbine_finish: values.turbine_finish,
          turbine_difference: values.turbine_difference,
          evc_start: values.evc_start,
          evc_finish: values.evc_finish,
          evc_difference_sm3: values.evc_difference_sm3,
        };
      } else if (activeTab === 'turbine') {
        payload = {
          ...payload,
          gtm_number: values.gtm_number,
          turbine_start: values.turbine_start,
          turbine_finish: values.turbine_finish,
          turbine_difference: values.turbine_difference,
          supply_pressure: values.supply_pressure,
          temp_avg_prs: values.temp_avg_prs,
          compression_factor: values.compression_factor,
          temp_base: values.temp_base,
          pressure_standard: values.pressure_standard,
          pressure_atm_standard: values.pressure_atm_standard,
          total_sm3: values.total_sm3,
          ghv: values.ghv,
          standard_1_sm3: values.standard_1_sm3,
          mmbtu: values.mmbtu,
        };
      }

      if (editingId) {
        await api.put(`${endpoint}/${editingId}`, payload);
        toast.success('Data pemakaian berhasil diperbarui.');
      } else {
        await api.post(endpoint, payload);
        toast.success('Data pemakaian baru berhasil dicatat.');
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
      toast.success('Data pemakaian berhasil dihapus.');
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

  // --- Dynamic Table Columns ---
  const getColumns = () => {
    const baseCols = [
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
      columnHelper.display({
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
        {/* TAB LIST & ACTION BAR */}
        <div className='p-4 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/20'>
          <TabsList className='bg-background border border-border'>
            <TabsTrigger value='delta_pressure'>Delta Pressure</TabsTrigger>
            <TabsTrigger value='evc'>EVC</TabsTrigger>
            <TabsTrigger value='turbine'>Turbin</TabsTrigger>
          </TabsList>

          <div className='flex items-center gap-4 w-full md:w-auto justify-between'>
            <div className='text-sm font-medium text-muted-foreground'>
              Total <span className='text-primary font-bold'>{meta.total}</span>{' '}
              Data
            </div>

            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className='border-border shadow-sm flex items-center gap-2 relative bg-background'
                >
                  <Filter className='w-4 h-4 text-muted-foreground' />
                  Filter
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
                  <h4 className='font-heading font-bold text-sm text-foreground'>
                    Filter Spesifik
                  </h4>
                  <div className='space-y-3'>
                    {activeTab !== 'turbine' && (
                      <Input
                        label='Plat Nomor Kendaraan'
                        placeholder='Ketik Plat...'
                        value={filterInput.license_plate}
                        onChange={(e) =>
                          setFilterInput({
                            ...filterInput,
                            license_plate: e.target.value,
                          })
                        }
                      />
                    )}
                    {activeTab !== 'delta_pressure' && (
                      <Input
                        label='Nomor GTM'
                        placeholder='Ketik GTM...'
                        value={filterInput.gtm_number}
                        onChange={(e) =>
                          setFilterInput({
                            ...filterInput,
                            gtm_number: e.target.value,
                          })
                        }
                      />
                    )}
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
                      Terapkan
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* TAB CONTENTS (Same Table Component, Dynamic Columns) */}
        <TabsContent value={activeTab} className='m-0 border-none outline-none'>
          <DataTable
            columns={getColumns()}
            data={data}
            isLoading={isLoading}
            emptyMessage={`Belum ada riwayat pemakaian untuk metode ${activeTab}.`}
          />
        </TabsContent>

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
              <select
                className='h-8 rounded-md border border-border bg-background px-2 text-sm'
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} per hal
                  </option>
                ))}
              </select>
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
      </Tabs>

      {/* MODAL VIEW DETAIL */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Detail Pemakaian - ${activeTab.toUpperCase()}`}
        size='md'
        footer={
          <div className='flex justify-end w-full'>
            <Button variant='outline' onClick={() => setIsDetailOpen(false)}>
              Tutup
            </Button>
          </div>
        }
      >
        {selectedData && (
          <div className='space-y-6 py-2'>
            <div className='flex items-center gap-3 pb-4 border-b border-border/50'>
              <div className='h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary'>
                <FileText className='h-5 w-5' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Customer</p>
                <p className='text-lg font-bold text-foreground'>
                  {selectedData.customer_name}
                </p>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border border-border/50'>
              <div>
                <p className='text-xs text-muted-foreground'>Tanggal</p>
                <p className='font-medium text-sm'>
                  {selectedData.date
                    ? format(new Date(selectedData.date), 'dd MMM yyyy')
                    : '-'}
                </p>
              </div>
              {selectedData.license_plate && (
                <div>
                  <p className='text-xs text-muted-foreground'>Plat Nomor</p>
                  <p className='font-medium text-sm font-mono'>
                    {selectedData.license_plate}
                  </p>
                </div>
              )}
              {selectedData.gtm_number && (
                <div>
                  <p className='text-xs text-muted-foreground'>GTM Number</p>
                  <p className='font-medium text-sm font-mono'>
                    {selectedData.gtm_number}
                  </p>
                </div>
              )}
              {selectedData.total_sm3 !== undefined && (
                <div>
                  <p className='text-xs text-muted-foreground'>Total SM3</p>
                  <p className='font-bold text-sm text-emerald-600 font-mono'>
                    {selectedData.total_sm3}
                  </p>
                </div>
              )}
              {selectedData.mmbtu !== undefined && (
                <div>
                  <p className='text-xs text-muted-foreground'>Total MMBTU</p>
                  <p className='font-bold text-sm text-primary font-mono'>
                    {selectedData.mmbtu}
                  </p>
                </div>
              )}
            </div>
            <div className='flex flex-col gap-3 bg-primary/5 p-4 rounded-lg border border-primary/20'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-muted-foreground'>
                  Harga / Satuan
                </span>
                <span className='text-sm font-mono font-medium'>
                  Rp {(selectedData.price_per_sm3 || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className='flex justify-between items-center pt-2 border-t border-primary/20 mt-1'>
                <span className='text-sm font-bold text-foreground'>
                  Total Penjualan
                </span>
                <span className='text-lg font-bold font-mono text-emerald-600'>
                  {selectedData.currency === 'USD' ? '$' : 'Rp'}{' '}
                  {(selectedData.total_sales || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL FORM CREATE / EDIT */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={
          editingId
            ? `Edit Data ${activeTab.toUpperCase()}`
            : `Catat Pemakaian - ${activeTab.toUpperCase()}`
        }
        size='xl'
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
              form='usage-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        }
      >
        <form
          id='usage-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6 py-2'
        >
          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <DatePicker
              label='Tanggal Pengisian'
              required
              value={form.watch('date')}
              onChange={(val) => form.setValue('date', val)}
              error={form.formState.errors.date?.message}
            />
            <Select
              label='Pilih Customer'
              required
              options={customers}
              value={form.watch('customer_id')}
              onChange={(val) => form.setValue('customer_id', val)}
              error={form.formState.errors.customer_id?.message}
            />
          </div>

          <div className='bg-muted/30 p-4 rounded-xl border border-border/60 space-y-4'>
            <h3 className='text-sm font-bold uppercase text-primary tracking-wider mb-2'>
              Data Pengukuran ({activeTab})
            </h3>

            {/* Fields Delta Pressure */}
            {activeTab === 'delta_pressure' && (
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <Input
                  label='Plat Kendaraan'
                  {...form.register('license_plate')}
                />
                <Input label='Tipe GTM' {...form.register('gtm_type')} />
                <NumberInput
                  label='LWC'
                  value={form.watch('lwc')}
                  onChange={(val) => form.setValue('lwc', val)}
                />
                <NumberInput
                  label='Vol Nm3 at 200 bar'
                  value={form.watch('vol_nm3_at_200_bar_g')}
                  onChange={(val) => form.setValue('vol_nm3_at_200_bar_g', val)}
                />
                <NumberInput
                  label='Pressure Start'
                  value={form.watch('pressure_start')}
                  onChange={(val) => form.setValue('pressure_start', val)}
                />
                <NumberInput
                  label='Pressure Finish'
                  value={form.watch('pressure_finish')}
                  onChange={(val) => form.setValue('pressure_finish', val)}
                />
                <NumberInput
                  label='Pressure Diff'
                  value={form.watch('pressure_difference')}
                  onChange={(val) => form.setValue('pressure_difference', val)}
                />
                <NumberInput
                  label='Total SM3'
                  value={form.watch('total_sm3')}
                  onChange={(val) => form.setValue('total_sm3', val)}
                />
                <NumberInput
                  label='GHV'
                  value={form.watch('ghv')}
                  onChange={(val) => form.setValue('ghv', val)}
                />
                <NumberInput
                  label='Std 1 SM3'
                  value={form.watch('standard_1_sm3')}
                  onChange={(val) => form.setValue('standard_1_sm3', val)}
                />
                <NumberInput
                  label='MMBTU'
                  value={form.watch('mmbtu')}
                  onChange={(val) => form.setValue('mmbtu', val)}
                />
                <NumberInput
                  label='MMBTU per SM3'
                  value={form.watch('mmbtu_per_sm3')}
                  onChange={(val) => form.setValue('mmbtu_per_sm3', val)}
                />
              </div>
            )}

            {/* Fields EVC */}
            {activeTab === 'evc' && (
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <Input
                  label='Plat Kendaraan'
                  {...form.register('license_plate')}
                />
                <Input label='GTM Number' {...form.register('gtm_number')} />
                <NumberInput
                  label='Turbine Start'
                  value={form.watch('turbine_start')}
                  onChange={(val) => form.setValue('turbine_start', val)}
                />
                <NumberInput
                  label='Turbine Finish'
                  value={form.watch('turbine_finish')}
                  onChange={(val) => form.setValue('turbine_finish', val)}
                />
                <NumberInput
                  label='Turbine Diff'
                  value={form.watch('turbine_difference')}
                  onChange={(val) => form.setValue('turbine_difference', val)}
                />
                <NumberInput
                  label='EVC Start'
                  value={form.watch('evc_start')}
                  onChange={(val) => form.setValue('evc_start', val)}
                />
                <NumberInput
                  label='EVC Finish'
                  value={form.watch('evc_finish')}
                  onChange={(val) => form.setValue('evc_finish', val)}
                />
                <NumberInput
                  label='Selisih EVC SM3'
                  value={form.watch('evc_difference_sm3')}
                  onChange={(val) => form.setValue('evc_difference_sm3', val)}
                />
              </div>
            )}

            {/* Fields Turbine */}
            {activeTab === 'turbine' && (
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <Input label='GTM Number' {...form.register('gtm_number')} />
                <NumberInput
                  label='Turbine Start'
                  value={form.watch('turbine_start')}
                  onChange={(val) => form.setValue('turbine_start', val)}
                />
                <NumberInput
                  label='Turbine Finish'
                  value={form.watch('turbine_finish')}
                  onChange={(val) => form.setValue('turbine_finish', val)}
                />
                <NumberInput
                  label='Turbine Diff'
                  value={form.watch('turbine_difference')}
                  onChange={(val) => form.setValue('turbine_difference', val)}
                />
                <NumberInput
                  label='Supply Pressure'
                  value={form.watch('supply_pressure')}
                  onChange={(val) => form.setValue('supply_pressure', val)}
                />
                <NumberInput
                  label='Temp Avg PRS'
                  value={form.watch('temp_avg_prs')}
                  onChange={(val) => form.setValue('temp_avg_prs', val)}
                />
                <NumberInput
                  label='Comp Factor'
                  value={form.watch('compression_factor')}
                  onChange={(val) => form.setValue('compression_factor', val)}
                />
                <NumberInput
                  label='Temp Base'
                  value={form.watch('temp_base')}
                  onChange={(val) => form.setValue('temp_base', val)}
                />
                <NumberInput
                  label='Pressure Std'
                  value={form.watch('pressure_standard')}
                  onChange={(val) => form.setValue('pressure_standard', val)}
                />
                <NumberInput
                  label='Press Atm Std'
                  value={form.watch('pressure_atm_standard')}
                  onChange={(val) =>
                    form.setValue('pressure_atm_standard', val)
                  }
                />
                <NumberInput
                  label='Total SM3'
                  value={form.watch('total_sm3')}
                  onChange={(val) => form.setValue('total_sm3', val)}
                />
                <NumberInput
                  label='GHV'
                  value={form.watch('ghv')}
                  onChange={(val) => form.setValue('ghv', val)}
                />
                <NumberInput
                  label='Std 1 SM3'
                  value={form.watch('standard_1_sm3')}
                  onChange={(val) => form.setValue('standard_1_sm3', val)}
                />
                <NumberInput
                  label='MMBTU'
                  value={form.watch('mmbtu')}
                  onChange={(val) => form.setValue('mmbtu', val)}
                />
              </div>
            )}
          </div>

          <div className='bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-4'>
            <h3 className='text-sm font-bold uppercase text-primary tracking-wider mb-2'>
              Data Finansial
            </h3>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <Select
                label='Mata Uang'
                options={[
                  { label: 'IDR', value: 'IDR' },
                  { label: 'USD', value: 'USD' },
                ]}
                value={form.watch('currency')}
                onChange={(val) => form.setValue('currency', val)}
              />
              <NumberInput
                label='Kurs (Exchange Rate)'
                required
                value={form.watch('exchange_rate')}
                onChange={(val) => form.setValue('exchange_rate', val)}
              />
              <NumberInput
                label='Harga per SM3'
                required
                value={form.watch('price_per_sm3')}
                onChange={(val) => form.setValue('price_per_sm3', val)}
              />
              <NumberInput
                label='Total Sales'
                required
                value={form.watch('total_sales')}
                onChange={(val) => form.setValue('total_sales', val)}
              />
            </div>
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
