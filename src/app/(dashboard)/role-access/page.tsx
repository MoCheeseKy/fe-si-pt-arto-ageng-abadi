'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  ShieldAlert,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  Shield,
  LayoutGrid,
  Link as LinkIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/form/Input';
import { SearchInput } from '@/components/form/SearchInput';
import { Select } from '@/components/form/Select';
import { DataTable } from '@/components/_shared/DataTable';
import { Modal } from '@/components/_shared/Modal';
import { TableActions } from '@/components/_shared/TableActions';
import { Tabs } from '@/components/_shared/Tabs';
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

const roleSchema = z.object({
  name: z.string().min(1, 'Nama role wajib diisi'),
});

const navigationSchema = z.object({
  name: z.string().min(1, 'Nama menu/navigasi wajib diisi'),
  path: z.string().min(1, 'Path URL wajib diisi (contoh: /dashboard)'),
});

const roleNavSchema = z.object({
  role_id: z.string().min(1, 'Role wajib dipilih'),
  navigation_id: z.string().min(1, 'Navigasi wajib dipilih'),
});

type RoleFormValues = z.infer<typeof roleSchema>;
type NavFormValues = z.infer<typeof navigationSchema>;
type RoleNavFormValues = z.infer<typeof roleNavSchema>;

export interface RoleRow extends RoleFormValues {
  id: string;
}
export interface NavRow extends NavFormValues {
  id: string;
}
export interface RoleNavRow extends RoleNavFormValues {
  id?: string;
  role_id: string;
  navigation_id: string;
  role_name?: string;
  navigation_name?: string;
  navigation_path?: string;
}

const roleHelper = createColumnHelper<RoleRow>();
const navHelper = createColumnHelper<NavRow>();
const roleNavHelper = createColumnHelper<RoleNavRow>();

/**
 * Halaman manajemen Role Access dan Navigasi.
 * Mengelola data Role, Menu Navigasi, dan pemetaan Hak Akses (Role has Navigation).
 *
 * @returns {JSX.Element} Komponen antarmuka Role Access
 */
