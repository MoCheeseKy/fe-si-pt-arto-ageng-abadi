// src/components/Keuangan/Invoice/InvoiceDetailModal.tsx
import * as React from 'react';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/_shared/Modal';
import { InvoiceRow } from './schema';

interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: InvoiceRow | null;
}

export function InvoiceDetailModal({
  isOpen,
  onClose,
  selectedData,
}: InvoiceDetailModalProps) {
  if (!selectedData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Detail Invoice'
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
        <div className='flex items-center gap-3 pb-4 border-b border-border/50'>
          <div className='h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary'>
            <FileText className='h-5 w-5' />
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>Nomor Invoice</p>
            <p className='text-lg font-bold font-mono text-foreground'>
              {selectedData.invoice_number || '-'}
            </p>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-y-4 gap-x-6 bg-muted/20 p-4 rounded-xl border border-border/50'>
          <div className='col-span-2 pb-2 border-b border-border/50'>
            <p className='text-xs text-muted-foreground'>Nama Customer</p>
            <p className='font-bold text-base'>{selectedData.customer_name}</p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Tanggal Invoice</p>
            <p className='font-medium text-sm'>
              {selectedData.date
                ? format(new Date(selectedData.date), 'dd MMM yyyy')
                : '-'}
            </p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Status</p>
            <Badge variant='outline' className='mt-1'>
              {selectedData.status || 'Draft'}
            </Badge>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Nomor PO</p>
            <p className='font-medium text-sm'>
              {selectedData.po_number || '-'}
            </p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Tanggal PO</p>
            <p className='font-medium text-sm'>
              {selectedData.po_date
                ? format(new Date(selectedData.po_date), 'dd MMM yyyy')
                : '-'}
            </p>
          </div>
          <div className='col-span-2'>
            <p className='text-xs text-muted-foreground'>Periode Penagihan</p>
            <p className='font-medium text-sm'>
              {selectedData.period_start
                ? format(new Date(selectedData.period_start), 'dd MMM yyyy')
                : '-'}{' '}
              s/d{' '}
              {selectedData.period_end
                ? format(new Date(selectedData.period_end), 'dd MMM yyyy')
                : '-'}
            </p>
          </div>
        </div>

        <div className='bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3'>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>
              Total Pemakaian (Usage)
            </span>
            <span className='font-mono font-medium'>
              {selectedData.total_usage || 0}
            </span>
          </div>
          <div className='flex justify-between text-sm text-destructive'>
            <span>Potongan Deposit</span>
            <span className='font-mono'>
              - Rp{' '}
              {(selectedData.deposit_deduction || 0).toLocaleString('id-ID')}
            </span>
          </div>
          <div className='flex justify-between items-center pt-3 border-t border-primary/20 mt-1'>
            <span className='text-sm font-bold text-foreground'>
              Total Tagihan (Bill)
            </span>
            <span className='text-lg font-bold font-mono text-emerald-600'>
              Rp {(selectedData.total_bill || 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {selectedData.note && (
          <div className='p-3 bg-muted/30 rounded-lg text-sm border border-border/50'>
            <span className='font-semibold'>Catatan: </span> {selectedData.note}
          </div>
        )}
      </div>
    </Modal>
  );
}
