'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/form/Select';
import { DatePicker } from '@/components/form/DatePicker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportingPage() {
  const [reportType, setReportType] = useState('pemakaian');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const reportOptions = [
    { label: 'Laporan Pemakaian Gas (Customer)', value: 'pemakaian' },
    { label: 'Laporan Pengisian Gas (Supplier)', value: 'pengisian' },
    { label: 'Rekap Tagihan Invoice', value: 'invoice' },
    { label: 'Rekap Pengeluaran Kas (Expenses)', value: 'expense' },
  ];

  const exportToExcel = async () => {
    if (!dateStart || !dateEnd) {
      toast.error('Pilih rentang tanggal terlebih dahulu.');
      return;
    }
    if (new Date(dateStart) > new Date(dateEnd)) {
      toast.error('Tanggal awal tidak boleh lebih besar dari tanggal akhir.');
      return;
    }

    setIsExporting(true);

    try {
      let dataToExport: any[] = [];
      let sheetName = '';
      let fileName = '';

      if (reportType === 'pemakaian') {
        const [dpRes, evcRes, turbinRes] = await Promise.all([
          api.get<any>('/v1/usage-delta-pressures'),
          api.get<any>('/v1/usage-evcs'),
          api.get<any>('/v1/usage-turbines'),
        ]);

        const allUsage = [
          ...(Array.isArray(dpRes.data) ? dpRes.data : dpRes.data?.rows || []),
          ...(Array.isArray(evcRes.data)
            ? evcRes.data
            : evcRes.data?.rows || []),
          ...(Array.isArray(turbinRes.data)
            ? turbinRes.data
            : turbinRes.data?.rows || []),
        ];

        const filtered = allUsage.filter((d) => {
          if (!d.date) return false;
          const tgl = new Date(d.date).toISOString().split('T')[0];
          return tgl >= dateStart && tgl <= dateEnd;
        });

        dataToExport = filtered.map((d) => ({
          'Tanggal': format(new Date(d.date), 'dd/MM/yyyy'),
          'ID Customer': d.customer_id,
          'Metode':
            d.evc_difference_sm3 !== undefined
              ? 'EVC'
              : d.turbine_difference !== undefined
                ? 'Turbin'
                : 'Delta Pressure',
          'Volume (Sm3)': d.total_sm3 || d.evc_difference_sm3 || 0,
          'MMBTU': d.mmbtu || 0,
          'Total Tagihan': d.total_sales || 0,
          'Mata Uang': d.currency || 'IDR',
        }));

        sheetName = 'Lap_Pemakaian';
        fileName = `Laporan_Pemakaian_${dateStart}_${dateEnd}.xlsx`;
      } else if (reportType === 'pengisian') {
        const res = await api.get<any>('/v1/purchases');
        const list = Array.isArray(res.data) ? res.data : res.data?.rows || [];

        const filtered = list.filter((d) => {
          if (!d.date) return false;
          const tgl = new Date(d.date).toISOString().split('T')[0];
          return tgl >= dateStart && tgl <= dateEnd;
        });

        dataToExport = filtered.map((d) => ({
          'Tanggal': format(new Date(d.date), 'dd/MM/yyyy'),
          'Nomor DO': d.do_number || '-',
          'ID Supplier': d.supplier_id,
          'Plat Nomor': d.license_plate,
          'Volume (MMSCF)': d.volume_mmscf,
          'Volume (MMBTU)': d.volume_mmbtu,
          'Total Harga': d.total_sales,
          'Mata Uang': d.currency,
        }));

        sheetName = 'Lap_Pengisian';
        fileName = `Laporan_Pengisian_${dateStart}_${dateEnd}.xlsx`;
      } else if (reportType === 'invoice') {
        const res = await api.get<any>('/v1/invoices');
        const list = Array.isArray(res.data) ? res.data : res.data?.rows || [];

        const filtered = list.filter((d) => {
          if (!d.date) return false;
          const tgl = new Date(d.date).toISOString().split('T')[0];
          return tgl >= dateStart && tgl <= dateEnd;
        });

        dataToExport = filtered.map((d) => ({
          'Tanggal Terbit': format(new Date(d.date), 'dd/MM/yyyy'),
          'No. Invoice': d.invoice_number,
          'ID Customer': d.customer_id,
          'Pemakaian Kotor': d.total_usage,
          'Potongan Deposit': d.deposit_deduction,
          'Tagihan Bersih': d.total_bill,
        }));

        sheetName = 'Lap_Invoice';
        fileName = `Laporan_Invoice_${dateStart}_${dateEnd}.xlsx`;
      } else if (reportType === 'expense') {
        const res = await api.get<any>('/v1/expenses');
        const list = Array.isArray(res.data) ? res.data : res.data?.rows || [];

        const filtered = list.filter((d) => {
          if (!d.date) return false;
          const tgl = new Date(d.date).toISOString().split('T')[0];
          return tgl >= dateStart && tgl <= dateEnd;
        });

        dataToExport = filtered.map((d) => ({
          'Tanggal': format(new Date(d.date), 'dd/MM/yyyy'),
          'Tipe': d.expense_type,
          'Deskripsi': d.description,
          'Total Pengeluaran': d.total,
          'Metode Pembayaran': d.payment_method,
        }));

        sheetName = 'Lap_Pengeluaran';
        fileName = `Laporan_Pengeluaran_${dateStart}_${dateEnd}.xlsx`;
      }

      if (dataToExport.length === 0) {
        toast.info('Tidak ada data ditemukan pada rentang tanggal tersebut.');
        setIsExporting(false);
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const wscols = Object.keys(dataToExport[0]).map(() => ({ wch: 20 }));
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      XLSX.writeFile(workbook, fileName);

      toast.success('File Excel berhasil diunduh.');
    } catch (error) {
      console.error(error);
      toast.error('Gagal melakukan penarikan data dari server.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div>
        <h2 className='text-2xl font-heading font-bold flex items-center gap-2 text-foreground tracking-tight'>
          <FileSpreadsheet className='w-6 h-6 text-primary' /> Laporan & Export
          Data
        </h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Tarik data operasional dan keuangan dari database dan ekspor ke format
          Microsoft Excel (.xlsx).
        </p>
      </div>

      <Card className='bg-card border-border shadow-soft-depth max-w-3xl overflow-hidden'>
        <CardHeader className='bg-muted/10 border-b border-border pb-4'>
          <CardTitle className='text-lg flex items-center gap-2'>
            <Filter className='w-4 h-4 text-primary' /> Parameter Ekstraksi Data
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-6 space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Select
              label='Jenis Laporan (Sumber Modul)'
              options={reportOptions}
              value={reportType}
              onChange={(val) => setReportType(val)}
            />
            <div className='space-y-1.5 w-full'>
              <label className='text-xs font-bold text-foreground uppercase tracking-wider'>
                Rentang Waktu
              </label>
              <div className='flex items-center gap-2 pt-1'>
                <div className='w-full'>
                  <DatePicker
                    value={dateStart}
                    onChange={(val) => setDateStart(val)}
                    placeholder='Tgl Awal'
                  />
                </div>
                <span className='text-muted-foreground text-xs font-semibold'>
                  s/d
                </span>
                <div className='w-full'>
                  <DatePicker
                    value={dateEnd}
                    onChange={(val) => setDateEnd(val)}
                    placeholder='Tgl Akhir'
                  />
                </div>
              </div>
            </div>
          </div>

          <div className='p-4 bg-muted/30 border border-border rounded-xl text-sm text-muted-foreground flex items-start gap-3'>
            <div className='mt-0.5'>
              <FileSpreadsheet className='w-5 h-5 text-emerald-500' />
            </div>
            <p className='leading-relaxed'>
              Sistem akan memanggil data mentah secara <i>live</i> dari
              database. Data dapat diolah kembali menggunakan PivotTable di
              Excel.
            </p>
          </div>

          <div className='pt-2 border-t border-border/50'>
            <Button
              onClick={exportToExcel}
              disabled={isExporting}
              className='w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-md h-11 px-8 font-bold tracking-wide'
            >
              {isExporting ? (
                'Memproses Data...'
              ) : (
                <>
                  <Download className='w-4 h-4 mr-2' /> Export to Excel (.xlsx)
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
