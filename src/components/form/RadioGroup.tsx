// src/components/form/RadioGroup.tsx
import * as React from 'react';
import {
  RadioGroup as ShadcnRadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';

export interface RadioOption {
  label: string;
  value: string;
}

export interface RadioGroupProps {
  label?: string;
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function RadioGroup({
  label,
  options,
  value,
  onChange,
  error,
  disabled,
}: RadioGroupProps) {
  return (
    <div className='space-y-3 w-full'>
      {label && (
        <label className='text-xs font-bold text-foreground uppercase tracking-wider'>
          {label}
        </label>
      )}
      <ShadcnRadioGroup
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        className='flex flex-col space-y-2'
      >
        {options.map((opt) => (
          <div className='flex items-center space-x-3' key={opt.value}>
            <RadioGroupItem value={opt.value} id={`radio-${opt.value}`} />
            <label
              htmlFor={`radio-${opt.value}`}
              className='text-sm font-semibold cursor-pointer'
            >
              {opt.label}
            </label>
          </div>
        ))}
      </ShadcnRadioGroup>
      {error && <p className='text-[10px] text-destructive'>{error}</p>}
    </div>
  );
}
