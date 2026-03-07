'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  FileSignature,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  Calculator,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { SearchInput } from '@/components/form/SearchInput';
import { Select } from '@/components/form/Select';
import { NumberInput } from '@/components/form/NumberInput';
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

const payrollSchema = z.object({
  employee_id: z.string().min(1, 'Karyawan wajib dipilih'),
  period: z.string().optional(),
  basic_salary: z.coerce.number().optional(),
  allowance: z.coerce.number().optional(),
  overtime: z.coerce.number().optional(),
  incentive_bonus: z.coerce.number().optional(),
  others_income: z.coerce.number().optional(),
  pph21: z.coerce.number().optional(),
  bpjs: z.coerce.number().optional(),
  debt_deduction: z.coerce.number().optional(),
  others_deduction: z.coerce.number().optional(),
});

type PayrollFormValues = z.infer<typeof payrollSchema>;

export interface PayrollRow extends PayrollFormValues {
  id: string;
  employee_name?: string;
  take_home_pay: number;
}

const columnHelper = createColumnHelper<PayrollRow>();

/**
 * Halaman manajemen operasional Payroll (Penggajian).
 * Menampilkan riwayat gaji karyawan dan kalkulasi otomatis komponen pendapatan & potongan.
 * Terintegrasi dengan endpoint /v1/payrolls dan /v1/employees.
 *
 * @returns {JSX.Element} Komponen UI halaman Payroll
 */
