'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  FileText,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { z } from 'zod';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
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

// 1. Schema Validasi Lokal untuk Invoice
const localInvoiceSchema = z.object({
  invoice_number: z.string().min(1, 'Nomor Invoice wajib diisi'),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  total_amount: z.coerce.number().min(0, 'Total amount tidak boleh negatif'),
  tax_amount: z.coerce.number().min(0, 'Tax amount tidak boleh negatif'),
  grand_total: z.coerce.number().min(0),
  status: z.string().optional(),
});

type LocalInvoiceFormValues = z.infer<typeof localInvoiceSchema>;

export interface InvoiceRow extends LocalInvoiceFormValues {
  id: string;
  customer_name?: string;
}

const columnHelper = createColumnHelper<InvoiceRow>();

interface PaginationMeta {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}

export default function InvoicePage() {
  const [data, setData] = useState<InvoiceRow[]>([]);
  const [customers, setCustomers] = useState<
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

  // Filter States - MENGGUNAKAN "ALL" SEBAGAI PENGGANTI EMPTY STRING ""
  const emptyFilters = { invoice_number: '', status: 'ALL' };
  const [filterInput, setFilterInput] = useState(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal & Actions States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<InvoiceRow | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<LocalInvoiceFormValues>({
    resolver: zodResolver(localInvoiceSchema as any),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      invoice_number: '',
      customer_id: '',
      total_amount: 0,
      tax_amount: 0,
      grand_total: 0,
      status: 'Draft',
    },
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.invoice_number !== '') count++;
    if (appliedFilters.status !== 'ALL') count++;
    return count;
  }, [appliedFilters]);

  // Kalkulasi Otomatis Grand Total
  const totalAmount = form.watch('total_amount');
  const taxAmount = form.watch('tax_amount');
  useEffect(() => {
    const calcGrandTotal = Number(totalAmount || 0) + Number(taxAmount || 0);
    form.setValue('grand_total', calcGrandTotal);
  }, [totalAmount, taxAmount, form]);

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

      if (appliedFilters.invoice_number)
        params.append('invoice_number', appliedFilters.invoice_number);
      // HANYA APPEND STATUS JIKA BUKAN "ALL"
      if (appliedFilters.status && appliedFilters.status !== 'ALL')
        params.append('status', appliedFilters.status);

      // Fetch Invoices dan Customers secara paralel
      const [invoiceRes, customerRes] = await Promise.all([
        api.get<any>(`/v1/invoices?${params.toString()}`),
        api.get<any>('/v1/customers?pageSize=1000'),
      ]);

      const customerList = Array.isArray(customerRes.data)
        ? customerRes.data
        : customerRes.data?.rows || [];
      setCustomers(
        customerList.map((c: any) => ({ label: c.company_name, value: c.id })),
      );

      const invoiceList = Array.isArray(invoiceRes.data)
        ? invoiceRes.data
        : invoiceRes.data?.rows || [];

      const mappedData: InvoiceRow[] = invoiceList.map((item: any) => ({
        ...item,
        customer_name:
          customerList.find((c: any) => c.id === item.customer_id)
            ?.company_name || 'Unknown Customer',
      }));

      setData(mappedData);

      if (invoiceRes.meta?.pagination) {
        setMeta(invoiceRes.meta.pagination);
      } else {
        setMeta({
          total: invoiceList.length,
          pageCount: 1,
          page: 1,
          pageSize: 10,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data invoice dari server.');
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

  const handleOpenDetail = (invoice: InvoiceRow) => {
    setSelectedData(invoice);
    setIsDetailOpen(true);
  };

  const handleOpenDialog = (invoice?: InvoiceRow) => {
    if (invoice) {
      setEditingId(invoice.id);
      form.reset({
        date: invoice.date
          ? new Date(invoice.date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        invoice_number: invoice.invoice_number || '',
        customer_id: invoice.customer_id,
        total_amount: invoice.total_amount || 0,
        tax_amount: invoice.tax_amount || 0,
        grand_total: invoice.grand_total || 0,
        status: invoice.status || 'Draft',
      });
    } else {
      setEditingId(null);
      form.reset({
        date: new Date().toISOString().split('T')[0],
        invoice_number: '',
        customer_id: '',
        total_amount: 0,
        tax_amount: 0,
        grand_total: 0,
        status: 'Draft',
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: LocalInvoiceFormValues) => {
    try {
      if (editingId) {
        await api.put(`/v1/invoices/${editingId}`, values);
        toast.success('Data invoice berhasil diperbarui.');
      } else {
        await api.post('/v1/invoices', values);
        toast.success('Invoice baru berhasil dibuat.');
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
      await api.delete(`/v1/invoices/${deletingId}`);
      toast.success('Invoice berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus invoice.');
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
      columnHelper.accessor('invoice_number', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('invoice_number')}
          >
            Nomor Invoice <SortIcon columnId='invoice_number' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-bold text-primary'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
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
        cell: (info) => {
          const val = info.getValue();
          return (
            <span className='font-medium text-foreground'>
              {val ? format(new Date(val), 'dd MMM yyyy') : '-'}
            </span>
          );
        },
      }),
      columnHelper.accessor('customer_name', {
        header: 'Customer',
        cell: (info) => (
          <span className='font-semibold text-foreground'>
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('grand_total', {
        header: () => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => handleSort('grand_total')}
          >
            Grand Total <SortIcon columnId='grand_total' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-bold text-emerald-600'>
            Rp {(info.getValue() || 0).toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => {
          const status = info.getValue();
          let badgeClass = 'bg-muted text-muted-foreground border-border';
          if (status === 'Paid')
            badgeClass =
              'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
          if (status === 'Unpaid')
            badgeClass =
              'bg-destructive/10 text-destructive border-destructive/20';
          if (status === 'Draft')
            badgeClass = 'bg-amber-500/10 text-amber-600 border-amber-500/20';

          return (
            <Badge variant='outline' className={badgeClass}>
              {status || 'Draft'}
            </Badge>
          );
        },
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

  const statusOptions = [
    { label: 'Draft', value: 'Draft' },
    { label: 'Unpaid', value: 'Unpaid' },
    { label: 'Paid', value: 'Paid' },
  ];

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-heading font-bold text-foreground tracking-tight flex items-center gap-2'>
            <FileText className='w-6 h-6 text-primary' /> Master Invoice
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pusat pengelolaan tagihan (Invoice) kepada pelanggan.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Buat Invoice
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
            Invoice
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
                    Pencarian data invoice.
                  </p>
                </div>

                <div className='space-y-3'>
                  <Input
                    label='Nomor Invoice'
                    placeholder='Ketik No Invoice...'
                    value={filterInput.invoice_number}
                    onChange={(e) =>
                      setFilterInput({
                        ...filterInput,
                        invoice_number: e.target.value,
                      })
                    }
                  />
                  <Select
                    label='Status Pembayaran'
                    options={[
                      { label: 'Semua Status', value: 'ALL' },
                      ...statusOptions,
                    ]}
                    value={filterInput.status}
                    onChange={(val) =>
                      setFilterInput({ ...filterInput, status: val })
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
          emptyMessage='Belum ada data invoice.'
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
        title='Detail Invoice'
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
            <div className='flex items-center gap-3 pb-4 border-b border-border/50'>
              <div className='h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary'>
                <FileText className='h-5 w-5' />
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Nomor Invoice</p>
                <p className='text-lg font-bold font-mono text-foreground'>
                  {selectedData.invoice_number || '-'}
                </p>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-y-4 gap-x-6'>
              <div>
                <p className='text-xs text-muted-foreground'>Tanggal</p>
                <p className='font-medium text-sm'>
                  {selectedData.date
                    ? format(new Date(selectedData.date), 'dd MMM yyyy')
                    : '-'}
                </p>
              </div>
              <div>
                <p className='text-xs text-muted-foreground'>Status</p>
                <p className='font-medium text-sm'>
                  {selectedData.status || 'Draft'}
                </p>
              </div>
              <div className='col-span-2'>
                <p className='text-xs text-muted-foreground'>Nama Customer</p>
                <p className='font-bold text-base'>
                  {selectedData.customer_name}
                </p>
              </div>
            </div>

            <div className='bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Subtotal (Amount)</span>
                <span className='font-mono'>
                  Rp {(selectedData.total_amount || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Pajak (Tax)</span>
                <span className='font-mono'>
                  Rp {(selectedData.tax_amount || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className='flex justify-between items-center pt-3 border-t border-primary/20 mt-1'>
                <span className='text-sm font-bold text-foreground'>
                  Grand Total
                </span>
                <span className='text-lg font-bold font-mono text-emerald-600'>
                  Rp {(selectedData.grand_total || 0).toLocaleString('id-ID')}
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
        title={editingId ? 'Edit Invoice' : 'Buat Invoice Baru'}
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
              form='invoice-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        }
      >
        <form
          id='invoice-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-5 py-2'
        >
          <div className='grid grid-cols-2 gap-4'>
            <Input
              label='Nomor Invoice'
              required
              placeholder='INV-2025-001'
              error={form.formState.errors.invoice_number?.message}
              {...form.register('invoice_number')}
            />
            <DatePicker
              label='Tanggal Invoice'
              required
              value={form.watch('date')}
              onChange={(val) => form.setValue('date', val)}
              error={form.formState.errors.date?.message}
            />
          </div>

          <Select
            label='Pilih Customer'
            required
            options={customers}
            value={form.watch('customer_id')}
            onChange={(val) => form.setValue('customer_id', val)}
            error={form.formState.errors.customer_id?.message}
          />

          <div className='bg-muted/30 p-4 rounded-xl border border-border/60 space-y-4'>
            <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider mb-1'>
              Rincian Nominal
            </h3>
            <NumberInput
              label='Total Amount (DPP)'
              required
              value={form.watch('total_amount')}
              onChange={(val) => form.setValue('total_amount', val)}
              error={form.formState.errors.total_amount?.message}
            />
            <NumberInput
              label='Total Pajak (Tax)'
              required
              value={form.watch('tax_amount')}
              onChange={(val) => form.setValue('tax_amount', val)}
              error={form.formState.errors.tax_amount?.message}
            />

            <div className='pt-3 border-t border-border flex justify-between items-center'>
              <span className='text-sm font-semibold uppercase tracking-wider'>
                Grand Total
              </span>
              <span className='text-lg font-mono font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20'>
                Rp {form.watch('grand_total').toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <Select
            label='Status Tagihan'
            required
            options={statusOptions}
            value={form.watch('status') || 'Draft'}
            onChange={(val) => form.setValue('status', val)}
          />
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
              Apakah Anda yakin ingin menghapus data invoice ini? Data ini
              terkait dengan pencatatan akuntansi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              {isDeleting ? 'Menghapus...' : 'Ya, Hapus Invoice'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
