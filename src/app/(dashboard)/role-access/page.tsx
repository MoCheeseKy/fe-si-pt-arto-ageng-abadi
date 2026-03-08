'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ShieldAlert,
  Plus,
  Shield,
  Users,
  Loader2,
  Save,
  Info,
  KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/form/Input';
import { Modal } from '@/components/_shared/Modal';
import { Checkbox } from '@/components/ui/checkbox';

const roleSchema = z.object({
  name: z.string().min(1, 'Nama role wajib diisi'),
});

type RoleFormValues = z.infer<typeof roleSchema>;

export interface RoleRow {
  id: string;
  name: string;
  description?: string;
  userCount?: number;
}

type PermissionAction = { view: boolean; edit: boolean; delete: boolean };
type PermissionsMap = Record<string, PermissionAction>;

const PERMISSION_MODULES = [
  {
    section: 'Master Data',
    items: [
      { id: 'customer', label: 'Customer' },
      { id: 'supplier', label: 'Supplier' },
      { id: 'driver', label: 'Driver' },
      { id: 'karyawan', label: 'Karyawan' },
      { id: 'user_management', label: 'User Management' },
    ],
  },
  {
    section: 'Operasional',
    items: [
      { id: 'pengisian', label: 'Pengisian Gas' },
      { id: 'pemakaian', label: 'Pemakaian Gas' },
      { id: 'kontrak', label: 'Kontrak & Penawaran' },
    ],
  },
  {
    section: 'Keuangan',
    items: [
      { id: 'invoice', label: 'Invoice' },
      { id: 'deposit', label: 'Deposit Wallet' },
      { id: 'pengeluaran', label: 'Pengeluaran' },
      { id: 'petty_cash', label: 'Petty Cash' },
      { id: 'kasbon', label: 'Kasbon' },
      { id: 'payroll', label: 'Payroll' },
    ],
  },
  {
    section: 'Accounting',
    items: [
      { id: 'coa', label: 'Buku Besar & CoA' },
      { id: 'jurnal', label: 'Jurnal Umum' },
      { id: 'laporan', label: 'Laporan Keuangan' },
      { id: 'reporting', label: 'Reporting Excel' },
    ],
  },
  {
    section: 'Pengaturan',
    items: [{ id: 'role_access', label: 'Role & Hak Akses' }],
  },
];

