// src/components/Accounting/Jurnal/JurnalFilter.tsx
import * as React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/form/Select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface JurnalFilterState {
  month: string;
  year: string;
}

interface JurnalFilterProps {
  filterInput: JurnalFilterState;
  setFilterInput: React.Dispatch<React.SetStateAction<JurnalFilterState>>;
  activeFilterCount: number;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  applyFilters: () => void;
  resetFilters: () => void;
}

const MONTHS = [
  { label: 'Semua Bulan', value: 'ALL' },
  { label: 'Januari', value: '1' },
  { label: 'Februari', value: '2' },
  { label: 'Maret', value: '3' },
  { label: 'April', value: '4' },
  { label: 'Mei', value: '5' },
  { label: 'Juni', value: '6' },
  { label: 'Juli', value: '7' },
  { label: 'Agustus', value: '8' },
  { label: 'September', value: '9' },
  { label: 'Oktober', value: '10' },
  { label: 'November', value: '11' },
  { label: 'Desember', value: '12' },
];

const currentYear = new Date().getFullYear();
const YEARS = [{ label: 'Semua Tahun', value: 'ALL' }];
for (let i = currentYear; i >= 2020; i--) {
  YEARS.push({ label: i.toString(), value: i.toString() });
}

export function JurnalFilter({
  filterInput,
  setFilterInput,
  activeFilterCount,
  isFilterOpen,
  setIsFilterOpen,
  applyFilters,
  resetFilters,
}: JurnalFilterProps) {
  return (
    <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className='border-border shadow-sm flex items-center gap-2 relative bg-background'
        >
          <Filter className='w-4 h-4 text-muted-foreground' />
          Filter Waktu
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
              Filter Periode
            </h4>
            <p className='text-xs text-muted-foreground'>
              Pencarian jurnal berdasarkan bulan dan tahun.
            </p>
          </div>
          <div className='space-y-3'>
            <Select
              label='Bulan'
              options={MONTHS}
              value={filterInput.month}
              onChange={(val) =>
                setFilterInput((prev) => ({ ...prev, month: val }))
              }
            />
            <Select
              label='Tahun'
              options={YEARS}
              value={filterInput.year}
              onChange={(val) =>
                setFilterInput((prev) => ({ ...prev, year: val }))
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
