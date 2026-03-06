// src/components/form/Input.tsx
import * as React from 'react';
import { Input as ShadcnInput } from '@/components/ui/input';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon: Icon, required, className, ...props }, ref) => {
    return (
      <div className='space-y-1.5 w-full'>
        {label && (
          <label className='text-xs font-bold text-foreground uppercase tracking-wider'>
            {label} {required && <span className='text-destructive'>*</span>}
          </label>
        )}
        <div className='relative'>
          {Icon && (
            <div className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'>
              <Icon className='h-4 w-4' />
            </div>
          )}
          <ShadcnInput
            ref={ref}
            required={required}
            className={`${Icon ? 'pl-9' : ''} ${error ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'} bg-background ${className || ''}`}
            {...props}
          />
        </div>
        {error && <p className='text-[10px] text-destructive'>{error}</p>}
      </div>
    );
  },
);
Input.displayName = 'Input';
