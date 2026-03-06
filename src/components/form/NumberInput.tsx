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

// src/components/form/CurrencyInput.tsx
import * as React from 'react';
import { NumberInput } from './NumberInput';

export interface CurrencyInputProps {
  label?: string;
  error?: string;
  amount: number;
  onAmountChange: (val: number) => void;
  currency: 'IDR' | 'USD';
  onCurrencyChange: (val: 'IDR' | 'USD') => void;
  exchangeRate?: number;
  onExchangeRateChange?: (val: number) => void;
  exchangeRateError?: string;
  disabled?: boolean;
}

export function CurrencyInput({
  label = 'Harga',
  error,
  amount,
  onAmountChange,
  currency,
  onCurrencyChange,
  exchangeRate,
  onExchangeRateChange,
  exchangeRateError,
  disabled,
}: CurrencyInputProps) {
  return (
    <div className='space-y-4 w-full p-4 border border-border/60 rounded-xl bg-muted/5 shadow-inner'>
      <div className='flex flex-col sm:flex-row gap-4 items-start'>
        <div className='space-y-1.5 w-full sm:w-1/3'>
          <label className='text-xs font-bold text-foreground uppercase tracking-wider'>
            Mata Uang
          </label>
          <select
            value={currency}
            onChange={(e) => onCurrencyChange(e.target.value as 'IDR' | 'USD')}
            disabled={disabled}
            className='flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:opacity-50'
          >
            <option value='IDR'>IDR (Rupiah)</option>
            <option value='USD'>USD (Dolar)</option>
          </select>
        </div>
        <div className='w-full sm:w-2/3'>
          <NumberInput
            label={`${label} (${currency})`}
            value={amount}
            onChange={onAmountChange}
            error={error}
            disabled={disabled}
            className={
              currency === 'USD' ? 'text-amber-500' : 'text-emerald-500'
            }
          />
        </div>
      </div>

      {currency === 'USD' && onExchangeRateChange && (
        <div className='pt-3 mt-1 border-t border-border border-dashed'>
          <NumberInput
            label='Kurs Rupiah (Statis)'
            value={exchangeRate}
            onChange={onExchangeRateChange}
            error={exchangeRateError}
            disabled={disabled}
            placeholder='Contoh: 15500'
            className='border-amber-500/50 focus-visible:ring-amber-500 bg-amber-500/5 text-amber-500'
          />
        </div>
      )}
    </div>
  );
}
