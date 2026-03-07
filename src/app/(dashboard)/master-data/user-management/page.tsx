'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Users,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { format } from 'date-fns';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/form/Input';
import { SearchInput } from '@/components/form/SearchInput';
import { Select } from '@/components/form/Select';
import { DataTable } from '@/components/_shared/DataTable';
import { Modal } from '@/components/_shared/Modal';
import { TableActions } from '@/components/_shared/TableActions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/**
 * Skema validasi form User Management.
 * Password bersifat opsional saat edit, namun akan divalidasi manual sebagai 'wajib' saat pembuatan (create).
 */
const userFormSchema = z.object({
  fullname: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().optional(),
  RoleId: z.string().min(1, 'Role wajib dipilih'),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export interface UserRow {
  id: string;
  fullname: string;
  email: string;
  RoleId: string;
  role?: { name: string };
  createdAt: Date;
}

const columnHelper = createColumnHelper<UserRow>();

/**
 * Halaman administrasi User Management.
 * Terintegrasi dengan endpoint /v1/user dan /v1/role untuk manajemen akses pengguna sistem.
 *
 * @returns {JSX.Element} Komponen UI halaman User Management
 */
export default function UserManagementPage() {
  const [data, setData] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<{ label: string; value: string }[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      fullname: '',
      email: '',
      password: '',
      RoleId: '',
    },
  });

  /**
   * Mengambil data pengguna dan daftar role yang tersedia dari backend secara bersamaan.
   *
   * @returns {Promise<void>}
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [userRes, roleRes] = await Promise.all([
        api.get<any>('/v1/user'),
        api.get<any>('/v1/role'),
      ]);

      const userList = Array.isArray(userRes.data)
        ? userRes.data
        : userRes.data?.rows || [];
      const roleList = Array.isArray(roleRes.data)
        ? roleRes.data
        : roleRes.data?.rows || [];

      setRoles(roleList.map((r: any) => ({ label: r.name, value: r.id })));
      setData(
        userList.sort(
          (a: UserRow, b: UserRow) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data pengguna dari server.');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Mempersiapkan *state* dan membuka modal form.
   * Mengosongkan isian password demi keamanan, pengguna hanya mengisinya jika ingin melakukan *reset* password.
   *
   * @param {UserRow} [user] - Data pengguna jika berada pada mode edit
   */
  const handleOpenDialog = (user?: UserRow) => {
    if (user) {
      setEditingId(user.id);
      form.reset({
        fullname: user.fullname,
        email: user.email,
        RoleId: user.RoleId,
        password: '',
      });
    } else {
      setEditingId(null);
      form.reset({ fullname: '', email: '', password: '', RoleId: '' });
    }
    setIsDialogOpen(true);
  };

  /**
   * Mengelola logika pengiriman form (Create/Update).
   * Memastikan *password* wajib diisi khusus untuk pembuatan *user* baru.
   *
   * @param {UserFormValues} values - Nilai tervalidasi dari form
   */
  const onSubmit = async (values: UserFormValues) => {
    try {
      const payload = { ...values };

      if (!editingId && !payload.password) {
        form.setError('password', {
          type: 'manual',
          message: 'Password wajib diisi untuk pengguna baru',
        });
        return;
      }

      if (editingId && !payload.password) {
        delete payload.password;
      }

      if (editingId) {
        await api.put(`/v1/user/${editingId}`, payload);
        toast.success('Data pengguna berhasil diperbarui.');
      } else {
        await api.post('/v1/user', payload);
        toast.success('Pengguna baru berhasil ditambahkan.');
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(
        err.message || 'Terjadi kesalahan saat menyimpan data pengguna.',
      );
    }
  };

  /**
   * Mengirim instruksi hapus (DELETE) pengguna ke *backend* berdasarkan ID.
   */
  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/user/${deletingId}`);
      toast.success('Pengguna berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data pengguna.');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        (item.fullname || '')
          .toLowerCase()
          .includes(globalFilter.toLowerCase()) ||
        (item.email || '').toLowerCase().includes(globalFilter.toLowerCase());
      const matchRole =
        roleFilter === 'Semua' ? true : item.RoleId === roleFilter;
      return matchSearch && matchRole;
    });
  }, [data, globalFilter, roleFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('fullname', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nama Pengguna <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <div className='flex items-center gap-3'>
            <div className='h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs'>
              {info.getValue().substring(0, 2).toUpperCase()}
            </div>
            <div className='flex flex-col'>
              <span className='font-semibold text-foreground'>
                {info.getValue()}
              </span>
              <span className='text-xs text-muted-foreground'>
                {info.row.original.email}
              </span>
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('role', {
        header: 'Hak Akses (Role)',
        cell: (info) => (
          <Badge
            variant='outline'
            className='bg-background flex w-fit items-center gap-1'
          >
            <Shield className='w-3 h-3 text-primary' />{' '}
            {info.getValue()?.name || 'No Role'}
          </Badge>
        ),
      }),
      columnHelper.accessor('createdAt', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tgl. Terdaftar <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='text-sm text-muted-foreground'>
            {info.getValue()
              ? format(new Date(info.getValue()), 'dd MMM yyyy, HH:mm')
              : '-'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: () => <div className='text-right'>Aksi</div>,
        cell: (info) => (
          <TableActions
            onEdit={() => handleOpenDialog(info.row.original)}
            onDelete={() => setDeletingId(info.row.original.id)}
          />
        ),
      }),
    ],
    [],
  );

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-heading font-bold text-foreground tracking-tight'>
            User Management
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Manajemen akun pengguna sistem dan penugasan role akses.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah User
        </Button>
      </div>

      {error && !isLoading && (
        <div className='bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center justify-between shadow-sm'>
          <div className='flex items-center gap-3'>
            <AlertCircle className='h-5 w-5 text-destructive' />
            <p className='text-sm font-medium text-destructive'>{error}</p>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={fetchData}
            className='border-destructive/30 text-destructive hover:bg-destructive/10'
          >
            <RefreshCcw className='h-4 w-4 mr-2' /> Coba Lagi
          </Button>
        </div>
      )}

      <div className='bg-card border border-border rounded-xl shadow-soft-depth overflow-hidden'>
        <div className='p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20'>
          <SearchInput
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder='Cari nama atau email pengguna...'
            className='w-full sm:max-w-sm'
          />

          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
              Role:
            </span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className='flex h-9 w-full sm:w-48 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary'
            >
              <option value='Semua'>Semua Role</option>
              {roles.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DataTable
          columns={columns as any}
          data={filteredData}
          isLoading={isLoading}
          emptyMessage='Tidak ada data pengguna yang ditemukan.'
        />
      </div>

      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Akun Pengguna' : 'Buat Akun Pengguna Baru'}
        size='md'
        footer={
          <div className='flex justify-end gap-3 w-full'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setIsDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              type='submit'
              form='user-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Pengguna'}
            </Button>
          </div>
        }
      >
        <form
          id='user-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-5 py-2'
        >
          <Input
            label='Nama Lengkap'
            required
            placeholder='John Doe'
            error={form.formState.errors.fullname?.message}
            {...form.register('fullname')}
          />
          <Input
            label='Alamat Email'
            required
            type='email'
            placeholder='admin@artoageng.co.id'
            error={form.formState.errors.email?.message}
            {...form.register('email')}
          />
          <Select
            label='Role Akses'
            required
            options={roles}
            value={form.watch('RoleId')}
            onChange={(val) => form.setValue('RoleId', val)}
            error={form.formState.errors.RoleId?.message}
          />

          <div className='pt-2 border-t border-border/50'>
            <Input
              label={editingId ? 'Reset Password (Opsional)' : 'Password'}
              required={!editingId}
              type='password'
              placeholder={
                editingId ? 'Kosongkan jika tidak ingin diubah' : '••••••••'
              }
              error={form.formState.errors.password?.message}
              {...form.register('password')}
            />
            {editingId && (
              <p className='text-[10px] text-muted-foreground mt-1 font-medium'>
                *Biarkan kosong jika Anda tidak ingin mengubah password akun
                ini.
              </p>
            )}
          </div>
        </form>
      </Modal>

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent className='bg-card border-border'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-destructive flex items-center gap-2'>
              <AlertCircle className='h-5 w-5' /> Konfirmasi Penghapusan
            </AlertDialogTitle>
            <AlertDialogDescription className='text-muted-foreground'>
              Apakah Anda yakin ingin menghapus akun pengguna ini? Pengguna
              tidak akan dapat mengakses sistem lagi setelah dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Akun'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
