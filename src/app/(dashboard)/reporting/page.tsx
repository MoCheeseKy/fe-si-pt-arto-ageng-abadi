'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, Download, Filter } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportingPage() {
  const [reportType, setReportType] = useState('pemakaian');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // --- MOCK DATA UNTUK LAPORAN ---
  const dummyDataPemakaian = [
    {
      Tanggal: '2025-10-24',
      Customer: 'PT. Industri Maju',
      Metode: 'Delta Pressure',
      'Volume (Sm3)': 4500,
      MMBTU: 158.2,
      'Total Tagihan': 18500000,
      Mata_Uang: 'IDR',
    },
    {
      Tanggal: '2025-10-25',
      Customer: 'PT. Tekno Pangan',
      Metode: 'EVC',
      'Volume (Sm3)': 2100,
      MMBTU: 0,
      'Total Tagihan': 4500,
      Mata_Uang: 'USD',
    },
  ];

  const dummyDataPengisian = [
    {
      Tanggal: '2025-10-24',
      Supplier: 'PT. Gas Bumi',
      No_DO: 'DO/1024/01',
      Plat_Nomor: 'B 9012 CXY',
      'Volume (MMBTU)': 1450.5,
      'Total Nilai': 45000000,
    },
  ];

  // --- LOGIKA EXPORT SHEETJS ---
  const exportToExcel = () => {
    if (!dateStart || !dateEnd) {
      toast.error('Pilih rentang tanggal terlebih dahulu.');
      return;
    }

    setIsExporting(true);

    try {
      let dataToExport: any[] = [];
      let sheetName = '';
      let fileName = '';

      // Tentukan data berdasarkan jenis laporan yang dipilih
      if (reportType === 'pemakaian') {
        dataToExport = dummyDataPemakaian;
        sheetName = 'Laporan Pemakaian';
        fileName = `Laporan_Pemakaian_Customer_${dateStart}_to_${dateEnd}.xlsx`;
      } else if (reportType === 'pengisian') {
        dataToExport = dummyDataPengisian;
        sheetName = 'Laporan Pengisian';
        fileName = `Laporan_Pengisian_Supplier_${dateStart}_to_${dateEnd}.xlsx`;
      }

      // 1. Buat Worksheet dari JSON
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);

      // (Opsional) Styling lebar kolom
      const wscols = Object.keys(dataToExport[0] || {}).map(() => ({
        wch: 20,
      }));
      worksheet['!cols'] = wscols;

      // 2. Buat Workbook dan append Worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // 3. Trigger Download
      XLSX.writeFile(workbook, fileName);

      toast.success('File Excel berhasil diunduh.');
    } catch (error) {
      console.error(error);
      toast.error('Gagal melakukan export data.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div>
        <h2 className='text-2xl font-heading font-bold flex items-center gap-2'>
          <FileSpreadsheet className='w-6 h-6 text-primary' /> Laporan & Export
        </h2>
        <p className='text-sm text-muted-foreground mt-1'>
          Generate laporan rekapitulasi operasional dan keuangan dalam format
          Excel (.xlsx).
        </p>
      </div>

      <Card className='bg-card border-border shadow-sm max-w-3xl'>
        <CardHeader className='bg-muted/20 border-b border-border pb-4'>
          <CardTitle className='text-lg flex items-center gap-2'>
            <Filter className='w-4 h-4' /> Parameter Laporan
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-6 space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <label className='text-sm font-bold text-foreground'>
                Jenis Laporan
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className='flex h-10 w-full rounded-md border-2 border-primary/50 bg-background px-3 py-1 font-medium text-foreground focus-visible:border-primary focus-visible:outline-none'
              >
                <option value='pemakaian'>
                  Laporan Pemakaian per Customer
                </option>
                <option value='pengisian'>
                  Laporan Pengisian per Supplier
                </option>
                <option value='deposit'>Rekap Deposit Customer</option>
                <option value='keuangan'>Laporan Keuangan (Laba Rugi)</option>
              </select>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-bold text-foreground'>
                Rentang Waktu
              </label>
              <div className='flex items-center gap-2'>
                <Input
                  type='date'
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className='w-full'
                />
                <span className='text-muted-foreground text-xs'>s/d</span>
                <Input
                  type='date'
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className='w-full'
                />
              </div>
            </div>
          </div>

          <div className='p-4 bg-muted/30 border border-border rounded-lg text-sm text-muted-foreground flex items-start gap-3'>
            <div className='mt-0.5'>
              <FileSpreadsheet className='w-5 h-5 text-emerald-500' />
            </div>
            <p>
              Data akan di-export secara raw ke dalam format Microsoft Excel
              menggunakan <strong className='text-foreground'>SheetJS</strong>.
              Pastikan Anda telah memilih rentang waktu yang sesuai agar ukuran
              file tidak terlalu besar.
            </p>
          </div>

          <Button
            onClick={exportToExcel}
            disabled={isExporting}
            className='w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-md h-11 px-8'
          >
            {isExporting ? (
              'Memproses Data...'
            ) : (
              <>
                <Download className='w-4 h-4 mr-2' /> Export to Excel
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
