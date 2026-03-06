'use client';

import { useState } from 'react';
import {
  LineChart,
  BarChart3,
  TrendingUp,
  Download,
  Printer,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

export default function LaporanKeuanganPage() {
  const [activeTab, setActiveTab] = useState('labarugi');
  const [periode, setPeriode] = useState('2025-10');

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-border pb-6'>
        <div>
          <h2 className='text-2xl font-heading font-bold flex items-center gap-2'>
            <BarChart3 className='w-6 h-6 text-primary' /> Laporan Keuangan
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Laporan Laba/Rugi, Neraca (Balance Sheet), dan Arus Kas (Cash Flow).
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Input
            type='month'
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            className='w-40'
          />
          <Button variant='outline' className='border-border'>
            <Printer className='w-4 h-4 mr-2' /> Cetak
          </Button>
          <Button className='bg-emerald-600 hover:bg-emerald-700 text-white'>
            <Download className='w-4 h-4 mr-2' /> PDF
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='grid w-full max-w-md grid-cols-3 bg-muted/50 border border-border'>
          <TabsTrigger value='labarugi'>Laba Rugi</TabsTrigger>
          <TabsTrigger value='neraca'>Neraca</TabsTrigger>
          <TabsTrigger value='aruskas'>Arus Kas</TabsTrigger>
        </TabsList>

        {/* TAB: LABA RUGI (Income Statement) */}
        <TabsContent value='labarugi' className='mt-6'>
          <Card className='bg-card border-border shadow-sm max-w-4xl mx-auto'>
            <CardContent className='p-8'>
              <div className='text-center mb-8'>
                <h3 className='font-heading font-bold text-xl uppercase tracking-wider'>
                  Laporan Laba Rugi
                </h3>
                <p className='text-sm text-muted-foreground'>
                  PT. Arto Ageng Abadi
                </p>
                <p className='text-xs text-muted-foreground'>
                  Periode: {periode}
                </p>
              </div>

              <div className='space-y-6 text-sm'>
                {/* PENDAPATAN */}
                <div>
                  <h4 className='font-bold text-primary border-b border-border pb-1 mb-2 uppercase'>
                    Pendapatan
                  </h4>
                  <div className='flex justify-between py-1 text-muted-foreground'>
                    <span>Pendapatan Penjualan Gas CNG</span>{' '}
                    <span className='font-mono'>Rp 1.250.000.000</span>
                  </div>
                  <div className='flex justify-between py-1 text-muted-foreground'>
                    <span>Pendapatan Lain-lain</span>{' '}
                    <span className='font-mono'>Rp 15.000.000</span>
                  </div>
                  <div className='flex justify-between py-2 font-bold mt-1 bg-muted/20 px-2 rounded'>
                    <span>Total Pendapatan</span>{' '}
                    <span className='font-mono'>Rp 1.265.000.000</span>
                  </div>
                </div>

                {/* HPP / BEBAN POKOK PENJUALAN */}
                <div>
                  <h4 className='font-bold text-primary border-b border-border pb-1 mb-2 uppercase'>
                    Harga Pokok Penjualan (HPP)
                  </h4>
                  <div className='flex justify-between py-1 text-muted-foreground'>
                    <span>Pembelian Gas CNG dari Supplier</span>{' '}
                    <span className='font-mono'>Rp 850.000.000</span>
                  </div>
                  <div className='flex justify-between py-1 text-muted-foreground'>
                    <span>Biaya Logistik & Transportasi (GTM)</span>{' '}
                    <span className='font-mono'>Rp 120.000.000</span>
                  </div>
                  <div className='flex justify-between py-2 font-bold mt-1 bg-muted/20 px-2 rounded'>
                    <span>Total HPP</span>{' '}
                    <span className='font-mono text-rose-500'>
                      (Rp 970.000.000)
                    </span>
                  </div>
                </div>

                <div className='flex justify-between py-3 font-bold text-base border-t border-b border-border text-primary'>
                  <span>Laba Kotor</span>{' '}
                  <span className='font-mono'>Rp 295.000.000</span>
                </div>

                {/* BEBAN OPERASIONAL */}
                <div>
                  <h4 className='font-bold text-primary border-b border-border pb-1 mb-2 uppercase'>
                    Beban Operasional
                  </h4>
                  <div className='flex justify-between py-1 text-muted-foreground'>
                    <span>Gaji Karyawan (Payroll)</span>{' '}
                    <span className='font-mono'>Rp 85.000.000</span>
                  </div>
                  <div className='flex justify-between py-1 text-muted-foreground'>
                    <span>Beban Administrasi & Umum</span>{' '}
                    <span className='font-mono'>Rp 25.000.000</span>
                  </div>
                  <div className='flex justify-between py-1 text-muted-foreground'>
                    <span>Beban Penyusutan Aset</span>{' '}
                    <span className='font-mono'>Rp 15.000.000</span>
                  </div>
                  <div className='flex justify-between py-2 font-bold mt-1 bg-muted/20 px-2 rounded'>
                    <span>Total Beban Operasional</span>{' '}
                    <span className='font-mono text-rose-500'>
                      (Rp 125.000.000)
                    </span>
                  </div>
                </div>

                <div className='flex justify-between py-4 mt-4 bg-primary/10 px-4 rounded-lg font-bold text-lg text-primary border border-primary/20 shadow-inner'>
                  <span className='flex items-center gap-2'>
                    <TrendingUp className='w-5 h-5' /> Laba Bersih (Net Profit)
                  </span>
                  <span className='font-mono'>Rp 170.000.000</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: NERACA (Balance Sheet) */}
        <TabsContent value='neraca' className='mt-6'>
          <Card className='bg-card border-border shadow-sm max-w-4xl mx-auto'>
            <CardContent className='p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[400px]'>
              <LineChart className='w-16 h-16 text-muted-foreground/30 mb-4' />
              <p className='font-bold text-foreground'>
                Format Neraca Belum Tersedia
              </p>
              <p className='text-sm'>
                Menunggu referensi format akun Aset, Kewajiban, dan Ekuitas dari
                file Excel LK.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: ARUS KAS (Cash Flow) */}
        <TabsContent value='aruskas' className='mt-6'>
          <Card className='bg-card border-border shadow-sm max-w-4xl mx-auto'>
            <CardContent className='p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[400px]'>
              <BarChart3 className='w-16 h-16 text-muted-foreground/30 mb-4' />
              <p className='font-bold text-foreground'>
                Format Arus Kas Belum Tersedia
              </p>
              <p className='text-sm'>
                Menunggu formula aktivitas Operasi, Investasi, dan Pendanaan
                dari file Excel LK.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
