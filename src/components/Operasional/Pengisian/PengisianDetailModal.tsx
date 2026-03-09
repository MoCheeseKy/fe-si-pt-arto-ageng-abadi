// src/components/Operasional/Pengisian/PengisianDetailModal.tsx
import * as React from 'react';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/_shared/Modal';
import { PurchaseRow } from './schema';

interface PengisianDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: PurchaseRow | null;
}

export function PengisianDetailModal({
  isOpen,
  onClose,
  selectedData,
}: PengisianDetailModalProps) {
  if (!selectedData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Detail Transaksi Pengisian'
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
            <p className='text-sm text-muted-foreground'>
              Nomor Delivery Order
            </p>
            <p className='text-lg font-bold font-mono text-foreground'>
              {selectedData.do_number || '-'}
            </p>
          </div>
        </div>

        {/* Informasi Umum */}
        <div>
          <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3'>
            Informasi Umum
          </h4>
          <div className='grid grid-cols-2 gap-y-4 gap-x-6 bg-muted/20 p-4 rounded-lg border border-border/50'>
            <div>
              <p className='text-xs text-muted-foreground'>Tanggal</p>
              <p className='font-medium text-sm'>
                {selectedData.date
                  ? format(new Date(selectedData.date), 'dd MMM yyyy')
                  : '-'}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>
                Supplier (Mother Station)
              </p>
              <p className='font-medium text-sm'>
                {selectedData.supplier_name}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Nama Driver</p>
              <p className='font-medium text-sm'>{selectedData.driver_name}</p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>
                Tipe GTM / Kendaraan
              </p>
              <p className='font-medium text-sm'>
                {selectedData.gtm_type || '-'}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Plat Nomor</p>
              <p className='font-medium text-sm font-mono'>
                {selectedData.license_plate || '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Data Teknis Pengukuran */}
        <div>
          <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3'>
            Pengukuran Operasional
          </h4>
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 bg-primary/5 p-4 rounded-lg border border-primary/10'>
            <div>
              <p className='text-xs text-muted-foreground'>GHC</p>
              <p className='font-semibold text-sm font-mono'>
                {selectedData.ghc || 0}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Volume MMSCF</p>
              <p className='font-semibold text-sm font-mono text-primary'>
                {selectedData.volume_mmscf || 0}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Volume MMBTU</p>
              <p className='font-semibold text-sm font-mono text-primary'>
                {selectedData.volume_mmbtu || 0}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Pressure Awal</p>
              <p className='font-semibold text-sm font-mono'>
                {selectedData.pressure_start || 0}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Pressure Akhir</p>
              <p className='font-semibold text-sm font-mono'>
                {selectedData.pressure_finish || 0}
              </p>
            </div>
            <div className='hidden sm:block'></div>
            <div>
              <p className='text-xs text-muted-foreground'>Meter Awal</p>
              <p className='font-semibold text-sm font-mono'>
                {selectedData.meter_start || 0}
              </p>
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Meter Akhir</p>
              <p className='font-semibold text-sm font-mono'>
                {selectedData.meter_finish || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Data Finansial */}
        <div>
          <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3'>
            Informasi Finansial
          </h4>
          <div className='flex flex-col gap-3 bg-muted/20 p-4 rounded-lg border border-border/50'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>
                Mata Uang & Kurs
              </span>
              <span className='text-sm font-medium'>
                {selectedData.currency || 'IDR'} (Rate:{' '}
                {selectedData.exchange_rate || 1})
              </span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>
                Harga per SM3
              </span>
              <span className='text-sm font-mono font-medium'>
                Rp {(selectedData.price_per_sm3 || 0).toLocaleString('id-ID')}
              </span>
            </div>
            <div className='flex justify-between items-center pt-3 border-t border-border/50 mt-1'>
              <span className='text-sm font-bold text-foreground'>
                Total Tagihan (Sales)
              </span>
              <span className='text-lg font-bold font-mono text-emerald-600'>
                Rp {(selectedData.total_sales || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
