'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Truck,
  RefreshCcw,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Driver, DriverFormValues, driverSchema } from '@/types/master';
import { Button } from '@/components/ui/button';
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

const columnHelper = createColumnHelper<Driver>();

/**
 * Halaman manajemen master data Driver.
 * Terintegrasi dengan endpoint CRUD /v1/drivers.
 *
 * @returns {JSX.Element} Komponen UI halaman Driver
 */
export default function DriverPage() {
  const [data, setData] = useState<Driver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(driverSchema as any),
    defaultValues: {
      name: '',
      nik: '',
      phone_number: '',
    },
  });

  /**
   * Mengambil list data driver menggunakan endpoint GET /v1/drivers.
   *
   * @returns {Promise<void>}
   */
  const fetchDrivers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get<any>('/v1/drivers');
      const fetchedData = Array.isArray(res.data)
        ? res.data
        : res.data?.rows || [];
      setData(fetchedData);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data driver dari server.');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  /**
   * Mempersiapkan form dan membuka modal dialog untuk mode Create atau Update.
   *
   * @param {Driver} [driver] - Data entitas driver yang akan diedit (opsional)
   */
  const handleOpenDialog = (driver?: Driver) => {
    if (driver) {
      setEditingId(driver.id);
      form.reset({
        name: driver.name,
        nik: driver.nik,
        phone_number: driver.phone_number,
      });
    } else {
      setEditingId(null);
      form.reset({ name: '', nik: '', phone_number: '' });
    }
    setIsDialogOpen(true);
  };

  /**
   * Mengirim payload form ke backend untuk proses penambahan (POST) atau pembaruan (PUT) data.
   *
   * @param {DriverFormValues} values - Nilai input dari form
   */
  const onSubmit = async (values: DriverFormValues) => {
    try {
      if (editingId) {
        await api.put(`/v1/drivers/${editingId}`, values);
        toast.success('Data driver berhasil diperbarui.');
      } else {
        await api.post('/v1/drivers', values);
        toast.success('Driver baru berhasil ditambahkan.');
      }
      setIsDialogOpen(false);
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan data.');
    }
  };

  /**
   * Mengirim request DELETE ke backend berdasarkan ID entitas yang disorot.
   */
  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/drivers/${deletingId}`);
      toast.success('Driver berhasil dihapus.');
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data.');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('name', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nama Driver <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
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
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            NIK KTP <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono text-sm tracking-wide'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('phone_number', {
        header: 'No. Handphone',
        cell: (info) => (
          <span className='font-mono text-muted-foreground'>
            {info.getValue()}
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
            Master Driver
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Kelola data pengemudi armada (GTM) dan identitas terkait.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah Driver
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
            onClick={fetchDrivers}
            className='border-destructive/30 text-destructive hover:bg-destructive/10'
          >
            <RefreshCcw className='h-4 w-4 mr-2' /> Coba Lagi
          </Button>
        </div>
      )}

      <div className='bg-card border border-border rounded-xl shadow-soft-depth overflow-hidden'>
        <div className='p-4 border-b border-border bg-muted/20'>
          <SearchInput
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder='Cari nama, NIK, atau nomor HP...'
            className='w-full sm:max-w-sm'
          />
        </div>

        <DataTable
          columns={columns as any}
          data={data}
          isLoading={isLoading}
          emptyMessage='Tidak ada data driver yang ditemukan.'
        />
      </div>

      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Data Driver' : 'Tambah Driver Baru'}
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
              form='driver-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        }
      >
        <form
          id='driver-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-5 py-2'
        >
          <Input
            label='Nama Driver'
            required
            placeholder='Nama lengkap sesuai KTP'
            error={form.formState.errors.name?.message}
            {...form.register('name')}
          />
          <Input
            label='NIK KTP (16 Digit)'
            required
            maxLength={16}
            placeholder='327xxxxxxxxxxxxx'
            error={form.formState.errors.nik?.message}
            {...form.register('nik')}
          />
          <Input
            label='Nomor Handphone'
            required
            placeholder='08xxxxxxxxxx'
            error={form.formState.errors.phone_number?.message}
            {...form.register('phone_number')}
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
              Apakah Anda yakin ingin menghapus data driver ini? Tindakan ini
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
