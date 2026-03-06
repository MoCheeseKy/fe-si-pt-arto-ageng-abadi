'use client';

import { useState, useMemo, useEffect } from 'react';
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
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Purchase,
  PurchaseFormValues,
  purchaseSchema,
} from '@/types/operasional';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const dummyPurchases: Purchase[] = [
  {
    id: 'PO-2510-001',
    date: '2025-10-24',
    supplier_name: 'PT. Gas Bumi Nusantara',
    nomor_do: 'DO/GBN/1024/01',
    plat_nomor: 'B 9012 CXY',
    jenis_gtm: '20FT',
    volume_mmbtu: 1450.5,
    total_penjualan: 45000000,
    currency: 'IDR',
    status: 'Selesai',
  },
  {
    id: 'PO-2510-002',
    date: '2025-10-25',
    supplier_name: 'CV. Energi Mandiri',
    nomor_do: 'DO/EM/1025/08',
    plat_nomor: 'D 1234 ABC',
    jenis_gtm: '40FT',
    volume_mmbtu: 3200.75,
    total_penjualan: 9500,
    currency: 'USD',
    status: 'Pending',
  },
];

const columnHelper = createColumnHelper<Purchase>();

export default function PengisianGasPage() {
  const [data, setData] = useState<Purchase[]>(dummyPurchases);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      supplier_id: '',
      driver_id: '',
      plat_nomor: '',
      jenis_gtm: '20FT',
      nomor_do: '',
      ghc: 0,
      pressure_start: 0,
      pressure_finish: 0,
      meter_awal: 0,
      meter_akhir: 0,
      currency: 'IDR',
      exchange_rate: 0,
      price_per_sm3: 0,
    },
  });

  // --- LOGIKA KALKULASI REAKTIF ---
  const watchValues = useWatch({ control: form.control });

  // TODO: Rumus asli menunggu file Excel. Ini adalah mock calculation agar UI reaktif.
  const calcMatering =
    (watchValues.meter_akhir || 0) - (watchValues.meter_awal || 0);
  const calcPressureDiff =
    (watchValues.pressure_finish || 0) - (watchValues.pressure_start || 0);
  const calcMMSCF = calcMatering * 0.0353147; // Dummy multiplier
  const calcMMBTU = calcMMSCF * (watchValues.ghc || 1); // Dummy multiplier

  // Harga * MMBTU (sesuai instruksi prompt: price * mmbtu)
  let totalPenjualan = calcMMBTU * (watchValues.price_per_sm3 || 0);
  if (watchValues.currency === 'USD') {
    // Jika USD, kita simpan nilainya dalam USD.
    // (Bisa juga dikali exchange_rate jika ingin disimpan nilai IDR-nya, kita ikuti instruksi price*mmbtu)
    totalPenjualan = calcMMBTU * (watchValues.price_per_sm3 || 0);
  }

  const onSubmit = async (values: PurchaseFormValues) => {
    await new Promise((res) => setTimeout(res, 800));
    toast.success('Data pengisian gas berhasil disimpan');
    setIsDialogOpen(false);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID Transaksi',
        cell: (info) => (
          <span className='font-semibold'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('date', { header: 'Tanggal' }),
      columnHelper.accessor('supplier_name', {
        header: 'Supplier & Logistik',
        cell: (info) => (
          <div className='flex flex-col'>
            <span className='font-medium text-foreground'>
              {info.getValue()}
            </span>
            <span className='text-xs text-muted-foreground'>
              {info.row.original.nomor_do} • {info.row.original.plat_nomor} (
              {info.row.original.jenis_gtm})
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('volume_mmbtu', {
        header: 'Vol MMBTU',
        cell: (info) => (
          <span className='font-mono'>{info.getValue().toFixed(2)}</span>
        ),
      }),
      columnHelper.accessor('total_penjualan', {
        header: 'Total Nilai',
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
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge
            variant={info.getValue() === 'Selesai' ? 'default' : 'secondary'}
          >
            {info.getValue()}
          </Badge>
        ),
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
                <FileText className='mr-2 h-4 w-4' /> Detail DO
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
            Pembelian (Pengisian Gas)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Catat penerimaan gas CNG dari Supplier ke GTM.
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className='bg-primary text-white'
        >
          <Plus className='w-4 h-4 mr-2' /> Input Pengisian
        </Button>
      </div>

      {/* Tabel Data */}
      <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
        <div className='p-4 border-b border-border bg-muted/20'>
          <div className='relative w-full max-w-sm'>
            <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Cari transaksi DO atau Plat...'
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

      {/* Dialog Form Lebar (Berisi Kalkulator Realtime) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-5xl bg-card p-0 overflow-hidden'>
          <div className='flex flex-col lg:flex-row h-[85vh] lg:h-[700px]'>
            {/* Sisi Kiri: Form Input */}
            <div className='flex-1 p-6 overflow-y-auto custom-scrollbar border-r border-border'>
              <DialogHeader className='mb-6'>
                <DialogTitle className='font-heading text-xl'>
                  Input Pengisian Gas Baru
                </DialogTitle>
              </DialogHeader>
              <form
                id='purchase-form'
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                {/* Section: Logistik */}
                <div className='space-y-4'>
                  <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider border-b border-border pb-2'>
                    Informasi Logistik
                  </h3>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium'>Tanggal</label>
                      <Input type='date' {...form.register('date')} />
                    </div>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium'>Nomor DO</label>
                      <Input
                        {...form.register('nomor_do')}
                        placeholder='DO/XXX/...'
                      />
                    </div>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium'>Supplier</label>
                      <select
                        {...form.register('supplier_id')}
                        className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                      >
                        <option value=''>-- Pilih Supplier --</option>
                        <option value='1'>PT. Gas Bumi Nusantara</option>
                      </select>
                    </div>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium'>Driver</label>
                      <select
                        {...form.register('driver_id')}
                        className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                      >
                        <option value=''>-- Pilih Driver --</option>
                        <option value='1'>Ahmad Sujatmiko</option>
                      </select>
                    </div>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium'>Plat Nomor</label>
                      <Input
                        {...form.register('plat_nomor')}
                        placeholder='B 1234 XX'
                      />
                    </div>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium'>Jenis GTM</label>
                      <select
                        {...form.register('jenis_gtm')}
                        className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors'
                      >
                        <option value='10FT'>10 FT</option>
                        <option value='20FT'>20 FT</option>
                        <option value='40FT'>40 FT</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Section: Parameter Teknis */}
                <div className='space-y-4'>
                  <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider border-b border-border pb-2'>
                    Parameter Teknis
                  </h3>
                  <div className='grid grid-cols-3 gap-4'>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium'>GHC</label>
                      <Input
                        type='number'
                        step='any'
                        {...form.register('ghc')}
                      />
                    </div>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium'>
                        Pressure Start
                      </label>
                      <Input
                        type='number'
                        step='any'
                        {...form.register('pressure_start')}
                      />
                    </div>
                    <div className='space-y-1'>
                      <label className='text-xs font-medium'>
                        Pressure Finish
                      </label>
                      <Input
                        type='number'
                        step='any'
                        {...form.register('pressure_finish')}
                      />
                    </div>
                    <div className='space-y-1 col-span-3 lg:col-span-1'>
                      <label className='text-xs font-medium'>Meter Awal</label>
                      <Input
                        type='number'
                        step='any'
                        {...form.register('meter_awal')}
                      />
                    </div>
                    <div className='space-y-1 col-span-3 lg:col-span-2'>
                      <label className='text-xs font-medium'>Meter Akhir</label>
                      <Input
                        type='number'
                        step='any'
                        {...form.register('meter_akhir')}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Harga & Mata Uang */}
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
                          Kurs Rupiah (Statis)
                        </label>
                        <Input
                          type='number'
                          step='any'
                          {...form.register('exchange_rate')}
                          placeholder='15500'
                          className='border-amber-500/50 focus-visible:ring-amber-500'
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

            {/* Sisi Kanan: Panel Kalkulasi Otomatis */}
            <div className='w-full lg:w-[380px] bg-sidebar/50 p-6 flex flex-col justify-between sidebar-gradient-dark'>
              <div>
                <div className='flex items-center gap-2 mb-6'>
                  <Calculator className='w-5 h-5 text-primary' />
                  <h3 className='font-heading font-semibold text-lg'>
                    Auto Kalkulasi
                  </h3>
                </div>

                <div className='space-y-4'>
                  <div className='bg-background/80 p-3 rounded-lg border border-border'>
                    <p className='text-xs text-muted-foreground mb-1'>
                      Selisih Meter (Matering Fill Post)
                    </p>
                    <p className='text-lg font-mono font-semibold'>
                      {calcMatering.toFixed(2)}{' '}
                      <span className='text-xs font-sans text-muted-foreground'>
                        M³
                      </span>
                    </p>
                  </div>

                  <div className='bg-background/80 p-3 rounded-lg border border-border'>
                    <p className='text-xs text-muted-foreground mb-1'>
                      Volume MMSCF
                    </p>
                    <p className='text-lg font-mono font-semibold text-blue-500'>
                      {calcMMSCF.toFixed(4)}
                    </p>
                  </div>

                  <div className='bg-background/80 p-3 rounded-lg border border-border border-l-4 border-l-primary shadow-sm'>
                    <p className='text-xs text-muted-foreground mb-1 font-bold'>
                      Volume MMBTU (Final Tagihan)
                    </p>
                    <p className='text-2xl font-mono font-bold text-primary'>
                      {calcMMBTU.toFixed(4)}
                    </p>
                  </div>
                </div>

                <div className='mt-8 pt-6 border-t border-border border-dashed'>
                  <p className='text-xs text-muted-foreground mb-2 flex items-center justify-between'>
                    Estimasi Total Penjualan
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

              <div className='mt-8 pt-4'>
                <Button
                  type='submit'
                  form='purchase-form'
                  className='w-full h-12 text-md font-semibold bg-primary hover:bg-primary/90 text-white'
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting
                    ? 'Menyimpan Transaksi...'
                    : 'Simpan Transaksi Pengisian'}
                </Button>
                <p className='text-[10px] text-center text-muted-foreground mt-3 leading-tight'>
                  Rumus kalkulasi saat ini menggunakan{' '}
                  <span className='text-amber-500'>dummy multiplier</span>. Akan
                  diperbarui otomatis setelah file Excel master
                  diimplementasikan.
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
