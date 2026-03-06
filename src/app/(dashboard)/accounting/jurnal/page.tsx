'use client';

import { useState } from 'react';
import { Search, FileText, Plus } from 'lucide-react';

import { Journal } from '@/types/accounting';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const dummyJournals: Journal[] = [
  {
    id: 'JRN-2510-001',
    transaction_date: '2025-10-25',
    reference_id: 'INV/AAA/1025/001',
    description: 'Pengakuan Piutang Tagihan PT. Industri Maju Abadi',
    source_module: 'Invoice',
    total_debit: 45000000,
    total_credit: 45000000,
    entries: [
      {
        account_code: '1130',
        account_name: 'Piutang Usaha',
        debit: 45000000,
        credit: 0,
      },
      {
        account_code: '4110',
        account_name: 'Pendapatan Penjualan Gas',
        debit: 0,
        credit: 45000000,
      },
    ],
  },
  {
    id: 'JRN-2510-002',
    transaction_date: '2025-10-25',
    reference_id: 'EXP-089',
    description: 'Beban Bensin GTM Driver Ahmad',
    source_module: 'Pengeluaran',
    total_debit: 1500000,
    total_credit: 1500000,
    entries: [
      {
        account_code: '5110',
        account_name: 'Beban Operasional Transportasi',
        debit: 1500000,
        credit: 0,
      },
      {
        account_code: '1110',
        account_name: 'Kas Tunai',
        debit: 0,
        credit: 1500000,
      },
    ],
  },
];

export default function JurnalPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredJournals = dummyJournals.filter(
    (j) =>
      j.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      j.reference_id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-heading font-bold flex items-center gap-2'>
            <FileText className='w-6 h-6 text-primary' /> Jurnal Umum
            (Auto-Journal)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Pencatatan double-entry yang ditarik otomatis dari transaksi.
          </p>
        </div>
        <Button className='bg-primary text-white'>
          <Plus className='w-4 h-4 mr-2' /> Entri Manual
        </Button>
      </div>

      <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
        <div className='p-4 border-b border-border bg-muted/20'>
          <Input
            placeholder='Cari deskripsi atau ID referensi...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='max-w-sm bg-background'
          />
        </div>

        <div className='p-6 space-y-8 bg-background/50'>
          {filteredJournals.map((journal) => (
            <div
              key={journal.id}
              className='border border-border rounded-lg bg-card overflow-hidden shadow-sm'
            >
              <div className='bg-muted/40 p-4 border-b border-border flex flex-col sm:flex-row justify-between sm:items-center gap-2'>
                <div>
                  <h3 className='font-bold text-foreground'>
                    {journal.description}
                  </h3>
                  <div className='text-xs text-muted-foreground flex items-center gap-3 mt-1'>
                    <span>Tgl: {journal.transaction_date}</span>
                    <span>
                      Ref:{' '}
                      <span className='text-primary font-mono'>
                        {journal.reference_id}
                      </span>
                    </span>
                  </div>
                </div>
                <Badge
                  variant='outline'
                  className='bg-background text-xs text-muted-foreground w-fit'
                >
                  {journal.source_module}
                </Badge>
              </div>

              <div className='overflow-x-auto'>
                <table className='w-full text-sm'>
                  <thead className='bg-muted/10 text-muted-foreground border-b border-border text-left'>
                    <tr>
                      <th className='px-4 py-2 w-24'>Kode</th>
                      <th className='px-4 py-2'>Nama Akun</th>
                      <th className='px-4 py-2 text-right w-32'>Debit (Rp)</th>
                      <th className='px-4 py-2 text-right w-32'>Kredit (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-border'>
                    {journal.entries.map((entry, idx) => (
                      <tr key={idx} className='hover:bg-muted/5'>
                        <td className='px-4 py-3 font-mono text-xs'>
                          {entry.account_code}
                        </td>
                        {/* Memberikan indentasi visual pada akun kredit untuk estetik standar akuntansi */}
                        <td
                          className={`px-4 py-3 ${entry.credit > 0 ? 'pl-8 text-muted-foreground' : 'font-medium'}`}
                        >
                          {entry.account_name}
                        </td>
                        <td className='px-4 py-3 text-right font-mono'>
                          {entry.debit > 0
                            ? entry.debit.toLocaleString('id-ID')
                            : '-'}
                        </td>
                        <td className='px-4 py-3 text-right font-mono'>
                          {entry.credit > 0
                            ? entry.credit.toLocaleString('id-ID')
                            : '-'}
                        </td>
                      </tr>
                    ))}
                    {/* Baris Total */}
                    <tr className='bg-muted/20 font-bold border-t-2 border-border'>
                      <td
                        colSpan={2}
                        className='px-4 py-3 text-right text-muted-foreground uppercase text-xs'
                      >
                        Total Transaksi
                      </td>
                      <td className='px-4 py-3 text-right font-mono text-emerald-500'>
                        {journal.total_debit.toLocaleString('id-ID')}
                      </td>
                      <td className='px-4 py-3 text-right font-mono text-emerald-500'>
                        {journal.total_credit.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {filteredJournals.length === 0 && (
            <div className='text-center py-10 text-muted-foreground'>
              Tidak ada jurnal ditemukan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
