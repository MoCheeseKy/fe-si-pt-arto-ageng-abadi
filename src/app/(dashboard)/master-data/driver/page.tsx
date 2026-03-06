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
  Edit2,
  Trash2,
  Truck,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

import { Driver, DriverFormValues, driverSchema } from '@/types/master';
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

const dummyDrivers: Driver[] = [
  {
    id: '1',
    name: 'Ahmad Sujatmiko',
    nik: '3273112233445566',
    phone_number: '08123456789',
  },
  {
    id: '2',
    name: 'Benny Setiawan',
    nik: '3273998877665544',
    phone_number: '08198765432',
  },
];

const columnHelper = createColumnHelper<Driver>();

export default function DriverPage() {
  const [data, setData] = useState<Driver[]>(dummyDrivers);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema),
    defaultValues: { name: '', nik: '', phone_number: '' },
  });

  const handleOpenDialog = (driver?: Driver) => {
    if (driver) {
      setEditingId(driver.id);
      form.reset({ ...driver });
    } else {
      setEditingId(null);
      form.reset({ name: '', nik: '', phone_number: '' });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: DriverFormValues) => {
    await new Promise((res) => setTimeout(res, 400));
    toast.success(
      `Driver berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}`,
    );
    setIsDialogOpen(false);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Nama Driver',
        cell: (info) => (
          <div className='flex items-center gap-2'>
            <Truck className='w-4 h-4 text-muted-foreground' />
            <span className='font-semibold text-foreground'>
              {info.getValue()}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('nik', {
        header: 'NIK KTP',
        cell: (info) => (
          <span className='font-mono text-sm'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('phone_number', {
        header: 'No. Handphone',
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
            <DropdownMenuContent align='end' className='bg-card border-border'>
              <DropdownMenuItem
                onClick={() => handleOpenDialog(info.row.original)}
                className='cursor-pointer'
              >
                <Edit2 className='mr-2 h-4 w-4' /> Edit Driver
              </DropdownMenuItem>
              <DropdownMenuItem className='cursor-pointer text-destructive focus:text-destructive'>
                <Trash2 className='mr-2 h-4 w-4' /> Hapus
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
      <div className='flex flex-col sm:flex-row justify-between gap-4'>
        <div>
          <h2 className='text-2xl font-heading font-bold'>Master Driver</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Data pengemudi operasional GTM.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary text-white'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah Driver
        </Button>
      </div>

      <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
        <div className='p-4 border-b border-border bg-muted/20'>
          <div className='relative w-full max-w-sm'>
            <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Cari driver...'
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
        <DialogContent className='sm:max-w-[400px] bg-card'>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Driver' : 'Tambah Driver'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div>
              <Input {...form.register('name')} placeholder='Nama Lengkap' />
              {form.formState.errors.name && (
                <p className='text-xs text-destructive mt-1'>
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Input
                {...form.register('nik')}
                placeholder='NIK (16 Digit)'
                maxLength={16}
              />
              {form.formState.errors.nik && (
                <p className='text-xs text-destructive mt-1'>
                  {form.formState.errors.nik.message}
                </p>
              )}
            </div>
            <div>
              <Input
                {...form.register('phone_number')}
                placeholder='Nomor Handphone'
              />
              {form.formState.errors.phone_number && (
                <p className='text-xs text-destructive mt-1'>
                  {form.formState.errors.phone_number.message}
                </p>
              )}
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
