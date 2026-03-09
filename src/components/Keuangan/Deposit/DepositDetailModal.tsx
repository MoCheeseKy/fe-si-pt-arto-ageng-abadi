// src/components/Keuangan/Deposit/DepositDetailModal.tsx
import * as React from 'react';
import { format } from 'date-fns';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/_shared/Modal';
import { DepositRow } from './schema';

interface DepositDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: DepositRow | null;
}

export function DepositDetailModal({
  isOpen,
  onClose,
  selectedData,
}: DepositDetailModalProps) {
  if (!selectedData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Detail Transaksi Deposit'
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
          <div className='mx-auto h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 mb-2'>
            <Wallet className='h-6 w-6' />
          </div>
          <p className='text-sm text-muted-foreground'>Nominal Deposit</p>
          <p className='text-2xl font-bold font-mono text-emerald-600'>
            Rp {(selectedData.amount || 0).toLocaleString('id-ID')}
          </p>
        </div>

        <div className='grid grid-cols-2 gap-y-4 gap-x-6'>
          <div>
            <p className='text-xs text-muted-foreground'>Tanggal Pencatatan</p>
            <p className='font-medium text-sm'>
              {selectedData.date
                ? format(new Date(selectedData.date), 'dd MMM yyyy')
                : '-'}
            </p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>
              Chart of Account (CoA)
            </p>
            <p className='font-mono text-sm'>
              {selectedData.chart_of_account || '-'}
            </p>
          </div>
          <div className='col-span-2'>
            <p className='text-xs text-muted-foreground'>
              Nama Pelanggan (Customer)
            </p>
            <p className='font-bold text-base'>{selectedData.customer_name}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
