// src/components/Accounting/Coa/CoaFilter.tsx
import * as React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/form/Select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface CoaFilterState {
  CoACategoryId: string;
}

interface CoaFilterProps {
  filterInput: CoaFilterState;
  setFilterInput: React.Dispatch<React.SetStateAction<CoaFilterState>>;
  activeFilterCount: number;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  categories: { label: string; value: string }[];
}

export function CoaFilter({
  filterInput,
  setFilterInput,
  activeFilterCount,
  isFilterOpen,
  setIsFilterOpen,
  applyFilters,
  resetFilters,
  categories,
}: CoaFilterProps) {
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
              Pencarian master akun berdasarkan kategori.
            </p>
          </div>
          <div className='space-y-3'>
            <Select
              label='Kategori Akun'
              options={[
                { label: 'Semua Kategori', value: 'ALL' },
                ...categories,
              ]}
              value={filterInput.CoACategoryId}
              onChange={(val) =>
                setFilterInput((prev) => ({ ...prev, CoACategoryId: val }))
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
