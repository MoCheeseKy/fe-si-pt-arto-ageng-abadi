// src/components/MasterData/Karyawan/EmployeeFilter.tsx
import * as React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/form/Input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

/** * State filter sekunder untuk pencarian data Karyawan.
 * (Field name dipisahkan untuk global search input)
 */
export interface EmployeeFilterState {
  nik: string;
}

interface EmployeeFilterProps {
  filterInput: EmployeeFilterState;
  setFilterInput: React.Dispatch<React.SetStateAction<EmployeeFilterState>>;
  activeFilterCount: number;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  applyFilters: () => void;
  resetFilters: () => void;
}

/**
 * Merender UI Popover yang berisi input form untuk memfilter tabel Karyawan berdasarkan NIK.
 * * @param {EmployeeFilterProps} props - Handler dan state yang mengontrol Popover dan Filter
 */
export function EmployeeFilter({
  filterInput,
  setFilterInput,
  activeFilterCount,
  isFilterOpen,
  setIsFilterOpen,
  applyFilters,
  resetFilters,
}: EmployeeFilterProps) {
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

          <div className='space-y-3'>
            <Input
              label='Nomor Induk Karyawan (NIK)'
              placeholder='Ketik NIK...'
              value={filterInput.nik}
              onChange={(e) =>
                setFilterInput({ ...filterInput, nik: e.target.value })
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
