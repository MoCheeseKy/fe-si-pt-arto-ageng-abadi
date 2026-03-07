'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Calculator,
  Gauge,
  Factory,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { format } from 'date-fns';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/form/Input';
import { SearchInput } from '@/components/form/SearchInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
import { NumberInput } from '@/components/form/NumberInput';
import { CurrencyInput } from '@/components/form/CurrencyInput';
import { DataTable } from '@/components/_shared/DataTable';
import { Modal } from '@/components/_shared/Modal';
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

const usageSchema = z.object({
  date: z.string().min(1, 'Tanggal wajib diisi'),
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  metode: z.enum(['Delta Pressure', 'EVC', 'Turbin']),
  currency: z.enum(['IDR', 'USD']).default('IDR'),
  exchange_rate: z.coerce.number().optional(),
  price_per_sm3: z.coerce.number().optional(),

  license_plate: z.string().optional(),
  gtm_type: z.string().optional(),
  gtm_number: z.string().optional(),

  lwc: z.coerce.number().optional(),
  vol_nm3_at_200_bar_g: z.coerce.number().optional(),
  pressure_start: z.coerce.number().optional(),
  pressure_finish: z.coerce.number().optional(),

  turbine_start: z.coerce.number().optional(),
  turbine_finish: z.coerce.number().optional(),
  evc_start: z.coerce.number().optional(),
  evc_finish: z.coerce.number().optional(),

  supply_pressure: z.coerce.number().optional(),
  temp_avg_prs: z.coerce.number().optional(),
  compression_factor: z.coerce.number().optional(),
  temp_base: z.coerce.number().optional(),
  pressure_standard: z.coerce.number().optional(),
  pressure_atm_standard: z.coerce.number().optional(),

  ghv: z.coerce.number().optional(),
  standard_1_sm3: z.coerce.number().optional(),
});

type UsageFormValues = z.infer<typeof usageSchema>;

export interface UsageRow {
  id: string;
  date: Date | string;
  customer_id: string;
  customer_name?: string;
  metode: 'Delta Pressure' | 'EVC' | 'Turbin';
  license_plate?: string;
  gtm_number?: string;
  total_sm3: number;
  total_mmbtu: number;
  total_sales: number;
  currency: string;
  raw_data: any;
}

const columnHelper = createColumnHelper<UsageRow>();

/**
 * Halaman manajemen operasional Pemakaian Gas.
 * Mengagregasi data dari tiga endpoint berbeda (Delta Pressure, EVC, Turbin) menjadi satu tabel terpadu.
 *
 * @returns {JSX.Element} Komponen UI halaman Pemakaian Gas
 */
