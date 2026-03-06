// src/components/_shared/TableActions.tsx
import { Eye, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface TableActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TableActions({ onView, onEdit, onDelete }: TableActionsProps) {
  return (
    <div className='flex items-center gap-1 justify-end'>
      <TooltipProvider delayDuration={100}>
        {onView && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                onClick={onView}
                className='h-8 w-8 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10'
              >
                <Eye className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className='text-xs'>Detail / Lihat</p>
            </TooltipContent>
          </Tooltip>
        )}
        {onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                onClick={onEdit}
                className='h-8 w-8 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10'
              >
                <Edit2 className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className='text-xs'>Edit Data</p>
            </TooltipContent>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                onClick={onDelete}
                className='h-8 w-8 text-destructive hover:text-red-400 hover:bg-destructive/10'
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className='text-xs'>Hapus</p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}
