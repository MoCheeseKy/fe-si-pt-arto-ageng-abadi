'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
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
  Banknote,
  CheckCircle2,
  CircleDashed,
} from 'lucide-react';
import { toast } from 'sonner';

import { Kasbon, KasbonFormValues, kasbonSchema } from '@/types/keuangan';
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

const dummyKasbon: Kasbon[] = [
  {
    id: 'KB-2510-001',
    date: '2025-10-10',
    employee_name: 'Ahmad Sujatmiko',
    description: 'Biaya sekolah anak',
    amount: 3000000,
    monthly_deduction: 500000,
    status: 'Aktif',
  },
  {
    id: 'KB-2508-012',
    date: '2025-08-05',
    employee_name: 'Benny Setiawan',
    description: 'Renovasi rumah',
    amount: 5000000,
    monthly_deduction: 1000000,
    status: 'Lunas',
  },
];

const columnHelper = createColumnHelper<Kasbon>();

export default function KasbonPage() {
  const [data, setData] = useState<Kasbon[]>(dummyKasbon);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<KasbonFormValues>({
    resolver: zodResolver(kasbonSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      employee_id: '',
      description: '',
      amount: 0,
      monthly_deduction: 0,
    },
  });

  const onSubmit = async (values: KasbonFormValues) => {
    await new Promise((res) => setTimeout(res, 500));
    toast.success('Data kasbon berhasil dicatat.');
    setIsDialogOpen(false);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('date', { header: 'Tanggal' }),
      columnHelper.accessor('employee_name', {
        header: 'Nama Karyawan',
        cell: (info) => (
          <span className='font-semibold'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('description', { header: 'Keterangan' }),
      columnHelper.accessor('amount', {
        header: 'Total Kasbon',
        cell: (info) => (
          <span className='font-mono text-rose-500'>
            Rp {info.getValue().toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper.accessor('monthly_deduction', {
        header: 'Potongan/Bulan',
        cell: (info) => (
          <span className='font-mono text-muted-foreground'>
            Rp {info.getValue().toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const isActive = info.getValue() === 'Aktif';
          return (
            <Badge
              variant={isActive ? 'secondary' : 'default'}
              className={
                isActive
                  ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                  : 'bg-emerald-500'
              }
            >
              {isActive ? (
                <CircleDashed className='w-3 h-3 mr-1' />
              ) : (
                <CheckCircle2 className='w-3 h-3 mr-1' />
              )}
              {info.getValue()}
            </Badge>
          );
        },
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
          <h2 className='text-2xl font-heading font-bold flex items-center gap-2'>
            <Banknote className='w-6 h-6 text-primary' /> Kasbon Karyawan
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Kelola pinjaman karyawan dan skema potongan bulanan.
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className='bg-primary text-white'
        >
          <Plus className='w-4 h-4 mr-2' /> Input Kasbon
        </Button>
      </div>

      <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
        <div className='p-4 border-b border-border bg-muted/20'>
          <Input
            placeholder='Cari karyawan...'
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className='max-w-sm bg-background'
          />
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-muted/40 text-muted-foreground font-heading border-b border-border'>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className='px-6 py-4 font-semibold'>
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

      {/* Dialog Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-md bg-card'>
          <DialogHeader>
            <DialogTitle>Input Kasbon Baru</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4 mt-2'
          >
            <div className='space-y-1'>
              <label className='text-xs'>Tanggal</label>
              <Input type='date' {...form.register('date')} />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Karyawan</label>
              <select
                {...form.register('employee_id')}
                className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm'
              >
                <option value=''>-- Pilih Karyawan --</option>
                <option value='1'>Ahmad Sujatmiko</option>
                <option value='2'>Benny Setiawan</option>
              </select>
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Keterangan / Keperluan</label>
              <Input {...form.register('description')} />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1'>
                <label className='text-xs'>Jumlah Kasbon</label>
                <Input
                  type='number'
                  {...form.register('amount')}
                  className='text-rose-500 font-mono'
                />
              </div>
              <div className='space-y-1'>
                <label className='text-xs'>Potongan / Bulan</label>
                <Input
                  type='number'
                  {...form.register('monthly_deduction')}
                  className='font-mono'
                />
              </div>
            </div>
            <DialogFooter className='pt-4'>
              <Button type='submit' className='w-full bg-primary text-white'>
                Simpan Data
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
