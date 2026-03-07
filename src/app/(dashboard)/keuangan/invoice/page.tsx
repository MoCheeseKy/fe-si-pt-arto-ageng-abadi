'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  Receipt,
  RefreshCcw,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { format } from 'date-fns';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
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

const invoiceSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  invoice_number: z.string().optional(),
  date: z.string().optional(),
  po_number: z.string().optional(),
  po_date: z.string().optional(),
  period_start: z.string().optional(),
  period_end: z.string().optional(),
  total_usage: z.coerce.number().optional(),
  deposit_deduction: z.coerce.number().optional(),
  total_bill: z.coerce.number().optional(),
  note: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export interface InvoiceRow extends InvoiceFormValues {
  id: string;
  customer_name?: string;
}

const columnHelper = createColumnHelper<InvoiceRow>();

/**
 * Halaman manajemen operasional Invoice (Penagihan).
 * Terintegrasi dengan endpoint /v1/invoices dan /v1/customers.
 *
 * @returns {JSX.Element} Komponen UI halaman Invoice
 */
export default function InvoicePage() {
  const [data, setData] = useState<InvoiceRow[]>([]);
  const [customers, setCustomers] = useState<
    { label: string; value: string }[]
  >([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [globalFilter, setGlobalFilter] = useState('');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customer_id: '',
      invoice_number: '',
      date: new Date().toISOString().split('T')[0],
      po_number: '',
      po_date: '',
      period_start: '',
      period_end: '',
      total_usage: 0,
      deposit_deduction: 0,
      total_bill: 0,
      note: '',
    },
  });

  const watchTotalUsage =
    useWatch({ control: form.control, name: 'total_usage' }) || 0;
  const watchDepositDeduction =
    useWatch({ control: form.control, name: 'deposit_deduction' }) || 0;

  const calculatedTotalBill = useMemo(() => {
    return watchTotalUsage - watchDepositDeduction;
  }, [watchTotalUsage, watchDepositDeduction]);

  useEffect(() => {
    form.setValue(
      'total_bill',
      calculatedTotalBill > 0 ? calculatedTotalBill : 0,
    );
  }, [calculatedTotalBill, form]);

  /**
   * Mengambil data invoice dan customer secara paralel untuk merender tabel dan opsi dropdown.
   *
   * @returns {Promise<void>}
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invoiceRes, custRes] = await Promise.all([
        api.get<any>('/v1/invoices'),
        api.get<any>('/v1/customers'),
      ]);

      const invoiceList = Array.isArray(invoiceRes.data)
        ? invoiceRes.data
        : invoiceRes.data?.rows || [];
      const custList = Array.isArray(custRes.data)
        ? custRes.data
        : custRes.data?.rows || [];

      setCustomers(
        custList.map((c: any) => ({ label: c.company_name, value: c.id })),
      );

      const getCustomerName = (id: string) =>
        custList.find((c: any) => c.id === id)?.company_name ||
        'Unknown Customer';

      const mappedData: InvoiceRow[] = invoiceList.map((item: any) => ({
        ...item,
        customer_name: getCustomerName(item.customer_id),
      }));

      setData(
        mappedData.sort(
          (a, b) =>
            new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
        ),
      );
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data dari server.');
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Menginisialisasi nilai form dan membuka modal untuk pembuatan atau pengubahan data.
   *
   * @param {InvoiceRow} [invoice] - Data invoice yang akan diedit (opsional)
   */
  const handleOpenDialog = (invoice?: InvoiceRow) => {
    if (invoice) {
      setEditingId(invoice.id);
      form.reset({
        ...invoice,
        date: invoice.date
          ? new Date(invoice.date).toISOString().split('T')[0]
          : '',
        po_date: invoice.po_date
          ? new Date(invoice.po_date).toISOString().split('T')[0]
          : '',
        period_start: invoice.period_start
          ? new Date(invoice.period_start).toISOString().split('T')[0]
          : '',
        period_end: invoice.period_end
          ? new Date(invoice.period_end).toISOString().split('T')[0]
          : '',
      });
    } else {
      setEditingId(null);
      form.reset({
        customer_id: '',
        invoice_number: '',
        date: new Date().toISOString().split('T')[0],
        po_number: '',
        po_date: '',
        period_start: '',
        period_end: '',
        total_usage: 0,
        deposit_deduction: 0,
        total_bill: 0,
        note: '',
      });
    }
    setIsDialogOpen(true);
  };

  /**
   * Mengirimkan data form ke endpoint API untuk operasi Create atau Update.
   *
   * @param {InvoiceFormValues} values - Nilai data dari form
   */
  const onSubmit = async (values: InvoiceFormValues) => {
    try {
      const payload = {
        ...values,
        date: values.date || undefined,
        po_date: values.po_date || undefined,
        period_start: values.period_start || undefined,
        period_end: values.period_end || undefined,
      };

      if (editingId) {
        await api.put(`/v1/invoices/${editingId}`, payload);
        toast.success('Invoice berhasil diperbarui.');
      } else {
        await api.post('/v1/invoices', payload);
        toast.success('Invoice baru berhasil diterbitkan.');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan invoice.');
    }
  };

  /**
   * Menghapus data invoice secara permanen melalui endpoint API.
   */
  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/v1/invoices/${deletingId}`);
      toast.success('Invoice berhasil dihapus.');
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
        (item.invoice_number || '')
          .toLowerCase()
          .includes(globalFilter.toLowerCase()) ||
        (item.customer_name || '')
          .toLowerCase()
          .includes(globalFilter.toLowerCase()),
    );
  }, [data, globalFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('invoice_number', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            No. Invoice <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-semibold text-primary'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.accessor('date', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tgl. Terbit <ArrowUpDown className='ml-2 h-3 w-3' />
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
      columnHelper.accessor('customer_name', {
        header: 'Customer',
        cell: (info) => (
          <div className='flex items-center gap-2'>
            <Receipt className='w-4 h-4 text-muted-foreground' />
            <span className='font-medium text-foreground'>
              {info.getValue()}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('period_start', {
        header: 'Periode Pemakaian',
        cell: (info) => {
          const start = info.getValue()
            ? format(new Date(info.getValue()!), 'dd MMM')
            : '-';
          const end = info.row.original.period_end
            ? format(new Date(info.row.original.period_end), 'dd MMM yyyy')
            : '-';
          return (
            <span className='text-xs text-muted-foreground'>
              {start} - {end}
            </span>
          );
        },
      }),
      columnHelper.accessor('total_bill', {
        header: 'Total Tagihan',
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
            Invoice Penagihan
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Penerbitan tagihan gas CNG kepada customer beserta kalkulasi
            potongan deposit.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white shadow-md'
        >
          <Plus className='w-4 h-4 mr-2' /> Terbitkan Invoice
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
            placeholder='Cari No. Invoice atau nama customer...'
            className='w-full sm:max-w-sm'
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          isLoading={isLoading}
          emptyMessage='Tidak ada data invoice.'
        />
      </div>

      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={editingId ? 'Edit Invoice' : 'Terbitkan Invoice Baru'}
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
              form='invoice-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Invoice'}
            </Button>
          </div>
        }
      >
        <form
          id='invoice-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-6 py-2'
        >
          <div className='space-y-4'>
            <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider border-b border-border/60 pb-2'>
              Informasi Dokumen
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
              <Select
                label='Customer'
                required
                options={customers}
                value={form.watch('customer_id')}
                onChange={(val) => form.setValue('customer_id', val)}
                error={form.formState.errors.customer_id?.message}
              />
              <Input
                label='Nomor Invoice'
                placeholder='INV/2026/...'
                error={form.formState.errors.invoice_number?.message}
                {...form.register('invoice_number')}
              />
              <DatePicker
                label='Tanggal Penerbitan'
                value={form.watch('date')}
                onChange={(val) => form.setValue('date', val)}
                error={form.formState.errors.date?.message}
              />
              <div className='grid grid-cols-2 gap-3'>
                <Input
                  label='Nomor PO'
                  placeholder='PO-123'
                  {...form.register('po_number')}
                />
                <DatePicker
                  label='Tanggal PO'
                  value={form.watch('po_date')}
                  onChange={(val) => form.setValue('po_date', val)}
                />
              </div>
            </div>
          </div>

          <div className='space-y-4'>
            <h3 className='text-sm font-bold uppercase text-muted-foreground tracking-wider border-b border-border/60 pb-2'>
              Periode & Tagihan
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
              <DatePicker
                label='Periode Mulai'
                value={form.watch('period_start')}
                onChange={(val) => form.setValue('period_start', val)}
              />
              <DatePicker
                label='Periode Selesai'
                value={form.watch('period_end')}
                onChange={(val) => form.setValue('period_end', val)}
              />

              <NumberInput
                label='Total Nominal Pemakaian (Rp)'
                value={form.watch('total_usage')}
                onChange={(val) => form.setValue('total_usage', val)}
              />
              <NumberInput
                label='Potongan Deposit (Rp)'
                value={form.watch('deposit_deduction')}
                onChange={(val) => form.setValue('deposit_deduction', val)}
                className='text-amber-500'
              />

              <div className='col-span-1 md:col-span-2 bg-primary/5 border border-primary/20 p-4 rounded-xl mt-2'>
                <NumberInput
                  label='Total Tagihan Akhir (Rp)'
                  value={form.watch('total_bill')}
                  onChange={(val) => form.setValue('total_bill', val)}
                  className='text-lg font-bold text-emerald-600'
                  disabled
                />
                <p className='text-[10px] text-muted-foreground mt-2 font-medium'>
                  *Kalkulasi otomatis: Total Pemakaian dikurangi Potongan
                  Deposit.
                </p>
              </div>
            </div>
          </div>

          <Textarea
            label='Catatan Tambahan'
            placeholder='Catatan opsional untuk invoice ini...'
            rows={3}
            {...form.register('note')}
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
              Apakah Anda yakin ingin menghapus invoice ini? Tindakan ini tidak
              dapat dibatalkan.
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
