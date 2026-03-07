'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Banknote,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
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
import { DatePicker } from '@/components/form/DatePicker';
import { NumberInput } from '@/components/form/NumberInput';
import { Textarea } from '@/components/form/Textarea';
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

const cashAdvanceSchema = z.object({
  employee_id: z.string().min(1, 'Karyawan wajib dipilih'),
  date: z.string().optional(),
  description: z.string().optional(),
  amount: z.coerce.number().min(1, 'Nominal kasbon harus lebih dari 0'),
  status: z.string().optional(),
  repayment_date: z.string().optional(),
  repayment_amount: z.coerce.number().optional(),
  repayment_method: z.string().optional(),
  repayment_account: z.string().optional(),
});

type CashAdvanceFormValues = z.infer<typeof cashAdvanceSchema>;

export interface CashAdvanceRow extends CashAdvanceFormValues {
  id: string;
  employee_name?: string;
}

const columnHelper = createColumnHelper<CashAdvanceRow>();

/**
 * Halaman manajemen operasional Kasbon (Cash Advance).
 * Terintegrasi dengan endpoint /v1/cash-advances dan /v1/employees.
 *
 * @returns {JSX.Element} Komponen UI halaman Kasbon
 */
export default function KasbonPage() {
  const [data, setData] = useState<CashAdvanceRow[]>([]);
  const [employees, setEmployees] = useState<
    { label: string; value: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<CashAdvanceFormValues>({
    resolver: zodResolver(cashAdvanceSchema),
    defaultValues: {
      employee_id: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      status: 'Belum Lunas',
      repayment_date: '',
      repayment_amount: 0,
      repayment_method: 'Potong Gaji',
      repayment_account: '',
    },
  });

  /**
   * Mengambil data kasbon dan karyawan secara paralel untuk merender tabel dan opsi form.
   *
   * @returns {Promise<void>}
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cashAdvanceRes, employeeRes] = await Promise.all([
        api.get<any>('/v1/cash-advances'),
        api.get<any>('/v1/employees'),
      ]);

      const caList = Array.isArray(cashAdvanceRes.data)
        ? cashAdvanceRes.data
        : cashAdvanceRes.data?.rows || [];
      const empList = Array.isArray(employeeRes.data)
        ? employeeRes.data
        : employeeRes.data?.rows || [];

      setEmployees(empList.map((e: any) => ({ label: e.name, value: e.id })));

      const getEmployeeName = (id: string) =>
        empList.find((e: any) => e.id === id)?.name || 'Unknown Employee';

      const mappedData: CashAdvanceRow[] = caList.map((item: any) => ({
        ...item,
        employee_name: getEmployeeName(item.employee_id),
      }));

      setData(
        mappedData.sort(
          (a, b) =>
            new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
        ),
      );
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data dari server.');
      toast.error('Gagal memuat data kasbon');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Membuka modal untuk mode tambah baru atau edit data kasbon.
   *
   * @param {CashAdvanceRow} [record] - Data kasbon yang akan diedit (opsional)
   */
  const handleOpenDialog = (record?: CashAdvanceRow) => {
    if (record) {
      setEditingId(record.id);
      form.reset({
        ...record,
        date: record.date
          ? new Date(record.date).toISOString().split('T')[0]
          : '',
        repayment_date: record.repayment_date
          ? new Date(record.repayment_date).toISOString().split('T')[0]
          : '',
      });
    } else {
      setEditingId(null);
      form.reset({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        status: 'Belum Lunas',
        repayment_date: '',
        repayment_amount: 0,
        repayment_method: 'Potong Gaji',
        repayment_account: '',
      });
    }
    setIsDialogOpen(true);
  };

  /**
   * Mengirimkan data form ke endpoint API untuk pembuatan atau pembaruan kasbon.
   *
   * @param {CashAdvanceFormValues} values - Nilai form yang telah tervalidasi
   */
  const onSubmit = async (values: CashAdvanceFormValues) => {
    try {
      const payload = {
        ...values,
        date: values.date || undefined,
        repayment_date: values.repayment_date || undefined,
      };

      if (editingId) {
        await api.put(`/v1/cash-advances/${editingId}`, payload);
        toast.success('Catatan kasbon berhasil diperbarui.');
      } else {
        await api.post('/v1/cash-advances', payload);
        toast.success('Kasbon baru berhasil dicatat.');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan data.');
    }
  };

  /**
   * Menghapus rekaman data kasbon berdasarkan ID.
   */
  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/cash-advances/${deletingId}`);
      toast.success('Catatan kasbon berhasil dihapus.');
      fetchData();
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
        (item.description || '')
          .toLowerCase()
          .includes(globalFilter.toLowerCase()) ||
        (item.employee_name || '')
          .toLowerCase()
          .includes(globalFilter.toLowerCase());
      const matchStatus =
        statusFilter === 'Semua' ? true : item.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [data, globalFilter, statusFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('date', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tgl. Pengajuan <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='text-muted-foreground'>
            {info.getValue()
              ? format(new Date(info.getValue()!), 'dd MMM yyyy')
              : '-'}
          </span>
        ),
      }),
      columnHelper.accessor('employee_name', {
        header: 'Karyawan',
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('amount', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nominal (Rp) <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-bold text-amber-600'>
            Rp {(info.getValue() || 0).toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper.accessor('description', {
        header: 'Keterangan',
        cell: (info) => (
          <span
            className='text-muted-foreground text-sm truncate max-w-[200px] inline-block'
            title={info.getValue()}
          >
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge
            variant='outline'
            className={
              info.getValue() === 'Lunas'
                ? 'text-emerald-500 border-emerald-500/30'
                : 'text-amber-500 border-amber-500/30'
            }
          >
            {info.getValue() || 'Belum Lunas'}
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
            Kasbon Karyawan
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan pengajuan kasbon dan pelacakan status pembayaran.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Ajukan Kasbon
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
            placeholder='Cari nama karyawan atau keterangan...'
            className='w-full sm:max-w-sm'
          />

          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider'>
              Status:
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className='flex h-9 w-full sm:w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary'
            >
              <option value='Semua'>Semua Status</option>
              <option value='Belum Lunas'>Belum Lunas</option>
              <option value='Lunas'>Lunas</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
          emptyMessage='Tidak ada riwayat kasbon.'
        />
      </div>

      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Pengajuan Kasbon' : 'Pengajuan Kasbon Baru'}
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
              form='kasbon-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        }
      >
        <form
          id='kasbon-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6 py-2'
        >
          <div className='space-y-4'>
            <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider border-b border-border/60 pb-2'>
              Informasi Pengajuan
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
              <Select
                label='Nama Karyawan'
                required
                options={employees}
                value={form.watch('employee_id')}
                onChange={(val) => form.setValue('employee_id', val)}
                error={form.formState.errors.employee_id?.message}
              />
              <DatePicker
                label='Tanggal Pengajuan'
                value={form.watch('date')}
                onChange={(val) => form.setValue('date', val)}
              />
              <NumberInput
                label='Nominal Kasbon (Rp)'
                required
                value={form.watch('amount')}
                onChange={(val) => form.setValue('amount', val)}
                error={form.formState.errors.amount?.message}
                className='font-bold text-lg text-amber-600'
              />
              <Select
                label='Status Kasbon'
                options={[
                  { label: 'Belum Lunas', value: 'Belum Lunas' },
                  { label: 'Lunas', value: 'Lunas' },
                ]}
                value={form.watch('status')}
                onChange={(val) => form.setValue('status', val)}
              />
            </div>
            <Textarea
              label='Keterangan Keperluan'
              placeholder='Alasan pengajuan kasbon...'
              rows={2}
              {...form.register('description')}
            />
          </div>

          <div className='space-y-4'>
            <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider border-b border-border/60 pb-2'>
              Informasi Pelunasan
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
              <DatePicker
                label='Tanggal Pelunasan'
                value={form.watch('repayment_date')}
                onChange={(val) => form.setValue('repayment_date', val)}
              />
              <NumberInput
                label='Nominal Dilunasi (Rp)'
                value={form.watch('repayment_amount')}
                onChange={(val) => form.setValue('repayment_amount', val)}
                className='text-emerald-600'
              />
              <Select
                label='Metode Pelunasan'
                options={[
                  { label: 'Potong Gaji', value: 'Potong Gaji' },
                  { label: 'Transfer Balik', value: 'Transfer' },
                  { label: 'Cash', value: 'Cash' },
                ]}
                value={form.watch('repayment_method')}
                onChange={(val) => form.setValue('repayment_method', val)}
              />
              <Input
                label='Rekening / Akun Penerima'
                placeholder='Jika via transfer...'
                {...form.register('repayment_account')}
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
              Apakah Anda yakin ingin menghapus data kasbon ini? Jika kasbon
              belum lunas, pastikan tagihan ke karyawan sudah diselesaikan.
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
