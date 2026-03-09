// src/components/Keuangan/PettyCash/PettyCashFilter.tsx
import * as React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/form/Select';
import { Input } from '@/components/form/Input';
import { DatePicker } from '@/components/form/DatePicker';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { transactionTypeOptions } from './schema';

export interface PettyCashFilterState {
  customer_id: string;
  transaction_type: string;
  expense_type: string;
  date: string;
}

interface PettyCashFilterProps {
  filterInput: PettyCashFilterState;
  setFilterInput: React.Dispatch<React.SetStateAction<PettyCashFilterState>>;
  activeFilterCount: number;
  isFilterOpen: boolean;
  setIsFilterOpen: (open: boolean) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  customers: { label: string; value: string }[];
}

export function PettyCashFilter({
  filterInput,
  setFilterInput,
  activeFilterCount,
  isFilterOpen,
  setIsFilterOpen,
  applyFilters,
  resetFilters,
  customers,
}: PettyCashFilterProps) {
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
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest('.rdp')) e.preventDefault();
        }}
      >
        <div className='space-y-4'>
          <div>
            <h4 className='font-heading font-bold text-sm text-foreground'>
              Filter Spesifik
            </h4>
            <p className='text-xs text-muted-foreground'>
              Pencarian data petty cash.
            </p>
          </div>
          <div className='space-y-3 max-h-[50vh] overflow-y-auto pr-1 pb-1'>
            <DatePicker
              label='Tanggal Transaksi'
              value={filterInput.date || ''}
              onChange={(val) =>
                setFilterInput((prev) => ({ ...prev, date: val }))
              }
            />
            <Select
              label='Tipe Transaksi'
              options={[
                { label: 'Semua Tipe', value: 'ALL' },
                ...transactionTypeOptions,
              ]}
              value={filterInput.transaction_type}
              onChange={(val) =>
                setFilterInput((prev) => ({ ...prev, transaction_type: val }))
              }
            />
            <Select
              label='Filter Customer'
              options={[
                { label: 'Semua Customer', value: 'ALL' },
                ...customers,
              ]}
              value={filterInput.customer_id}
              onChange={(val) =>
                setFilterInput((prev) => ({ ...prev, customer_id: val }))
              }
            />
            <Input
              label='Kategori Beban/Dana'
              placeholder='Contoh: Operasional / Bensin...'
              value={filterInput.expense_type}
              onChange={(e) =>
                setFilterInput((prev) => ({
                  ...prev,
                  expense_type: e.target.value,
                }))
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
              Terapkan
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
