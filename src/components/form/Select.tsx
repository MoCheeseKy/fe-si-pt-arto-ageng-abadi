// src/components/form/Select.tsx
import * as React from 'react';
import {
  Select as ShadcnSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  label?: string;
  error?: string;
  placeholder?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export function Select({
  label,
  error,
  placeholder = 'Pilih...',
  options,
  value,
  onChange,
  disabled,
  required,
}: SelectProps) {
  return (
    <div className='space-y-1.5 w-full'>
      {label && (
        <label className='text-xs font-bold text-foreground uppercase tracking-wider'>
          {label} {required && <span className='text-destructive'>*</span>}
        </label>
      )}
      <ShadcnSelect value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          // TAMBAHKAN w-full DISINI AGAR SELECT TIDAK KECIL
          className={`w-full bg-background ${error ? 'border-destructive focus:ring-destructive' : 'focus:ring-primary'}`}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className='cursor-pointer'
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </ShadcnSelect>
      {error && <p className='text-[10px] text-destructive'>{error}</p>}
    </div>
  );
}