export default function PemakaianGasPage() {
  const [data, setData] = useState<UsageRow[]>([]);
  const [customers, setCustomers] = useState<
    { label: string; value: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('Semua');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deletingRecord, setDeletingRecord] = useState<{
    id: string;
    metode: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<UsageFormValues>({
    resolver: zodResolver(usageSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      customer_id: '',
      metode: 'Delta Pressure',
      currency: 'IDR',
      exchange_rate: 0,
      price_per_sm3: 0,
      license_plate: '',
      gtm_type: '',
      gtm_number: '',
      lwc: 0,
      vol_nm3_at_200_bar_g: 0,
      pressure_start: 0,
      pressure_finish: 0,
      turbine_start: 0,
      turbine_finish: 0,
      evc_start: 0,
      evc_finish: 0,
      supply_pressure: 0,
      temp_avg_prs: 0,
      compression_factor: 0,
      temp_base: 0,
      pressure_standard: 0,
      pressure_atm_standard: 0,
      ghv: 0,
      standard_1_sm3: 0,
    },
  });

  const watchValues = useWatch({ control: form.control });
  const selectedMethod = watchValues.metode;

  let calcSelisih = 0;
  let calcTotalSm3 = 0;
  let calcMMBTU = 0;

  if (selectedMethod === 'Delta Pressure') {
    calcSelisih =
      (watchValues.pressure_finish || 0) - (watchValues.pressure_start || 0);
    calcTotalSm3 = calcSelisih * 12.5;
    calcMMBTU = calcTotalSm3 * (watchValues.ghv || 1) * 0.05;
  } else if (selectedMethod === 'EVC') {
    calcSelisih = (watchValues.evc_finish || 0) - (watchValues.evc_start || 0);
    calcTotalSm3 = calcSelisih;
  } else if (selectedMethod === 'Turbin') {
    calcSelisih =
      (watchValues.turbine_finish || 0) - (watchValues.turbine_start || 0);
    calcTotalSm3 = calcSelisih * (watchValues.compression_factor || 1);
    calcMMBTU = calcTotalSm3 * (watchValues.ghv || 1) * 0.05;
  }

  const totalPenjualan =
    watchValues.currency === 'USD'
      ? (selectedMethod === 'EVC' ? calcTotalSm3 : calcMMBTU) *
        (watchValues.price_per_sm3 || 0)
      : calcTotalSm3 * (watchValues.price_per_sm3 || 0);

  /**
   * Mengambil data pemakaian dari tiga endpoint terpisah dan data customer.
   * Melakukan agregasi data agar dapat disajikan dalam satu tabel yang sama.
   *
   * @returns {Promise<void>}
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [custRes, dpRes, evcRes, turbRes] = await Promise.all([
        api.get<any>('/v1/customers'),
        api.get<any>('/v1/usage-delta-pressures'),
        api.get<any>('/v1/usage-evcs'),
        api.get<any>('/v1/usage-turbines'),
      ]);

      const custList = Array.isArray(custRes.data)
        ? custRes.data
        : custRes.data?.rows || [];
      const dpList = Array.isArray(dpRes.data)
        ? dpRes.data
        : dpRes.data?.rows || [];
      const evcList = Array.isArray(evcRes.data)
        ? evcRes.data
        : evcRes.data?.rows || [];
      const turbList = Array.isArray(turbRes.data)
        ? turbRes.data
        : turbRes.data?.rows || [];

      setCustomers(
        custList.map((c: any) => ({ label: c.company_name, value: c.id })),
      );

      const getCustomerName = (id: string) =>
        custList.find((c: any) => c.id === id)?.company_name || 'Unknown';

      const mappedDp: UsageRow[] = dpList.map((item: any) => ({
        id: item.id,
        date: item.date,
        customer_id: item.customer_id,
        customer_name: getCustomerName(item.customer_id),
        metode: 'Delta Pressure',
        license_plate: item.license_plate,
        total_sm3: item.total_sm3 || 0,
        total_mmbtu: item.mmbtu || 0,
        total_sales: item.total_sales || 0,
        currency: item.currency || 'IDR',
        raw_data: item,
      }));

      const mappedEvc: UsageRow[] = evcList.map((item: any) => ({
        id: item.id,
        date: item.date,
        customer_id: item.customer_id,
        customer_name: getCustomerName(item.customer_id),
        metode: 'EVC',
        license_plate: item.license_plate,
        gtm_number: item.gtm_number,
        total_sm3: item.evc_difference_sm3 || 0,
        total_mmbtu: 0,
        total_sales: item.total_sales || 0,
        currency: item.currency || 'IDR',
        raw_data: item,
      }));

      const mappedTurb: UsageRow[] = turbList.map((item: any) => ({
        id: item.id,
        date: item.date,
        customer_id: item.customer_id,
        customer_name: getCustomerName(item.customer_id),
        metode: 'Turbin',
        gtm_number: item.gtm_number,
        total_sm3: item.total_sm3 || 0,
        total_mmbtu: item.mmbtu || 0,
        total_sales: item.total_sales || 0,
        currency: item.currency || 'IDR',
        raw_data: item,
      }));

      setData(
        [...mappedDp, ...mappedEvc, ...mappedTurb].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      );
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data dari server.');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Mengatur nilai form berdasarkan entitas yang dipilih dan metode pengukurannya.
   *
   * @param {UsageRow} [usage] - Data pemakaian yang akan diedit (opsional)
   */
  const handleOpenDialog = (usage?: UsageRow) => {
    if (usage) {
      setEditingId(usage.id);
      form.reset({
        ...usage.raw_data,
        metode: usage.metode,
        date: new Date(usage.date).toISOString().split('T')[0],
      });
    } else {
      setEditingId(null);
      form.reset({
        date: new Date().toISOString().split('T')[0],
        customer_id: '',
        metode: 'Delta Pressure',
        currency: 'IDR',
        exchange_rate: 0,
        price_per_sm3: 0,
        license_plate: '',
        gtm_type: '',
        gtm_number: '',
        lwc: 0,
        vol_nm3_at_200_bar_g: 0,
        pressure_start: 0,
        pressure_finish: 0,
        turbine_start: 0,
        turbine_finish: 0,
        evc_start: 0,
        evc_finish: 0,
        supply_pressure: 0,
        temp_avg_prs: 0,
        compression_factor: 0,
        temp_base: 0,
        pressure_standard: 0,
        pressure_atm_standard: 0,
        ghv: 0,
        standard_1_sm3: 0,
      });
    }
    setIsDialogOpen(true);
  };

  /**
   * Memproses payload dan merutekannya ke endpoint yang sesuai dengan metode yang dipilih.
   * Menangani kalkulasi turunan sebelum diinjeksi ke payload.
   *
   * @param {UsageFormValues} values - Nilai input dari form
   */
  const onSubmit = async (values: UsageFormValues) => {
    try {
      let endpoint = '';
      let payload: any = {
        date: values.date,
        customer_id: values.customer_id,
        currency: values.currency,
        exchange_rate: values.exchange_rate,
        price_per_sm3: values.price_per_sm3,
        total_sales: totalPenjualan,
      };

      if (values.metode === 'Delta Pressure') {
        endpoint = '/v1/usage-delta-pressures';
        payload = {
          ...payload,
          license_plate: values.license_plate,
          gtm_type: values.gtm_type,
          lwc: values.lwc,
          vol_nm3_at_200_bar_g: values.vol_nm3_at_200_bar_g,
          pressure_start: values.pressure_start,
          pressure_finish: values.pressure_finish,
          pressure_difference: calcSelisih,
          total_sm3: calcTotalSm3,
          ghv: values.ghv,
          standard_1_sm3: values.standard_1_sm3,
          mmbtu: calcMMBTU,
          mmbtu_per_sm3: calcMMBTU / (calcTotalSm3 || 1),
        };
      } else if (values.metode === 'EVC') {
        endpoint = '/v1/usage-evcs';
        payload = {
          ...payload,
          license_plate: values.license_plate,
          gtm_number: values.gtm_number,
          turbine_start: values.turbine_start,
          turbine_finish: values.turbine_finish,
          evc_start: values.evc_start,
          evc_finish: values.evc_finish,
          evc_difference_sm3: calcTotalSm3,
        };
      } else {
        endpoint = '/v1/usage-turbines';
        payload = {
          ...payload,
          gtm_number: values.gtm_number,
          turbine_start: values.turbine_start,
          turbine_finish: values.turbine_finish,
          turbine_difference: calcSelisih,
          supply_pressure: values.supply_pressure,
          temp_avg_prs: values.temp_avg_prs,
          compression_factor: values.compression_factor,
          temp_base: values.temp_base,
          pressure_standard: values.pressure_standard,
          pressure_atm_standard: values.pressure_atm_standard,
          total_sm3: calcTotalSm3,
          ghv: values.ghv,
          standard_1_sm3: values.standard_1_sm3,
          mmbtu: calcMMBTU,
        };
      }

      if (editingId) {
        await api.put(`${endpoint}/${editingId}`, payload);
        toast.success('Data pemakaian gas berhasil diperbarui.');
      } else {
        await api.post(endpoint, payload);
        toast.success('Catatan pemakaian gas baru berhasil ditambahkan.');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan data.');
    }
  };

  /**
   * Menghapus rekaman data dari endpoint yang sesuai berdasarkan metodenya.
   */
  const handleDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    let endpoint = '';
    if (deletingRecord.metode === 'Delta Pressure')
      endpoint = '/v1/usage-delta-pressures';
    else if (deletingRecord.metode === 'EVC') endpoint = '/v1/usage-evcs';
    else endpoint = '/v1/usage-turbines';

    try {
      await api.delete(`${endpoint}/${deletingRecord.id}`);
      toast.success('Riwayat pemakaian berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data.');
    } finally {
      setIsDeleting(false);
      setDeletingRecord(null);
    }
  };

  const filteredData = useMemo(() => {
    if (methodFilter === 'Semua') return data;
    return data.filter((item) => item.metode === methodFilter);
  }, [data, methodFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('date', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tanggal <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='text-muted-foreground font-medium'>
            {format(new Date(info.getValue()), 'dd MMM yyyy')}
          </span>
        ),
      }),
      columnHelper.accessor('customer_name', {
        header: 'Customer',
        cell: (info) => (
          <div className='flex flex-col'>
            <span className='font-semibold text-foreground flex items-center gap-2'>
              <Factory className='h-3 w-3 text-muted-foreground' />{' '}
              {info.getValue()}
            </span>
            <span className='text-xs text-muted-foreground mt-0.5'>
              {info.row.original.license_plate ||
                info.row.original.gtm_number ||
                '-'}{' '}
              •{' '}
              <strong className='text-primary'>
                {info.row.original.metode}
              </strong>
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('total_sm3', {
        header: 'Total Sm³',
        cell: (info) => (
          <span className='font-mono text-emerald-500 font-semibold'>
            {info.getValue()?.toLocaleString('id-ID') || 0}
          </span>
        ),
      }),
      columnHelper.accessor('total_sales', {
        header: 'Nilai Tagihan',
        cell: (info) => {
          const isUSD = info.row.original.currency === 'USD';
          return (
            <span
              className={`font-mono font-bold ${isUSD ? 'text-amber-500' : 'text-emerald-500'}`}
            >
              {isUSD ? '$' : 'Rp'}{' '}
              {(info.getValue() || 0).toLocaleString('id-ID')}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className='text-right'>Aksi</div>,
        cell: (info) => (
          <TableActions
            onEdit={() => handleOpenDialog(info.row.original)}
            onDelete={() =>
              setDeletingRecord({
                id: info.row.original.id,
                metode: info.row.original.metode,
              })
            }
          />
        ),
      }),
    ],
    [],
  );

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-heading font-bold text-foreground tracking-tight'>
            Pemakaian Gas (Customer)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan distribusi gas ke pelanggan dengan berbagai metode
            pengukuran.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Input Pemakaian
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

      <div className='bg-card border border-border rounded-xl shadow-soft-depth overflow-hidden'>
        <div className='p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20'>
          <SearchInput
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder='Cari customer, tanggal, plat nomor...'
            className='w-full sm:max-w-sm'
          />

          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
              Metode:
            </span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className='flex h-9 w-full sm:w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary'
            >
              <option value='Semua'>Semua Metode</option>
              <option value='Delta Pressure'>Delta Pressure</option>
              <option value='EVC'>EVC</option>
              <option value='Turbin'>Turbin</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
          emptyMessage='Tidak ada riwayat pemakaian gas.'
        />
      </div>

      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Pemakaian Gas' : 'Input Pemakaian Gas Baru'}
        size='xl'
      >
        <div className='flex flex-col lg:flex-row gap-6'>
          <div className='flex-1 space-y-6'>
            <form
              id='usage-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-6'
            >
              <div className='bg-primary/5 p-4 rounded-xl border border-primary/20 shadow-inner'>
                <label className='text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-3'>
                  <Gauge className='w-4 h-4' /> Metode Pengukuran
                </label>
                <select
                  {...form.register('metode')}
                  className='flex h-10 w-full rounded-md border border-primary/40 bg-background px-3 py-1 font-semibold text-foreground shadow-sm focus-visible:ring-1 focus-visible:ring-primary'
                >
                  <option value='Delta Pressure'>Metode: Delta Pressure</option>
                  <option value='EVC'>Metode: EVC</option>
                  <option value='Turbin'>Metode: Turbin</option>
                </select>
              </div>

              <div className='space-y-4'>
                <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider border-b border-border/60 pb-2'>
                  Informasi Umum
                </h3>
                <div className='grid grid-cols-2 gap-5'>
                  <DatePicker
                    label='Tanggal'
                    required
                    value={form.watch('date')}
                    onChange={(val) => form.setValue('date', val)}
                    error={form.formState.errors.date?.message}
                  />
                  <Select
                    label='Customer'
                    required
                    options={customers}
                    value={form.watch('customer_id')}
                    onChange={(val) => form.setValue('customer_id', val)}
                    error={form.formState.errors.customer_id?.message}
                  />

                  {selectedMethod !== 'Turbin' && (
                    <Input
                      label='Plat Nomor'
                      placeholder='B 1234 XX'
                      {...form.register('license_plate')}
                    />
                  )}
                  {selectedMethod === 'Delta Pressure' && (
                    <Input
                      label='Jenis GTM'
                      placeholder='10FT / 20FT'
                      {...form.register('gtm_type')}
                    />
                  )}
                  {(selectedMethod === 'EVC' ||
                    selectedMethod === 'Turbin') && (
                    <Input
                      label='No. GTM'
                      placeholder='GTM-XX'
                      {...form.register('gtm_number')}
                    />
                  )}
                </div>
              </div>

              <div className='space-y-4'>
                <h3 className='text-sm font-bold uppercase text-primary tracking-wider border-b border-border/60 pb-2'>
                  Parameter {selectedMethod}
                </h3>
                <div className='grid grid-cols-2 gap-5'>
                  {selectedMethod === 'Delta Pressure' && (
                    <>
                      <NumberInput
                        label='LWC'
                        value={form.watch('lwc')}
                        onChange={(val) => form.setValue('lwc', val)}
                      />
                      <NumberInput
                        label='Vol Nm3 at 200 bar G'
                        value={form.watch('vol_nm3_at_200_bar_g')}
                        onChange={(val) =>
                          form.setValue('vol_nm3_at_200_bar_g', val)
                        }
                      />
                      <NumberInput
                        label='Tekanan Awal'
                        value={form.watch('pressure_start')}
                        onChange={(val) => form.setValue('pressure_start', val)}
                        className='border-amber-500/30'
                      />
                      <NumberInput
                        label='Tekanan Akhir'
                        value={form.watch('pressure_finish')}
                        onChange={(val) =>
                          form.setValue('pressure_finish', val)
                        }
                        className='border-amber-500/30'
                      />
                      <NumberInput
                        label='GHV'
                        value={form.watch('ghv')}
                        onChange={(val) => form.setValue('ghv', val)}
                      />
                      <NumberInput
                        label='Standar 1 Sm3 (Ft3)'
                        value={form.watch('standard_1_sm3')}
                        onChange={(val) => form.setValue('standard_1_sm3', val)}
                      />
                    </>
                  )}
                  {selectedMethod === 'EVC' && (
                    <>
                      <NumberInput
                        label='Turbin Awal'
                        value={form.watch('turbine_start')}
                        onChange={(val) => form.setValue('turbine_start', val)}
                      />
                      <NumberInput
                        label='Turbin Akhir'
                        value={form.watch('turbine_finish')}
                        onChange={(val) => form.setValue('turbine_finish', val)}
                      />
                      <NumberInput
                        label='EVC Awal'
                        value={form.watch('evc_start')}
                        onChange={(val) => form.setValue('evc_start', val)}
                        className='border-amber-500/30'
                      />
                      <NumberInput
                        label='EVC Akhir'
                        value={form.watch('evc_finish')}
                        onChange={(val) => form.setValue('evc_finish', val)}
                        className='border-amber-500/30'
                      />
                    </>
                  )}
                  {selectedMethod === 'Turbin' && (
                    <>
                      <NumberInput
                        label='Turbin Awal'
                        value={form.watch('turbine_start')}
                        onChange={(val) => form.setValue('turbine_start', val)}
                        className='border-amber-500/30'
                      />
                      <NumberInput
                        label='Turbin Akhir'
                        value={form.watch('turbine_finish')}
                        onChange={(val) => form.setValue('turbine_finish', val)}
                        className='border-amber-500/30'
                      />
                      <NumberInput
                        label='Supply Pressure'
                        value={form.watch('supply_pressure')}
                        onChange={(val) =>
                          form.setValue('supply_pressure', val)
                        }
                      />
                      <NumberInput
                        label='Temp Avg PRS (C)'
                        value={form.watch('temp_avg_prs')}
                        onChange={(val) => form.setValue('temp_avg_prs', val)}
                      />
                      <NumberInput
                        label='Faktor Kompresi'
                        value={form.watch('compression_factor')}
                        onChange={(val) =>
                          form.setValue('compression_factor', val)
                        }
                      />
                      <NumberInput
                        label='Temp Base (C)'
                        value={form.watch('temp_base')}
                        onChange={(val) => form.setValue('temp_base', val)}
                      />
                      <NumberInput
                        label='Pressure Standar'
                        value={form.watch('pressure_standard')}
                        onChange={(val) =>
                          form.setValue('pressure_standard', val)
                        }
                      />
                      <NumberInput
                        label='Pressure Atm Standar'
                        value={form.watch('pressure_atm_standard')}
                        onChange={(val) =>
                          form.setValue('pressure_atm_standard', val)
                        }
                      />
                      <NumberInput
                        label='GHV'
                        value={form.watch('ghv')}
                        onChange={(val) => form.setValue('ghv', val)}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className='space-y-4 pb-4'>
                <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider border-b border-border/60 pb-2'>
                  Komersial (Harga)
                </h3>
                <CurrencyInput
                  label='Harga per Sm³ / MMBTU'
                  amount={form.watch('price_per_sm3') || 0}
                  onAmountChange={(val) => form.setValue('price_per_sm3', val)}
                  currency={form.watch('currency')}
                  onCurrencyChange={(val) => form.setValue('currency', val)}
                  exchangeRate={form.watch('exchange_rate')}
                  onExchangeRateChange={(val) =>
                    form.setValue('exchange_rate', val)
                  }
                />
              </div>
            </form>
          </div>

          <div className='w-full lg:w-[380px] bg-sidebar/40 p-6 flex flex-col justify-between rounded-xl border border-border/50'>
            <div>
              <div className='flex items-center gap-2 mb-6'>
                <Calculator className='w-5 h-5 text-primary' />
                <h3 className='font-heading font-semibold text-lg'>
                  Estimasi Kalkulasi
                </h3>
              </div>

              <div className='space-y-4'>
                <div className='bg-background/80 p-4 rounded-lg border border-border'>
                  <p className='text-xs text-muted-foreground mb-1 uppercase font-bold tracking-wider'>
                    {selectedMethod === 'Delta Pressure'
                      ? 'Selisih Tekanan'
                      : selectedMethod === 'EVC'
                        ? 'Selisih EVC Sm³'
                        : 'Selisih Turbin'}
                  </p>
                  <p className='text-xl font-mono font-semibold'>
                    {calcSelisih.toFixed(2)}
                  </p>
                </div>

                <div className='bg-background/80 p-4 rounded-lg border border-border border-l-4 border-l-secondary shadow-sm'>
                  <p className='text-xs text-muted-foreground mb-1 uppercase font-bold tracking-wider'>
                    Total SM³
                  </p>
                  <p className='text-2xl font-mono font-bold text-secondary'>
                    {calcTotalSm3.toFixed(4)}
                  </p>
                </div>

                {selectedMethod !== 'EVC' && (
                  <div className='bg-background/80 p-4 rounded-lg border border-border'>
                    <p className='text-xs text-muted-foreground mb-1 uppercase font-bold tracking-wider'>
                      Volume MMBTU
                    </p>
                    <p className='text-xl font-mono font-semibold text-primary'>
                      {calcMMBTU.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>

              <div className='mt-8 pt-6 border-t border-border/80 border-dashed'>
                <p className='text-xs text-muted-foreground mb-2 flex items-center justify-between uppercase font-bold tracking-wider'>
                  Total Penjualan
                  <Badge
                    variant='outline'
                    className={
                      watchValues.currency === 'USD'
                        ? 'text-amber-500 border-amber-500/30'
                        : ''
                    }
                  >
                    {watchValues.currency}
                  </Badge>
                </p>
                <p className='text-3xl font-heading font-bold text-foreground break-all'>
                  {watchValues.currency === 'USD' ? '$' : 'Rp'}{' '}
                  {totalPenjualan.toLocaleString('id-ID', {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>

            <div className='mt-8 pt-4 flex gap-3'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsDialogOpen(false)}
                className='w-full'
              >
                Batal
              </Button>
              <Button
                type='submit'
                form='usage-form'
                className='w-full bg-primary hover:bg-primary/90 text-white'
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <AlertDialog
        open={!!deletingRecord}
        onOpenChange={(open) => !open && setDeletingRecord(null)}
      >
        <AlertDialogContent className='bg-card border-border'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-destructive flex items-center gap-2'>
              <AlertCircle className='h-5 w-5' /> Konfirmasi Penghapusan
            </AlertDialogTitle>
            <AlertDialogDescription className='text-muted-foreground'>
              Apakah Anda yakin ingin menghapus data pemakaian gas ini? Tindakan
              ini akan memengaruhi laporan penjualan pelanggan terkait.
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
