// src/components/Keuangan/Kasbon/KasbonDetailModal.tsx
import * as React from 'react';
import { format } from 'date-fns';
import { Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/_shared/Modal';
import { CashAdvanceRow } from './schema';

interface CashAdvanceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: CashAdvanceRow | null;
}

export function CashAdvanceDetailModal({
  isOpen,
  onClose,
  selectedData,
}: CashAdvanceDetailModalProps) {
  if (!selectedData) return null;

  const isLunas = selectedData.status === 'Lunas';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Detail Kasbon'
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
            className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center mb-2 ${isLunas ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}
          >
            <Banknote className='h-6 w-6' />
          </div>
          <p className='text-sm text-muted-foreground'>Nominal Pinjaman</p>
          <p className='text-2xl font-bold font-mono text-foreground'>
            Rp {(selectedData.amount || 0).toLocaleString('id-ID')}
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
            <p className='text-xs text-muted-foreground'>Status</p>
            <Badge
              variant='outline'
              className={
                isLunas
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 mt-1'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/20 mt-1'
              }
            >
              {selectedData.status || 'Belum Lunas'}
            </Badge>
          </div>
          <div className='col-span-2'>
            <p className='text-xs text-muted-foreground'>Nama Karyawan</p>
            <p className='font-bold text-base'>{selectedData.employee_name}</p>
          </div>
          <div className='col-span-2'>
            <p className='text-xs text-muted-foreground'>
              Keterangan / Keperluan
            </p>
            <p className='text-sm text-muted-foreground'>
              {selectedData.description || '-'}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
