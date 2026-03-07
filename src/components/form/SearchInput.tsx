'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input, InputProps } from '@/components/form/Input';
import { cn } from '@/lib/utils';

export type SearchInputProps = Omit<InputProps, 'label' | 'error' | 'icon'>;

const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, placeholder = 'Cari data...', ...props }, ref) => {
    return (
      <Input
        ref={ref}
        icon={Search}
        placeholder={placeholder}
        className={cn('max-w-sm', className)}
        {...props}
      />
    );
  },
);

SearchInput.displayName = 'SearchInput';

export { SearchInput };
