'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper, ColumnDef } from '@tanstack/react-table';
import {
  Plus,
  FileSignature,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { z } from 'zod';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
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

type TabTypes = 'offer' | 'key_term' | 'pjbg';

// Schema Master untuk mencakup ke-3 form
const contractSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),

  // Shared & Key Term fields
  offer_number: z.string().optional(),
  offer_date: z.string().optional(),
  volume: z.coerce.number().optional(),
  duration: z.string().optional(),
  price_type: z.string().optional(),
  moq: z.coerce.number().optional(),
  billing_type: z.string().optional(),

  // PJBG fields
  contract_number: z.string().optional(),

  // Offer fields
  date: z.string().optional(),
  implementation: z.string().optional(),
  monthly_cng_usage_volume: z.coerce.number().optional(),
  standard_ghv_specification: z.string().optional(),
  cng_mother_station_location: z.string().optional(),
  cng_gas_price_per_sm3: z.coerce.number().optional(),
  payment_method: z.string().optional(),
  price_includes: z.string().optional(),
  contract_period: z.string().optional(),
  preparation_time: z.string().optional(),
  validity: z.string().optional(),
});

type ContractFormValues = z.infer<typeof contractSchema>;

const columnHelper = createColumnHelper<any>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function KontrakPenawaranPage() {
  const [activeTab, setActiveTab] = useState<TabTypes>('offer');

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
  const emptyFilters = { offer_number: '', contract_number: '' };
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<any | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema as any),
    defaultValues: { customer_id: '' },
  });

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

      if (appliedFilters.offer_number && activeTab !== 'pjbg')
        params.append('offer_number', appliedFilters.offer_number);
      if (appliedFilters.contract_number && activeTab === 'pjbg')
        params.append('contract_number', appliedFilters.contract_number);

      const endpoint = endpointMap[activeTab];
      const res = await api.get<any>(`${endpoint}?${params.toString()}`);

      const list = Array.isArray(res.data) ? res.data : res.data?.rows || [];

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
      toast.error('Gagal memuat data kontrak');
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
    setSort({ id: 'createdAt', desc: true });
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
        date: row.date ? new Date(row.date).toISOString().split('T')[0] : '',
        offer_date: row.offer_date
          ? new Date(row.offer_date).toISOString().split('T')[0]
          : '',
      });
    } else {
      setEditingId(null);
      form.reset({
        customer_id: '',
        date: new Date().toISOString().split('T')[0],
        offer_date: new Date().toISOString().split('T')[0],
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: ContractFormValues) => {
    try {
      const endpoint = endpointMap[activeTab];

      let payload: any = { customer_id: values.customer_id };

      if (activeTab === 'offer') {
        payload = {
          ...payload,
          offer_number: values.offer_number,
          date: values.date,
          implementation: values.implementation,
          monthly_cng_usage_volume: values.monthly_cng_usage_volume,
          standard_ghv_specification: values.standard_ghv_specification,
          cng_mother_station_location: values.cng_mother_station_location,
          cng_gas_price_per_sm3: values.cng_gas_price_per_sm3,
          payment_method: values.payment_method,
          price_includes: values.price_includes,
          contract_period: values.contract_period,
          preparation_time: values.preparation_time,
          validity: values.validity,
        };
      } else if (activeTab === 'key_term') {
        payload = {
          ...payload,
          offer_number: values.offer_number,
          offer_date: values.offer_date,
          volume: values.volume,
          duration: values.duration,
          price_type: values.price_type,
          moq: values.moq,
          billing_type: values.billing_type,
        };
      } else if (activeTab === 'pjbg') {
        payload = {
          ...payload,
          contract_number: values.contract_number,
          duration: values.duration,
        };
      }

      if (editingId) {
        await api.put(`${endpoint}/${editingId}`, payload);
        toast.success('Data berhasil diperbarui.');
      } else {
        await api.post(endpoint, payload);
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

  // --- Dynamic Table Columns ---
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
          header: 'Nomor Penawaran',
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
          header: 'Nomor Penawaran',
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
          header: 'Nomor Kontrak',
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
        {/* TAB LIST & ACTION BAR */}
        <div className='p-4 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-muted/20'>
          <TabsList className='bg-background border border-border'>
            <TabsTrigger value='offer'>Penawaran (Offers)</TabsTrigger>
            <TabsTrigger value='key_term'>Key Terms</TabsTrigger>
            <TabsTrigger value='pjbg'>Kontrak PJBG</TabsTrigger>
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
                    {activeTab !== 'pjbg' && (
                      <Input
                        label='Nomor Penawaran'
                        placeholder='Ketik No Offer...'
                        value={filterInput.offer_number}
                        onChange={(e) =>
                          setFilterInput({
                            ...filterInput,
                            offer_number: e.target.value,
                          })
                        }
                      />
                    )}
                    {activeTab === 'pjbg' && (
                      <Input
                        label='Nomor Kontrak'
                        placeholder='Ketik No Kontrak...'
                        value={filterInput.contract_number}
                        onChange={(e) =>
                          setFilterInput({
                            ...filterInput,
                            contract_number: e.target.value,
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

        {/* TAB CONTENTS */}
        <TabsContent value={activeTab} className='m-0 border-none outline-none'>
          <DataTable
            columns={getColumns()}
            data={data}
            isLoading={isLoading}
            emptyMessage={`Belum ada data untuk kategori ${activeTab}.`}
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
        title={`Detail Dokumen`}
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
          <div className='space-y-5 py-2'>
            <div className='flex items-center gap-3 pb-3 border-b border-border/50'>
              <div className='h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary'>
                <FileSignature className='h-5 w-5' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Customer / Perusahaan
                </p>
                <p className='text-lg font-bold text-foreground'>
                  {selectedData.customer_name}
                </p>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4'>
              {selectedData.offer_number && (
                <div>
                  <p className='text-xs text-muted-foreground'>
                    Nomor Penawaran
                  </p>
                  <p className='font-medium text-sm font-mono text-primary'>
                    {selectedData.offer_number}
                  </p>
                </div>
              )}
              {selectedData.contract_number && (
                <div>
                  <p className='text-xs text-muted-foreground'>
                    Nomor Kontrak PJBG
                  </p>
                  <p className='font-medium text-sm font-mono text-primary'>
                    {selectedData.contract_number}
                  </p>
                </div>
              )}
              {selectedData.date && (
                <div>
                  <p className='text-xs text-muted-foreground'>Tanggal</p>
                  <p className='font-medium text-sm'>
                    {format(new Date(selectedData.date), 'dd MMM yyyy')}
                  </p>
                </div>
              )}
              {selectedData.offer_date && (
                <div>
                  <p className='text-xs text-muted-foreground'>
                    Tanggal Penawaran
                  </p>
                  <p className='font-medium text-sm'>
                    {format(new Date(selectedData.offer_date), 'dd MMM yyyy')}
                  </p>
                </div>
              )}
              {selectedData.duration && (
                <div>
                  <p className='text-xs text-muted-foreground'>
                    Durasi Kontrak
                  </p>
                  <p className='font-medium text-sm'>{selectedData.duration}</p>
                </div>
              )}
              {selectedData.contract_period && (
                <div>
                  <p className='text-xs text-muted-foreground'>
                    Periode Kontrak
                  </p>
                  <p className='font-medium text-sm'>
                    {selectedData.contract_period}
                  </p>
                </div>
              )}
            </div>

            {activeTab === 'offer' && (
              <div className='space-y-3 bg-muted/20 p-4 rounded-lg border border-border/50 mt-2'>
                <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  Spesifikasi Penawaran
                </h4>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-xs text-muted-foreground'>
                      Harga per SM3
                    </p>
                    <p className='font-semibold font-mono text-emerald-600 text-sm'>
                      Rp{' '}
                      {(selectedData.cng_gas_price_per_sm3 || 0).toLocaleString(
                        'id-ID',
                      )}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>Vol Bulanan</p>
                    <p className='font-semibold text-sm'>
                      {selectedData.monthly_cng_usage_volume || 0}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>
                      Metode Pembayaran
                    </p>
                    <p className='font-medium text-sm'>
                      {selectedData.payment_method || '-'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>
                      Masa Berlaku
                    </p>
                    <p className='font-medium text-sm'>
                      {selectedData.validity || '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'key_term' && (
              <div className='space-y-3 bg-muted/20 p-4 rounded-lg border border-border/50 mt-2'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <p className='text-xs text-muted-foreground'>Volume</p>
                    <p className='font-semibold text-sm'>
                      {selectedData.volume || 0}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>
                      Minimum Order Qty
                    </p>
                    <p className='font-semibold text-sm'>
                      {selectedData.moq || 0}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>Tipe Harga</p>
                    <p className='font-medium text-sm'>
                      {selectedData.price_type || '-'}
                    </p>
                  </div>
                  <div>
                    <p className='text-xs text-muted-foreground'>
                      Tipe Penagihan
                    </p>
                    <p className='font-medium text-sm'>
                      {selectedData.billing_type || '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* MODAL FORM CREATE / EDIT */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={
          editingId
            ? `Edit ${activeTab.toUpperCase()}`
            : `Buat Dokumen - ${activeTab.toUpperCase()}`
        }
        size={activeTab === 'offer' ? 'lg' : 'md'}
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
              form='contract-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        }
      >
        <form
          id='contract-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-5 py-2'
        >
          <Select
            label='Pilih Customer'
            required
            options={customers}
            value={form.watch('customer_id')}
            onChange={(val) => form.setValue('customer_id', val)}
            error={form.formState.errors.customer_id?.message}
          />

          {/* Fields Offer */}
          {activeTab === 'offer' && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input
                label='Nomor Penawaran'
                {...form.register('offer_number')}
              />
              <DatePicker
                label='Tanggal Penawaran'
                value={form.watch('date')}
                onChange={(val) => form.setValue('date', val)}
              />
              <NumberInput
                label='Volume Pemakaian Bulanan'
                value={form.watch('monthly_cng_usage_volume')}
                onChange={(val) =>
                  form.setValue('monthly_cng_usage_volume', val)
                }
              />
              <NumberInput
                label='Harga Gas CNG (Rp/SM3)'
                value={form.watch('cng_gas_price_per_sm3')}
                onChange={(val) => form.setValue('cng_gas_price_per_sm3', val)}
              />
              <Input
                label='Pelaksanaan (Implementation)'
                {...form.register('implementation')}
              />
              <Input
                label='Spesifikasi GHV Standar'
                {...form.register('standard_ghv_specification')}
              />
              <Input
                label='Lokasi Mother Station'
                {...form.register('cng_mother_station_location')}
              />
              <Input
                label='Harga Termasuk (Price Includes)'
                {...form.register('price_includes')}
              />
              <Input
                label='Metode Pembayaran'
                {...form.register('payment_method')}
              />
              <Input
                label='Periode Kontrak'
                {...form.register('contract_period')}
              />
              <Input
                label='Waktu Persiapan'
                {...form.register('preparation_time')}
              />
              <Input
                label='Masa Berlaku (Validity)'
                {...form.register('validity')}
              />
            </div>
          )}

          {/* Fields Key Term */}
          {activeTab === 'key_term' && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <Input
                  label='Nomor Penawaran Referensi'
                  {...form.register('offer_number')}
                />
                <DatePicker
                  label='Tanggal Referensi'
                  value={form.watch('offer_date')}
                  onChange={(val) => form.setValue('offer_date', val)}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <NumberInput
                  label='Volume Kesepakatan'
                  value={form.watch('volume')}
                  onChange={(val) => form.setValue('volume', val)}
                />
                <NumberInput
                  label='Minimum Order Qty (MOQ)'
                  value={form.watch('moq')}
                  onChange={(val) => form.setValue('moq', val)}
                />
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <Input
                  label='Durasi Kontrak'
                  placeholder='Cth: 1 Tahun'
                  {...form.register('duration')}
                />
                <Input
                  label='Tipe Penagihan'
                  placeholder='Cth: Bulanan'
                  {...form.register('billing_type')}
                />
              </div>
              <Input
                label='Tipe Harga'
                placeholder='Cth: Fixed / Fluktuatif'
                {...form.register('price_type')}
              />
            </div>
          )}

          {/* Fields PJBG */}
          {activeTab === 'pjbg' && (
            <div className='space-y-4'>
              <Input
                label='Nomor Kontrak Resmi (PJBG)'
                required
                {...form.register('contract_number')}
              />
              <Input
                label='Durasi Kontrak'
                placeholder='Cth: 2 Tahun'
                {...form.register('duration')}
              />
            </div>
          )}
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
