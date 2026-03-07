'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  AlertCircle,
  RefreshCcw,
  LineChart,
} from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { Tabs } from '@/components/_shared/Tabs';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Halaman Laporan Keuangan (Laba Rugi, Neraca, Arus Kas).
 * Menampilkan ringkasan aktivitas finansial perusahaan.
 *
 * @returns {JSX.Element} Komponen UI halaman Laporan Keuangan
 */
export default function LaporanKeuanganPage() {
  const [periode, setPeriode] = useState('2025-10');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  /**
   * Mengambil data laporan laba rugi dari server berdasarkan periode.
   * Catatan: Karena endpoint laporan belum tersedia di backend, fungsi ini disiapkan menggunakan simulasi fallback.
   *
   * @returns {Promise<void>}
   */
  const fetchLabaRugi = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // TODO: Uncomment baris di bawah ini ketika endpoint laporan di backend sudah siap
      // const res = await api.get(`/v1/reports/income-statement?period=${periode}`);
      // setData(res.data);

      // Simulasi delay & dummy data sementara agar UI tidak kosong (Fallback)
      await new Promise((resolve) => setTimeout(resolve, 800));
      setData({
        pendapatan: {
          penjualan: 1250000000,
          lain: 15000000,
          total: 1265000000,
        },
        hpp: { pembelian: 850000000, logistik: 120000000, total: 970000000 },
        laba_kotor: 295000000,
        beban_ops: {
          payroll: 85000000,
          admin: 25000000,
          penyusutan: 15000000,
          total: 125000000,
        },
        laba_bersih: 170000000,
      });
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data laporan.');
      toast.error('Gagal memuat data laporan');
    } finally {
      setIsLoading(false);
    }
  }, [periode]);

  useEffect(() => {
    fetchLabaRugi();
  }, [fetchLabaRugi]);

  const tabsContent = [
    {
      label: 'Laba Rugi (Income)',
      value: 'labarugi',
      content: (
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

            {isLoading ? (
              <div className='text-center py-10 text-muted-foreground animate-pulse'>
                Memuat laporan...
              </div>
            ) : data ? (
              <div className='space-y-6 text-sm'>
                <div>
                  <h4 className='font-bold text-primary border-b border-border pb-1 mb-2 uppercase'>
                    Pendapatan
                  </h4>
                  <div className='flex justify-between py-1 text-muted-foreground'>
                    <span>Pendapatan Penjualan Gas CNG</span>{' '}
                    <span className='font-mono'>
                      Rp {data.pendapatan.penjualan.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className='flex justify-between py-1 text-muted-foreground'>
                    <span>Pendapatan Lain-lain</span>{' '}
                    <span className='font-mono'>
                      Rp {data.pendapatan.lain.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className='flex justify-between py-2 font-bold mt-1 bg-muted/20 px-2 rounded'>
                    <span>Total Pendapatan</span>{' '}
                    <span className='font-mono'>
                      Rp {data.pendapatan.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className='font-bold text-primary border-b border-border pb-1 mb-2 uppercase'>
                    Harga Pokok Penjualan (HPP)
                  </h4>
                  <div className='flex justify-between py-1 text-muted-foreground'>
                    <span>Pembelian Gas CNG dari Supplier</span>{' '}
                    <span className='font-mono'>
                      Rp {data.hpp.pembelian.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className='flex justify-between py-1 text-muted-foreground'>
                    <span>Biaya Logistik & Transportasi (GTM)</span>{' '}
                    <span className='font-mono'>
                      Rp {data.hpp.logistik.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className='flex justify-between py-2 font-bold mt-1 bg-muted/20 px-2 rounded'>
                    <span>Total HPP</span>{' '}
                    <span className='font-mono text-rose-500'>
                      (Rp {data.hpp.total.toLocaleString('id-ID')})
                    </span>
                  </div>
                </div>

                <div className='flex justify-between py-3 font-bold text-base border-t border-b border-border text-primary'>
                  <span>Laba Kotor</span>{' '}
                  <span className='font-mono'>
                    Rp {data.laba_kotor.toLocaleString('id-ID')}
                  </span>
                </div>

                <div>
                  <h4 className='font-bold text-primary border-b border-border pb-1 mb-2 uppercase'>
                    Beban Operasional
                  </h4>
                  <div className='flex justify-between py-1 text-muted-foreground'>
                    <span>Gaji Karyawan (Payroll)</span>{' '}
                    <span className='font-mono'>
                      Rp {data.beban_ops.payroll.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className='flex justify-between py-1 text-muted-foreground'>
                    <span>Beban Administrasi & Umum</span>{' '}
                    <span className='font-mono'>
                      Rp {data.beban_ops.admin.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className='flex justify-between py-1 text-muted-foreground'>
                    <span>Beban Penyusutan Aset</span>{' '}
                    <span className='font-mono'>
                      Rp {data.beban_ops.penyusutan.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className='flex justify-between py-2 font-bold mt-1 bg-muted/20 px-2 rounded'>
                    <span>Total Beban Operasional</span>{' '}
                    <span className='font-mono text-rose-500'>
                      (Rp {data.beban_ops.total.toLocaleString('id-ID')})
                    </span>
                  </div>
                </div>

                <div className='flex justify-between py-4 mt-4 bg-primary/10 px-4 rounded-lg font-bold text-lg text-primary border border-primary/20 shadow-inner'>
                  <span className='flex items-center gap-2'>
                    <TrendingUp className='w-5 h-5' /> Laba Bersih (Net Profit)
                  </span>
                  <span className='font-mono'>
                    Rp {data.laba_bersih.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ) : (
              <div className='text-center py-10 text-muted-foreground'>
                Data laporan tidak tersedia.
              </div>
            )}
          </CardContent>
        </Card>
      ),
    },
    {
      label: 'Neraca (Balance Sheet)',
      value: 'neraca',
      content: (
        <Card className='bg-card border-border shadow-sm max-w-4xl mx-auto'>
          <CardContent className='p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[400px]'>
            <LineChart className='w-16 h-16 text-muted-foreground/30 mb-4' />
            <p className='font-bold text-foreground'>
              Format Neraca Belum Tersedia
            </p>
            <p className='text-sm'>
              Menunggu API neraca dan referensi format akun dari akuntan.
            </p>
          </CardContent>
        </Card>
      ),
    },
    {
      label: 'Arus Kas (Cash Flow)',
      value: 'aruskas',
      content: (
        <Card className='bg-card border-border shadow-sm max-w-4xl mx-auto'>
          <CardContent className='p-12 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[400px]'>
            <BarChart3 className='w-16 h-16 text-muted-foreground/30 mb-4' />
            <p className='font-bold text-foreground'>
              Format Arus Kas Belum Tersedia
            </p>
            <p className='text-sm'>
              Menunggu API arus kas dan formula aktivitas Operasi, Investasi,
              dan Pendanaan.
            </p>
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-border pb-6'>
        <div>
          <h2 className='text-2xl font-heading font-bold flex items-center gap-2'>
            <BarChart3 className='w-6 h-6 text-primary' /> Laporan Keuangan
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Laporan Laba/Rugi, Neraca, dan Arus Kas.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <div className='w-40'>
            <Input
              type='month'
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
            />
          </div>
          <Button
            variant='outline'
            className='border-border h-9'
            onClick={fetchLabaRugi}
          >
            <RefreshCcw className='w-4 h-4 mr-2' /> Segarkan
          </Button>
          <Button className='bg-emerald-600 hover:bg-emerald-700 text-white h-9 shadow-md'>
            <Download className='w-4 h-4 mr-2' /> Unduh PDF
          </Button>
        </div>
      </div>

      {error && !isLoading && (
        <div className='bg-destructive/10 border border-destructive/20 p-4 rounded-xl flex items-center gap-3'>
          <AlertCircle className='h-5 w-5 text-destructive' />
          <p className='text-sm font-medium text-destructive'>{error}</p>
        </div>
      )}

      <Tabs tabs={tabsContent} defaultValue='labarugi' />
    </div>
  );
}
