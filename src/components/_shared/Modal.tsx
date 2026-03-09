// src/components/_shared/Modal.tsx
import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`${sizeClasses[size]} bg-card p-0 overflow-hidden border-border/80 shadow-2xl`}
      >
        {/* Header - Aksen garis atas untuk command center vibe */}
        <div className='p-6 border-b border-border/60 bg-muted/10 card-indicator-blue relative'>
          <DialogHeader>
            <DialogTitle className='font-heading text-lg font-bold tracking-tight text-foreground'>
              {title}
            </DialogTitle>
            {description && (
              <DialogDescription className='text-xs text-muted-foreground font-medium'>
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        </div>

        <div className='p-6 max-h-[75vh] overflow-y-auto custom-scrollbar bg-background/50'>
          {children}
        </div>

        {/* Footer (Optional) */}
        {footer && (
          <div className='p-4 border-t border-border/60 bg-muted/20'>
            <DialogFooter>{footer}</DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
