// src/components/Keuangan/PettyCash/PettyCashDetailModal.tsx
import * as React from 'react';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/_shared/Modal';
import { PettyCashRow } from './schema';

interface PettyCashDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: PettyCashRow | null;
}

export function PettyCashDetailModal({
  isOpen,
  onClose,
  selectedData,
}: PettyCashDetailModalProps) {
  if (!selectedData) return null;

  const isIncome = selectedData.transaction_type === 'Pemasukan';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Detail Petty Cash'
      size='sm'
      footer={
        <div className='flex justify-end w-full'>
          <Button variant='outline' onClick={onClose}>
            Tutup
          </Button>
        </div>
      }
    >
      <div className='space-y-6 py-2'>
        <div className='flex flex-col gap-1 pb-4 border-b border-border/50 text-center'>
          <div
            className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-2 ${isIncome ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}
          >
            <FileText className='h-6 w-6' />
          </div>
          <p className='text-sm text-muted-foreground'>Total Nominal</p>
          <p
            className={`text-2xl font-bold font-mono ${isIncome ? 'text-emerald-600' : 'text-foreground'}`}
          >
            {isIncome ? '+' : '-'} Rp{' '}
            {(selectedData.total || 0).toLocaleString('id-ID')}
          </p>
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
            <p className='text-xs text-muted-foreground'>Tipe Transaksi</p>
            <Badge
              variant='outline'
              className={
                isIncome
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 mt-1'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20 mt-1'
              }
            >
              {selectedData.transaction_type || '-'}
            </Badge>
          </div>
          <div className='col-span-2'>
            <p className='text-xs text-muted-foreground'>Terkait Customer</p>
            <p className='font-bold text-base'>{selectedData.customer_name}</p>
          </div>
          <div className='col-span-2'>
            <p className='text-xs text-muted-foreground'>Kategori Beban/Dana</p>
            <p className='font-medium text-sm'>
              {selectedData.expense_type || '-'}
            </p>
          </div>
        </div>

        <div className='bg-muted/20 p-4 rounded-xl border border-border/50 space-y-3'>
          <h4 className='text-xs font-bold uppercase text-muted-foreground mb-2'>
            Rincian Perhitungan
          </h4>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-xs text-muted-foreground'>Kuantitas</p>
              <p className='font-mono text-sm'>{selectedData.quantity || 0}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Harga Satuan</p>
              <p className='font-mono text-sm'>
                Rp {(selectedData.unit_price || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div className='col-span-2'>
              <p className='text-xs text-muted-foreground'>
                Deskripsi / Catatan
              </p>
              <p className='text-sm text-muted-foreground'>
                {selectedData.description || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
