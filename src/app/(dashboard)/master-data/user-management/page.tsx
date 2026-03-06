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
  ShieldCheck,
  Edit2,
  Trash2,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

import { User, UserFormValues, userSchema } from '@/types/auth';
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

const dummyUsers: User[] = [
  {
    id: '1',
    name: 'Budi Administrator',
    username: 'admin',
    role: 'Super Admin',
    status: 'Aktif',
  },
  {
    id: '2',
    name: 'Siti Keuangan',
    username: 'finance',
    role: 'Finance',
    status: 'Aktif',
  },
  {
    id: '3',
    name: 'Agus Operasional',
    username: 'operator1',
    role: 'Operator',
    status: 'Nonaktif',
  },
];

const columnHelper = createColumnHelper<User>();

export default function UserManagementPage() {
  const [data, setData] = useState<User[]>(dummyUsers);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', username: '', password: '', role: '' },
  });

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      form.reset({
        name: user.name,
        username: user.username,
        role: user.role,
        password: '',
      });
    } else {
      setEditingId(null);
      form.reset({ name: '', username: '', password: '', role: '' });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: UserFormValues) => {
    await new Promise((res) => setTimeout(res, 500));
    toast.success(`User berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}.`);
    setIsDialogOpen(false);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Nama Lengkap',
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('username', {
        header: 'Username',
        cell: (info) => (
          <span className='font-mono text-muted-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('role', {
        header: 'Jabatan (Role)',
        cell: (info) => (
          <Badge variant='outline' className='border-primary/30 text-primary'>
            {info.getValue()}
          </Badge>
        ),
      }),
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
              <Button variant='ghost' size='icon'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={() => handleOpenDialog(info.row.original)}
              >
                <Edit2 className='mr-2 h-4 w-4' /> Edit User
              </DropdownMenuItem>
              <DropdownMenuItem className='text-destructive'>
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
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-heading font-bold flex items-center gap-2'>
            <ShieldCheck className='w-6 h-6 text-primary' /> User Management
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Kelola akses pengguna dan jabatan (Role-Based Access Control).
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary text-white'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah User
        </Button>
      </div>

      <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
        <div className='p-4 border-b border-border bg-muted/20'>
          <Input
            placeholder='Cari nama atau username...'
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-md bg-card'>
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit User' : 'Tambah User Baru'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4 mt-2'
          >
            <div className='space-y-1'>
              <label className='text-xs'>Nama Lengkap</label>
              <Input {...form.register('name')} />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Username</label>
              <Input {...form.register('username')} />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>
                Password{' '}
                {editingId && (
                  <span className='text-muted-foreground'>
                    (Kosongkan jika tidak ingin diubah)
                  </span>
                )}
              </label>
              <Input
                type='password'
                {...form.register('password')}
                placeholder='••••••••'
              />
              {form.formState.errors.password && (
                <p className='text-[10px] text-destructive'>
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Jabatan / Role</label>
              <select
                {...form.register('role')}
                className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm'
              >
                <option value=''>-- Pilih Role --</option>
                <option value='Super Admin'>Super Admin</option>
                <option value='Admin Operasional'>Admin Operasional</option>
                <option value='Finance'>Finance (Keuangan)</option>
                <option value='Operator'>Operator</option>
              </select>
            </div>
            <DialogFooter className='pt-4'>
              <Button type='submit' className='w-full bg-primary text-white'>
                Simpan Data User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
