// src/components/Operasional/Kontrak/KeyTerm/KeyTermDetailModal.tsx
import * as React from 'react';
import { format } from 'date-fns';
import { FileSignature } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/_shared/Modal';

interface KeyTermDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: any | null;
}

export function KeyTermDetailModal({
  isOpen,
  onClose,
  selectedData,
}: KeyTermDetailModalProps) {
  if (!selectedData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Detail Dokumen Key Term'
      size='md'
      footer={
        <div className='flex justify-end w-full'>
          <Button variant='outline' onClick={onClose}>
            Tutup
          </Button>
        </div>
      }
    >
      <div className='space-y-5 py-2'>
        <div className='flex items-center gap-3 pb-3 border-b border-border/50'>
          <div className='h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary'>
            <FileSignature className='h-5 w-5' />
          </div>
          <div>
            <p className='text-sm text-muted-foreground'>
              Customer / Perusahaan
            </p>
            <p className='text-lg font-bold text-foreground'>
              {selectedData.customer_name}
            </p>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <p className='text-xs text-muted-foreground'>
              Nomor Penawaran Referensi
            </p>
            <p className='font-medium text-sm font-mono text-primary'>
              {selectedData.offer_number || '-'}
            </p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Tanggal Penawaran</p>
            <p className='font-medium text-sm'>
              {selectedData.offer_date
                ? format(new Date(selectedData.offer_date), 'dd MMM yyyy')
                : '-'}
            </p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Durasi Kontrak</p>
            <p className='font-medium text-sm'>
              {selectedData.duration || '-'}
            </p>
          </div>
        </div>

        <div className='space-y-3 bg-muted/20 p-4 rounded-lg border border-border/50 mt-2'>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-xs text-muted-foreground'>
                Volume Kesepakatan
              </p>
              <p className='font-semibold text-sm'>
                {selectedData.volume || 0}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>
                Minimum Order Qty (MOQ)
              </p>
              <p className='font-semibold text-sm'>{selectedData.moq || 0}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Tipe Harga</p>
              <p className='font-medium text-sm'>
                {selectedData.price_type || '-'}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Tipe Penagihan</p>
              <p className='font-medium text-sm'>
                {selectedData.billing_type || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
