'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function Topbar() {
  const { theme, setTheme } = useTheme();

  return (
    <header className='h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-20 transition-colors'>
      <div className='flex items-center gap-4'>
        <SidebarTrigger className='text-muted-foreground hover:text-foreground' />
        <h1 className='font-heading font-semibold text-lg tracking-tight hidden sm:block'>
          SIMOK - Arto Ageng Abadi
        </h1>
      </div>

      <div className='flex items-center gap-2'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className='text-muted-foreground hover:text-foreground'
        >
          <Sun className='h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
          <Moon className='absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          <span className='sr-only'>Toggle theme</span>
        </Button>

        <div className='flex items-center gap-3 border-l border-border pl-4 ml-2'>
          <div className='text-right hidden md:block'>
            <p className='text-sm font-bold leading-none text-foreground'>
              admin@artoageng.co.id
            </p>
            <p className='text-xs text-muted-foreground mt-1'>Super Admin</p>
          </div>
          <Avatar className='h-9 w-9 ring-2 ring-border'>
            <AvatarFallback className='bg-primary text-white text-xs font-bold'>
              AA
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
