'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Factory,
  RefreshCcw,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/form/Input';
import { SearchInput } from '@/components/form/SearchInput';
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
 * Skema validasi form Supplier menggunakan Zod.
 * Disesuaikan dengan CreateSupplierDto dari backend.
 */
const supplierSchema = z.object({
  company_name: z
    .string()
    .min(3, { message: 'Nama Perusahaan minimal 3 karakter' }),
  address: z.string().optional(),
  phone_number: z.string().optional(),
  pic_name: z.string().optional(),
  pic_phone_number: z.string().optional(),
});

type SupplierFormValues = z.infer<typeof supplierSchema>;

export interface Supplier extends SupplierFormValues {
  id: string;
  status: 'Aktif' | 'Nonaktif';
}

const columnHelper = createColumnHelper<Supplier>();

/**
 * Halaman manajemen master data Supplier.
 * Menampilkan tabel data supplier dengan fitur filter, sort, dan pagination.
 * Terintegrasi dengan endpoint CRUD /v1/suppliers.
 *
 * @returns {JSX.Element} Komponen UI halaman Supplier
 */
export default function SupplierPage() {
  const [data, setData] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierSchema as any),
    defaultValues: {
      company_name: '',
      address: '',
      phone_number: '',
      pic_name: '',
      pic_phone_number: '',
    },
  });

  /**
   * Mengambil data supplier dari backend.
   * DTO backend tidak memiliki field status, sehingga disuntikkan default "Aktif" untuk kebutuhan filter UI.
   *
   * @returns {Promise<void>}
   */
  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<any>('/v1/suppliers');
      const fetchedData = Array.isArray(res.data)
        ? res.data
        : res.data?.rows || [];

      const mappedData: Supplier[] = fetchedData.map((item: any) => ({
        ...item,
        status: item.status || 'Aktif',
      }));

      setData(mappedData);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data supplier dari server.');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  /**
   * Membuka modal form untuk mode tambah atau edit.
   * * @param {Supplier} [supplier] - Data supplier jika dalam mode edit, kosong jika tambah baru
   */
  const handleOpenDialog = (supplier?: Supplier) => {
    if (supplier) {
      setEditingId(supplier.id);
      form.reset({
        company_name: supplier.company_name,
        address: supplier.address || '',
        phone_number: supplier.phone_number || '',
        pic_name: supplier.pic_name || '',
        pic_phone_number: supplier.pic_phone_number || '',
      });
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

  /**
   * Menangani proses submit form (Create atau Update).
   * Memanggil PUT jika editingId tersedia, POST jika tidak.
   * * @param {SupplierFormValues} values - Payload dari react-hook-form
   */
  const onSubmit = async (values: SupplierFormValues) => {
    try {
      if (editingId) {
        await api.put(`/v1/suppliers/${editingId}`, values);
        toast.success('Data supplier berhasil diperbarui.');
      } else {
        await api.post('/v1/suppliers', values);
        toast.success('Supplier baru berhasil ditambahkan.');
      }
      setIsDialogOpen(false);
      fetchSuppliers();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan data.');
    }
  };

  /**
   * Menghapus data supplier berdasarkan ID yang tersimpan di state deletingId.
   */
  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/suppliers/${deletingId}`);
      toast.success('Supplier berhasil dihapus.');
      fetchSuppliers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data.');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const filteredData = useMemo(() => {
    if (statusFilter === 'Semua') return data;
    return data.filter((item) => item.status === statusFilter);
  }, [data, statusFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('company_name', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nama Perusahaan (Supplier) <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <div className='flex items-center gap-2'>
            <Factory className='w-4 h-4 text-muted-foreground' />
            <span className='font-semibold text-foreground'>
              {info.getValue()}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('pic_name', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            PIC & Kontak <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <div className='flex flex-col'>
            <span className='text-sm font-medium text-foreground'>
              {info.getValue() || '-'}
            </span>
            <span className='text-xs text-muted-foreground font-mono'>
              {info.row.original.pic_phone_number || '-'}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge
            variant={info.getValue() === 'Aktif' ? 'default' : 'secondary'}
            className={
              info.getValue() === 'Aktif'
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : ''
            }
          >
            {info.getValue()}
          </Badge>
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
            Master Supplier
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Kelola data pemasok gas CNG (Mother Station) dan kontak PIC.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah Supplier
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
            onClick={fetchSuppliers}
            className='border-destructive/30 text-destructive hover:bg-destructive/10'
          >
            <RefreshCcw className='h-4 w-4 mr-2' /> Coba Lagi
          </Button>
        </div>
      )}

      <div className='bg-card border border-border rounded-xl shadow-soft-depth overflow-hidden'>
        <div className='p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20'>
          <SearchInput
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder='Cari nama, alamat, atau PIC...'
            className='w-full sm:max-w-sm'
          />

          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='flex h-9 w-full sm:w-32 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary'
            >
              <option value='Semua'>Semua</option>
              <option value='Aktif'>Aktif</option>
              <option value='Nonaktif'>Nonaktif</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns as any}
          data={filteredData}
          isLoading={isLoading}
          emptyMessage='Tidak ada data supplier yang ditemukan.'
        />
      </div>

      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Data Supplier' : 'Tambah Supplier Baru'}
        size='lg'
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
              form='supplier-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        }
      >
        <form
          id='supplier-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='grid grid-cols-1 md:grid-cols-2 gap-5 py-2'
        >
          <div className='col-span-1 md:col-span-2'>
            <Input
              label='Nama Perusahaan Pemasok'
              required
              placeholder='PT. Pertamina Gas...'
              error={form.formState.errors.company_name?.message}
              {...form.register('company_name')}
            />
          </div>
          <Input
            label='No. Telepon Kantor'
            placeholder='021-XXXXXXX'
            error={form.formState.errors.phone_number?.message}
            {...form.register('phone_number')}
          />
          <div className='col-span-1 md:col-span-2'>
            <Input
              label='Alamat Lengkap / Lokasi Mother Station'
              placeholder='Jl. Raya Industri...'
              error={form.formState.errors.address?.message}
              {...form.register('address')}
            />
          </div>
          <div className='border-t border-border/50 pt-4 mt-2 col-span-1 md:col-span-2'>
            <h4 className='text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4'>
              Informasi Penanggung Jawab (PIC)
            </h4>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
              <Input
                label='Nama PIC'
                placeholder='Budi Santoso'
                error={form.formState.errors.pic_name?.message}
                {...form.register('pic_name')}
              />
              <Input
                label='No. HP PIC'
                placeholder='08XXXXXXXXXX'
                error={form.formState.errors.pic_phone_number?.message}
                {...form.register('pic_phone_number')}
              />
            </div>
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
              Apakah Anda yakin ingin menghapus data supplier ini? Tindakan ini
              tidak dapat dibatalkan.
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
