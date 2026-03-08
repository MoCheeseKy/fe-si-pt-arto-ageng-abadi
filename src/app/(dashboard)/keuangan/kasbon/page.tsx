'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Banknote,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { z } from 'zod';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
import { Textarea } from '@/components/form/Textarea';
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

// 1. Schema Validasi Lokal untuk Cash Advance (Kasbon)
const localCashAdvanceSchema = z.object({
  employee_id: z.string().min(1, 'Karyawan wajib dipilih'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  description: z.string().optional(),
  amount: z.coerce.number().min(1, 'Nominal kasbon harus lebih dari 0'),
  monthly_deduction: z.coerce.number().min(0).optional(),
});

type LocalCashAdvanceFormValues = z.infer<typeof localCashAdvanceSchema>;

export interface CashAdvanceRow extends LocalCashAdvanceFormValues {
  id: string;
  employee_name?: string;
}

const columnHelper = createColumnHelper<CashAdvanceRow>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function KasbonPage() {
  const [data, setData] = useState<CashAdvanceRow[]>([]);
  const [employees, setEmployees] = useState<
    { label: string; value: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Server-Side States ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState<{ id: string; desc: boolean } | null>({
    id: 'date',
    desc: true,
  });
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    pageSize: 10,
    pageCount: 0,
    total: 0,
  });

  // Filter States (Gunakan "ALL" untuk Dropdown All)
  const emptyFilters = { employee_id: 'ALL' };
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<CashAdvanceRow | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<LocalCashAdvanceFormValues>({
    resolver: zodResolver(localCashAdvanceSchema as any),
    defaultValues: {
      employee_id: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      monthly_deduction: 0,
    },
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.employee_id !== 'ALL') count++;
    return count;
  }, [appliedFilters]);

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

      // Fetch Kasbon dan Employees secara paralel
      // Note: Pastikan endpoint backend untuk Kasbon adalah `/v1/cash-advances`
      const [kasbonRes, employeeRes] = await Promise.all([
        api.get<any>(`/v1/cash-advances?${params.toString()}`),
        api.get<any>('/v1/employees?pageSize=1000'),
      ]);

      const employeeList = Array.isArray(employeeRes.data)
        ? employeeRes.data
        : employeeRes.data?.rows || [];
      setEmployees(
        employeeList.map((e: any) => ({ label: e.name, value: e.id })),
      );

      const kasbonList = Array.isArray(kasbonRes.data)
        ? kasbonRes.data
        : kasbonRes.data?.rows || [];

      const mappedData: CashAdvanceRow[] = kasbonList.map((item: any) => ({
        ...item,
        employee_name:
          employeeList.find((e: any) => e.id === item.employee_id)?.name ||
          'Unknown Employee',
      }));

      setData(mappedData);

      if (kasbonRes.meta?.pagination) {
        setMeta(kasbonRes.meta.pagination);
      } else {
        setMeta({
          total: kasbonList.length,
          pageCount: 1,
          page: 1,
          pageSize: 10,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data kasbon dari server.');
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

  const handleOpenDetail = (kasbon: CashAdvanceRow) => {
    setSelectedData(kasbon);
    setIsDetailOpen(true);
  };

  const handleOpenDialog = (kasbon?: CashAdvanceRow) => {
    if (kasbon) {
      setEditingId(kasbon.id);
      form.reset({
        employee_id: kasbon.employee_id,
        date: kasbon.date
          ? new Date(kasbon.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        description: kasbon.description || '',
        amount: kasbon.amount || 0,
        monthly_deduction: kasbon.monthly_deduction || 0,
      });
    } else {
      setEditingId(null);
      form.reset({
        employee_id: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        monthly_deduction: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: LocalCashAdvanceFormValues) => {
    try {
      if (editingId) {
        await api.put(`/v1/cash-advances/${editingId}`, values);
        toast.success('Data kasbon berhasil diperbarui.');
      } else {
        await api.post('/v1/cash-advances', values);
        toast.success('Kasbon baru berhasil dicatat.');
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
      await api.delete(`/v1/cash-advances/${deletingId}`);
      toast.success('Kasbon berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus kasbon.');
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
      columnHelper.accessor('date', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('date')}
          >
            Tanggal <SortIcon columnId='date' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-medium text-foreground'>
            {info.getValue()
              ? format(new Date(info.getValue()!), 'dd MMM yyyy')
              : '-'}
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
            Karyawan <SortIcon columnId='employee_id' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('amount', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('amount')}
          >
            Total Pinjaman (Rp) <SortIcon columnId='amount' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-bold text-amber-600'>
            Rp {(info.getValue() || 0).toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper.accessor('monthly_deduction', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('monthly_deduction')}
          >
            Potongan / Bulan <SortIcon columnId='monthly_deduction' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono text-muted-foreground'>
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
            <Banknote className='w-6 h-6 text-primary' /> Master Kasbon
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan pinjaman (Cash Advance) karyawan dan rincian potongan
            gaji bulanan.
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

      <div className='bg-card border border-border rounded-xl shadow-soft-depth overflow-hidden flex flex-col'>
        {/* ACTION BAR */}
        <div className='p-4 border-b border-border flex justify-between items-center bg-muted/20'>
          <div className='text-sm font-medium text-muted-foreground'>
            Total <span className='text-primary font-bold'>{meta.total}</span>{' '}
            Catatan Kasbon
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
                    Pencarian data kasbon.
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
          emptyMessage='Belum ada data pengajuan kasbon.'
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

      {/* MODAL VIEW DETAIL */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title='Rincian Pinjaman (Kasbon)'
        size='sm'
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
            <div className='flex flex-col gap-1 pb-4 border-b border-border/50 text-center'>
              <div className='mx-auto h-12 w-12 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-600 mb-2'>
                <FileText className='h-6 w-6' />
              </div>
              <p className='text-sm text-muted-foreground'>Total Kasbon</p>
              <p className='text-2xl font-bold font-mono text-amber-600'>
                Rp {(selectedData.amount || 0).toLocaleString('id-ID')}
              </p>
            </div>

            <div className='grid grid-cols-2 gap-y-4 gap-x-6'>
              <div>
                <p className='text-xs text-muted-foreground'>
                  Tanggal Transaksi
                </p>
                <p className='font-medium text-sm'>
                  {selectedData.date
                    ? format(new Date(selectedData.date), 'dd MMM yyyy')
                    : '-'}
                </p>
              </div>
              <div className='col-span-2'>
                <p className='text-xs text-muted-foreground'>Nama Karyawan</p>
                <p className='font-bold text-base'>
                  {selectedData.employee_name}
                </p>
              </div>
              <div className='col-span-2'>
                <p className='text-xs text-muted-foreground'>
                  Deskripsi / Keterangan Keperluan
                </p>
                <p className='text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg mt-1 border border-border/50'>
                  {selectedData.description || '-'}
                </p>
              </div>
            </div>

            <div className='bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3 mt-2'>
              <div className='flex flex-col gap-1 text-center'>
                <span className='text-xs text-muted-foreground font-semibold uppercase tracking-wider'>
                  Potongan Gaji Bulanan
                </span>
                <span className='text-lg font-mono font-bold text-destructive'>
                  Rp{' '}
                  {(selectedData.monthly_deduction || 0).toLocaleString(
                    'id-ID',
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL FORM CREATE / EDIT */}
      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Kasbon Karyawan' : 'Pengajuan Kasbon Baru'}
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
          className='space-y-5 py-2'
        >
          <div className='grid grid-cols-2 gap-4'>
            <Select
              label='Pilih Karyawan'
              required
              options={employees}
              value={form.watch('employee_id')}
              onChange={(val) => form.setValue('employee_id', val)}
              error={form.formState.errors.employee_id?.message}
            />
            <DatePicker
              label='Tanggal Pengajuan'
              required
              value={form.watch('date')}
              onChange={(val) => form.setValue('date', val)}
              error={form.formState.errors.date?.message}
            />
          </div>

          <Textarea
            label='Deskripsi (Keperluan Kasbon)'
            placeholder='Contoh: Pinjaman dana darurat keluarga...'
            rows={2}
            {...form.register('description')}
          />

          <div className='bg-muted/30 p-4 rounded-xl border border-border/60 space-y-4'>
            <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider mb-1'>
              Rincian Nominal
            </h3>
            <NumberInput
              label='Total Pinjaman (Rp)'
              required
              value={form.watch('amount')}
              onChange={(val) => form.setValue('amount', val)}
              error={form.formState.errors.amount?.message}
            />
            <NumberInput
              label='Rencana Potongan Bulanan (Rp)'
              value={form.watch('monthly_deduction')}
              onChange={(val) => form.setValue('monthly_deduction', val)}
              error={form.formState.errors.monthly_deduction?.message}
            />
            <p className='text-[11px] text-muted-foreground leading-relaxed mt-1'>
              Potongan bulanan ini akan secara otomatis terintegrasi sebagai
              pengurang netto di dalam perhitungan Payroll (Gaji) karyawan yang
              bersangkutan.
            </p>
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
              Apakah Anda yakin ingin menghapus data kasbon ini? Hal ini dapat
              memengaruhi rekap potongan gaji bulanan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Kasbon'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
