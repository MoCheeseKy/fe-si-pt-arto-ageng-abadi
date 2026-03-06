'use client';

import { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Search,
  Plus,
  FileText,
  MoreHorizontal,
  Calculator,
  Factory,
  Gauge,
} from 'lucide-react';
import { toast } from 'sonner';

import { Usage, UsageFormValues, usageSchema } from '@/types/operasional';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const dummyUsages: Usage[] = [
  {
    id: 'USE-2510-001',
    date: '2025-10-24',
    customer_name: 'PT. Industri Maju Abadi',
    metode: 'Delta Pressure',
    plat_nomor: 'B 9012 CXY',
    jenis_gtm: '20FT',
    total_sm3: 4500.5,
    total_mmbtu: 158.2,
    total_penjualan: 18500000,
    currency: 'IDR',
    status: 'Selesai',
  },
  {
    id: 'USE-2510-002',
    date: '2025-10-25',
    customer_name: 'PT. Tekno Pangan',
    metode: 'EVC',
    plat_nomor: 'D 1234 ABC',
    jenis_gtm: '10FT',
    total_sm3: 2100.0,
    total_mmbtu: 0,
    total_penjualan: 4500,
    currency: 'USD',
    status: 'Selesai',
  },
];

const columnHelper = createColumnHelper<Usage>();

