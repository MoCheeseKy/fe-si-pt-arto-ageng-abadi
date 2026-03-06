'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Building2,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

import { Customer, CustomerFormValues, customerSchema } from '@/types/customer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Dummy Data (Struktur menyesuaikan Backend + Computed Fields)
const dummyData: Customer[] = [
  {
    id: '1',
    company_name: 'PT. Industri Maju Abadi',
    npwp: '01.234.567.8-901.000',
    address: 'Jl. Raya Industri No.12, Bekasi',
    phone_number: '021-88997766',
    pic_name: 'Budi Santoso',
    pic_phone_number: '081234567890',
    status: 'Aktif',
    saldo_deposit: 2500000,
  },
  {
    id: '2',
    company_name: 'PT. Tekno Pangan',
    npwp: '02.345.678.9-012.000',
    address: 'Kawasan Surya Cipta, Karawang',
    phone_number: '0267-112233',
    pic_name: 'Andi Wijaya',
    pic_phone_number: '081987654321',
    status: 'Aktif',
    saldo_deposit: 15000000,
  },
  {
    id: '3',
    company_name: 'CV. Berkah Gas',
    npwp: '03.456.789.0-123.000',
    address: 'Jl. Soekarno Hatta, Bandung',
    phone_number: '022-445566',
    pic_name: 'Siti Aminah',
    pic_phone_number: '081566778899',
    status: 'Nonaktif',
    saldo_deposit: 0,
  },
];

const columnHelper = createColumnHelper<Customer>();

