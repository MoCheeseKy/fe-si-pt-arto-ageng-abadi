// src/components/Accounting/Coa/CoaFormModal.tsx
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { NumberInput } from '@/components/form/NumberInput';
import { Modal } from '@/components/_shared/Modal';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

import { localCoaSchema, LocalCoaFormValues, CoaRow } from './schema';
import { CategoryFormModal } from './CategoryFormModal';

interface CoaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: CoaRow | null;
  onSubmit: (values: LocalCoaFormValues) => void;
  categories: { label: string; value: string }[];
  refreshCategories: () => Promise<void>;
}

export function CoaFormModal({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  categories,
  refreshCategories,
}: CoaFormModalProps) {
  const form = useForm<LocalCoaFormValues>({
    resolver: zodResolver(localCoaSchema as any),
    defaultValues: { code: '', name: '', CoACategoryId: '', initialBalance: 0 },
  });

  const [openCategoryCombobox, setOpenCategoryCombobox] = React.useState(false);

  // State untuk Category Modal Sub-Form
  const [isCategoryModalOpen, setIsCategoryModalOpen] = React.useState(false);
  const [isSavingCategory, setIsSavingCategory] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      form.reset(
        initialData || {
          code: '',
          name: '',
          CoACategoryId: '',
          initialBalance: 0,
        },
      );
    }
  }, [isOpen, initialData, form]);

  const handleAddCategory = async (name: string) => {
    if (!name.trim()) {
      toast.error('Nama kategori tidak boleh kosong.');
      return;
    }
    setIsSavingCategory(true);
    try {
      const res = await api.post<{ id: string; name: string }>(
        '/v1/coa-categories',
        { name },
      );
      toast.success('Kategori baru berhasil ditambahkan.');
      setIsCategoryModalOpen(false);

      await refreshCategories();

      if (res.data?.id) {
        form.setValue('CoACategoryId', res.data.id);
        form.clearErrors('CoACategoryId');
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan kategori.');
    } finally {
      setIsSavingCategory(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={initialData ? 'Edit Akun (CoA)' : 'Tambah Akun Baru'}
        size='md'
        footer={
          <div className='flex justify-end gap-3 w-full'>
            <Button type='button' variant='ghost' onClick={onClose}>
              Batal
            </Button>
            <Button
              type='submit'
              form='coa-form'
              className='bg-primary hover:bg-primary/90 text-white'
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </Button>
          </div>
        }
      >
        <form
          id='coa-form'
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-5 py-2'
        >
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <Input
              label='Kode Akun'
              required
              placeholder='Contoh: 110-100'
              error={form.formState.errors.code?.message}
              {...form.register('code')}
            />
            <Input
              label='Nama Akun'
              required
              placeholder='Contoh: Kas Bebas'
              error={form.formState.errors.name?.message}
              {...form.register('name')}
            />
          </div>

          <div className='space-y-2'>
            <label className='text-sm font-medium leading-none'>
              Kategori Akun <span className='text-destructive'>*</span>
            </label>
            <Popover
              open={openCategoryCombobox}
              onOpenChange={setOpenCategoryCombobox}
            >
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  role='combobox'
                  aria-expanded={openCategoryCombobox}
                  className={cn(
                    'w-full justify-between font-normal h-10 px-3 border-input bg-background',
                    !form.watch('CoACategoryId') && 'text-muted-foreground',
                  )}
                >
                  {form.watch('CoACategoryId')
                    ? categories.find(
                        (c) => c.value === form.watch('CoACategoryId'),
                      )?.label
                    : 'Pilih atau cari kategori...'}
                  <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className='w-[--radix-popover-trigger-width] p-0'
                align='start'
              >
                <Command>
                  <CommandInput placeholder='Cari kategori...' />
                  <CommandList>
                    <CommandEmpty>Kategori tidak ditemukan.</CommandEmpty>
                    <CommandGroup>
                      {categories.map((category) => (
                        <CommandItem
                          key={category.value}
                          value={category.label}
                          onSelect={() => {
                            form.setValue('CoACategoryId', category.value);
                            form.clearErrors('CoACategoryId');
                            setOpenCategoryCombobox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              form.watch('CoACategoryId') === category.value
                                ? 'opacity-100'
                                : 'opacity-0',
                            )}
                          />
                          {category.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <div className='border-t border-border p-1'>
                      <CommandItem
                        onSelect={() => {
                          setOpenCategoryCombobox(false);
                          setIsCategoryModalOpen(true);
                        }}
                        className='flex cursor-pointer items-center justify-center font-medium text-primary aria-selected:bg-primary/10 aria-selected:text-primary'
                      >
                        <Plus className='mr-2 h-4 w-4' />
                        Tambah Kategori Baru...
                      </CommandItem>
                    </div>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {form.formState.errors.CoACategoryId && (
              <p className='text-[0.8rem] font-medium text-destructive'>
                {form.formState.errors.CoACategoryId.message}
              </p>
            )}
          </div>

          <div className='grid grid-cols-1'>
            <NumberInput
              label='Saldo Awal (Initial Balance)'
              required
              value={form.watch('initialBalance')}
              onChange={(val) => form.setValue('initialBalance', val)}
              error={form.formState.errors.initialBalance?.message}
            />
          </div>
        </form>
      </Modal>

      {/* Sub Modal yang terisolasi di dalam komponen ini */}
      <CategoryFormModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSubmit={handleAddCategory}
        isSaving={isSavingCategory}
      />
    </>
  );
}
