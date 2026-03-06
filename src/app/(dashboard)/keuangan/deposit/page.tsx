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
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { Deposit, DepositFormValues, depositSchema } from '@/types/keuangan';
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

const dummyDeposits: Deposit[] = [
  {
    id: 'DEP-001',
    date: '2025-10-20',
    customer_name: 'PT. Industri Maju Abadi',
    amount: 20000000,
    type: 'Top Up',
  },
  {
    id: 'DEP-002',
    date: '2025-10-25',
    customer_name: 'PT. Industri Maju Abadi',
    amount: 5000000,
    type: 'Deduction',
    reference_id: 'INV/AAA/1025/001',
  },
];

const columnHelper = createColumnHelper<Deposit>();

export default function DepositPage() {
  const [data, setData] = useState<Deposit[]>(dummyDeposits);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<DepositFormValues>({
    resolver: zodResolver(depositSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      customer_id: '',
      amount: 0,
      note: '',
    },
  });

  const onSubmit = async (values: DepositFormValues) => {
    await new Promise((res) => setTimeout(res, 600));
    toast.success('Top Up Deposit berhasil dicatat.');
    setIsDialogOpen(false);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID Transaksi',
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('date', { header: 'Tanggal' }),
      columnHelper.accessor('customer_name', { header: 'Customer' }),
      columnHelper.accessor('type', {
        header: 'Tipe Mutasi',
        cell: (info) => {
          const val = info.getValue();
          return (
            <Badge
              variant='outline'
              className={
                val === 'Top Up'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
              }
            >
              {val === 'Top Up' ? (
                <ArrowUpRight className='w-3 h-3 mr-1' />
              ) : (
                <ArrowDownRight className='w-3 h-3 mr-1' />
              )}
              {val}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('amount', {
        header: 'Jumlah (Rp)',
        cell: (info) => {
          const isTopUp = info.row.original.type === 'Top Up';
          return (
            <span
              className={`font-mono font-bold ${isTopUp ? 'text-emerald-500' : 'text-rose-500'}`}
            >
              {isTopUp ? '+' : '-'} Rp {info.getValue().toLocaleString('id-ID')}
            </span>
          );
        },
      }),
      columnHelper.accessor('reference_id', {
        header: 'Referensi',
        cell: (info) => (
          <span className='text-xs text-muted-foreground'>
            {info.getValue() || '-'}
          </span>
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
          <h2 className='text-2xl font-heading font-bold flex items-center gap-2'>
            <Wallet className='w-6 h-6 text-primary' /> Wallet & Deposit
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Kelola saldo deposit customer (Top-up manual & pemotongan otomatis).
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className='bg-primary text-white'
        >
          <Plus className='w-4 h-4 mr-2' /> Top Up Saldo
        </Button>
      </div>

      <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
        <div className='p-4 border-b border-border bg-muted/20'>
          <Input
            placeholder='Cari transaksi atau customer...'
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className='max-w-sm bg-background'
          />
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-muted/40 text-muted-foreground font-heading'>
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

      {/* Dialog Form Top Up */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-md bg-card'>
          <DialogHeader>
            <DialogTitle>Top Up Saldo Customer</DialogTitle>
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
              <label className='text-xs'>Customer</label>
              <select
                {...form.register('customer_id')}
                className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm'
              >
                <option value=''>-- Pilih Customer --</option>
                <option value='1'>PT. Industri Maju Abadi</option>
              </select>
              {form.formState.errors.customer_id && (
                <p className='text-[10px] text-destructive'>
                  {form.formState.errors.customer_id.message}
                </p>
              )}
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Jumlah Deposit (Rp)</label>
              <Input
                type='number'
                {...form.register('amount')}
                className='font-mono text-lg text-emerald-500'
              />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Catatan Referensi</label>
              <Input
                {...form.register('note')}
                placeholder='Transfer via BCA...'
              />
            </div>
            <DialogFooter className='pt-4'>
              <Button type='submit' className='w-full bg-primary text-white'>
                Proses Top Up
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