export default function RoleAccessPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [navs, setNavs] = useState<NavRow[]>([]);
  const [roleNavs, setRoleNavs] = useState<RoleNavRow[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [roleSearch, setRoleSearch] = useState('');
  const [navSearch, setNavSearch] = useState('');
  const [roleNavSearch, setRoleNavSearch] = useState('');

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleEditId, setRoleEditId] = useState<string | null>(null);

  const [isNavModalOpen, setIsNavModalOpen] = useState(false);
  const [navEditId, setNavEditId] = useState<string | null>(null);

  const [isRoleNavModalOpen, setIsRoleNavModalOpen] = useState(false);

  const [deletingRecord, setDeletingRecord] = useState<{
    id: string;
    type: 'role' | 'nav' | 'rolenav';
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const roleForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema as any),
    defaultValues: { name: '' },
  });
  const navForm = useForm<NavFormValues>({
    resolver: zodResolver(navigationSchema as any),
    defaultValues: { name: '', path: '' },
  });
  const roleNavForm = useForm<RoleNavFormValues>({
    resolver: zodResolver(roleNavSchema as any),
    defaultValues: { role_id: '', navigation_id: '' },
  });

  /**
   * Mengambil data Role, Navigasi, dan relasinya secara paralel dari backend.
   *
   * @returns {Promise<void>}
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [roleRes, navRes, roleNavRes] = await Promise.all([
        api.get<any>('/v1/role'),
        api.get<any>('/v1/navigations'),
        api.get<any>('/v1/role-has-navigations'),
      ]);

      const roleList = Array.isArray(roleRes.data)
        ? roleRes.data
        : roleRes.data?.rows || [];
      const navList = Array.isArray(navRes.data)
        ? navRes.data
        : navRes.data?.rows || [];
      const roleNavList = Array.isArray(roleNavRes.data)
        ? roleNavRes.data
        : roleNavRes.data?.rows || [];

      setRoles(roleList);
      setNavs(navList);

      const mappedRoleNavs = roleNavList.map((rn: any) => ({
        ...rn,
        role_name:
          roleList.find((r: any) => r.id === rn.role_id)?.name ||
          'Unknown Role',
        navigation_name:
          navList.find((n: any) => n.id === rn.navigation_id)?.name ||
          'Unknown Navigasi',
        navigation_path:
          navList.find((n: any) => n.id === rn.navigation_id)?.path || '-',
      }));

      setRoleNavs(mappedRoleNavs);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data pengaturan akses.');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRoleSubmit = async (values: RoleFormValues) => {
    try {
      if (roleEditId) {
        await api.put(`/v1/role/${roleEditId}`, values);
        toast.success('Role berhasil diperbarui.');
      } else {
        await api.post('/v1/role', values);
        toast.success('Role baru berhasil ditambahkan.');
      }
      setIsRoleModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan role.');
    }
  };

  const onNavSubmit = async (values: NavFormValues) => {
    try {
      if (navEditId) {
        await api.put(`/v1/navigations/${navEditId}`, values);
        toast.success('Menu navigasi berhasil diperbarui.');
      } else {
        await api.post('/v1/navigations', values);
        toast.success('Menu navigasi baru berhasil ditambahkan.');
      }
      setIsNavModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan navigasi.');
    }
  };

  const onRoleNavSubmit = async (values: RoleNavFormValues) => {
    try {
      await api.post('/v1/role-has-navigations', values);
      toast.success('Hak akses menu berhasil diberikan pada role.');
      setIsRoleNavModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(
        err.message || 'Gagal memberikan hak akses. Pastikan relasi belum ada.',
      );
    }
  };

  /**
   * Menghapus rekaman berdasarkan tipe tab yang sedang aktif atau dipilih.
   * Untuk entitas pivot (RoleHasNav), mungkin membutuhkan composite key atau ID.
   */
  const handleDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    let endpoint = '';

    if (deletingRecord.type === 'role')
      endpoint = `/v1/role/${deletingRecord.id}`;
    else if (deletingRecord.type === 'nav')
      endpoint = `/v1/navigations/${deletingRecord.id}`;
    else endpoint = `/v1/role-has-navigations/${deletingRecord.id}`;
    // Catatan: Jika pivot table (role-has-navigations) di backend menggunakan Composite Key (role_id & navigation_id)
    // untuk DELETE, Anda harus menyesuaikan endpoint ini sesuai dokumentasi API.

    try {
      await api.delete(endpoint);
      toast.success('Data berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data.');
    } finally {
      setIsDeleting(false);
      setDeletingRecord(null);
    }
  };

  // --- FILTER & DROPDOWN OPTIONS ---
  const filteredRoles = useMemo(
    () =>
      roles.filter((r) =>
        r.name.toLowerCase().includes(roleSearch.toLowerCase()),
      ),
    [roles, roleSearch],
  );
  const filteredNavs = useMemo(
    () =>
      navs.filter(
        (n) =>
          n.name.toLowerCase().includes(navSearch.toLowerCase()) ||
          n.path.toLowerCase().includes(navSearch.toLowerCase()),
      ),
    [navs, navSearch],
  );
  const filteredRoleNavs = useMemo(
    () =>
      roleNavs.filter(
        (rn) =>
          (rn.role_name || '')
            .toLowerCase()
            .includes(roleNavSearch.toLowerCase()) ||
          (rn.navigation_name || '')
            .toLowerCase()
            .includes(roleNavSearch.toLowerCase()),
      ),
    [roleNavs, roleNavSearch],
  );

  const roleOptions = useMemo(
    () => roles.map((r) => ({ label: r.name, value: r.id })),
    [roles],
  );
  const navOptions = useMemo(
    () => navs.map((n) => ({ label: `${n.name} (${n.path})`, value: n.id })),
    [navs],
  );

  // --- COLUMNS ---
  const roleCols = useMemo(
    () => [
      roleHelper.accessor('name', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nama Role <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <Badge
            variant='outline'
            className='bg-background flex w-fit items-center gap-1.5 py-1'
          >
            <Shield className='w-3.5 h-3.5 text-primary' />{' '}
            <span className='font-semibold text-sm'>{info.getValue()}</span>
          </Badge>
        ),
      }),
      roleHelper.display({
        id: 'actions',
        header: () => <div className='text-right'>Aksi</div>,
        cell: (info) => (
          <TableActions
            onEdit={() => {
              setRoleEditId(info.row.original.id);
              roleForm.reset({ name: info.row.original.name });
              setIsRoleModalOpen(true);
            }}
            onDelete={() =>
              setDeletingRecord({ id: info.row.original.id, type: 'role' })
            }
          />
        ),
      }),
    ],
    [roleForm],
  );

  const navCols = useMemo(
    () => [
      navHelper.accessor('name', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Label Menu <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      navHelper.accessor('path', {
        header: 'Path URL',
        cell: (info) => (
          <span className='font-mono text-muted-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      navHelper.display({
        id: 'actions',
        header: () => <div className='text-right'>Aksi</div>,
        cell: (info) => (
          <TableActions
            onEdit={() => {
              setNavEditId(info.row.original.id);
              navForm.reset({
                name: info.row.original.name,
                path: info.row.original.path,
              });
              setIsNavModalOpen(true);
            }}
            onDelete={() =>
              setDeletingRecord({ id: info.row.original.id, type: 'nav' })
            }
          />
        ),
      }),
    ],
    [navForm],
  );

  const roleNavCols = useMemo(
    () => [
      roleNavHelper.accessor('role_name', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tingkat Role <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-semibold text-primary'>{info.getValue()}</span>
        ),
      }),
      roleNavHelper.accessor('navigation_name', {
        header: 'Menu yang Bisa Diakses',
        cell: (info) => (
          <div className='flex flex-col'>
            <span className='font-medium text-foreground'>
              {info.getValue()}
            </span>
            <span className='text-xs text-muted-foreground font-mono'>
              {info.row.original.navigation_path}
            </span>
          </div>
        ),
      }),
      roleNavHelper.display({
        id: 'actions',
        header: () => <div className='text-right'>Aksi</div>,
        cell: (info) => (
          <TableActions
            onDelete={
              info.row.original.id
                ? () =>
                    setDeletingRecord({
                      id: info.row.original.id!,
                      type: 'rolenav',
                    })
                : undefined
            }
          />
        ),
      }),
    ],
    [],
  );

  const tabsContent = [
    {
      label: 'Master Role',
      value: 'role',
      content: (
        <div className='space-y-4'>
          <div className='flex flex-col sm:flex-row justify-between gap-4 p-4 bg-muted/20 border border-border rounded-t-xl'>
            <SearchInput
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              placeholder='Cari nama role...'
            />
            <Button
              onClick={() => {
                setRoleEditId(null);
                roleForm.reset({ name: '' });
                setIsRoleModalOpen(true);
              }}
              className='bg-primary hover:bg-primary/90 text-white'
            >
              <Plus className='w-4 h-4 mr-2' /> Tambah Role
            </Button>
          </div>
          <DataTable
            columns={roleCols as any}
            data={filteredRoles}
            isLoading={isLoading}
            emptyMessage='Belum ada data Role.'
          />
        </div>
      ),
    },
    {
      label: 'Menu Navigasi',
      value: 'nav',
      content: (
        <div className='space-y-4'>
          <div className='flex flex-col sm:flex-row justify-between gap-4 p-4 bg-muted/20 border border-border rounded-t-xl'>
            <SearchInput
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder='Cari nama atau path menu...'
            />
            <Button
              onClick={() => {
                setNavEditId(null);
                navForm.reset({ name: '', path: '' });
                setIsNavModalOpen(true);
              }}
              className='bg-primary hover:bg-primary/90 text-white'
            >
              <Plus className='w-4 h-4 mr-2' /> Tambah Menu
            </Button>
          </div>
          <DataTable
            columns={navCols as any}
            data={filteredNavs}
            isLoading={isLoading}
            emptyMessage='Belum ada data Navigasi.'
          />
        </div>
      ),
    },
    {
      label: 'Pemetaan Hak Akses',
      value: 'mapping',
      content: (
        <div className='space-y-4'>
          <div className='flex flex-col sm:flex-row justify-between gap-4 p-4 bg-muted/20 border border-border rounded-t-xl'>
            <SearchInput
              value={roleNavSearch}
              onChange={(e) => setRoleNavSearch(e.target.value)}
              placeholder='Cari role atau menu...'
            />
            <Button
              onClick={() => {
                roleNavForm.reset({ role_id: '', navigation_id: '' });
                setIsRoleNavModalOpen(true);
              }}
              className='bg-primary hover:bg-primary/90 text-white'
            >
              <LinkIcon className='w-4 h-4 mr-2' /> Berikan Akses Menu
            </Button>
          </div>
          <DataTable
            columns={roleNavCols as any}
            data={filteredRoleNavs}
            isLoading={isLoading}
            emptyMessage='Belum ada pemetaan hak akses.'
          />
        </div>
      ),
    },
  ];

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col gap-1'>
        <h2 className='text-2xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2'>
          <ShieldAlert className='w-6 h-6 text-primary' /> Pengaturan Hak Akses
        </h2>
        <p className='text-sm text-muted-foreground'>
          Konfigurasi Role pengguna dan pemetaan (mapping) menu navigasi yang
          diperbolehkan.
        </p>
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

      <div className='bg-card border border-border rounded-xl shadow-soft-depth overflow-hidden p-2'>
        <Tabs tabs={tabsContent} defaultValue='role' />
      </div>

      {/* MODAL ROLE */}
      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title={roleEditId ? 'Edit Role' : 'Tambah Role Baru'}
        size='sm'
        footer={
          <div className='flex justify-end gap-3 w-full'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setIsRoleModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type='submit'
              form='role-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={roleForm.formState.isSubmitting}
            >
              {roleForm.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Role'}
            </Button>
          </div>
        }
      >
        <form
          id='role-form'
          onSubmit={roleForm.handleSubmit(onRoleSubmit)}
          className='space-y-4 py-2'
        >
          <Input
            label='Nama Hak Akses (Role)'
            placeholder='Contoh: Super Admin, Finance...'
            error={roleForm.formState.errors.name?.message}
            {...roleForm.register('name')}
          />
        </form>
      </Modal>

      {/* MODAL NAVIGASI */}
      <Modal
        isOpen={isNavModalOpen}
        onClose={() => setIsNavModalOpen(false)}
        title={navEditId ? 'Edit Navigasi Menu' : 'Tambah Menu Navigasi'}
        size='md'
        footer={
          <div className='flex justify-end gap-3 w-full'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setIsNavModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type='submit'
              form='nav-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={navForm.formState.isSubmitting}
            >
              {navForm.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Menu'}
            </Button>
          </div>
        }
      >
        <form
          id='nav-form'
          onSubmit={navForm.handleSubmit(onNavSubmit)}
          className='space-y-5 py-2'
        >
          <Input
            label='Label Menu'
            placeholder='Contoh: Master Data Customer'
            error={navForm.formState.errors.name?.message}
            {...navForm.register('name')}
          />
          <Input
            label='Path (URL Route)'
            placeholder='Contoh: /master-data/customer'
            error={navForm.formState.errors.path?.message}
            {...navForm.register('path')}
          />
        </form>
      </Modal>

      {/* MODAL MAPPING ROLE HAS NAVIGATIONS */}
      <Modal
        isOpen={isRoleNavModalOpen}
        onClose={() => setIsRoleNavModalOpen(false)}
        title='Berikan Akses Menu ke Role'
        size='md'
        footer={
          <div className='flex justify-end gap-3 w-full'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setIsRoleNavModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type='submit'
              form='rolenav-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={roleNavForm.formState.isSubmitting}
            >
              {roleNavForm.formState.isSubmitting
                ? 'Menyimpan...'
                : 'Simpan Akses'}
            </Button>
          </div>
        }
      >
        <form
          id='rolenav-form'
          onSubmit={roleNavForm.handleSubmit(onRoleNavSubmit)}
          className='space-y-5 py-2'
        >
          <div className='bg-primary/5 p-4 rounded-xl border border-primary/20 mb-4'>
            <p className='text-xs text-muted-foreground leading-snug'>
              Pilih <strong className='text-foreground'>Role</strong> dan
              pasangkan dengan{' '}
              <strong className='text-foreground'>Menu Navigasi</strong> yang
              diizinkan untuk diakses. Setelah disimpan, pengguna dengan role
              ini akan dapat melihat menu tersebut.
            </p>
          </div>
          <Select
            label='Pilih Role Pengguna'
            required
            options={roleOptions}
            value={roleNavForm.watch('role_id')}
            onChange={(val) => roleNavForm.setValue('role_id', val)}
            error={roleNavForm.formState.errors.role_id?.message}
          />
          <Select
            label='Pilih Menu Navigasi (URL)'
            required
            options={navOptions}
            value={roleNavForm.watch('navigation_id')}
            onChange={(val) => roleNavForm.setValue('navigation_id', val)}
            error={roleNavForm.formState.errors.navigation_id?.message}
          />
        </form>
      </Modal>

      {/* DELETE CONFIRMATION */}
      <AlertDialog
        open={!!deletingRecord}
        onOpenChange={(open) => !open && setDeletingRecord(null)}
      >
        <AlertDialogContent className='bg-card border-border'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-destructive flex items-center gap-2'>
              <AlertCircle className='h-5 w-5' /> Konfirmasi Penghapusan
            </AlertDialogTitle>
            <AlertDialogDescription className='text-muted-foreground'>
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini dapat
              memutus hak akses pengguna yang sedang aktif dan tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
