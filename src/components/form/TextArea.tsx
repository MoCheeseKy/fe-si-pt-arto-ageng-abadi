// src/components/form/Textarea.tsx
import * as React from 'react';
import { Textarea as ShadcnTextarea } from '@/components/ui/textarea';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, required, className, ...props }, ref) => {
    return (
      <div className='space-y-1.5 w-full'>
        {label && (
          <label className='text-xs font-bold text-foreground uppercase tracking-wider'>
            {label} {required && <span className='text-destructive'>*</span>}
          </label>
        )}
        <ShadcnTextarea
          ref={ref}
          required={required}
          className={`${error ? 'border-destructive focus-visible:ring-destructive' : 'focus-visible:ring-primary'} bg-background min-h-[80px] ${className || ''}`}
          {...props}
        />
        {error && <p className='text-[10px] text-destructive'>{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
