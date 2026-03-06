'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Factory,
  MoreHorizontal,
  History,
} from 'lucide-react';
import { toast } from 'sonner';

import { Supplier, SupplierFormValues, supplierSchema } from '@/types/master';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const dummySuppliers: Supplier[] = [
  {
    id: '1',
    company_name: 'PT. Gas Bumi Nusantara',
    address: 'Jl. Industri Raya Blok C, Cilegon',
    phone_number: '0254-332211',
    pic_name: 'Haryanto',
    pic_phone_number: '08122334455',
  },
  {
    id: '2',
    company_name: 'CV. Energi Mandiri',
    address: 'Kawasan MM2100, Bekasi',
    phone_number: '021-889900',
    pic_name: 'Ridwan',
    pic_phone_number: '08199887766',
  },
];

const columnHelper = createColumnHelper<Supplier>();

export default function SupplierPage() {
  const [data, setData] = useState<Supplier[]>(dummySuppliers);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      company_name: '',
      address: '',
      phone_number: '',
      pic_name: '',
      pic_phone_number: '',
    },
  });

  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingId(supplier.id);
      form.reset({ ...supplier });
    } else {
      setEditingId(null);
      form.reset({
        company_name: '',
        address: '',
        phone_number: '',
        pic_name: '',
        pic_phone_number: '',
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: SupplierFormValues) => {
    await new Promise((res) => setTimeout(res, 600));
    toast.success(
      `Supplier berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}`,
    );
    setIsDialogOpen(false);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('company_name', {
        header: 'Nama Supplier',
        cell: (info) => (
          <div className='flex items-center gap-2'>
            <Factory className='w-4 h-4 text-muted-foreground' />
            <span className='font-semibold text-foreground'>
              {info.getValue()}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('address', {
        header: 'Kontak & Alamat',
        cell: (info) => (
          <div className='flex flex-col'>
            <span className='text-sm text-foreground'>{info.getValue()}</span>
            <span className='text-xs text-muted-foreground'>
              Telp: {info.row.original.phone_number || '-'}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('pic_name', {
        header: 'Penanggung Jawab (PIC)',
        cell: (info) => (
          <div className='flex flex-col'>
            <span className='text-sm font-medium text-foreground'>
              {info.getValue()}
            </span>
            <span className='text-xs text-muted-foreground'>
              {info.row.original.pic_phone_number}
            </span>
          </div>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        cell: (info) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='bg-card border-border w-48'
            >
              <DropdownMenuItem
                onClick={() => handleOpenDialog(info.row.original)}
                className='cursor-pointer'
              >
                <Edit2 className='mr-2 h-4 w-4' /> Edit Data
              </DropdownMenuItem>
              <DropdownMenuItem className='cursor-pointer'>
                <History className='mr-2 h-4 w-4' /> Riwayat Pengisian
              </DropdownMenuItem>
              <DropdownMenuItem className='cursor-pointer text-destructive focus:text-destructive'>
                <Trash2 className='mr-2 h-4 w-4' /> Hapus (Hard Delete)
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
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col sm:flex-row justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-heading font-bold'>Master Supplier</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Kelola data pemasok gas CNG.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary text-white'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah Supplier
        </Button>
      </div>

      <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
        <div className='p-4 border-b border-border bg-muted/20'>
          <div className='relative w-full max-w-sm'>
            <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Cari supplier...'
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className='pl-9 bg-background'
            />
          </div>
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
        <DialogContent className='sm:max-w-[500px] bg-card'>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Supplier' : 'Tambah Supplier'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <Input
              {...form.register('company_name')}
              placeholder='Nama Perusahaan'
            />
            {form.formState.errors.company_name && (
              <p className='text-xs text-destructive'>
                {form.formState.errors.company_name.message}
              </p>
            )}

            <Input {...form.register('address')} placeholder='Alamat Lengkap' />
            <Input
              {...form.register('phone_number')}
              placeholder='No. Telp Kantor'
            />

            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Input {...form.register('pic_name')} placeholder='Nama PIC' />
                {form.formState.errors.pic_name && (
                  <p className='text-xs text-destructive'>
                    {form.formState.errors.pic_name.message}
                  </p>
                )}
              </div>
              <div>
                <Input
                  {...form.register('pic_phone_number')}
                  placeholder='No. HP PIC'
                />
                {form.formState.errors.pic_phone_number && (
                  <p className='text-xs text-destructive'>
                    {form.formState.errors.pic_phone_number.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type='submit'
                className='bg-primary text-white'
                disabled={form.formState.isSubmitting}
              >
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