export default function CustomerPage() {
  const [data, setData] = useState<Customer[]>(dummyData);
  const [globalFilter, setGlobalFilter] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      company_name: '',
      npwp: '',
      address: '',
      phone_number: '',
      pic_name: '',
      pic_phone_number: '',
    },
  });

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingId(customer.id);
      form.reset({
        company_name: customer.company_name,
        npwp: customer.npwp || '',
        address: customer.address || '',
        phone_number: customer.phone_number || '',
        pic_name: customer.pic_name || '',
        pic_phone_number: customer.pic_phone_number || '',
      });
    } else {
      setEditingId(null);
      form.reset({
        company_name: '',
        npwp: '',
        address: '',
        phone_number: '',
        pic_name: '',
        pic_phone_number: '',
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      // Simulasi API POST/PUT
      await new Promise((res) => setTimeout(res, 600));
      toast.success(
        `Customer berhasil ${editingId ? 'diperbarui' : 'ditambahkan'}`,
      );
      setIsDialogOpen(false);
      // Implementasi refresh fetch() nantinya diletakkan di sini
    } catch (error) {
      toast.error('Terjadi kesalahan sistem');
    }
  };

  // Definisi Kolom Tabel
  const columns = useMemo(
    () => [
      columnHelper.accessor('company_name', {
        header: 'Nama Perusahaan',
        cell: (info) => (
          <div className='flex items-center gap-2'>
            <Building2 className='w-4 h-4 text-muted-foreground' />
            <span className='font-semibold text-foreground'>
              {info.getValue()}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('pic_name', {
        header: 'PIC & Kontak',
        cell: (info) => (
          <div className='flex flex-col'>
            <span className='text-sm font-medium text-foreground'>
              {info.getValue()}
            </span>
            <span className='text-xs text-muted-foreground'>
              {info.row.original.pic_phone_number}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('saldo_deposit', {
        header: 'Saldo Deposit',
        cell: (info) => {
          const value = info.getValue();
          return (
            <span
              className={`font-mono font-medium ${value < 5000000 ? 'text-destructive' : 'text-emerald-500'}`}
            >
              Rp {value.toLocaleString('id-ID')}
            </span>
          );
        },
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => (
          <Badge
            variant={info.getValue() === 'Aktif' ? 'default' : 'secondary'}
            className={
              info.getValue() === 'Aktif'
                ? 'bg-emerald-500 hover:bg-emerald-600'
                : ''
            }
          >
            {info.getValue()}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        cell: (info) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon' className='h-8 w-8'>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align='end'
              className='w-40 bg-card border-border'
            >
              <DropdownMenuItem
                onClick={() => handleOpenDialog(info.row.original)}
                className='cursor-pointer'
              >
                <Edit2 className='mr-2 h-4 w-4' /> Edit Data
              </DropdownMenuItem>
              <DropdownMenuItem className='cursor-pointer text-destructive focus:text-destructive'>
                <Trash2 className='mr-2 h-4 w-4' /> Nonaktifkan
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className='space-y-6 animate-in fade-in duration-500'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div>
          <h2 className='text-2xl font-heading font-bold text-foreground'>
            Master Customer
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Kelola data klien, kontak PIC, dan pantau saldo deposit.
          </p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className='bg-primary hover:bg-primary/90 text-white'
        >
          <Plus className='w-4 h-4 mr-2' /> Tambah Customer
        </Button>
      </div>

      <div className='bg-card border border-border rounded-xl shadow-sm overflow-hidden'>
        {/* Table Toolbar */}
        <div className='p-4 border-b border-border flex items-center justify-between gap-4 bg-muted/20'>
          <div className='relative w-full max-w-sm'>
            <Search className='absolute left-3 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Cari perusahaan atau PIC...'
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className='pl-9 bg-background border-border'
            />
          </div>
        </div>

        {/* Data Table */}
        <div className='overflow-x-auto'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-muted/40 text-muted-foreground font-heading'>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className='px-6 py-4 font-semibold border-b border-border'
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className='divide-y divide-border'>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className='hover:bg-muted/10 transition-colors'
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className='px-6 py-4'>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className='px-6 py-12 text-center text-muted-foreground'
                  >
                    Tidak ada data customer yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className='p-4 border-t border-border flex items-center justify-between bg-muted/20'>
          <span className='text-sm text-muted-foreground'>
            Halaman {table.getState().pagination.pageIndex + 1} dari{' '}
            {table.getPageCount()}
          </span>
          <div className='space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className='border-border'
            >
              Sebelumnnya
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className='border-border'
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      </div>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='sm:max-w-[600px] bg-card border-border'>
          <DialogHeader>
            <DialogTitle className='font-heading text-xl'>
              {editingId ? 'Edit Data Customer' : 'Tambah Customer Baru'}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4 mt-4'
          >
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2 col-span-2'>
                <label className='text-sm font-medium'>
                  Nama Perusahaan <span className='text-destructive'>*</span>
                </label>
                <Input
                  {...form.register('company_name')}
                  placeholder='PT. Arto Ageng Abadi'
                  className='border-border'
                />
                {form.formState.errors.company_name && (
                  <p className='text-xs text-destructive'>
                    {form.formState.errors.company_name.message}
                  </p>
                )}
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>NPWP</label>
                <Input
                  {...form.register('npwp')}
                  placeholder='00.000.000.0-000.000'
                  className='border-border'
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>
                  No. Telepon Kantor
                </label>
                <Input
                  {...form.register('phone_number')}
                  placeholder='021-XXXXXXX'
                  className='border-border'
                />
              </div>
              <div className='space-y-2 col-span-2'>
                <label className='text-sm font-medium'>Alamat Lengkap</label>
                <Input
                  {...form.register('address')}
                  placeholder='Jl. Raya...'
                  className='border-border'
                />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>
                  Nama PIC <span className='text-destructive'>*</span>
                </label>
                <Input
                  {...form.register('pic_name')}
                  placeholder='Nama Penanggung Jawab'
                  className='border-border'
                />
                {form.formState.errors.pic_name && (
                  <p className='text-xs text-destructive'>
                    {form.formState.errors.pic_name.message}
                  </p>
                )}
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>
                  No. HP PIC <span className='text-destructive'>*</span>
                </label>
                <Input
                  {...form.register('pic_phone_number')}
                  placeholder='08XXXXXXXXXX'
                  className='border-border'
                />
                {form.formState.errors.pic_phone_number && (
                  <p className='text-xs text-destructive'>
                    {form.formState.errors.pic_phone_number.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className='mt-6 border-t border-border pt-4'>
              <Button
                type='button'
                variant='ghost'
                onClick={() => setIsDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                type='submit'
                className='bg-primary hover:bg-primary/90 text-white'
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
