// src/components/_shared/Tabs.tsx
import * as React from 'react';
import {
  Tabs as ShadcnTabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

export interface TabItem {
  label: string;
  value: string;
  content: React.ReactNode;
}

export interface AppTabsProps {
  tabs: TabItem[];
  defaultValue?: string;
}

export function Tabs({ tabs, defaultValue }: AppTabsProps) {
  const initialTab = defaultValue || tabs[0]?.value;

  return (
    <ShadcnTabs defaultValue={initialTab} className='w-full'>
      <TabsList className='w-full justify-start rounded-none border-b border-border bg-transparent p-0 h-auto space-x-1'>
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className='rounded-t-lg rounded-b-none border-b-[3px] border-transparent px-6 py-2.5 font-bold uppercase tracking-wider text-xs text-muted-foreground transition-all duration-300
            hover:text-foreground
            data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-primary/5 data-[state=active]:shadow-none'
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className='mt-6 outline-none animate-in fade-in slide-in-from-bottom-2 duration-500'
        >
          {tab.content}
        </TabsContent>
      ))}
    </ShadcnTabs>
  );
}
