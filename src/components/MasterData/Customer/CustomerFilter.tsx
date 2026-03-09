// src/components/MasterData/Customer/CustomerFilter.tsx
import * as React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

/** * Mendefinisikan struktur data untuk secondary filters yang ada di dalam Popover.
 * (Field company_name dipisah ke global search)
 */
export interface CustomerFilterState {
  npwp: string;
  pic_name: string;
  address: string;
  phone_number: string;
  pic_phone_number: string;
}

interface CustomerFilterProps {
  filterInput: CustomerFilterState;
  setFilterInput: React.Dispatch<React.SetStateAction<CustomerFilterState>>;
  activeFilterCount: number;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  applyFilters: () => void;
  resetFilters: () => void;
}

/**
 * Merender komponen Popover untuk menampung input filter sekunder.
 * Menerima filterInput state dan men-trigger fungsi applyFilters saat disubmit.
 * * @param {CustomerFilterProps} props - Properti yang berisi state dan handler untuk filter.
 * @returns {JSX.Element} Elemen Popover filter
 */
export function CustomerFilter({
  filterInput,
  setFilterInput,
  activeFilterCount,
  isFilterOpen,
  setIsFilterOpen,
  applyFilters,
  resetFilters,
}: CustomerFilterProps) {
  return (
    <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className='border-border shadow-sm flex items-center gap-2 relative bg-background'
        >
          <Filter className='w-4 h-4 text-muted-foreground' />
          Filter Data
          {activeFilterCount > 0 && (
            <span className='absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white'>
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className='w-80 p-4 rounded-xl border-border shadow-lg'
        align='end'
      >
        <div className='space-y-4'>
          <div>
            <h4 className='font-heading font-bold text-sm text-foreground'>
              Filter Spesifik
            </h4>
            <p className='text-xs text-muted-foreground'>
              Isi parameter pencarian di bawah ini.
            </p>
          </div>

          <div className='space-y-3 max-h-[50vh] overflow-y-auto pr-2 pb-2'>
            <Input
              label='Nomor NPWP'
              placeholder='Ketik NPWP...'
              value={filterInput.npwp}
              onChange={(e) =>
                setFilterInput({ ...filterInput, npwp: e.target.value })
              }
            />
            <Input
              label='Alamat Perusahaan'
              placeholder='Ketik alamat...'
              value={filterInput.address}
              onChange={(e) =>
                setFilterInput({ ...filterInput, address: e.target.value })
              }
            />
            <Input
              label='No. Telepon Kantor'
              placeholder='Ketik no. telp...'
              value={filterInput.phone_number}
              onChange={(e) =>
                setFilterInput({ ...filterInput, phone_number: e.target.value })
              }
            />
            <Input
              label='Nama PIC'
              placeholder='Ketik nama PIC...'
              value={filterInput.pic_name}
              onChange={(e) =>
                setFilterInput({ ...filterInput, pic_name: e.target.value })
              }
            />
            <Input
              label='No. Telepon PIC'
              placeholder='Ketik no. telp PIC...'
              value={filterInput.pic_phone_number}
              onChange={(e) =>
                setFilterInput({
                  ...filterInput,
                  pic_phone_number: e.target.value,
                })
              }
            />
          </div>

          <div className='flex justify-end gap-2 pt-3 border-t border-border/50'>
            <Button variant='ghost' size='sm' onClick={resetFilters}>
              Reset
            </Button>
            <Button
              size='sm'
              onClick={applyFilters}
              className='bg-primary text-white'
            >
              Terapkan Filter
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
