'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  CreditCard,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { DataTable } from '@/components/_shared/DataTable';
import { Modal } from '@/components/_shared/Modal';
import { TableActions } from '@/components/_shared/TableActions';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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

// 1. Schema Validasi Lokal untuk Payroll
const localPayrollSchema = z.object({
  employee_id: z.string().min(1, 'Karyawan wajib dipilih'),
  period: z.string().min(1, 'Periode wajib diisi'),
  basic_salary: z.coerce.number().min(0).optional(),
  allowance: z.coerce.number().min(0).optional(),
  overtime: z.coerce.number().min(0).optional(),
  incentive_bonus: z.coerce.number().min(0).optional(),
  others_income: z.coerce.number().min(0).optional(),
  pph21: z.coerce.number().min(0).optional(),
  bpjs: z.coerce.number().min(0).optional(),
  debt_deduction: z.coerce.number().min(0).optional(),
  others_deduction: z.coerce.number().min(0).optional(),
});

type LocalPayrollFormValues = z.infer<typeof localPayrollSchema>;

export interface PayrollRow extends LocalPayrollFormValues {
  id: string;
  employee_name?: string;
  calculated_income?: number;
  calculated_deduction?: number;
  net_salary?: number;
}

const columnHelper = createColumnHelper<PayrollRow>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function PayrollPage() {
  const [data, setData] = useState<PayrollRow[]>([]);
  const [employees, setEmployees] = useState<
    { label: string; value: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Server-Side States ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<{ id: string; desc: boolean } | null>({
    id: 'period',
    desc: true,
  });
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    pageCount: 0,
    total: 0,
  });

  // Filter States
  const emptyFilters = { employee_id: 'ALL', period: '' };
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<PayrollRow | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<LocalPayrollFormValues>({
    resolver: zodResolver(localPayrollSchema as any),
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.employee_id !== 'ALL') count++;
    if (appliedFilters.period !== '') count++;
    return count;
  }, [appliedFilters]);

  // Dynamic Calculation untuk Form
  const watchedValues = useWatch({ control: form.control });
  const calculatedForm = useMemo(() => {
    const income =
      (Number(watchedValues.basic_salary) || 0) +
      (Number(watchedValues.allowance) || 0) +
      (Number(watchedValues.overtime) || 0) +
      (Number(watchedValues.incentive_bonus) || 0) +
      (Number(watchedValues.others_income) || 0);
    const deduction =
      (Number(watchedValues.pph21) || 0) +
      (Number(watchedValues.bpjs) || 0) +
      (Number(watchedValues.debt_deduction) || 0) +
      (Number(watchedValues.others_deduction) || 0);
    return { income, deduction, net: income - deduction };
  }, [watchedValues]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());

      if (sort) {
        params.append(
          'order',
          JSON.stringify([[sort.id, sort.desc ? 'DESC' : 'ASC']]),
        );
      }

      if (appliedFilters.employee_id && appliedFilters.employee_id !== 'ALL') {
        params.append('employee_id', appliedFilters.employee_id);
      }
      if (appliedFilters.period) {
        params.append('period', appliedFilters.period);
      }

      const [payrollRes, employeeRes] = await Promise.all([
        api.get<any>(`/v1/payrolls?${params.toString()}`),
        api.get<any>('/v1/employees?pageSize=1000'),
      ]);

      const employeeList = Array.isArray(employeeRes.data)
        ? employeeRes.data
        : employeeRes.data?.rows || [];
      setEmployees(
        employeeList.map((e: any) => ({ label: e.name, value: e.id })),
      );

      const payrollList = Array.isArray(payrollRes.data)
        ? payrollRes.data
        : payrollRes.data?.rows || [];

      const mappedData: PayrollRow[] = payrollList.map((item: any) => {
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
          employee_name:
            employeeList.find((e: any) => e.id === item.employee_id)?.name ||
            'Unknown Employee',
          calculated_income: income,
          calculated_deduction: deduction,
          net_salary: income - deduction,
        };
      });

      setData(mappedData);

      if (payrollRes.meta?.pagination) {
        setMeta(payrollRes.meta.pagination);
      } else {
        setMeta({
          total: payrollList.length,
          pageCount: 1,
          page: 1,
          pageSize: 10,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data payroll dari server.');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, sort, appliedFilters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (columnId: string) => {
    setSort((prev) => {
      if (prev?.id === columnId) {
        if (prev.desc) return null;
        return { id: columnId, desc: true };
      }
      return { id: columnId, desc: false };
    });
    setPage(1);
  };

  const applyFilters = () => {
    setAppliedFilters(filterInput);
    setPage(1);
    setIsFilterOpen(false);
  };

  const resetFilters = () => {
    setFilterInput(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
    setIsFilterOpen(false);
  };

  const handleOpenDetail = (payroll: PayrollRow) => {
    setSelectedData(payroll);
    setIsDetailOpen(true);
  };

  const handleOpenDialog = (payroll?: PayrollRow) => {
    if (payroll) {
      setEditingId(payroll.id);
      form.reset({
        employee_id: payroll.employee_id,
        period: payroll.period || '',
        basic_salary: payroll.basic_salary || 0,
        allowance: payroll.allowance || 0,
        overtime: payroll.overtime || 0,
        incentive_bonus: payroll.incentive_bonus || 0,
        others_income: payroll.others_income || 0,
        pph21: payroll.pph21 || 0,
        bpjs: payroll.bpjs || 0,
        debt_deduction: payroll.debt_deduction || 0,
        others_deduction: payroll.others_deduction || 0,
      });
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

  const onSubmit = async (values: LocalPayrollFormValues) => {
    try {
      if (editingId) {
        await api.put(`/v1/payrolls/${editingId}`, values);
        toast.success('Data gaji berhasil diperbarui.');
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

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/payrolls/${deletingId}`);
      toast.success('Data gaji berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data.');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const SortIcon = ({ columnId }: { columnId: string }) => (
    <ArrowUpDown
      className={`ml-2 h-3 w-3 ${sort?.id === columnId ? 'text-primary' : 'text-muted-foreground/50'}`}
    />
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor('period', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('period')}
          >
            Periode <SortIcon columnId='period' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-semibold text-primary'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('employee_name', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('employee_id')}
          >
            Nama Karyawan <SortIcon columnId='employee_id' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('basic_salary', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('basic_salary')}
          >
            Gaji Pokok <SortIcon columnId='basic_salary' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono text-muted-foreground'>
            Rp {(info.getValue() || 0).toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper.accessor('net_salary', {
        header: 'Gaji Bersih (Netto)',
        cell: (info) => (
          <span className='font-mono font-bold text-emerald-600'>
            Rp {(info.getValue() || 0).toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper?.display({
        id: 'actions',
        header: () => <div className='text-right'>Aksi</div>,
        cell: (info) => (
          <TableActions
            onView={() => handleOpenDetail(info.row.original)}
            onEdit={() => handleOpenDialog(info.row.original)}
            onDelete={() => setDeletingId(info.row.original.id)}
          />
        ),
      }),
    ],
    [sort],
  );

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2'>
            <CreditCard className='w-6 h-6 text-primary' /> Master Payroll
            (Gaji)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pusat pencatatan gaji bulanan, rincian pendapatan, dan pemotongan
            karyawan.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Buat Slip Gaji
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

      <div className='bg-card border border-border rounded-xl shadow-soft-depth overflow-hidden flex flex-col'>
        {/* ACTION BAR */}
        <div className='p-4 border-b border-border flex justify-between items-center bg-muted/20'>
          <div className='text-sm font-medium text-muted-foreground'>
            Total <span className='text-primary font-bold'>{meta.total}</span>{' '}
            Catatan Payroll
          </div>

          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className='border-border shadow-sm flex items-center gap-2 relative bg-background'
              >
                <Filter className='w-4 h-4 text-muted-foreground' />
                Filter Data
                {activeFilterCount > 0 && (
                  <span className='absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white'>
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className='w-80 p-4 rounded-xl border-border shadow-lg'
              align='end'
            >
              <div className='space-y-4'>
                <div>
                  <h4 className='font-heading font-bold text-sm text-foreground'>
                    Filter Spesifik
                  </h4>
                  <p className='text-xs text-muted-foreground'>
                    Pencarian data rekap gaji.
                  </p>
                </div>

                <div className='space-y-3'>
                  <Select
                    label='Filter Karyawan'
                    options={[
                      { label: 'Semua Karyawan', value: 'ALL' },
                      ...employees,
                    ]}
                    value={filterInput.employee_id}
                    onChange={(val) =>
                      setFilterInput({ ...filterInput, employee_id: val })
                    }
                  />
                  <Input
                    label='Periode'
                    placeholder='Contoh: Januari 2025'
                    value={filterInput.period}
                    onChange={(e) =>
                      setFilterInput({ ...filterInput, period: e.target.value })
                    }
                  />
                </div>

                <div className='flex justify-end gap-2 pt-3 border-t border-border/50'>
                  <Button variant='ghost' size='sm' onClick={resetFilters}>
                    Reset
                  </Button>
                  <Button
                    size='sm'
                    onClick={applyFilters}
                    className='bg-primary text-white'
                  >
                    Terapkan Filter
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <DataTable
          columns={columns as any}
          data={data}
          isLoading={isLoading}
          emptyMessage='Belum ada data slip gaji.'
        />

        {/* CUSTOM PAGINATION FOOTER */}
        {!isLoading && meta.total > 0 && (
          <div className='flex items-center justify-between px-6 py-4 border-t border-border bg-background'>
            <div className='text-sm text-muted-foreground'>
              Menampilkan{' '}
              <span className='font-semibold text-foreground'>
                {(page - 1) * pageSize + 1}
              </span>{' '}
              -{' '}
              <span className='font-semibold text-foreground'>
                {Math.min(page * pageSize, meta.total)}
              </span>{' '}
              dari{' '}
              <span className='font-semibold text-foreground'>
                {meta.total}
              </span>{' '}
              data
            </div>

            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <span className='text-xs text-muted-foreground'>
                  Baris per halaman:
                </span>
                <select
                  className='h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary'
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {[5, 10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className='flex items-center gap-1'>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-8 w-8'
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <div className='flex items-center justify-center w-12 text-sm font-medium'>
                  {page} / {meta.pageCount || 1}
                </div>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-8 w-8'
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= (meta.pageCount || 1)}
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL VIEW DETAIL (SLIP GAJI) */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title='Detail Slip Gaji Karyawan'
        size='lg'
        footer={
          <div className='flex justify-end w-full'>
            <Button variant='outline' onClick={() => setIsDetailOpen(false)}>
              Tutup
            </Button>
          </div>
        }
      >
        {selectedData && (
          <div className='space-y-6 py-2'>
            <div className='flex justify-between items-center pb-4 border-b border-border/50'>
              <div className='flex items-center gap-3'>
                <div className='h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary'>
                  <FileText className='h-5 w-5' />
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Karyawan</p>
                  <p className='text-lg font-bold text-foreground'>
                    {selectedData.employee_name}
                  </p>
                </div>
              </div>
              <div className='text-right'>
                <p className='text-sm text-muted-foreground'>Periode</p>
                <p className='font-semibold text-primary'>
                  {selectedData.period || '-'}
                </p>
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Kolom Pendapatan */}
              <div className='space-y-3'>
                <h4 className='text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-md inline-block'>
                  Pendapatan (Income)
                </h4>
                <div className='bg-muted/20 p-4 rounded-xl border border-border/50 space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Gaji Pokok</span>
                    <span className='font-mono'>
                      Rp{' '}
                      {(selectedData.basic_salary || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Tunjangan</span>
                    <span className='font-mono'>
                      Rp {(selectedData.allowance || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Lembur (Overtime)
                    </span>
                    <span className='font-mono'>
                      Rp {(selectedData.overtime || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Bonus Insentif
                    </span>
                    <span className='font-mono'>
                      Rp{' '}
                      {(selectedData.incentive_bonus || 0).toLocaleString(
                        'id-ID',
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Pendapatan Lain
                    </span>
                    <span className='font-mono'>
                      Rp{' '}
                      {(selectedData.others_income || 0).toLocaleString(
                        'id-ID',
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between pt-2 mt-2 border-t font-semibold text-emerald-600'>
                    <span>Total Pendapatan</span>
                    <span className='font-mono'>
                      Rp{' '}
                      {(selectedData.calculated_income || 0).toLocaleString(
                        'id-ID',
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Kolom Potongan */}
              <div className='space-y-3'>
                <h4 className='text-xs font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-3 py-1.5 rounded-md inline-block'>
                  Potongan (Deduction)
                </h4>
                <div className='bg-muted/20 p-4 rounded-xl border border-border/50 space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>PPh21</span>
                    <span className='font-mono text-destructive'>
                      Rp {(selectedData.pph21 || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>BPJS</span>
                    <span className='font-mono text-destructive'>
                      Rp {(selectedData.bpjs || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Potongan Kasbon
                    </span>
                    <span className='font-mono text-destructive'>
                      Rp{' '}
                      {(selectedData.debt_deduction || 0).toLocaleString(
                        'id-ID',
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Potongan Lainnya
                    </span>
                    <span className='font-mono text-destructive'>
                      Rp{' '}
                      {(selectedData.others_deduction || 0).toLocaleString(
                        'id-ID',
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between pt-2 mt-2 border-t font-semibold text-destructive'>
                    <span>Total Potongan</span>
                    <span className='font-mono'>
                      Rp{' '}
                      {(selectedData.calculated_deduction || 0).toLocaleString(
                        'id-ID',
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-primary/5 p-4 rounded-xl border border-primary/20 flex justify-between items-center'>
              <span className='text-sm font-bold uppercase tracking-wider'>
                Take Home Pay (Gaji Bersih)
              </span>
              <span className='text-2xl font-mono font-bold text-primary'>
                Rp {(selectedData.net_salary || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL FORM CREATE / EDIT */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Slip Gaji' : 'Buat Slip Gaji Baru'}
        size='xl'
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
              form='payroll-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? 'Menyimpan...'
                : 'Simpan Slip Gaji'}
            </Button>
          </div>
        }
      >
        <form
          id='payroll-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6 py-2'
        >
          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <Select
              label='Pilih Karyawan'
              required
              options={employees}
              value={form.watch('employee_id')}
              onChange={(val) => form.setValue('employee_id', val)}
              error={form.formState.errors.employee_id?.message}
            />
            <Input
              label='Periode (Bulan & Tahun)'
              required
              placeholder='Contoh: Januari 2025'
              error={form.formState.errors.period?.message}
              {...form.register('period')}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* KIRI: Pendapatan */}
            <div className='bg-muted/20 p-4 rounded-xl border border-border/50 space-y-4'>
              <h3 className='text-xs font-bold uppercase text-emerald-600 mb-2'>
                Rincian Pendapatan (+)
              </h3>
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

            {/* KANAN: Potongan */}
            <div className='bg-muted/20 p-4 rounded-xl border border-border/50 space-y-4'>
              <h3 className='text-xs font-bold uppercase text-destructive mb-2'>
                Rincian Potongan (-)
              </h3>
              <NumberInput
                label='Potongan PPh21'
                value={form.watch('pph21')}
                onChange={(val) => form.setValue('pph21', val)}
              />
              <NumberInput
                label='Potongan BPJS'
                value={form.watch('bpjs')}
                onChange={(val) => form.setValue('bpjs', val)}
              />
              <NumberInput
                label='Potongan Kasbon (Debt)'
                value={form.watch('debt_deduction')}
                onChange={(val) => form.setValue('debt_deduction', val)}
              />
              <NumberInput
                label='Potongan Lainnya'
                value={form.watch('others_deduction')}
                onChange={(val) => form.setValue('others_deduction', val)}
              />
            </div>
          </div>

          {/* BAWAH: Live Summary */}
          <div className='bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3'>
            <h3 className='text-xs font-bold uppercase text-primary tracking-wider border-b border-primary/20 pb-2'>
              Ringkasan Kalkulasi (Otomatis)
            </h3>
            <div className='grid grid-cols-3 gap-4 text-center pt-1'>
              <div>
                <p className='text-[11px] text-muted-foreground uppercase'>
                  Total Pendapatan
                </p>
                <p className='font-mono font-semibold text-emerald-600'>
                  Rp {calculatedForm.income.toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className='text-[11px] text-muted-foreground uppercase'>
                  Total Potongan
                </p>
                <p className='font-mono font-semibold text-destructive'>
                  Rp {calculatedForm.deduction.toLocaleString('id-ID')}
                </p>
              </div>
              <div className='bg-background rounded-md border py-1 shadow-sm'>
                <p className='text-[11px] text-muted-foreground uppercase font-bold'>
                  Gaji Bersih
                </p>
                <p className='font-mono font-bold text-primary'>
                  Rp {calculatedForm.net.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* ALERT DIALOG DELETE */}
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
              Apakah Anda yakin ingin menghapus data slip gaji ini?
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
