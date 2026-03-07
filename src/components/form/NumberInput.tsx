// src/components/form/NumberInput.tsx
import * as React from 'react';
import { Input } from './Input';

export interface NumberInputProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value'
> {
  label?: string;
  error?: string;
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ label, error, value, onChange, min, max, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    React.useEffect(() => {
      if (value !== undefined && value !== null && !isNaN(value)) {
        setDisplayValue(new Intl.NumberFormat('id-ID').format(value));
      } else {
        setDisplayValue('');
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let rawValue = e.target.value.replace(/\D/g, '');
      if (!rawValue) {
        setDisplayValue('');
        onChange?.(0);
        return;
      }

      let numValue = parseInt(rawValue, 10);
      if (min !== undefined && numValue < min) numValue = min;
      if (max !== undefined && numValue > max) numValue = max;

      setDisplayValue(new Intl.NumberFormat('id-ID').format(numValue));
      onChange?.(numValue);
    };

    return (
      <Input
        ref={ref}
        label={label}
        error={error}
        type='text'
        value={displayValue}
        onChange={handleChange}
        className='font-mono font-semibold tracking-wide'
        {...props}
      />
    );
  },
);
NumberInput.displayName = 'NumberInput';
