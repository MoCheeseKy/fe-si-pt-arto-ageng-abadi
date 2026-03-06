'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Search,
  Plus,
  FileSignature,
  Calculator,
  FileText,
  Printer,
} from 'lucide-react';
import { toast } from 'sonner';

import { Payroll, PayrollFormValues, payrollSchema } from '@/types/keuangan';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const dummyPayrolls: Payroll[] = [
  {
    id: 'PR-2510-001',
    period: 'Oktober 2025',
    employee_name: 'Ahmad Sujatmiko',
    nik: '3273112233',
    total_income: 6500000,
    total_deduction: 750000,
    take_home_pay: 5750000,
    status: 'Draft',
  },
];

// Mock data: Hutang Kasbon Karyawan
const mockHutangKasbon = {
  '1': { remaining: 2500000, monthly: 500000 },
};

const columnHelper = createColumnHelper<Payroll>();

export default function GajiPage() {
  const [data, setData] = useState<Payroll[]>(dummyPayrolls);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<PayrollFormValues>({
    resolver: zodResolver(payrollSchema),
    defaultValues: {
      period: '2025-10',
      employee_id: '',
      gaji_pokok: 0,
      tunjangan: 0,
      lembur: 0,
      insentif: 0,
      lain_penghasilan: 0,
      pph21: 0,
      bpjs: 0,
      potongan_hutang: 0,
      lain_potongan: 0,
    },
  });

  const watchValues = useWatch({ control: form.control });
  const employeeId = watchValues.employee_id;

  // Auto-fill potongan hutang saat karyawan dipilih
  useEffect(() => {
    if (employeeId === '1') {
      form.setValue('potongan_hutang', mockHutangKasbon['1'].monthly, {
        shouldValidate: true,
      });
    } else {
      form.setValue('potongan_hutang', 0);
    }
  }, [employeeId, form]);

  // Kalkulasi THP
  const calcPenghasilan =
    (watchValues.gaji_pokok || 0) +
    (watchValues.tunjangan || 0) +
    (watchValues.lembur || 0) +
    (watchValues.insentif || 0) +
    (watchValues.lain_penghasilan || 0);
  const calcPotongan =
    (watchValues.pph21 || 0) +
    (watchValues.bpjs || 0) +
    (watchValues.potongan_hutang || 0) +
    (watchValues.lain_potongan || 0);
  const calcTHP = calcPenghasilan - calcPotongan;

  const onSubmit = async (values: PayrollFormValues) => {
    await new Promise((res) => setTimeout(res, 600));
    toast.success('Data payroll berhasil disimpan.');
    setIsDialogOpen(false);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('period', { header: 'Periode' }),
      columnHelper.accessor('employee_name', {
        header: 'Nama & NIK',
        cell: (info) => (
          <div className='flex flex-col'>
            <span className='font-semibold text-foreground'>
              {info.getValue()}
            </span>
            <span className='text-xs text-muted-foreground'>
              {info.row.original.nik}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('total_income', {
        header: 'Penghasilan',
        cell: (info) => (
          <span className='font-mono text-emerald-500'>
            Rp {info.getValue().toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper.accessor('total_deduction', {
        header: 'Potongan',
        cell: (info) => (
          <span className='font-mono text-rose-500'>
            Rp {info.getValue().toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper.accessor('take_home_pay', {
        header: 'Take Home Pay',
        cell: (info) => (
          <span className='font-bold font-mono text-primary'>
            Rp {info.getValue().toLocaleString('id-ID')}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge
            variant={info.getValue() === 'Paid' ? 'default' : 'secondary'}
            className={
              info.getValue() === 'Paid'
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : ''
            }
          >
            {info.getValue()}
          </Badge>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-heading font-bold flex items-center gap-2'>
            <FileSignature className='w-6 h-6 text-primary' /> Payroll (Gaji
            Karyawan)
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Buat slip gaji dengan kalkulasi pajak, BPJS, dan potongan hutang.
          </p>
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className='bg-primary text-white'
        >
          <Plus className='w-4 h-4 mr-2' /> Buat Slip Gaji
        </Button>
      </div>

      <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
        <div className='p-4 border-b border-border bg-muted/20'>
          <Input
            placeholder='Cari periode atau karyawan...'
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className='max-w-sm bg-background'
          />
        </div>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-muted/40 text-muted-foreground font-heading'>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((h) => (
                    <th key={h.id} className='px-6 py-4 font-semibold'>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className='divide-y divide-border'>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className='hover:bg-muted/10'>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className='px-6 py-4'>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog Gaji (Slip Style) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-4xl bg-card p-0 overflow-hidden'>
          <div className='flex flex-col lg:flex-row h-[80vh] lg:h-[650px]'>
            {/* Sisi Kiri: Form Input Pendapatan & Potongan */}
            <div className='flex-1 p-6 overflow-y-auto custom-scrollbar border-r border-border'>
              <DialogHeader className='mb-6'>
                <DialogTitle className='font-heading text-xl'>
                  Draft Slip Gaji Baru
                </DialogTitle>
              </DialogHeader>
              <form
                id='payroll-form'
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                {/* Referensi */}
                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-1'>
                    <label className='text-xs'>Bulan / Periode</label>
                    <Input type='month' {...form.register('period')} />
                  </div>
                  <div className='space-y-1'>
                    <label className='text-xs font-bold text-primary'>
                      Karyawan
                    </label>
                    <select
                      {...form.register('employee_id')}
                      className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:ring-1 focus-visible:ring-primary'
                    >
                      <option value=''>-- Pilih --</option>
                      <option value='1'>Ahmad Sujatmiko (Ops)</option>
                      <option value='2'>Benny Setiawan (Driver)</option>
                    </select>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-border'>
                  {/* Kolom Penghasilan */}
                  <div className='space-y-4'>
                    <h3 className='text-sm font-bold text-emerald-500 border-b border-border pb-2'>
                      Rincian Penghasilan (+)
                    </h3>
                    <div className='space-y-2'>
                      <div className='space-y-1'>
                        <label className='text-[10px] text-muted-foreground uppercase'>
                          Gaji Pokok
                        </label>
                        <Input
                          type='number'
                          {...form.register('gaji_pokok')}
                          className='font-mono h-8'
                        />
                      </div>
                      <div className='space-y-1'>
                        <label className='text-[10px] text-muted-foreground uppercase'>
                          Tunjangan Tetap/Jabatan
                        </label>
                        <Input
                          type='number'
                          {...form.register('tunjangan')}
                          className='font-mono h-8'
                        />
                      </div>
                      <div className='space-y-1'>
                        <label className='text-[10px] text-muted-foreground uppercase'>
                          Uang Lembur (Overtime)
                        </label>
                        <Input
                          type='number'
                          {...form.register('lembur')}
                          className='font-mono h-8'
                        />
                      </div>
                      <div className='space-y-1'>
                        <label className='text-[10px] text-muted-foreground uppercase'>
                          Insentif / Bonus / THR
                        </label>
                        <Input
                          type='number'
                          {...form.register('insentif')}
                          className='font-mono h-8'
                        />
                      </div>
                      <div className='space-y-1'>
                        <label className='text-[10px] text-muted-foreground uppercase'>
                          Lain-lain (Reimburse dsb)
                        </label>
                        <Input
                          type='number'
                          {...form.register('lain_penghasilan')}
                          className='font-mono h-8'
                        />
                      </div>
                    </div>
                  </div>

                  {/* Kolom Potongan */}
                  <div className='space-y-4'>
                    <h3 className='text-sm font-bold text-rose-500 border-b border-border pb-2'>
                      Rincian Potongan (-)
                    </h3>
                    <div className='space-y-2'>
                      <div className='space-y-1'>
                        <label className='text-[10px] text-muted-foreground uppercase'>
                          Potongan PPh 21
                        </label>
                        <Input
                          type='number'
                          {...form.register('pph21')}
                          className='font-mono h-8 border-rose-500/30'
                        />
                      </div>
                      <div className='space-y-1'>
                        <label className='text-[10px] text-muted-foreground uppercase'>
                          Iuran BPJS (Kes/TK)
                        </label>
                        <Input
                          type='number'
                          {...form.register('bpjs')}
                          className='font-mono h-8 border-rose-500/30'
                        />
                      </div>

                      {/* Potongan Kasbon Terhubung Otomatis */}
                      <div className='space-y-1'>
                        <div className='flex justify-between items-center'>
                          <label className='text-[10px] text-muted-foreground uppercase'>
                            Cicilan Kasbon
                          </label>
                          {employeeId === '1' && (
                            <Badge
                              variant='secondary'
                              className='text-[9px] px-1 bg-amber-500/10 text-amber-500'
                            >
                              Otomatis Terisi
                            </Badge>
                          )}
                        </div>
                        <Input
                          type='number'
                          {...form.register('potongan_hutang')}
                          className='font-mono h-8 border-rose-500/30 bg-muted/20'
                        />
                        {employeeId === '1' && (
                          <p className='text-[9px] text-muted-foreground'>
                            Sisa hutang: Rp 2.500.000
                          </p>
                        )}
                      </div>

                      <div className='space-y-1'>
                        <label className='text-[10px] text-muted-foreground uppercase'>
                          Lain-lain (Telat/Absen)
                        </label>
                        <Input
                          type='number'
                          {...form.register('lain_potongan')}
                          className='font-mono h-8 border-rose-500/30'
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Sisi Kanan: Summary Realtime THP */}
            <div className='w-full lg:w-[320px] bg-sidebar/50 p-6 flex flex-col justify-between sidebar-gradient-dark'>
              <div>
                <div className='flex items-center gap-2 mb-6'>
                  <Calculator className='w-5 h-5 text-primary' />
                  <h3 className='font-heading font-semibold text-lg'>
                    Estimasi Slip
                  </h3>
                </div>

                <div className='space-y-3'>
                  <div className='flex justify-between items-center text-sm p-3 bg-background rounded-md border border-border'>
                    <span className='text-muted-foreground'>
                      Total Penghasilan
                    </span>
                    <span className='font-mono font-semibold text-emerald-500'>
                      {calcPenghasilan.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className='flex justify-between items-center text-sm p-3 bg-background rounded-md border border-border'>
                    <span className='text-muted-foreground'>
                      Total Potongan
                    </span>
                    <span className='font-mono font-semibold text-rose-500'>
                      - {calcPotongan.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className='mt-6 pt-4 border-t border-border'>
                  <p className='text-xs text-muted-foreground mb-1 uppercase font-bold tracking-wider'>
                    Take Home Pay
                  </p>
                  <p
                    className={`text-3xl font-heading font-bold break-all ${calcTHP < 0 ? 'text-rose-500' : 'text-primary'}`}
                  >
                    Rp {calcTHP.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className='mt-8 pt-4'>
                <Button
                  type='submit'
                  form='payroll-form'
                  className='w-full h-11 text-sm font-semibold bg-primary hover:bg-primary/90 text-white'
                  disabled={form.formState.isSubmitting || calcTHP < 0}
                >
                  Simpan Slip Gaji
                </Button>
                {calcTHP < 0 && (
                  <p className='text-[10px] text-rose-500 text-center mt-2'>
                    THP tidak boleh bernilai minus.
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
