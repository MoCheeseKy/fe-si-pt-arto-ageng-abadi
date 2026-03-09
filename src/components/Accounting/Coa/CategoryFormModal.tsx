// src/components/Accounting/Coa/CategoryFormModal.tsx
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import { Modal } from '@/components/_shared/Modal';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isSaving: boolean;
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSaving,
}: CategoryFormModalProps) {
  const [name, setName] = React.useState('');

  React.useEffect(() => {
    if (isOpen) setName('');
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(name);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Tambah Kategori Akun Baru'
      size='sm'
      footer={
        <div className='flex justify-end gap-2 w-full'>
          <Button type='button' variant='ghost' onClick={onClose}>
            Batal
          </Button>
          <Button
            type='button'
            onClick={handleSubmit}
            className='bg-primary hover:bg-primary/90 text-white'
            disabled={isSaving}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Kategori'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className='space-y-4 py-2'>
        <Input
          label='Nama Kategori'
          required
          placeholder='Contoh: Aset Lancar, Modal...'
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </form>
    </Modal>
  );
}
