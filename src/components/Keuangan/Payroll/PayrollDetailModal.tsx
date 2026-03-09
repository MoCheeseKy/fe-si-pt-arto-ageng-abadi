// src/components/Keuangan/Payroll/PayrollDetailModal.tsx
import * as React from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/_shared/Modal';
import { PayrollRow } from './schema';

interface PayrollDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedData: PayrollRow | null;
}

export function PayrollDetailModal({
  isOpen,
  onClose,
  selectedData,
}: PayrollDetailModalProps) {
  if (!selectedData) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Detail Slip Gaji Karyawan'
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
        <div className='flex justify-between items-center pb-4 border-b border-border/50'>
          <div className='flex items-center gap-3'>
            <div className='h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary'>
              <FileText className='h-5 w-5' />
            </div>
            <div>
              <p className='text-sm text-muted-foreground'>Karyawan</p>
              <p className='text-lg font-bold text-foreground'>
                {selectedData.employee_name}
              </p>
            </div>
          </div>
          <div className='text-right'>
            <p className='text-sm text-muted-foreground'>Periode</p>
            <p className='font-semibold text-primary'>
              {selectedData.period || '-'}
            </p>
          </div>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Kolom Pendapatan */}
          <div className='space-y-3'>
            <h4 className='text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-md inline-block'>
              Pendapatan (Income)
            </h4>
            <div className='bg-muted/20 p-4 rounded-xl border border-border/50 space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Gaji Pokok</span>
                <span className='font-mono'>
                  Rp {(selectedData.basic_salary || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Tunjangan</span>
                <span className='font-mono'>
                  Rp {(selectedData.allowance || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Lembur (Overtime)</span>
                <span className='font-mono'>
                  Rp {(selectedData.overtime || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Bonus Insentif</span>
                <span className='font-mono'>
                  Rp{' '}
                  {(selectedData.incentive_bonus || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Pendapatan Lain</span>
                <span className='font-mono'>
                  Rp {(selectedData.others_income || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className='flex justify-between pt-2 mt-2 border-t font-semibold text-emerald-600'>
                <span>Total Pendapatan</span>
                <span className='font-mono'>
                  Rp{' '}
                  {(selectedData.calculated_income || 0).toLocaleString(
                    'id-ID',
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Kolom Potongan */}
          <div className='space-y-3'>
            <h4 className='text-xs font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-3 py-1.5 rounded-md inline-block'>
              Potongan (Deduction)
            </h4>
            <div className='bg-muted/20 p-4 rounded-xl border border-border/50 space-y-2 text-sm'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>PPh21</span>
                <span className='font-mono text-destructive'>
                  Rp {(selectedData.pph21 || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>BPJS</span>
                <span className='font-mono text-destructive'>
                  Rp {(selectedData.bpjs || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Potongan Kasbon</span>
                <span className='font-mono text-destructive'>
                  Rp{' '}
                  {(selectedData.debt_deduction || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Potongan Lainnya</span>
                <span className='font-mono text-destructive'>
                  Rp{' '}
                  {(selectedData.others_deduction || 0).toLocaleString('id-ID')}
                </span>
              </div>
              <div className='flex justify-between pt-2 mt-2 border-t font-semibold text-destructive'>
                <span>Total Potongan</span>
                <span className='font-mono'>
                  Rp{' '}
                  {(selectedData.calculated_deduction || 0).toLocaleString(
                    'id-ID',
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-primary/5 p-4 rounded-xl border border-primary/20 flex justify-between items-center'>
          <span className='text-sm font-bold uppercase tracking-wider'>
            Take Home Pay (Gaji Bersih)
          </span>
          <span className='text-2xl font-mono font-bold text-primary'>
            Rp {(selectedData.net_salary || 0).toLocaleString('id-ID')}
          </span>
        </div>
      </div>
    </Modal>
  );
}
