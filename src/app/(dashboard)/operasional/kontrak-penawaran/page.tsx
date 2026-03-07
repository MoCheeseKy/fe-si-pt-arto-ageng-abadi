'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createColumnHelper } from '@tanstack/react-table';
import {
  Plus,
  FileText,
  AlertCircle,
  RefreshCcw,
  ArrowUpDown,
  FileSignature,
  KeySquare,
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
import { DataTable } from '@/components/_shared/DataTable';
import { Modal } from '@/components/_shared/Modal';
import { TableActions } from '@/components/_shared/TableActions';
import { Tabs } from '@/components/_shared/Tabs';
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

const offerSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  offer_number: z.string().optional(),
  date: z.string().optional(),
  implementation: z.string().optional(),
  monthly_cng_usage_volume: z.coerce.number().optional(),
  standard_ghv_specification: z.string().optional(),
  cng_mother_station_location: z.string().optional(),
  cng_gas_price_per_sm3: z.coerce.number().optional(),
  payment_method: z.string().optional(),
  price_includes: z.string().optional(),
  contract_period: z.string().optional(),
  preparation_time: z.string().optional(),
  validity: z.string().optional(),
});

const pjbgSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  contract_number: z.string().optional(),
  duration: z.string().optional(),
});

const keyTermSchema = z.object({
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  offer_number: z.string().optional(),
  offer_date: z.string().optional(),
  volume: z.coerce.number().optional(),
  duration: z.string().optional(),
  price_type: z.string().optional(),
  moq: z.coerce.number().optional(),
  billing_type: z.string().optional(),
});

type OfferFormValues = z.infer<typeof offerSchema>;
type PjbgFormValues = z.infer<typeof pjbgSchema>;
type KeyTermFormValues = z.infer<typeof keyTermSchema>;

export interface OfferRow extends OfferFormValues {
  id: string;
  customer_name?: string;
}
export interface PjbgRow extends PjbgFormValues {
  id: string;
  customer_name?: string;
}
export interface KeyTermRow extends KeyTermFormValues {
  id: string;
  customer_name?: string;
}

const offerHelper = createColumnHelper<OfferRow>();
const pjbgHelper = createColumnHelper<PjbgRow>();
const keyTermHelper = createColumnHelper<KeyTermRow>();

/**
 * Halaman manajemen operasional Kontrak & Penawaran.
 * Menampilkan data Penawaran, Kontrak PJBG, dan Key Terms menggunakan antarmuka Tabs.
 *
 * @returns {JSX.Element} Komponen UI halaman Kontrak & Penawaran
 */