export default function PemakaianGasPage() {
  const [data, setData] = useState<Usage[]>(dummyUsages);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<UsageFormValues>({
    resolver: zodResolver(usageSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      customer_id: '',
      metode: 'Delta Pressure',
      currency: 'IDR',
      // Init all optional fields to 0 or ""
      tekanan_awal: 0,
      tekanan_akhir: 0,
      turbin_awal: 0,
      turbin_akhir: 0,
      evc_awal: 0,
      evc_akhir: 0,
      price_per_sm3: 0,
      exchange_rate: 0,
    },
  });

  const watchValues = useWatch({ control: form.control });
  const selectedMethod = watchValues.metode;

  // --- LOGIKA KALKULASI REAKTIF --- (Menunggu file Excel LK)
  let calcSelisih = 0;
  let calcTotalSm3 = 0;
  let calcMMBTU = 0;

  if (selectedMethod === 'Delta Pressure') {
    calcSelisih =
      (watchValues.tekanan_akhir || 0) - (watchValues.tekanan_awal || 0);
    calcTotalSm3 = calcSelisih * 12.5; // Dummy multiplier
    calcMMBTU = calcTotalSm3 * (watchValues.ghv || 1) * 0.05; // Dummy
  } else if (selectedMethod === 'EVC') {
    calcSelisih = (watchValues.evc_akhir || 0) - (watchValues.evc_awal || 0); // Selisih EVC Sm3
    calcTotalSm3 = calcSelisih;
    // EVC biasanya pakai Sm3 langsung untuk total tagihan
  } else if (selectedMethod === 'Turbin') {
    calcSelisih =
      (watchValues.turbin_akhir || 0) - (watchValues.turbin_awal || 0);
    calcTotalSm3 = calcSelisih * (watchValues.faktor_kompresi || 1); // Dummy
    calcMMBTU = calcTotalSm3 * (watchValues.ghv || 1) * 0.05; // Dummy
  }

  // Sesuai List Modul: jika dolar = mmbtu * price, jika rupiah = total sm3 * price
  // Catatan: Jika metode EVC, instruksi aslinya tidak mencantumkan MMBTU, jadi kita pakai Sm3
  let totalPenjualan = 0;
  if (watchValues.currency === 'USD') {
    totalPenjualan =
      (selectedMethod === 'EVC' ? calcTotalSm3 : calcMMBTU) *
      (watchValues.price_per_sm3 || 0);
  } else {
    totalPenjualan = calcTotalSm3 * (watchValues.price_per_sm3 || 0);
  }

  const onSubmit = async (values: UsageFormValues) => {
    await new Promise((res) => setTimeout(res, 800));
    toast.success('Data pemakaian gas berhasil disimpan');
    setIsDialogOpen(false);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID Pemakaian',
        cell: (info) => (
          <span className='font-semibold'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('date', { header: 'Tanggal' }),
      columnHelper.accessor('customer_name', {
        header: 'Customer',
        cell: (info) => (
          <div className='flex flex-col'>
            <span className='font-medium text-foreground'>
              {info.getValue()}
            </span>
            <span className='text-xs text-muted-foreground'>
              {info.row.original.plat_nomor} • {info.row.original.metode}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('total_sm3', {
        header: 'Total Sm³',
        cell: (info) => (
          <span className='font-mono'>
            {info.getValue().toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper.accessor('total_penjualan', {
        header: 'Nilai Tagihan',
        cell: (info) => {
          const isUSD = info.row.original.currency === 'USD';
          return (
            <span
              className={`font-semibold ${isUSD ? 'text-amber-500' : 'text-emerald-500'}`}
            >
              {isUSD ? '$' : 'Rp'} {info.getValue().toLocaleString('id-ID')}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        cell: (info) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem>
                <FileText className='mr-2 h-4 w-4' /> Detail Berita Acara
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-heading font-bold'>
            Pemakaian Gas (Customer)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Catat distribusi dan pemakaian gas ke pelanggan.
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className='bg-primary text-white'
        >
          <Plus className='w-4 h-4 mr-2' /> Input Pemakaian
        </Button>
      </div>

      {/* Tabel Data */}
      <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
        <div className='p-4 border-b border-border bg-muted/20'>
          <div className='relative w-full max-w-sm'>
            <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Cari customer atau ID...'
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className='pl-9 bg-background'
            />
          </div>
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-muted/40 text-muted-foreground font-heading'>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className='px-6 py-4 font-semibold border-b'>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className='divide-y divide-border'>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className='hover:bg-muted/10'>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className='px-6 py-4'>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog Form Lebar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-5xl bg-card p-0 overflow-hidden'>
          <div className='flex flex-col lg:flex-row h-[85vh] lg:h-[700px]'>
            {/* Sisi Kiri: Form Input */}
            <div className='flex-1 p-6 overflow-y-auto custom-scrollbar border-r border-border'>
              <DialogHeader className='mb-6'>
                <DialogTitle className='font-heading text-xl'>
                  Input Pemakaian Gas Baru
                </DialogTitle>
              </DialogHeader>
              <form
                id='usage-form'
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                {/* METHOD SELECTOR */}
                <div className='bg-muted/30 p-4 rounded-lg border border-border'>
                  <label className='text-sm font-bold text-primary flex items-center gap-2 mb-2'>
                    <Gauge className='w-4 h-4' /> Metode Pengukuran Wajib
                    Dipilih
                  </label>
                  <select
                    {...form.register('metode')}
                    className='flex h-10 w-full rounded-md border-2 border-primary bg-background px-3 py-1 font-semibold text-foreground shadow-sm'
                  >
                    <option value='Delta Pressure'>
                      Metode: Delta Pressure
                    </option>
                    <option value='EVC'>Metode: EVC</option>
                    <option value='Turbin'>Metode: Turbin</option>
                  </select>
                </div>

                {/* UMUM */}
                <div className='space-y-4'>
                  <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider border-b border-border pb-2'>
                    Informasi Umum
                  </h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium'>Tanggal</label>
                      <Input type='date' {...form.register('date')} />
                    </div>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium'>Customer</label>
                      <select
                        {...form.register('customer_id')}
                        className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm'
                      >
                        <option value=''>-- Pilih Customer --</option>
                        <option value='1'>PT. Industri Maju Abadi</option>
                      </select>
                    </div>
                    {selectedMethod !== 'Turbin' && (
                      <div className='space-y-1'>
                        <label className='text-xs font-medium'>
                          Plat Nomor
                        </label>
                        <Input
                          {...form.register('plat_nomor')}
                          placeholder='B 1234 XX'
                        />
                      </div>
                    )}
                    {selectedMethod === 'Delta Pressure' && (
                      <div className='space-y-1'>
                        <label className='text-xs font-medium'>Jenis GTM</label>
                        <Input {...form.register('jenis_gtm')} />
                      </div>
                    )}
                    {(selectedMethod === 'EVC' ||
                      selectedMethod === 'Turbin') && (
                      <div className='space-y-1'>
                        <label className='text-xs font-medium'>No. GTM</label>
                        <Input {...form.register('no_gtm')} />
                      </div>
                    )}
                  </div>
                </div>

                {/* DYNAMIC FIELD BERDASARKAN METODE */}
                <div className='space-y-4'>
                  <h3 className='text-sm font-bold uppercase text-primary tracking-wider border-b border-border pb-2'>
                    Parameter {selectedMethod}
                  </h3>
                  <div className='grid grid-cols-2 gap-4'>
                    {selectedMethod === 'Delta Pressure' && (
                      <>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium'>LWC</label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('lwc')}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium'>
                            Vol Nm3 at 200 bar G
                          </label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('vol_nm3_200')}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium text-amber-500'>
                            Tekanan Awal
                          </label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('tekanan_awal')}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium text-amber-500'>
                            Tekanan Akhir
                          </label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('tekanan_akhir')}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium'>GHV</label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('ghv')}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium'>
                            Standar 1 Sm3 (Ft3)
                          </label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('standar_1_sm3')}
                          />
                        </div>
                      </>
                    )}

                    {selectedMethod === 'EVC' && (
                      <>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium'>
                            Turbin Awal
                          </label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('turbin_awal')}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium'>
                            Turbin Akhir
                          </label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('turbin_akhir')}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium text-amber-500'>
                            EVC Awal
                          </label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('evc_awal')}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium text-amber-500'>
                            EVC Akhir
                          </label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('evc_akhir')}
                          />
                        </div>
                      </>
                    )}

                    {selectedMethod === 'Turbin' && (
                      <>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium text-amber-500'>
                            Turbin Awal
                          </label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('turbin_awal')}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium text-amber-500'>
                            Turbin Akhir
                          </label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('turbin_akhir')}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium'>
                            Supply Pressure
                          </label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('supply_pressure')}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium'>
                            Temp Avg PRS (C)
                          </label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('temp_avg_prs')}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium'>
                            Faktor Kompresi
                          </label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('faktor_kompresi')}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium'>
                            Temp Base (C)
                          </label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('temp_base')}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium'>
                            Pressure Standar
                          </label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('pressure_standar')}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium'>
                            Pressure Atm Standar
                          </label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('pressure_atm_standar')}
                          />
                        </div>
                        <div className='space-y-1'>
                          <label className='text-xs font-medium'>GHV</label>
                          <Input
                            type='number'
                            step='any'
                            {...form.register('ghv')}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* HARGA */}
                <div className='space-y-4 pb-4'>
                  <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider border-b border-border pb-2'>
                    Komersial (Harga)
                  </h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium'>Mata Uang</label>
                      <select
                        {...form.register('currency')}
                        className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors'
                      >
                        <option value='IDR'>Rupiah (IDR)</option>
                        <option value='USD'>Dolar (USD)</option>
                      </select>
                    </div>
                    {watchValues.currency === 'USD' && (
                      <div className='space-y-1'>
                        <label className='text-xs font-medium text-amber-500'>
                          Kurs Rupiah
                        </label>
                        <Input
                          type='number'
                          step='any'
                          {...form.register('exchange_rate')}
                        />
                        {form.formState.errors.exchange_rate && (
                          <p className='text-[10px] text-destructive'>
                            {form.formState.errors.exchange_rate.message}
                          </p>
                        )}
                      </div>
                    )}
                    <div className='space-y-1 col-span-2'>
                      <label className='text-xs font-medium'>
                        Harga per Sm³ ({watchValues.currency})
                      </label>
                      <Input
                        type='number'
                        step='any'
                        {...form.register('price_per_sm3')}
                        className='text-lg font-mono'
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Sisi Kanan: Panel Kalkulasi */}
            <div className='w-full lg:w-[380px] bg-sidebar/50 p-6 flex flex-col justify-between sidebar-gradient-dark'>
              <div>
                <div className='flex items-center gap-2 mb-6'>
                  <Calculator className='w-5 h-5 text-primary' />
                  <h3 className='font-heading font-semibold text-lg'>
                    Estimasi {selectedMethod}
                  </h3>
                </div>

                <div className='space-y-4'>
                  <div className='bg-background/80 p-3 rounded-lg border border-border'>
                    <p className='text-xs text-muted-foreground mb-1'>
                      {selectedMethod === 'Delta Pressure'
                        ? 'Selisih Tekanan'
                        : selectedMethod === 'EVC'
                          ? 'Selisih EVC Sm³'
                          : 'Selisih Turbin'}
                    </p>
                    <p className='text-lg font-mono font-semibold'>
                      {calcSelisih.toFixed(2)}
                    </p>
                  </div>

                  <div className='bg-background/80 p-3 rounded-lg border border-border border-l-4 border-l-secondary'>
                    <p className='text-xs text-muted-foreground mb-1 font-bold'>
                      Total SM³
                    </p>
                    <p className='text-2xl font-mono font-bold text-secondary'>
                      {calcTotalSm3.toFixed(4)}
                    </p>
                  </div>

                  {selectedMethod !== 'EVC' && (
                    <div className='bg-background/80 p-3 rounded-lg border border-border'>
                      <p className='text-xs text-muted-foreground mb-1'>
                        Volume MMBTU
                      </p>
                      <p className='text-lg font-mono font-semibold text-primary'>
                        {calcMMBTU.toFixed(4)}
                      </p>
                    </div>
                  )}
                </div>

                <div className='mt-8 pt-6 border-t border-border border-dashed'>
                  <p className='text-xs text-muted-foreground mb-2 flex items-center justify-between'>
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
                  <p className='text-[10px] text-muted-foreground mt-1'>
                    {watchValues.currency === 'USD'
                      ? selectedMethod === 'EVC'
                        ? 'Rumus: Total Sm³ x Harga ($)'
                        : 'Rumus: MMBTU x Harga ($)'
                      : 'Rumus: Total Sm³ x Harga (Rp)'}
                  </p>
                </div>
              </div>

              <div className='mt-8 pt-4'>
                <Button
                  type='submit'
                  form='usage-form'
                  className='w-full h-12 text-md font-semibold bg-primary hover:bg-primary/90 text-white'
                  disabled={form.formState.isSubmitting}
                >
                  Simpan Transaksi
                </Button>
                <p className='text-[10px] text-center text-muted-foreground mt-3'>
                  Data rumus MMBTU dan Sm³ akan direvisi sesuai excel master LK.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
