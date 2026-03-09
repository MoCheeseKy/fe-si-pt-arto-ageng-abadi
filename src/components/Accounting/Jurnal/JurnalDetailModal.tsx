// src/components/Accounting/Jurnal/JurnalDetailModal.tsx
import * as React from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/_shared/Modal';
import { JournalRow } from './schema';

interface JurnalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: JournalRow | null;
}

export function JurnalDetailModal({
  isOpen,
  onClose,
  selectedData,
}: JurnalDetailModalProps) {
  if (!selectedData) return null;

  const totalDebit =
    selectedData.entries?.reduce(
      (sum, item) => sum + (Number(item.debit) || 0),
      0,
    ) || 0;
  const totalCredit =
    selectedData.entries?.reduce(
      (sum, item) => sum + (Number(item.credit) || 0),
      0,
    ) || 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Rincian Jurnal Umum'
      size='lg'
      footer={
        <div className='flex justify-end w-full'>
          <Button variant='outline' onClick={onClose}>
            Tutup
          </Button>
        </div>
      }
    >
      <div className='space-y-6 py-2'>
        <div className='grid grid-cols-2 gap-4 pb-4 border-b border-border/50'>
          <div>
            <p className='text-xs text-muted-foreground'>Tanggal Transaksi</p>
            <p className='font-semibold text-foreground'>
              {selectedData.transaction_date
                ? format(
                    new Date(selectedData.transaction_date),
                    'dd MMMM yyyy',
                  )
                : '-'}
            </p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Sumber Modul</p>
            <Badge
              variant='outline'
              className='uppercase text-[10px] tracking-wider mt-1'
            >
              {selectedData.source_module || 'Manual'}
            </Badge>
          </div>
          <div className='col-span-2'>
            <p className='text-xs text-muted-foreground'>Keterangan Jurnal</p>
            <p className='text-sm bg-muted/30 p-3 rounded-lg mt-1 border border-border/50'>
              {selectedData.description || '-'}
            </p>
          </div>
        </div>

        <div className='space-y-3'>
          <h4 className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>
            Rincian Ayat Jurnal (Lines)
          </h4>
          <div className='border border-border rounded-xl overflow-hidden'>
            <table className='w-full text-sm text-left'>
              <thead className='bg-muted/50 text-xs uppercase text-muted-foreground'>
                <tr>
                  <th className='px-4 py-3 font-semibold'>Kode Akun</th>
                  <th className='px-4 py-3 font-semibold text-right'>Debit</th>
                  <th className='px-4 py-3 font-semibold text-right'>Kredit</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border'>
                {selectedData.entries?.map((entry: any, index: number) => {
                  const isCredit = Number(entry.credit) > 0;
                  return (
                    <tr key={index} className='hover:bg-muted/20'>
                      <td
                        className={`px-4 py-3 font-mono ${isCredit ? 'pl-8 text-muted-foreground' : 'text-foreground'}`}
                      >
                        {entry.account_code}
                      </td>
                      <td className='px-4 py-3 font-mono text-right text-emerald-600'>
                        {Number(entry.debit) > 0
                          ? Number(entry.debit).toLocaleString('id-ID')
                          : '-'}
                      </td>
                      <td className='px-4 py-3 font-mono text-right text-destructive'>
                        {Number(entry.credit) > 0
                          ? Number(entry.credit).toLocaleString('id-ID')
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className='bg-primary/5 font-bold'>
                <tr>
                  <td className='px-4 py-3 text-right'>Total</td>
                  <td className='px-4 py-3 text-right font-mono text-emerald-600'>
                    {totalDebit.toLocaleString('id-ID')}
                  </td>
                  <td className='px-4 py-3 text-right font-mono text-destructive'>
                    {totalCredit.toLocaleString('id-ID')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}
