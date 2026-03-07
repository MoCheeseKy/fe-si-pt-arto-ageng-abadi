'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  BookOpen,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Coa, CoaFormValues, coaSchema } from '@/types/accounting';
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

const columnHelper = createColumnHelper<Coa>();

/**
 * Halaman manajemen Chart of Account (CoA) / Bagan Akun.
 * Terintegrasi dengan endpoint /v1/coas untuk operasi CRUD struktur buku besar.
 *
 * @returns {JSX.Element} Komponen UI halaman CoA
 */
export default function CoaPage() {
  const [data, setData] = useState<Coa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Semua');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<CoaFormValues>({
    resolver: zodResolver(coaSchema),
    defaultValues: {
      account_code: '',
      account_name: '',
      category: 'Aset',
      description: '',
    },
  });

  /**
   * Mengambil daftar akun dari backend.
   *
   * @returns {Promise<void>}
   */
  const fetchCoas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<any>('/v1/coas');
      const fetchedData = Array.isArray(res.data)
        ? res.data
        : res.data?.rows || [];

      const mappedData: Coa[] = fetchedData.map((item: any) => ({
        ...item,
        status: item.status || 'Aktif',
        balance: item.balance || 0,
      }));

      setData(mappedData);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data CoA dari server.');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoas();
  }, [fetchCoas]);

  /**
   * Menyiapkan nilai form dan menampilkan modal untuk membuat atau mengedit akun.
   *
   * @param {Coa} [coa] - Data akun untuk mode edit (opsional)
   */
  const handleOpenDialog = (coa?: Coa) => {
    if (coa) {
      setEditingId(coa.id);
      form.reset({
        account_code: coa.account_code,
        account_name: coa.account_name,
        category: coa.category,
      });
    } else {
      setEditingId(null);
      form.reset({
        account_code: '',
        account_name: '',
        category: 'Aset',
        description: '',
      });
    }
    setIsDialogOpen(true);
  };

  /**
   * Mengirimkan data form akun ke backend untuk dibuat atau diperbarui.
   *
   * @param {CoaFormValues} values - Nilai isian form yang sudah tervalidasi
   */
  const onSubmit = async (values: CoaFormValues) => {
    try {
      if (editingId) {
        await api.put(`/v1/coas/${editingId}`, values);
        toast.success('Akun berhasil diperbarui.');
      } else {
        await api.post('/v1/coas', values);
        toast.success('Akun baru berhasil ditambahkan.');
      }
      setIsDialogOpen(false);
      fetchCoas();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan akun.');
    }
  };

  /**
   * Menghapus data akun berdasarkan ID.
   */
  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/coas/${deletingId}`);
      toast.success('Akun berhasil dihapus.');
      fetchCoas();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data.');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch =
        (item.account_code || '')
          .toLowerCase()
          .includes(globalFilter.toLowerCase()) ||
        (item.account_name || '')
          .toLowerCase()
          .includes(globalFilter.toLowerCase());
      const matchCat =
        categoryFilter === 'Semua' ? true : item.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [data, globalFilter, categoryFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('account_code', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Kode Akun <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-bold text-primary'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('account_name', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nama Akun <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('category', {
        header: 'Kategori',
        cell: (info) => {
          const cat = info.getValue();
          const colorClass =
            cat === 'Aset'
              ? 'text-blue-500 border-blue-500/30'
              : cat === 'Pendapatan'
                ? 'text-emerald-500 border-emerald-500/30'
                : cat === 'Beban'
                  ? 'text-rose-500 border-rose-500/30'
                  : cat === 'Kewajiban'
                    ? 'text-amber-500 border-amber-500/30'
                    : 'text-purple-500 border-purple-500/30';
          return (
            <Badge variant='outline' className={`bg-background ${colorClass}`}>
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
          <h2 className='text-2xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2'>
            <BookOpen className='w-6 h-6 text-primary' /> Chart of Account (CoA)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Struktur buku besar untuk mencatat semua aliran dana operasional.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah Akun
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
            onClick={fetchCoas}
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
            placeholder='Cari kode atau nama akun...'
            className='w-full sm:max-w-sm'
          />

          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
              Kategori:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className='flex h-9 w-full sm:w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary'
            >
              <option value='Semua'>Semua Kategori</option>
              <option value='Aset'>Aset</option>
              <option value='Kewajiban'>Kewajiban</option>
              <option value='Ekuitas'>Ekuitas</option>
              <option value='Pendapatan'>Pendapatan</option>
              <option value='Beban'>Beban</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
          emptyMessage='Tidak ada data akun CoA.'
        />
      </div>

      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Akun CoA' : 'Tambah Akun CoA Baru'}
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
              form='coa-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Akun'}
            </Button>
          </div>
        }
      >
        <form
          id='coa-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-5 py-2'
        >
          <div className='grid grid-cols-2 gap-5'>
            <Input
              label='Kode Akun'
              required
              placeholder='Contoh: 1110'
              error={form.formState.errors.account_code?.message}
              {...form.register('account_code')}
            />
            <Select
              label='Kategori'
              required
              options={[
                { label: 'Aset', value: 'Aset' },
                { label: 'Kewajiban', value: 'Kewajiban' },
                { label: 'Ekuitas', value: 'Ekuitas' },
                { label: 'Pendapatan', value: 'Pendapatan' },
                { label: 'Beban', value: 'Beban' },
              ]}
              value={form.watch('category')}
              onChange={(val) => form.setValue('category', val as any)}
              error={form.formState.errors.category?.message}
            />
          </div>
          <Input
            label='Nama Akun'
            required
            placeholder='Contoh: Kas Tunai'
            error={form.formState.errors.account_name?.message}
            {...form.register('account_name')}
          />
          <Input
            label='Deskripsi (Opsional)'
            placeholder='Keterangan kegunaan akun ini...'
            error={form.formState.errors.description?.message}
            {...form.register('description')}
          />
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
              Apakah Anda yakin ingin menghapus akun CoA ini? Penghapusan akun
              mungkin akan memutus keterkaitan pada jurnal.
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