export default function KontrakPenawaranPage() {
  const [customers, setCustomers] = useState<
    { label: string; value: string }[]
  >([]);

  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [pjbgs, setPjbgs] = useState<PjbgRow[]>([]);
  const [keyTerms, setKeyTerms] = useState<KeyTermRow[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [offerSearch, setOfferSearch] = useState('');
  const [pjbgSearch, setPjbgSearch] = useState('');
  const [keyTermSearch, setKeyTermSearch] = useState('');

  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerEditId, setOfferEditId] = useState<string | null>(null);

  const [isPjbgModalOpen, setIsPjbgModalOpen] = useState(false);
  const [pjbgEditId, setPjbgEditId] = useState<string | null>(null);

  const [isKeyTermModalOpen, setIsKeyTermModalOpen] = useState(false);
  const [keyTermEditId, setKeyTermEditId] = useState<string | null>(null);

  const [deletingRecord, setDeletingRecord] = useState<{
    id: string;
    type: 'offer' | 'pjbg' | 'keyterm';
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const offerForm = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema as any),
  });
  const pjbgForm = useForm<PjbgFormValues>({
    resolver: zodResolver(pjbgSchema as any),
  });
  const keyTermForm = useForm<KeyTermFormValues>({
    resolver: zodResolver(keyTermSchema as any),
  });

  /**
   * Mengambil seluruh data relasional yang dibutuhkan secara paralel.
   *
   * @returns {Promise<void>}
   */
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [custRes, offerRes, pjbgRes, ktRes] = await Promise.all([
        api.get<any>('/v1/customers'),
        api.get<any>('/v1/offers'),
        api.get<any>('/v1/contract-pjbgs'),
        api.get<any>('/v1/contract-key-terms'),
      ]);

      const custList = Array.isArray(custRes.data)
        ? custRes.data
        : custRes.data?.rows || [];
      setCustomers(
        custList.map((c: any) => ({ label: c.company_name, value: c.id })),
      );

      const getCustomerName = (id: string) =>
        custList.find((c: any) => c.id === id)?.company_name || 'Unknown';

      const mapData = (data: any[]) =>
        data.map((item: any) => ({
          ...item,
          customer_name: getCustomerName(item.customer_id),
        }));

      setOffers(
        mapData(
          Array.isArray(offerRes.data)
            ? offerRes.data
            : offerRes.data?.rows || [],
        ),
      );
      setPjbgs(
        mapData(
          Array.isArray(pjbgRes.data) ? pjbgRes.data : pjbgRes.data?.rows || [],
        ),
      );
      setKeyTerms(
        mapData(
          Array.isArray(ktRes.data) ? ktRes.data : ktRes.data?.rows || [],
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
   * Menangani submit untuk entitas Penawaran (Offer).
   *
   * @param {OfferFormValues} values - Data form penawaran
   */
  const onOfferSubmit = async (values: OfferFormValues) => {
    try {
      if (offerEditId) {
        await api.put(`/v1/offers/${offerEditId}`, values);
        toast.success('Penawaran berhasil diperbarui.');
      } else {
        await api.post('/v1/offers', values);
        toast.success('Penawaran baru berhasil ditambahkan.');
      }
      setIsOfferModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan penawaran.');
    }
  };

  /**
   * Menangani submit untuk entitas Kontrak PJBG.
   *
   * @param {PjbgFormValues} values - Data form PJBG
   */
  const onPjbgSubmit = async (values: PjbgFormValues) => {
    try {
      if (pjbgEditId) {
        await api.put(`/v1/contract-pjbgs/${pjbgEditId}`, values);
        toast.success('Kontrak PJBG berhasil diperbarui.');
      } else {
        await api.post('/v1/contract-pjbgs', values);
        toast.success('Kontrak PJBG baru berhasil ditambahkan.');
      }
      setIsPjbgModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan kontrak PJBG.');
    }
  };

  /**
   * Menangani submit untuk entitas Key Term.
   *
   * @param {KeyTermFormValues} values - Data form Key Term
   */
  const onKeyTermSubmit = async (values: KeyTermFormValues) => {
    try {
      if (keyTermEditId) {
        await api.put(`/v1/contract-key-terms/${keyTermEditId}`, values);
        toast.success('Key Term berhasil diperbarui.');
      } else {
        await api.post('/v1/contract-key-terms', values);
        toast.success('Key Term baru berhasil ditambahkan.');
      }
      setIsKeyTermModalOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan Key Term.');
    }
  };

  /**
   * Menghapus rekaman berdasarkan tipe entitas yang dipilih.
   */
  const handleDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    let endpoint = '';
    if (deletingRecord.type === 'offer') endpoint = '/v1/offers';
    else if (deletingRecord.type === 'pjbg') endpoint = '/v1/contract-pjbgs';
    else endpoint = '/v1/contract-key-terms';

    try {
      await api.delete(`${endpoint}/${deletingRecord.id}`);
      toast.success('Data berhasil dihapus.');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data.');
    } finally {
      setIsDeleting(false);
      setDeletingRecord(null);
    }
  };

  // --- FILTER LOGIC ---
  const filteredOffers = useMemo(
    () =>
      offers.filter((o) =>
        (o.offer_number || '')
          .toLowerCase()
          .includes(offerSearch.toLowerCase()),
      ),
    [offers, offerSearch],
  );
  const filteredPjbgs = useMemo(
    () =>
      pjbgs.filter((p) =>
        (p.contract_number || '')
          .toLowerCase()
          .includes(pjbgSearch.toLowerCase()),
      ),
    [pjbgs, pjbgSearch],
  );
  const filteredKeyTerms = useMemo(
    () =>
      keyTerms.filter((k) =>
        (k.offer_number || '')
          .toLowerCase()
          .includes(keyTermSearch.toLowerCase()),
      ),
    [keyTerms, keyTermSearch],
  );

  // --- COLUMNS ---
  const offerColumns = useMemo(
    () => [
      offerHelper.accessor('offer_number', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            No. Penawaran <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-semibold text-primary'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      offerHelper.accessor('date', {
        header: 'Tanggal',
        cell: (info) => (
          <span className='text-muted-foreground'>
            {info.getValue()
              ? format(new Date(info.getValue()!), 'dd MMM yyyy')
              : '-'}
          </span>
        ),
      }),
      offerHelper.accessor('customer_name', {
        header: 'Customer',
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      offerHelper.accessor('monthly_cng_usage_volume', {
        header: 'Vol. Bulanan',
        cell: (info) => (
          <span className='font-mono'>
            {info.getValue()?.toLocaleString('id-ID') || 0}
          </span>
        ),
      }),
      offerHelper.display({
        id: 'actions',
        header: () => <div className='text-right'>Aksi</div>,
        cell: (info) => (
          <TableActions
            onEdit={() => {
              setOfferEditId(info.row.original.id);
              offerForm.reset({
                ...info.row.original,
                date: info.row.original.date
                  ? new Date(info.row.original.date).toISOString().split('T')[0]
                  : '',
              });
              setIsOfferModalOpen(true);
            }}
            onDelete={() =>
              setDeletingRecord({ id: info.row.original.id, type: 'offer' })
            }
          />
        ),
      }),
    ],
    [offerForm],
  );

  const pjbgColumns = useMemo(
    () => [
      pjbgHelper.accessor('contract_number', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            No. Kontrak <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-semibold text-primary'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      pjbgHelper.accessor('customer_name', {
        header: 'Customer',
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      pjbgHelper.accessor('duration', {
        header: 'Durasi Kontrak',
        cell: (info) => <span>{info.getValue() || '-'}</span>,
      }),
      pjbgHelper.display({
        id: 'actions',
        header: () => <div className='text-right'>Aksi</div>,
        cell: (info) => (
          <TableActions
            onEdit={() => {
              setPjbgEditId(info.row.original.id);
              pjbgForm.reset(info.row.original);
              setIsPjbgModalOpen(true);
            }}
            onDelete={() =>
              setDeletingRecord({ id: info.row.original.id, type: 'pjbg' })
            }
          />
        ),
      }),
    ],
    [pjbgForm],
  );

  const keyTermColumns = useMemo(
    () => [
      keyTermHelper.accessor('offer_number', {
        header: ({ column }) => (
          <Button
            variant='ghost'
            className='p-0 h-auto font-bold uppercase hover:bg-transparent'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Ref. Penawaran <ArrowUpDown className='ml-2 h-3 w-3' />
          </Button>
        ),
        cell: (info) => (
          <span className='font-mono font-semibold text-primary'>
            {info.getValue() || '-'}
          </span>
        ),
      }),
      keyTermHelper.accessor('customer_name', {
        header: 'Customer',
        cell: (info) => (
          <span className='font-medium text-foreground'>{info.getValue()}</span>
        ),
      }),
      keyTermHelper.accessor('volume', {
        header: 'Volume',
        cell: (info) => (
          <span className='font-mono text-emerald-500'>
            {info.getValue()?.toLocaleString('id-ID') || 0}
          </span>
        ),
      }),
      keyTermHelper.accessor('price_type', {
        header: 'Tipe Harga',
        cell: (info) => <span>{info.getValue() || '-'}</span>,
      }),
      keyTermHelper.display({
        id: 'actions',
        header: () => <div className='text-right'>Aksi</div>,
        cell: (info) => (
          <TableActions
            onEdit={() => {
              setKeyTermEditId(info.row.original.id);
              keyTermForm.reset({
                ...info.row.original,
                offer_date: info.row.original.offer_date
                  ? new Date(info.row.original.offer_date)
                      .toISOString()
                      .split('T')[0]
                  : '',
              });
              setIsKeyTermModalOpen(true);
            }}
            onDelete={() =>
              setDeletingRecord({ id: info.row.original.id, type: 'keyterm' })
            }
          />
        ),
      }),
    ],
    [keyTermForm],
  );

  const tabsContent = [
    {
      label: 'Penawaran (Offer)',
      value: 'offer',
      content: (
        <div className='space-y-4'>
          <div className='flex flex-col sm:flex-row justify-between gap-4 p-4 bg-muted/20 border border-border rounded-t-xl'>
            <SearchInput
              value={offerSearch}
              onChange={(e) => setOfferSearch(e.target.value)}
              placeholder='Cari No. Penawaran...'
            />
            <Button
              onClick={() => {
                setOfferEditId(null);
                offerForm.reset({});
                setIsOfferModalOpen(true);
              }}
              className='bg-primary hover:bg-primary/90 text-white'
            >
              <Plus className='w-4 h-4 mr-2' /> Buat Penawaran
            </Button>
          </div>
          <DataTable
            columns={offerColumns as any}
            data={filteredOffers}
            isLoading={isLoading}
            emptyMessage='Belum ada data penawaran.'
          />
        </div>
      ),
    },
    {
      label: 'Kontrak PJBG',
      value: 'pjbg',
      content: (
        <div className='space-y-4'>
          <div className='flex flex-col sm:flex-row justify-between gap-4 p-4 bg-muted/20 border border-border rounded-t-xl'>
            <SearchInput
              value={pjbgSearch}
              onChange={(e) => setPjbgSearch(e.target.value)}
              placeholder='Cari No. Kontrak...'
            />
            <Button
              onClick={() => {
                setPjbgEditId(null);
                pjbgForm.reset({});
                setIsPjbgModalOpen(true);
              }}
              className='bg-primary hover:bg-primary/90 text-white'
            >
              <Plus className='w-4 h-4 mr-2' /> Tambah PJBG
            </Button>
          </div>
          <DataTable
            columns={pjbgColumns as any}
            data={filteredPjbgs}
            isLoading={isLoading}
            emptyMessage='Belum ada data Kontrak PJBG.'
          />
        </div>
      ),
    },
    {
      label: 'Key Terms',
      value: 'keyterm',
      content: (
        <div className='space-y-4'>
          <div className='flex flex-col sm:flex-row justify-between gap-4 p-4 bg-muted/20 border border-border rounded-t-xl'>
            <SearchInput
              value={keyTermSearch}
              onChange={(e) => setKeyTermSearch(e.target.value)}
              placeholder='Cari Ref. Penawaran...'
            />
            <Button
              onClick={() => {
                setKeyTermEditId(null);
                keyTermForm.reset({});
                setIsKeyTermModalOpen(true);
              }}
              className='bg-primary hover:bg-primary/90 text-white'
            >
              <Plus className='w-4 h-4 mr-2' /> Tambah Key Term
            </Button>
          </div>
          <DataTable
            columns={keyTermColumns as any}
            data={filteredKeyTerms}
            isLoading={isLoading}
            emptyMessage='Belum ada data Key Terms.'
          />
        </div>
      ),
    },
  ];

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col gap-1'>
        <h2 className='text-2xl font-heading font-bold text-foreground tracking-tight'>
          Kontrak & Penawaran
        </h2>
        <p className='text-sm text-muted-foreground'>
          Manajemen dokumen penawaran harga, kontrak PJBG, dan Key Terms
          pelanggan.
        </p>
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

      <div className='bg-card border border-border rounded-xl shadow-soft-depth overflow-hidden p-2'>
        <Tabs tabs={tabsContent} defaultValue='offer' />
      </div>

      {/* MODAL OFFER */}
      <Modal
        isOpen={isOfferModalOpen}
        onClose={() => setIsOfferModalOpen(false)}
        title={offerEditId ? 'Edit Penawaran' : 'Buat Penawaran Baru'}
        size='xl'
        footer={
          <div className='flex justify-end gap-3 w-full'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setIsOfferModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type='submit'
              form='offer-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={offerForm.formState.isSubmitting}
            >
              {offerForm.formState.isSubmitting
                ? 'Menyimpan...'
                : 'Simpan Penawaran'}
            </Button>
          </div>
        }
      >
        <form
          id='offer-form'
          onSubmit={offerForm.handleSubmit(onOfferSubmit)}
          className='space-y-6 py-2'
        >
          <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
            <Select
              label='Customer'
              required
              options={customers}
              value={offerForm.watch('customer_id')}
              onChange={(val) => offerForm.setValue('customer_id', val)}
              error={offerForm.formState.errors.customer_id?.message}
            />
            <Input
              label='Nomor Penawaran'
              placeholder='OFF/2026/...'
              error={offerForm.formState.errors.offer_number?.message}
              {...offerForm.register('offer_number')}
            />
            <DatePicker
              label='Tanggal Penawaran'
              value={offerForm.watch('date')}
              onChange={(val) => offerForm.setValue('date', val)}
            />
            <Input
              label='Implementasi'
              placeholder='Deskripsi implementasi'
              {...offerForm.register('implementation')}
            />
            <NumberInput
              label='Estimasi Volume Bulanan'
              value={offerForm.watch('monthly_cng_usage_volume')}
              onChange={(val) =>
                offerForm.setValue('monthly_cng_usage_volume', val)
              }
            />
            <NumberInput
              label='Harga Gas per Sm3 (IDR)'
              value={offerForm.watch('cng_gas_price_per_sm3')}
              onChange={(val) =>
                offerForm.setValue('cng_gas_price_per_sm3', val)
              }
              className='text-emerald-500'
            />
            <Input
              label='Spesifikasi Standar GHV'
              placeholder='Contoh: 1000 BTU/scf'
              {...offerForm.register('standard_ghv_specification')}
            />
            <Input
              label='Lokasi Mother Station'
              placeholder='Lokasi stasiun pengisian'
              {...offerForm.register('cng_mother_station_location')}
            />
            <Input
              label='Metode Pembayaran'
              placeholder='Contoh: Net 30 Days'
              {...offerForm.register('payment_method')}
            />
            <Input
              label='Durasi Kontrak'
              placeholder='Contoh: 1 Tahun'
              {...offerForm.register('contract_period')}
            />
            <Input
              label='Waktu Persiapan'
              placeholder='Contoh: 2 Minggu'
              {...offerForm.register('preparation_time')}
            />
            <Input
              label='Masa Berlaku Penawaran'
              placeholder='Contoh: 14 Hari'
              {...offerForm.register('validity')}
            />
          </div>
          <Input
            label='Harga Termasuk (Price Includes)'
            placeholder='Deskripsi apa saja yang termasuk dalam harga'
            {...offerForm.register('price_includes')}
          />
        </form>
      </Modal>

      {/* MODAL PJBG */}
      <Modal
        isOpen={isPjbgModalOpen}
        onClose={() => setIsPjbgModalOpen(false)}
        title={pjbgEditId ? 'Edit Kontrak PJBG' : 'Tambah Kontrak PJBG'}
        size='md'
        footer={
          <div className='flex justify-end gap-3 w-full'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setIsPjbgModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type='submit'
              form='pjbg-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={pjbgForm.formState.isSubmitting}
            >
              {pjbgForm.formState.isSubmitting
                ? 'Menyimpan...'
                : 'Simpan Kontrak'}
            </Button>
          </div>
        }
      >
        <form
          id='pjbg-form'
          onSubmit={pjbgForm.handleSubmit(onPjbgSubmit)}
          className='space-y-5 py-2'
        >
          <Select
            label='Customer'
            required
            options={customers}
            value={pjbgForm.watch('customer_id')}
            onChange={(val) => pjbgForm.setValue('customer_id', val)}
            error={pjbgForm.formState.errors.customer_id?.message}
          />
          <Input
            label='Nomor Kontrak'
            placeholder='PJBG/2026/...'
            error={pjbgForm.formState.errors.contract_number?.message}
            {...pjbgForm.register('contract_number')}
          />
          <Input
            label='Durasi Kontrak'
            placeholder='Contoh: 2 Tahun'
            error={pjbgForm.formState.errors.duration?.message}
            {...pjbgForm.register('duration')}
          />
        </form>
      </Modal>

      {/* MODAL KEY TERM */}
      <Modal
        isOpen={isKeyTermModalOpen}
        onClose={() => setIsKeyTermModalOpen(false)}
        title={keyTermEditId ? 'Edit Key Term' : 'Tambah Key Term'}
        size='lg'
        footer={
          <div className='flex justify-end gap-3 w-full'>
            <Button
              type='button'
              variant='ghost'
              onClick={() => setIsKeyTermModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type='submit'
              form='keyterm-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={keyTermForm.formState.isSubmitting}
            >
              {keyTermForm.formState.isSubmitting
                ? 'Menyimpan...'
                : 'Simpan Key Term'}
            </Button>
          </div>
        }
      >
        <form
          id='keyterm-form'
          onSubmit={keyTermForm.handleSubmit(onKeyTermSubmit)}
          className='grid grid-cols-1 md:grid-cols-2 gap-5 py-2'
        >
          <div className='col-span-1 md:col-span-2'>
            <Select
              label='Customer'
              required
              options={customers}
              value={keyTermForm.watch('customer_id')}
              onChange={(val) => keyTermForm.setValue('customer_id', val)}
              error={keyTermForm.formState.errors.customer_id?.message}
            />
          </div>
          <Input
            label='Nomor Penawaran (Ref)'
            placeholder='OFF/...'
            {...keyTermForm.register('offer_number')}
          />
          <DatePicker
            label='Tanggal Penawaran'
            value={keyTermForm.watch('offer_date')}
            onChange={(val) => keyTermForm.setValue('offer_date', val)}
          />
          <NumberInput
            label='Volume'
            value={keyTermForm.watch('volume')}
            onChange={(val) => keyTermForm.setValue('volume', val)}
          />
          <NumberInput
            label='MOQ (Minimum Order Quantity)'
            value={keyTermForm.watch('moq')}
            onChange={(val) => keyTermForm.setValue('moq', val)}
          />
          <Input
            label='Tipe Harga'
            placeholder='Contoh: Fixed'
            {...keyTermForm.register('price_type')}
          />
          <Input
            label='Durasi'
            placeholder='Contoh: 6 Bulan'
            {...keyTermForm.register('duration')}
          />
          <div className='col-span-1 md:col-span-2'>
            <Input
              label='Tipe Penagihan (Billing Type)'
              placeholder='Contoh: Monthly'
              {...keyTermForm.register('billing_type')}
            />
          </div>
        </form>
      </Modal>

      {/* ALERT DIALOG DELETE GLOBAL */}
      <AlertDialog
        open={!!deletingRecord}
        onOpenChange={(open) => !open && setDeletingRecord(null)}
      >
        <AlertDialogContent className='bg-card border-border'>
          <AlertDialogHeader>
            <AlertDialogTitle className='text-destructive flex items-center gap-2'>
              <AlertCircle className='h-5 w-5' /> Konfirmasi Penghapusan
            </AlertDialogTitle>
            <AlertDialogDescription className='text-muted-foreground'>
              Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak
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
