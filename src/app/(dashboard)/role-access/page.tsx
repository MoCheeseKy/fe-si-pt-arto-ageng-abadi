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
  Shield,
  Edit2,
  Trash2,
  MoreHorizontal,
  CheckSquare,
} from 'lucide-react';
import { toast } from 'sonner';

import { Role, RoleFormValues, roleSchema } from '@/types/role';
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

const dummyRoles: Role[] = [
  {
    id: '1',
    name: 'Super Admin',
    description: 'Akses penuh ke seluruh sistem',
    total_users: 1,
  },
  {
    id: '2',
    name: 'Finance',
    description: 'Akses modul keuangan dan accounting',
    total_users: 2,
  },
  {
    id: '3',
    name: 'Operator',
    description: 'Akses modul operasional lapangan',
    total_users: 4,
  },
];

// Mock data: Daftar modul/navigasi yang ada di sistem
const availableModules = [
  { id: 'MOD-01', category: 'Master Data', name: 'Master Customer' },
  { id: 'MOD-02', category: 'Master Data', name: 'Master Supplier' },
  { id: 'MOD-03', category: 'Master Data', name: 'Master Driver' },
  { id: 'MOD-04', category: 'Operasional', name: 'Pengisian Gas (Pembelian)' },
  { id: 'MOD-05', category: 'Operasional', name: 'Pemakaian Gas (Distribusi)' },
  { id: 'MOD-06', category: 'Operasional', name: 'Kontrak & Penawaran' },
  { id: 'MOD-07', category: 'Keuangan', name: 'Manajemen Invoice' },
  { id: 'MOD-08', category: 'Keuangan', name: 'Wallet & Deposit' },
  { id: 'MOD-09', category: 'Keuangan', name: 'Pengeluaran & Petty Cash' },
  { id: 'MOD-10', category: 'Accounting', name: 'Buku Besar & Jurnal' },
  { id: 'MOD-11', category: 'Sistem', name: 'User & Role Management' },
];

const columnHelper = createColumnHelper<Role>();

