import * as React from 'react';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/_shared/Modal';

export function EvcDetailModal({ isOpen, onClose, selectedData }: any) {
  if (!selectedData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detail Pemakaian - EVC`}
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
            <p className='text-sm text-muted-foreground'>Customer</p>
            <p className='text-lg font-bold text-foreground'>
              {selectedData.customer_name}
            </p>
          </div>
        </div>
        <div className='grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg border border-border/50'>
          <div>
            <p className='text-xs text-muted-foreground'>Tanggal</p>
            <p className='font-medium text-sm'>
              {selectedData.date
                ? format(new Date(selectedData.date), 'dd MMM yyyy')
                : '-'}
            </p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Plat Nomor</p>
            <p className='font-medium text-sm font-mono'>
              {selectedData.license_plate || '-'}
            </p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>GTM Number</p>
            <p className='font-medium text-sm font-mono'>
              {selectedData.gtm_number || '-'}
            </p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Selisih EVC SM3</p>
            <p className='font-bold text-sm text-emerald-600 font-mono'>
              {selectedData.evc_difference_sm3 || 0}
            </p>
          </div>
        </div>
        <div className='flex flex-col gap-3 bg-primary/5 p-4 rounded-lg border border-primary/20'>
          <div className='flex justify-between items-center'>
            <span className='text-sm text-muted-foreground'>
              Harga / Satuan
            </span>
            <span className='text-sm font-mono font-medium'>
              Rp {(selectedData.price_per_sm3 || 0).toLocaleString('id-ID')}
            </span>
          </div>
          <div className='flex justify-between items-center pt-2 border-t border-primary/20 mt-1'>
            <span className='text-sm font-bold text-foreground'>
              Total Penjualan
            </span>
            <span className='text-lg font-bold font-mono text-emerald-600'>
              {selectedData.currency === 'USD' ? '$' : 'Rp'}{' '}
              {(selectedData.total_sales || 0).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