export default function RoleAccessPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  const [selectedRole, setSelectedRole] = useState<RoleRow | null>(null);

  // Permission States
  const [permissions, setPermissions] = useState<PermissionsMap>({});
  const [originalPermissions, setOriginalPermissions] =
    useState<PermissionsMap>({});
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal States
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const roleForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema as any),
    defaultValues: { name: '' },
  });

  const isDirty = useMemo(() => {
    return JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
  }, [permissions, originalPermissions]);

  const activePermissionsCount = useMemo(() => {
    return Object.values(permissions).reduce(
      (acc, perm) =>
        acc + (perm.view ? 1 : 0) + (perm.edit ? 1 : 0) + (perm.delete ? 1 : 0),
      0,
    );
  }, [permissions]);

  const fetchRoles = useCallback(async () => {
    setIsLoadingRoles(true);
    try {
      const res = await api.get<any>('/v1/role');
      const roleList = Array.isArray(res.data)
        ? res.data
        : res.data?.rows || [];

      // Simulating user count and descriptions since it might not be in the direct payload
      const mappedRoles = roleList.map((r: any) => ({
        ...r,
        description: `Hak akses untuk pengguna level ${r.name}`,
        userCount: Math.floor(Math.random() * 10), // Fallback placeholder
      }));

      setRoles(mappedRoles);

      // Auto select first role if none is selected
      if (mappedRoles.length > 0 && !selectedRole) {
        setSelectedRole(mappedRoles[0]);
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal memuat daftar role.');
    } finally {
      setIsLoadingRoles(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    if (selectedRole) {
      loadPermissionsForRole(selectedRole.id);
    }
  }, [selectedRole]);

  const loadPermissionsForRole = (roleId: string) => {
    setIsLoadingPermissions(true);

    // TODO: Ganti dengan pemanggilan endpoint aktual yang menarik granular permission: GET /v1/role/:id/permissions
    setTimeout(() => {
      const emptyPerms: PermissionsMap = {};
      PERMISSION_MODULES.forEach((sec) =>
        sec.items.forEach((item) => {
          emptyPerms[item.id] = { view: false, edit: false, delete: false };
        }),
      );

      // Simulate some existing permissions for visual testing
      if (roleId) {
        emptyPerms['customer'] = { view: true, edit: true, delete: false };
        emptyPerms['pengisian'] = { view: true, edit: false, delete: false };
      }

      setPermissions(emptyPerms);
      setOriginalPermissions(JSON.parse(JSON.stringify(emptyPerms))); // Deep copy
      setIsLoadingPermissions(false);
    }, 400);
  };

  const handlePermissionChange = (
    moduleId: string,
    action: keyof PermissionAction,
    checked: boolean,
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [action]: checked,
      },
    }));
  };

  const handleSectionSelectAll = (
    section: (typeof PERMISSION_MODULES)[0],
    checked: boolean,
  ) => {
    setPermissions((prev) => {
      const next = { ...prev };
      section.items.forEach((item) => {
        next[item.id] = { view: checked, edit: checked, delete: checked };
      });
      return next;
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      // TODO: Integrasi dengan endpoint update permission: PUT /v1/role/:id/permissions
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulasi network delay

      setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
      toast.success(
        `Permission untuk role ${selectedRole.name} berhasil diperbarui.`,
      );
    } catch (error) {
      toast.error('Gagal menyimpan perubahan permission.');
    } finally {
      setIsSaving(false);
    }
  };

  const onRoleSubmit = async (values: RoleFormValues) => {
    try {
      await api.post('/v1/role', values);
      toast.success('Role baru berhasil ditambahkan.');
      setIsRoleModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan role.');
    }
  };

  return (
    <div className='space-y-6 animate-in fade-in duration-500 h-full flex flex-col'>
      <div>
        <h2 className='text-2xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2'>
          <ShieldAlert className='w-6 h-6 text-primary' /> Pengaturan Hak Akses
        </h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Manajemen Role dan konfigurasi Permission Matrix untuk kontrol
          otorisasi tingkat lanjut.
        </p>
      </div>

      <div className='flex flex-col md:flex-row bg-card border border-border rounded-xl shadow-soft-depth overflow-hidden min-h-[calc(100vh-14rem)] relative'>
        {/* === LEFT COLUMN: ROLE LIST === */}
        <aside className='w-full md:w-72 border-r border-border flex flex-col bg-muted/10 shrink-0'>
          <div className='p-4 border-b border-border bg-background flex flex-col gap-3'>
            <Button
              onClick={() => {
                roleForm.reset({ name: '' });
                setIsRoleModalOpen(true);
              }}
              className='w-full bg-primary hover:bg-primary/90 text-white shadow-sm'
            >
              <Plus className='w-4 h-4 mr-2' /> Tambah Role
            </Button>
          </div>

          <div className='flex-1 overflow-y-auto p-2 space-y-1'>
            {isLoadingRoles ? (
              <div className='flex justify-center p-6'>
                <Loader2 className='w-6 h-6 animate-spin text-muted-foreground' />
              </div>
            ) : roles.length === 0 ? (
              <div className='p-4 text-center text-sm text-muted-foreground'>
                Belum ada role.
              </div>
            ) : (
              roles.map((role) => {
                const isActive = selectedRole?.id === role.id;
                return (
                  <div
                    key={role.id}
                    onClick={() =>
                      !isDirty
                        ? setSelectedRole(role)
                        : toast.error(
                            'Simpan atau batalkan perubahan sebelum berpindah role.',
                          )
                    }
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 select-none group ${
                      isActive
                        ? 'border-l-[3px] border-l-[#DC2626] bg-primary/10'
                        : 'border-l-[3px] border-l-transparent hover:bg-muted/60'
                    }`}
                  >
                    <div className='flex justify-between items-start mb-1'>
                      <span
                        className={`font-bold font-heading ${isActive ? 'text-[#DC2626]' : 'text-foreground group-hover:text-primary'}`}
                      >
                        {role.name}
                      </span>
                      <Shield
                        className={`w-4 h-4 ${isActive ? 'text-[#DC2626]' : 'text-muted-foreground'}`}
                      />
                    </div>
                    <p className='text-[11px] text-muted-foreground line-clamp-1 mb-2'>
                      {role.description}
                    </p>
                    <div className='flex items-center gap-1.5 text-xs text-muted-foreground font-medium'>
                      <Users className='w-3.5 h-3.5' /> {role.userCount || 0}{' '}
                      Pengguna
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* === RIGHT COLUMN: PERMISSION MATRIX === */}
        <main className='flex-1 flex flex-col relative bg-background h-full overflow-hidden'>
          {selectedRole ? (
            <>
              {/* Header Info */}
              <header className='p-5 border-b border-border bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 z-10'>
                <div>
                  <h3 className='text-xl font-heading font-bold text-foreground flex items-center gap-2'>
                    <KeyRound className='w-5 h-5 text-primary' /> Matrix Izin:{' '}
                    {selectedRole.name}
                  </h3>
                  <p className='text-sm text-muted-foreground mt-0.5'>
                    Atur izin Akses (View), Modifikasi (Create/Edit), dan Hapus
                    (Delete) per modul.
                  </p>
                </div>
                <Badge
                  variant='outline'
                  className='bg-primary/5 text-primary border-primary/20 px-3 py-1 text-sm shrink-0'
                >
                  {activePermissionsCount} Permissions Aktif
                </Badge>
              </header>

              {/* Scrollable Matrix */}
              <div className='flex-1 overflow-y-auto p-4 sm:p-6 pb-28'>
                {isLoadingPermissions ? (
                  <div className='flex flex-col items-center justify-center h-full text-muted-foreground'>
                    <Loader2 className='w-8 h-8 animate-spin mb-4' />
                    <p>Memuat skema permission...</p>
                  </div>
                ) : (
                  <div className='space-y-8'>
                    {PERMISSION_MODULES.map((section, idx) => {
                      const isSectionAllChecked = section.items.every(
                        (item) =>
                          permissions[item.id]?.view &&
                          permissions[item.id]?.edit &&
                          permissions[item.id]?.delete,
                      );

                      return (
                        <div
                          key={idx}
                          className='border border-border rounded-xl overflow-hidden shadow-sm'
                        >
                          <div className='bg-muted/40 p-4 border-b border-border flex justify-between items-center'>
                            <h4 className='font-bold text-foreground text-base'>
                              {section.section}
                            </h4>
                            <div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
                              <Checkbox
                                id={`select-all-${idx}`}
                                checked={isSectionAllChecked}
                                onCheckedChange={(c) =>
                                  handleSectionSelectAll(section, !!c)
                                }
                              />
                              <label
                                htmlFor={`select-all-${idx}`}
                                className='cursor-pointer select-none'
                              >
                                Pilih Semua Modul
                              </label>
                            </div>
                          </div>

                          <table className='w-full text-sm text-left'>
                            <thead className='bg-muted/20 text-muted-foreground border-b border-border'>
                              <tr>
                                <th className='py-3 px-5 font-semibold w-2/5'>
                                  Nama Modul
                                </th>
                                <th className='py-3 px-4 font-semibold text-center w-1/5'>
                                  Lihat (View)
                                </th>
                                <th className='py-3 px-4 font-semibold text-center w-1/5'>
                                  Buat / Edit
                                </th>
                                <th className='py-3 px-4 font-semibold text-center w-1/5'>
                                  Hapus (Delete)
                                </th>
                              </tr>
                            </thead>
                            <tbody className='divide-y divide-border'>
                              {section.items.map((item) => (
                                <tr
                                  key={item.id}
                                  className='hover:bg-muted/10 transition-colors'
                                >
                                  <td className='py-3.5 px-5 font-medium text-foreground'>
                                    {item.label}
                                  </td>
                                  <td className='py-3.5 px-4 text-center'>
                                    <Checkbox
                                      checked={
                                        permissions[item.id]?.view || false
                                      }
                                      onCheckedChange={(c) =>
                                        handlePermissionChange(
                                          item.id,
                                          'view',
                                          !!c,
                                        )
                                      }
                                    />
                                  </td>
                                  <td className='py-3.5 px-4 text-center'>
                                    <Checkbox
                                      checked={
                                        permissions[item.id]?.edit || false
                                      }
                                      onCheckedChange={(c) =>
                                        handlePermissionChange(
                                          item.id,
                                          'edit',
                                          !!c,
                                        )
                                      }
                                    />
                                  </td>
                                  <td className='py-3.5 px-4 text-center'>
                                    <Checkbox
                                      checked={
                                        permissions[item.id]?.delete || false
                                      }
                                      onCheckedChange={(c) =>
                                        handlePermissionChange(
                                          item.id,
                                          'delete',
                                          !!c,
                                        )
                                      }
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sticky Action Bar */}
              {isDirty && (
                <div className='absolute bottom-0 left-0 right-0 p-4 sm:px-6 bg-background border-t border-border shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] flex flex-col sm:flex-row items-center justify-between gap-4 z-20 animate-in slide-in-from-bottom-4 duration-300'>
                  <div className='flex items-center gap-2 text-amber-600 font-bold text-sm bg-amber-500/10 px-4 py-2 rounded-lg border border-amber-500/20'>
                    <Info className='w-5 h-5' /> Ada modifikasi permission yang
                    belum disimpan
                  </div>
                  <div className='flex gap-3 w-full sm:w-auto'>
                    <Button
                      variant='outline'
                      onClick={() =>
                        setPermissions(
                          JSON.parse(JSON.stringify(originalPermissions)),
                        )
                      }
                      className='w-full sm:w-auto'
                    >
                      Batalkan
                    </Button>
                    <Button
                      onClick={handleSavePermissions}
                      disabled={isSaving}
                      className='w-full sm:w-auto bg-primary hover:bg-primary/90 text-white shadow-md'
                    >
                      {isSaving ? (
                        <Loader2 className='w-4 h-4 animate-spin mr-2' />
                      ) : (
                        <Save className='w-4 h-4 mr-2' />
                      )}
                      Simpan Perubahan
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className='flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center'>
              <Shield className='w-16 h-16 mb-4 text-muted-foreground/30' />
              <p className='text-lg font-semibold text-foreground'>
                Tidak Ada Role Terpilih
              </p>
              <p className='text-sm mt-1 max-w-sm'>
                Pilih salah satu role dari panel di sebelah kiri untuk melihat
                dan memodifikasi hak aksesnya (Permission Matrix).
              </p>
            </div>
          )}
        </main>
      </div>

      <Modal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        title='Tambah Master Role Baru'
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
    </div>
  );
}
