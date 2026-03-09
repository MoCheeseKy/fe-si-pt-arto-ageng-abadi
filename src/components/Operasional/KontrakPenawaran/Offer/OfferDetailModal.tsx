// src/components/Operasional/Kontrak/Offer/OfferDetailModal.tsx
import * as React from 'react';
import { format } from 'date-fns';
import { FileSignature } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/_shared/Modal';

interface OfferDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: any | null;
}

export function OfferDetailModal({
  isOpen,
  onClose,
  selectedData,
}: OfferDetailModalProps) {
  if (!selectedData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Detail Dokumen Penawaran'
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
            <p className='text-xs text-muted-foreground'>Nomor Penawaran</p>
            <p className='font-medium text-sm font-mono text-primary'>
              {selectedData.offer_number || '-'}
            </p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Tanggal</p>
            <p className='font-medium text-sm'>
              {selectedData.date
                ? format(new Date(selectedData.date), 'dd MMM yyyy')
                : '-'}
            </p>
          </div>
          <div>
            <p className='text-xs text-muted-foreground'>Periode Kontrak</p>
            <p className='font-medium text-sm'>
              {selectedData.contract_period || '-'}
            </p>
          </div>
        </div>

        <div className='space-y-3 bg-muted/20 p-4 rounded-lg border border-border/50 mt-2'>
          <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
            Spesifikasi Penawaran
          </h4>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <p className='text-xs text-muted-foreground'>Harga per SM3</p>
              <p className='font-semibold font-mono text-emerald-600 text-sm'>
                Rp{' '}
                {(selectedData.cng_gas_price_per_sm3 || 0).toLocaleString(
                  'id-ID',
                )}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Vol Bulanan</p>
              <p className='font-semibold text-sm'>
                {selectedData.monthly_cng_usage_volume || 0}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Metode Pembayaran</p>
              <p className='font-medium text-sm'>
                {selectedData.payment_method || '-'}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Masa Berlaku</p>
              <p className='font-medium text-sm'>
                {selectedData.validity || '-'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
