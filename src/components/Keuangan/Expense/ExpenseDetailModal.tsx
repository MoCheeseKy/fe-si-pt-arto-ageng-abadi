// src/components/Keuangan/Pengeluaran/ExpenseDetailModal.tsx
import * as React from 'react';
import { format } from 'date-fns';
import { CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/_shared/Modal';
import { ExpenseRow } from './schema';

interface ExpenseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: ExpenseRow | null;
}

export function ExpenseDetailModal({
  isOpen,
  onClose,
  selectedData,
}: ExpenseDetailModalProps) {
  if (!selectedData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Detail Pengeluaran (Expense)'
      size='md'
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
          <div className='mx-auto h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-2'>
            <CreditCard className='h-6 w-6' />
          </div>
          <p className='text-sm text-muted-foreground'>Total Pengeluaran</p>
          <p className='text-2xl font-bold font-mono text-destructive'>
            Rp {(selectedData.total || 0).toLocaleString('id-ID')}
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
            <p className='text-xs text-muted-foreground'>Tipe Pengeluaran</p>
            <p className='font-medium text-sm'>
              {selectedData.expense_type || '-'}
            </p>
          </div>
          <div className='col-span-2'>
            <p className='text-xs text-muted-foreground'>Customer Terkait</p>
            <p className='font-bold text-base'>{selectedData.customer_name}</p>
          </div>
          <div className='col-span-2'>
            <p className='text-xs text-muted-foreground'>
              Deskripsi / Keterangan
            </p>
            <p className='text-sm text-muted-foreground'>
              {selectedData.description || '-'}
            </p>
          </div>
        </div>

        <div className='bg-muted/20 p-4 rounded-xl border border-border/50 space-y-3'>
          <h4 className='text-xs font-bold uppercase text-muted-foreground mb-2'>
            Rincian Pembayaran
          </h4>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-xs text-muted-foreground'>Quantity</p>
              <p className='font-mono text-sm'>{selectedData.quantity || 0}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Unit Price</p>
              <p className='font-mono text-sm'>
                Rp {(selectedData.unit_price || 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Payment Method</p>
              <p className='text-sm'>{selectedData.payment_method || '-'}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Bank Account</p>
              <p className='font-mono text-sm'>
                {selectedData.bank_account || '-'}
              </p>
            </div>
            <div className='col-span-2'>
              <p className='text-xs text-muted-foreground'>
                Chart of Account (CoA)
              </p>
              <p className='font-mono text-sm'>{selectedData.account || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
