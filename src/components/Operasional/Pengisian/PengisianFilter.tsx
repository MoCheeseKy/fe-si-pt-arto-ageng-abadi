// src/components/Operasional/Pengisian/PengisianFilter.tsx
import * as React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface PengisianFilterState {
  start_date: string;
  end_date: string;
}

interface PengisianFilterProps {
  filterInput: PengisianFilterState;
  setFilterInput: React.Dispatch<React.SetStateAction<PengisianFilterState>>;
  activeFilterCount: number;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  applyFilters: () => void;
  resetFilters: () => void;
}

/**
 * Merender Popover Filter untuk mencari data Pengisian berdasarkan rentang tanggal.
 */
export function PengisianFilter({
  filterInput,
  setFilterInput,
  activeFilterCount,
  isFilterOpen,
  setIsFilterOpen,
  applyFilters,
  resetFilters,
}: PengisianFilterProps) {
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
          <h4 className='font-heading font-bold text-sm text-foreground'>
            Filter Rentang Waktu
          </h4>
          <p className='text-xs text-muted-foreground mb-4'>
            Cari transaksi pengisian gas berdasarkan tanggal.
          </p>
          <div className='space-y-3'>
            <Input
              type='date'
              label='Tanggal Mulai (Start Date)'
              value={filterInput.start_date}
              onChange={(e) =>
                setFilterInput({ ...filterInput, start_date: e.target.value })
              }
            />
            <Input
              type='date'
              label='Tanggal Akhir (End Date)'
              value={filterInput.end_date}
              onChange={(e) =>
                setFilterInput({ ...filterInput, end_date: e.target.value })
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
