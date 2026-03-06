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
  Users,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

import { Employee, EmployeeFormValues, employeeSchema } from '@/types/master';
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

const dummyEmployees: Employee[] = [
  {
    id: '1',
    name: 'Ahmad Sujatmiko',
    nik: '3273112233445566',
    position: 'Driver GTM',
    phone_number: '08123456789',
    status: 'Aktif',
  },
  {
    id: '2',
    name: 'Benny Setiawan',
    nik: '3273998877665544',
    position: 'Operator Mother Station',
    phone_number: '08198765432',
    status: 'Aktif',
  },
  {
    id: '3',
    name: 'Siti Aminah',
    nik: '3273123456789012',
    position: 'Finance',
    phone_number: '081566778899',
    status: 'Nonaktif',
  },
];

const columnHelper = createColumnHelper<Employee>();

export default function KaryawanPage() {
  const [data, setData] = useState<Employee[]>(dummyEmployees);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { name: '', nik: '', position: '', phone_number: '' },
  });

  const handleOpenDialog = (employee?: Employee) => {
    if (employee) {
      setEditingId(employee.id);
      form.reset({ ...employee });
    } else {
      setEditingId(null);
      form.reset({ name: '', nik: '', position: '', phone_number: '' });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: EmployeeFormValues) => {
    await new Promise((res) => setTimeout(res, 400));
    toast.success(
      `Karyawan berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}`,
    );
    setIsDialogOpen(false);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Nama Karyawan',
        cell: (info) => (
          <div className='flex items-center gap-2'>
            <Users className='w-4 h-4 text-muted-foreground' />
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
      columnHelper.accessor('position', { header: 'Jabatan' }),
      columnHelper.accessor('phone_number', { header: 'No. Handphone' }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge
            variant={info.getValue() === 'Aktif' ? 'default' : 'secondary'}
            className={info.getValue() === 'Aktif' ? 'bg-emerald-500' : ''}
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
              <Button variant='ghost' size='icon' className='h-8 w-8'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='bg-card border-border'>
              <DropdownMenuItem
                onClick={() => handleOpenDialog(info.row.original)}
                className='cursor-pointer'
              >
                <Edit2 className='mr-2 h-4 w-4' /> Edit Karyawan
              </DropdownMenuItem>
              <DropdownMenuItem className='cursor-pointer text-destructive focus:text-destructive'>
                <Trash2 className='mr-2 h-4 w-4' /> Nonaktifkan
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
          <h2 className='text-2xl font-heading font-bold'>Master Karyawan</h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Data referensi pegawai untuk modul Payroll dan Kasbon.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary text-white'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah Karyawan
        </Button>
      </div>

      <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
        <div className='p-4 border-b border-border bg-muted/20'>
          <div className='relative w-full max-w-sm'>
            <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Cari karyawan atau NIK...'
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
              {editingId ? 'Edit Karyawan' : 'Tambah Karyawan'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4 mt-2'
          >
            <div className='space-y-1'>
              <label className='text-xs font-medium'>Nama Lengkap</label>
              <Input {...form.register('name')} />
            </div>
            <div className='space-y-1'>
              <label className='text-xs font-medium'>NIK KTP (16 Digit)</label>
              <Input {...form.register('nik')} maxLength={16} />
            </div>
            <div className='space-y-1'>
              <label className='text-xs font-medium'>Jabatan</label>
              <Input
                {...form.register('position')}
                placeholder='Contoh: Finance / Driver'
              />
            </div>
            <div className='space-y-1'>
              <label className='text-xs font-medium'>Nomor Handphone</label>
              <Input {...form.register('phone_number')} />
            </div>
            <DialogFooter className='pt-4'>
              <Button
                type='submit'
                className='w-full bg-primary text-white'
                disabled={form.formState.isSubmitting}
              >
                Simpan Data
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
