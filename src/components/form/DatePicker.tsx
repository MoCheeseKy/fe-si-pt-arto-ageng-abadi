// src/components/form/DatePicker.tsx
import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface DatePickerProps {
  label?: string;
  error?: string;
  value?: string;
  onChange?: (date: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

export function DatePicker({
  label,
  error,
  value,
  onChange,
  disabled,
  required,
  placeholder = 'Pilih Tanggal',
}: DatePickerProps) {
  const date = value ? new Date(value) : undefined;

  const handleSelect = (selectedDate: Date | undefined) => {
    if (onChange && selectedDate) {
      // Mengubah date object menjadi YYYY-MM-DD
      const offsetDate = new Date(
        selectedDate.getTime() - selectedDate.getTimezoneOffset() * 60000,
      );
      onChange(offsetDate.toISOString().split('T')[0]);
    }
  };

  return (
    <div className='space-y-1.5 w-full'>
      {label && (
        <label className='text-xs font-bold text-foreground uppercase tracking-wider'>
          {label} {required && <span className='text-destructive'>*</span>}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={`w-full justify-start text-left font-normal bg-background ${!date && 'text-muted-foreground'} ${error ? 'border-destructive' : ''}`}
            disabled={disabled}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {date ? format(date, 'yyyy-MM-dd') : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='single'
            selected={date}
            onSelect={handleSelect}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {error && <p className='text-[10px] text-destructive'>{error}</p>}
    </div>
  );
}
