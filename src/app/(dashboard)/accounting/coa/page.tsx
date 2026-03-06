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
import { Search, Plus, BookOpen, Edit2, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import { Coa, CoaFormValues, coaSchema } from '@/types/accounting';
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

const dummyCoa: Coa[] = [
  {
    id: '1',
    account_code: '1110',
    account_name: 'Kas Tunai',
    category: 'Aset',
    balance: 15000000,
    status: 'Aktif',
  },
  {
    id: '2',
    account_code: '1120',
    account_name: 'Bank BCA',
    category: 'Aset',
    balance: 245000000,
    status: 'Aktif',
  },
  {
    id: '3',
    account_code: '4110',
    account_name: 'Pendapatan Penjualan Gas',
    category: 'Pendapatan',
    balance: 850000000,
    status: 'Aktif',
  },
  {
    id: '4',
    account_code: '5110',
    account_name: 'Beban Operasional GTM',
    category: 'Beban',
    balance: -45000000,
    status: 'Aktif',
  },
];

const columnHelper = createColumnHelper<Coa>();

export default function CoaPage() {
  const [data, setData] = useState<Coa[]>(dummyCoa);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<CoaFormValues>({
    resolver: zodResolver(coaSchema),
    defaultValues: {
      account_code: '',
      account_name: '',
      category: 'Aset',
      description: '',
    },
  });

  const onSubmit = async (values: CoaFormValues) => {
    await new Promise((res) => setTimeout(res, 500));
    toast.success('Akun CoA berhasil ditambahkan.');
    setIsDialogOpen(false);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('account_code', {
        header: 'Kode Akun',
        cell: (info) => (
          <span className='font-mono font-bold text-primary'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('account_name', {
        header: 'Nama Akun',
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('category', {
        header: 'Kategori',
        cell: (info) => {
          const cat = info.getValue();
          return (
            <Badge
              variant='outline'
              className={
                cat === 'Aset'
                  ? 'text-blue-500 border-blue-500/30'
                  : cat === 'Pendapatan'
                    ? 'text-emerald-500 border-emerald-500/30'
                    : 'text-muted-foreground'
              }
            >
              {cat}
            </Badge>
          );
        },
      }),
      columnHelper.accessor('balance', {
        header: 'Saldo Terkini',
        cell: (info) => {
          const val = info.getValue();
          return (
            <span
              className={`font-mono font-semibold ${val < 0 ? 'text-rose-500' : 'text-foreground'}`}
            >
              Rp {val.toLocaleString('id-ID')}
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
                <Edit2 className='mr-2 h-4 w-4' /> Edit Akun
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
          <h2 className='text-2xl font-heading font-bold flex items-center gap-2'>
            <BookOpen className='w-6 h-6 text-primary' /> Chart of Account (CoA)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Struktur buku besar untuk mencatat semua aliran dana.
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className='bg-primary text-white'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah Akun
        </Button>
      </div>

      <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
        <div className='p-4 border-b border-border bg-muted/20'>
          <Input
            placeholder='Cari kode atau nama akun...'
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-md bg-card'>
          <DialogHeader>
            <DialogTitle>Tambah Akun CoA</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4 mt-2'
          >
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1'>
                <label className='text-xs'>Kode Akun</label>
                <Input
                  {...form.register('account_code')}
                  placeholder='Contoh: 1110'
                  className='font-mono'
                />
              </div>
              <div className='space-y-1'>
                <label className='text-xs'>Kategori</label>
                <select
                  {...form.register('category')}
                  className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm'
                >
                  <option value='Aset'>Aset</option>
                  <option value='Kewajiban'>Kewajiban</option>
                  <option value='Ekuitas'>Ekuitas</option>
                  <option value='Pendapatan'>Pendapatan</option>
                  <option value='Beban'>Beban</option>
                </select>
              </div>
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Nama Akun</label>
              <Input
                {...form.register('account_name')}
                placeholder='Kas Tunai...'
              />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Deskripsi (Opsional)</label>
              <Input {...form.register('description')} />
            </div>
            <DialogFooter className='pt-4'>
              <Button type='submit' className='w-full bg-primary text-white'>
                Simpan Akun
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
