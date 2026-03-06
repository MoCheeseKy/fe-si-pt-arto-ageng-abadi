'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Plus,
  Search,
  FileText,
  Download,
  MoreHorizontal,
  FileSignature,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  OfferFormValues,
  KeyTermFormValues,
  PjbgFormValues,
  offerSchema,
  keyTermSchema,
  pjbgSchema,
} from '@/types/kontrak';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function KontrakPenawaranPage() {
  const [activeTab, setActiveTab] = useState('penawaran');

  // Dialog States
  const [openOffer, setOpenOffer] = useState(false);
  const [openKeyTerm, setOpenKeyTerm] = useState(false);
  const [openPjbg, setOpenPjbg] = useState(false);

  // Forms
  const formOffer = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
  });
  const formKeyTerm = useForm<KeyTermFormValues>({
    resolver: zodResolver(keyTermSchema),
    defaultValues: { jenis_harga: 'Flat', sistem_penagihan: 'Top Up' },
  });
  const formPjbg = useForm<PjbgFormValues>({
    resolver: zodResolver(pjbgSchema),
  });

  const watchKeyTermHarga = useWatch({
    control: formKeyTerm.control,
    name: 'jenis_harga',
  });

  const onSubmitOffer = async (data: OfferFormValues) => {
    await new Promise((r) => setTimeout(r, 600));
    toast.success('Dokumen Penawaran berhasil dibuat');
    setOpenOffer(false);
  };

  const onSubmitKeyTerm = async (data: KeyTermFormValues) => {
    await new Promise((r) => setTimeout(r, 600));
    toast.success('Kontrak Key Term berhasil disimpan');
    setOpenKeyTerm(false);
  };

  const onSubmitPjbg = async (data: PjbgFormValues) => {
    await new Promise((r) => setTimeout(r, 600));
    toast.success('Kontrak PJBG berhasil disimpan');
    setOpenPjbg(false);
  };

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div>
        <h2 className='text-2xl font-heading font-bold'>Kontrak & Penawaran</h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Manajemen dokumen legal, kesepakatan harga, dan periode layanan klien.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full grid-cols-3 max-w-md bg-muted/50 border border-border p-1'>
          <TabsTrigger
            value='penawaran'
            className='data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm'
          >
            Penawaran
          </TabsTrigger>
          <TabsTrigger
            value='keyterm'
            className='data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm'
          >
            Key Term
          </TabsTrigger>
          <TabsTrigger
            value='pjbg'
            className='data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm'
          >
            PJBG
          </TabsTrigger>
        </TabsList>

        {/* CONTENT: PENAWARAN */}
        <TabsContent value='penawaran' className='mt-6'>
          <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
            <div className='p-4 border-b border-border bg-muted/20 flex justify-between items-center gap-4'>
              <div className='relative w-full max-w-sm'>
                <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Cari no penawaran...'
                  className='pl-9 bg-background'
                />
              </div>
              <Button
                onClick={() => setOpenOffer(true)}
                className='bg-primary text-white'
              >
                <Plus className='w-4 h-4 mr-2' /> Buat Penawaran
              </Button>
            </div>
            <div className='overflow-x-auto p-4 text-center text-muted-foreground'>
              {/* Tempat Map Tabel Penawaran */}
              <div className='flex flex-col items-center justify-center py-10'>
                <FileText className='w-12 h-12 text-muted-foreground/30 mb-3' />
                <p>Belum ada dokumen penawaran. Buat penawaran pertama Anda.</p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* CONTENT: KEY TERM */}
        <TabsContent value='keyterm' className='mt-6'>
          <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
            <div className='p-4 border-b border-border bg-muted/20 flex justify-between items-center gap-4'>
              <div className='relative w-full max-w-sm'>
                <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Cari customer atau no penawaran...'
                  className='pl-9 bg-background'
                />
              </div>
              <Button
                onClick={() => setOpenKeyTerm(true)}
                className='bg-primary text-white'
              >
                <Plus className='w-4 h-4 mr-2' /> Buat Key Term
              </Button>
            </div>
            <div className='overflow-x-auto'>
              <table className='w-full text-sm text-left'>
                <thead className='bg-muted/40 text-muted-foreground font-heading'>
                  <tr>
                    <th className='px-6 py-4 font-semibold border-b'>
                      Detail Dokumen
                    </th>
                    <th className='px-6 py-4 font-semibold border-b'>
                      Customer & Periode
                    </th>
                    <th className='px-6 py-4 font-semibold border-b'>
                      Volume / Skema
                    </th>
                    <th className='px-6 py-4 font-semibold border-b'>Aksi</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-border'>
                  <tr className='hover:bg-muted/10'>
                    <td className='px-6 py-4'>
                      <div className='font-semibold'>OFF/1025/001</div>
                      <div className='text-xs text-muted-foreground'>
                        Tgl: 24 Okt 2025
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='font-medium text-foreground'>
                        PT. Industri Maju Abadi
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        1 Tahun (Aktif)
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='font-mono text-xs mb-1'>
                        Vol: 45,000 Sm3
                      </div>
                      <Badge
                        variant='outline'
                        className='text-[10px] bg-secondary/10 text-secondary border-secondary/30 mr-1'
                      >
                        Flat
                      </Badge>
                      <Badge
                        variant='outline'
                        className='text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                      >
                        Top Up
                      </Badge>
                    </td>
                    <td className='px-6 py-4'>
                      <Button variant='outline' size='sm' className='h-8'>
                        <Download className='w-3 h-3 mr-2' /> Unduh PDF
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* CONTENT: PJBG */}
        <TabsContent value='pjbg' className='mt-6'>
          <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
            <div className='p-4 border-b border-border bg-muted/20 flex justify-between items-center gap-4'>
              <div className='relative w-full max-w-sm'>
                <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Cari nomor PJBG...'
                  className='pl-9 bg-background'
                />
              </div>
              <Button
                onClick={() => setOpenPjbg(true)}
                className='bg-primary text-white'
              >
                <Plus className='w-4 h-4 mr-2' /> Input PJBG Baru
              </Button>
            </div>
            <div className='overflow-x-auto p-4 text-center text-muted-foreground'>
              <div className='flex flex-col items-center justify-center py-10'>
                <FileSignature className='w-12 h-12 text-muted-foreground/30 mb-3' />
                <p>
                  Belum ada kontrak PJBG. Kontrak ini akan mengikuti template
                  internal.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* DIALOG: PENAWARAN */}
      <Dialog open={openOffer} onOpenChange={setOpenOffer}>
        <DialogContent className='max-w-3xl bg-card max-h-[90vh] overflow-y-auto custom-scrollbar'>
          <DialogHeader>
            <DialogTitle>Buat Dokumen Penawaran Baru</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={formOffer.handleSubmit(onSubmitOffer)}
            className='space-y-4 grid grid-cols-2 gap-4 mt-2'
          >
            <div className='space-y-1 col-span-2 sm:col-span-1'>
              <label className='text-xs'>No Penawaran</label>
              <Input {...formOffer.register('no_penawaran')} />
            </div>
            <div className='space-y-1 col-span-2 sm:col-span-1'>
              <label className='text-xs'>Tanggal</label>
              <Input type='date' {...formOffer.register('tanggal')} />
            </div>
            <div className='space-y-1 col-span-2'>
              <label className='text-xs'>Customer</label>
              <Input
                {...formOffer.register('customer_id')}
                placeholder='Pilih Customer...'
              />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Pelaksanaan</label>
              <Input {...formOffer.register('pelaksanaan')} />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Volume Pemakaian / Bulan (Sm3)</label>
              <Input
                type='number'
                {...formOffer.register('volume_cng_perbulan')}
              />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Std. Spesifikasi GHV</label>
              <Input {...formOffer.register('standar_spesifikasi_ghv')} />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Lokasi Mother Station</label>
              <Input {...formOffer.register('lokasi_mother_station')} />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Harga per Sm3</label>
              <Input
                type='number'
                {...formOffer.register('harga_gas_per_sm3')}
              />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Cara Pembayaran</label>
              <Input {...formOffer.register('cara_pembayaran')} />
            </div>
            <div className='space-y-1 col-span-2'>
              <label className='text-xs'>Harga Termasuk (Include)</label>
              <Input
                {...formOffer.register('harga_termasuk')}
                placeholder='Contoh: PPN 11%, Biaya Transport...'
              />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Periode Kontrak</label>
              <Input {...formOffer.register('periode_kontrak')} />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Waktu Persiapan</label>
              <Input {...formOffer.register('waktu_persiapan')} />
            </div>
            <div className='space-y-1 col-span-2'>
              <label className='text-xs'>Validity</label>
              <Input {...formOffer.register('validity')} />
            </div>
            <DialogFooter className='col-span-2 pt-4'>
              <Button type='submit' className='w-full bg-primary text-white'>
                Generate Penawaran
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: KEY TERM */}
      <Dialog open={openKeyTerm} onOpenChange={setOpenKeyTerm}>
        <DialogContent className='max-w-2xl bg-card'>
          <DialogHeader>
            <DialogTitle>Buat Kontrak Key Term</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={formKeyTerm.handleSubmit(onSubmitKeyTerm)}
            className='space-y-4 grid grid-cols-2 gap-4 mt-2'
          >
            <div className='space-y-1'>
              <label className='text-xs'>No Penawaran Referensi</label>
              <Input {...formKeyTerm.register('no_penawaran')} />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Tanggal Penawaran</label>
              <Input
                type='date'
                {...formKeyTerm.register('tanggal_penawaran')}
              />
            </div>
            <div className='space-y-1 col-span-2'>
              <label className='text-xs'>Customer</label>
              <Input
                {...formKeyTerm.register('customer_id')}
                placeholder='Pilih Customer...'
              />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Volume Kontrak</label>
              <Input type='number' {...formKeyTerm.register('volume')} />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Jangka Waktu</label>
              <Input
                {...formKeyTerm.register('jangka_waktu')}
                placeholder='Contoh: 1 Tahun'
              />
            </div>

            <div className='space-y-1 border-t border-border pt-4 mt-2 col-span-2'>
              <label className='text-xs font-bold text-primary'>
                Skema Harga & Penagihan
              </label>
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Jenis Harga</label>
              <select
                {...formKeyTerm.register('jenis_harga')}
                className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm'
              >
                <option value='Flat'>Flat</option>
                <option value='Tiering'>Tiering</option>
              </select>
            </div>
            {watchKeyTermHarga === 'Flat' && (
              <div className='space-y-1'>
                <label className='text-xs text-amber-500'>
                  MoQ (Minimum Order Quantity)
                </label>
                <Input
                  type='number'
                  {...formKeyTerm.register('moq')}
                  className='border-amber-500/50'
                />
                {formKeyTerm.formState.errors.moq && (
                  <p className='text-[10px] text-destructive'>
                    {formKeyTerm.formState.errors.moq.message}
                  </p>
                )}
              </div>
            )}
            <div className='space-y-1 col-span-2'>
              <label className='text-xs'>Sistem Penagihan</label>
              <select
                {...formKeyTerm.register('sistem_penagihan')}
                className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm'
              >
                <option value='Top Up'>
                  Top Up (Saldo Terpotong Otomatis)
                </option>
                <option value='Deposit'>Deposit (Jaminan Utuh)</option>
              </select>
            </div>
            <DialogFooter className='col-span-2 pt-4'>
              <Button type='submit' className='w-full bg-primary text-white'>
                Simpan Key Term
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: PJBG */}
      <Dialog open={openPjbg} onOpenChange={setOpenPjbg}>
        <DialogContent className='max-w-md bg-card'>
          <DialogHeader>
            <DialogTitle>Input Kontrak PJBG</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={formPjbg.handleSubmit(onSubmitPjbg)}
            className='space-y-4 mt-2'
          >
            <div className='space-y-1'>
              <label className='text-xs'>Nomor PJBG</label>
              <Input {...formPjbg.register('nomor')} />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Customer</label>
              <Input
                {...formPjbg.register('customer_id')}
                placeholder='Pilih Customer...'
              />
            </div>
            <div className='space-y-1'>
              <label className='text-xs'>Jangka Waktu</label>
              <Input {...formPjbg.register('jangka_waktu')} />
            </div>
            <div className='bg-muted/50 p-3 rounded-md border border-border mt-4'>
              <p className='text-xs text-muted-foreground'>
                <FileSignature className='inline w-4 h-4 mr-1' /> Dokumen fisik
                PJBG akan menggunakan template internal perusahaan yang
                dilampirkan terpisah.
              </p>
            </div>
            <DialogFooter className='pt-4'>
              <Button type='submit' className='w-full bg-primary text-white'>
                Simpan PJBG
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