export default function RoleAccessPage() {
  const [data, setData] = useState<Role[]>(dummyRoles);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', description: '', permissions: [] },
  });

  const watchPermissions =
    useWatch({ control: form.control, name: 'permissions' }) || [];

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingId(role.id);
      // Simulasi fetch permissions yang sudah ada
      form.reset({
        name: role.name,
        description: role.description,
        permissions:
          role.name === 'Finance'
            ? ['MOD-07', 'MOD-08', 'MOD-09', 'MOD-10']
            : ['MOD-01'],
      });
    } else {
      setEditingId(null);
      form.reset({ name: '', description: '', permissions: [] });
    }
    setIsDialogOpen(true);
  };

  const handleTogglePermission = (modId: string, checked: boolean) => {
    if (checked)
      form.setValue('permissions', [...watchPermissions, modId], {
        shouldValidate: true,
      });
    else
      form.setValue(
        'permissions',
        watchPermissions.filter((id) => id !== modId),
        { shouldValidate: true },
      );
  };

  const handleSelectAll = () => {
    form.setValue(
      'permissions',
      availableModules.map((m) => m.id),
      { shouldValidate: true },
    );
  };

  const handleDeselectAll = () => {
    form.setValue('permissions', [], { shouldValidate: true });
  };

  const onSubmit = async (values: RoleFormValues) => {
    await new Promise((res) => setTimeout(res, 500));
    toast.success(
      `Role & Hak Akses berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}.`,
    );
    setIsDialogOpen(false);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: 'Nama Jabatan (Role)',
        cell: (info) => (
          <span className='font-bold text-primary'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('description', {
        header: 'Deskripsi',
        cell: (info) => (
          <span className='text-muted-foreground'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('total_users', {
        header: 'Total Pengguna',
        cell: (info) => (
          <Badge variant='secondary'>{info.getValue()} User</Badge>
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
            <DropdownMenuContent align='end' className='w-48'>
              <DropdownMenuItem
                onClick={() => handleOpenDialog(info.row.original)}
              >
                <Edit2 className='mr-2 h-4 w-4' /> Edit Hak Akses
              </DropdownMenuItem>
              <DropdownMenuItem className='text-destructive'>
                <Trash2 className='mr-2 h-4 w-4' /> Hapus Role
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      }),
    ],
    [watchPermissions],
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  // Group modules by category for UI grouping
  const groupedModules = availableModules.reduce(
    (acc, mod) => {
      if (!acc[mod.category]) acc[mod.category] = [];
      acc[mod.category].push(mod);
      return acc;
    },
    {} as Record<string, typeof availableModules>,
  );

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-heading font-bold flex items-center gap-2'>
            <Shield className='w-6 h-6 text-primary' /> Role Access
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Definisikan jabatan dan atur modul apa saja yang boleh mereka akses.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary text-white'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah Role
        </Button>
      </div>

      <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
        <div className='p-4 border-b border-border bg-muted/20'>
          <Input
            placeholder='Cari nama role...'
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-2xl bg-card max-h-[90vh] flex flex-col p-0'>
          <div className='p-6 pb-4 border-b border-border'>
            <DialogTitle className='text-xl font-heading'>
              {editingId ? 'Edit Role & Hak Akses' : 'Buat Role Baru'}
            </DialogTitle>
          </div>

          <form
            id='role-form'
            onSubmit={form.handleSubmit(onSubmit)}
            className='flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6'
          >
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1 col-span-2 sm:col-span-1'>
                <label className='text-xs font-bold'>Nama Jabatan (Role)</label>
                <Input
                  {...form.register('name')}
                  placeholder='Contoh: Admin Gudang'
                />
              </div>
              <div className='space-y-1 col-span-2 sm:col-span-1'>
                <label className='text-xs'>Deskripsi (Opsional)</label>
                <Input
                  {...form.register('description')}
                  placeholder='Tugas operasional...'
                />
              </div>
            </div>

            <div className='space-y-3 pt-2'>
              <div className='flex justify-between items-end border-b border-border pb-2'>
                <div>
                  <h3 className='text-sm font-bold text-primary flex items-center gap-2'>
                    <CheckSquare className='w-4 h-4' /> Pengaturan Hak Akses
                    (Modul)
                  </h3>
                  <p className='text-xs text-muted-foreground mt-1'>
                    Centang modul yang boleh dilihat & dikelola oleh role ini.
                  </p>
                </div>
                <div className='space-x-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleSelectAll}
                    className='h-7 text-[10px]'
                  >
                    Pilih Semua
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleDeselectAll}
                    className='h-7 text-[10px]'
                  >
                    Hapus Semua
                  </Button>
                </div>
              </div>

              {form.formState.errors.permissions && (
                <p className='text-xs text-destructive bg-destructive/10 p-2 rounded'>
                  {form.formState.errors.permissions.message}
                </p>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6 pt-2'>
                {Object.entries(groupedModules).map(([category, modules]) => (
                  <div key={category} className='space-y-2'>
                    <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 p-1.5 rounded'>
                      {category}
                    </h4>
                    <div className='space-y-2 pl-2'>
                      {modules.map((mod) => (
                        <div
                          key={mod.id}
                          className='flex items-center space-x-3'
                        >
                          <input
                            type='checkbox'
                            id={`mod-${mod.id}`}
                            className='w-4 h-4 text-primary rounded border-border focus:ring-primary bg-background'
                            checked={watchPermissions.includes(mod.id)}
                            onChange={(e) =>
                              handleTogglePermission(mod.id, e.target.checked)
                            }
                          />
                          <label
                            htmlFor={`mod-${mod.id}`}
                            className='text-sm font-medium cursor-pointer text-foreground'
                          >
                            {mod.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>

          <div className='p-4 border-t border-border bg-muted/10'>
            <Button
              type='submit'
              form='role-form'
              className='w-full bg-primary text-white'
            >
              Simpan Role & Akses
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
