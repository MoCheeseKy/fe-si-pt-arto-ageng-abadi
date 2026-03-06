// src/components/form/Checkbox.tsx
import * as React from 'react';
import { Checkbox as ShadcnCheckbox } from '@/components/ui/checkbox';

export interface CheckboxProps {
  id: string;
  label: string;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export function Checkbox({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: CheckboxProps) {
  return (
    <div className='items-top flex space-x-3'>
      <ShadcnCheckbox
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
      <div className='grid gap-1.5 leading-none'>
        <label
          htmlFor={id}
          className='text-sm font-semibold leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
        >
          {label}
        </label>
        {description && (
          <p className='text-xs text-muted-foreground'>{description}</p>
        )}
      </div>
    </div>
  );
}