export default function PayrollPage() {
  const [data, setData] = useState<PayrollRow[]>([]);
  const [employees, setEmployees] = useState<
    { label: string; value: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<PayrollFormValues>({
    resolver: zodResolver(payrollSchema as any),
    defaultValues: {
      employee_id: '',
      period: '',
      basic_salary: 0,
      allowance: 0,
      overtime: 0,
      incentive_bonus: 0,
      others_income: 0,
      pph21: 0,
      bpjs: 0,
      debt_deduction: 0,
      others_deduction: 0,
    },
  });

  const watchValues = useWatch({ control: form.control });

  const calculatedIncome = useMemo(() => {
    return (
      (watchValues.basic_salary || 0) +
      (watchValues.allowance || 0) +
      (watchValues.overtime || 0) +
      (watchValues.incentive_bonus || 0) +
      (watchValues.others_income || 0)
    );
  }, [watchValues]);

  const calculatedDeduction = useMemo(() => {
    return (
      (watchValues.pph21 || 0) +
      (watchValues.bpjs || 0) +
      (watchValues.debt_deduction || 0) +
      (watchValues.others_deduction || 0)
    );
  }, [watchValues]);

  const takeHomePay = useMemo(() => {
    return calculatedIncome - calculatedDeduction;
  }, [calculatedIncome, calculatedDeduction]);

  /**
   * Mengambil data penggajian dan data referensi karyawan secara paralel.
   * Melakukan kalkulasi take home pay secara *on-the-fly* untuk disajikan di tabel.
   *
   * @returns {Promise<void>}
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [payrollRes, employeeRes] = await Promise.all([
        api.get<any>('/v1/payrolls'),
        api.get<any>('/v1/employees'),
      ]);

      const prList = Array.isArray(payrollRes.data)
        ? payrollRes.data
        : payrollRes.data?.rows || [];
      const empList = Array.isArray(employeeRes.data)
        ? employeeRes.data
        : employeeRes.data?.rows || [];

      setEmployees(empList.map((e: any) => ({ label: e.name, value: e.id })));

      const getEmployeeName = (id: string) =>
        empList.find((e: any) => e.id === id)?.name || 'Unknown Employee';

      const mappedData: PayrollRow[] = prList.map((item: any) => {
        const income =
          (item.basic_salary || 0) +
          (item.allowance || 0) +
          (item.overtime || 0) +
          (item.incentive_bonus || 0) +
          (item.others_income || 0);
        const deduction =
          (item.pph21 || 0) +
          (item.bpjs || 0) +
          (item.debt_deduction || 0) +
          (item.others_deduction || 0);

        return {
          ...item,
          employee_name: getEmployeeName(item.employee_id),
          take_home_pay: income - deduction,
        };
      });

      setData(mappedData);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data dari server.');
      toast.error('Gagal memuat data penggajian');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Membuka modal form untuk membuat slip gaji baru atau memperbarui data lama.
   *
   * @param {PayrollRow} [payroll] - Data gaji yang akan diedit (opsional)
   */
  const handleOpenDialog = (payroll?: PayrollRow) => {
    if (payroll) {
      setEditingId(payroll.id);
      form.reset({ ...payroll });
    } else {
      setEditingId(null);
      form.reset({
        employee_id: '',
        period: '',
        basic_salary: 0,
        allowance: 0,
        overtime: 0,
        incentive_bonus: 0,
        others_income: 0,
        pph21: 0,
        bpjs: 0,
        debt_deduction: 0,
        others_deduction: 0,
      });
    }
    setIsDialogOpen(true);
  };

  /**
   * Mengirimkan data form slip gaji ke backend.
   *
   * @param {PayrollFormValues} values - Nilai input dari form
   */
  const onSubmit = async (values: PayrollFormValues) => {
    try {
      if (editingId) {
        await api.put(`/v1/payrolls/${editingId}`, values);
        toast.success('Slip gaji berhasil diperbarui.');
      } else {
        await api.post('/v1/payrolls', values);
        toast.success('Slip gaji baru berhasil dicatat.');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan data.');
    }
  };

  /**
   * Menghapus rekaman slip gaji berdasarkan ID.
   */
  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/payrolls/${deletingId}`);
      toast.success('Slip gaji berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data.');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(
      (item) =>
        (item.period || '')
          .toLowerCase()
          .includes(globalFilter.toLowerCase()) ||
        (item.employee_name || '')
          .toLowerCase()
          .includes(globalFilter.toLowerCase()),
    );
  }, [data, globalFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('period', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Periode <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-semibold text-primary'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('employee_name', {
        header: 'Nama Karyawan',
        cell: (info) => (
          <div className='flex items-center gap-2'>
            <FileSignature className='w-4 h-4 text-muted-foreground' />
            <span className='font-medium text-foreground'>
              {info.getValue()}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('basic_salary', {
        header: 'Gaji Pokok',
        cell: (info) => (
          <span className='font-mono text-muted-foreground'>
            Rp {(info.getValue() || 0).toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper.accessor('take_home_pay', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Take Home Pay <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-bold text-emerald-500'>
            Rp {(info.getValue() || 0).toLocaleString('id-ID')}
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
            Payroll (Gaji)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Manajemen slip gaji, tunjangan, dan pemotongan karyawan.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Terbitkan Slip Gaji
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
        <div className='p-4 border-b border-border bg-muted/20'>
          <SearchInput
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder='Cari nama karyawan atau periode...'
            className='w-full sm:max-w-sm'
          />
        </div>

        <DataTable
          columns={columns as any}
          data={filteredData}
          isLoading={isLoading}
          emptyMessage='Tidak ada riwayat penggajian.'
        />
      </div>

      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Slip Gaji' : 'Buat Slip Gaji Baru'}
        size='xl'
      >
        <div className='flex flex-col lg:flex-row gap-6'>
          <div className='flex-1 space-y-6'>
            <form
              id='payroll-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-6'
            >
              <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                <Select
                  label='Nama Karyawan'
                  required
                  options={employees}
                  value={form.watch('employee_id')}
                  onChange={(val) => form.setValue('employee_id', val)}
                  error={form.formState.errors.employee_id?.message}
                />
                <Input
                  label='Periode Gaji'
                  placeholder='Contoh: Januari 2026'
                  error={form.formState.errors.period?.message}
                  {...form.register('period')}
                />
              </div>

              <div className='space-y-4'>
                <h3 className='text-sm font-bold uppercase text-emerald-600 tracking-wider border-b border-border/60 pb-2'>
                  Pendapatan (Income)
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <NumberInput
                    label='Gaji Pokok'
                    value={form.watch('basic_salary')}
                    onChange={(val) => form.setValue('basic_salary', val)}
                  />
                  <NumberInput
                    label='Tunjangan'
                    value={form.watch('allowance')}
                    onChange={(val) => form.setValue('allowance', val)}
                  />
                  <NumberInput
                    label='Uang Lembur (Overtime)'
                    value={form.watch('overtime')}
                    onChange={(val) => form.setValue('overtime', val)}
                  />
                  <NumberInput
                    label='Bonus / Insentif'
                    value={form.watch('incentive_bonus')}
                    onChange={(val) => form.setValue('incentive_bonus', val)}
                  />
                  <NumberInput
                    label='Pendapatan Lainnya'
                    value={form.watch('others_income')}
                    onChange={(val) => form.setValue('others_income', val)}
                  />
                </div>
              </div>

              <div className='space-y-4'>
                <h3 className='text-sm font-bold uppercase text-amber-600 tracking-wider border-b border-border/60 pb-2'>
                  Potongan (Deduction)
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <NumberInput
                    label='PPH 21'
                    value={form.watch('pph21')}
                    onChange={(val) => form.setValue('pph21', val)}
                  />
                  <NumberInput
                    label='BPJS (Kesehatan/TK)'
                    value={form.watch('bpjs')}
                    onChange={(val) => form.setValue('bpjs', val)}
                  />
                  <NumberInput
                    label='Potongan Kasbon (Hutang)'
                    value={form.watch('debt_deduction')}
                    onChange={(val) => form.setValue('debt_deduction', val)}
                    className='border-amber-500/30'
                  />
                  <NumberInput
                    label='Potongan Lainnya'
                    value={form.watch('others_deduction')}
                    onChange={(val) => form.setValue('others_deduction', val)}
                  />
                </div>
              </div>
            </form>
          </div>

          <div className='w-full lg:w-[380px] bg-sidebar/40 p-6 flex flex-col justify-between rounded-xl border border-border/50'>
            <div>
              <div className='flex items-center gap-2 mb-6'>
                <Calculator className='w-5 h-5 text-primary' />
                <h3 className='font-heading font-semibold text-lg'>
                  Ringkasan Gaji
                </h3>
              </div>

              <div className='space-y-4'>
                <div className='bg-emerald-500/10 p-4 rounded-lg border border-emerald-500/20'>
                  <p className='text-xs text-emerald-600 mb-1 uppercase font-bold tracking-wider'>
                    Total Pendapatan
                  </p>
                  <p className='text-xl font-mono font-semibold text-emerald-600'>
                    Rp {calculatedIncome.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className='bg-amber-500/10 p-4 rounded-lg border border-amber-500/20'>
                  <p className='text-xs text-amber-600 mb-1 uppercase font-bold tracking-wider'>
                    Total Potongan
                  </p>
                  <p className='text-xl font-mono font-semibold text-amber-600'>
                    Rp {calculatedDeduction.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className='mt-8 pt-6 border-t border-border/80 border-dashed'>
                <p className='text-xs text-muted-foreground mb-2 flex items-center justify-between uppercase font-bold tracking-wider'>
                  Take Home Pay
                </p>
                <p className='text-3xl font-heading font-bold text-foreground break-all'>
                  Rp {takeHomePay.toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className='mt-8 pt-4 flex gap-3'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsDialogOpen(false)}
                className='w-full'
              >
                Batal
              </Button>
              <Button
                type='submit'
                form='payroll-form'
                className='w-full bg-primary hover:bg-primary/90 text-white'
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? 'Menyimpan...'
                  : 'Simpan Slip Gaji'}
              </Button>
            </div>
          </div>
        </div>
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
              Apakah Anda yakin ingin menghapus slip gaji ini? Riwayat potongan
              kasbon terkait mungkin harus disesuaikan secara manual.
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
