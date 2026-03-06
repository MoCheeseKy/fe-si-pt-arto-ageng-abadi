'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Truck,
  Factory,
  FileText,
  Wallet,
  Receipt,
  CreditCard,
  BookOpen,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

const navItems = [
  {
    group: 'Overview',
    items: [{ title: 'Dashboard', url: '/overview', icon: LayoutDashboard }],
  },
  {
    group: 'Master Data',
    items: [
      { title: 'Customer', url: '/master-data/customer', icon: Users },
      { title: 'Supplier', url: '/master-data/supplier', icon: Factory },
      { title: 'Driver', url: '/master-data/driver', icon: Truck },
    ],
  },
  {
    group: 'Operasional',
    items: [
      {
        title: 'Pembelian (Pengisian)',
        url: '/operasional/pengisian',
        icon: Truck,
      },
      { title: 'Pemakaian Gas', url: '/operasional/pemakaian', icon: Factory },
      {
        title: 'Kontrak & Penawaran',
        url: '/operasional/kontrak-penawaran',
        icon: FileText,
      },
    ],
  },
  {
    group: 'Keuangan',
    items: [
      { title: 'Invoice', url: '/keuangan/invoice', icon: Receipt },
      { title: 'Deposit Wallet', url: '/keuangan/deposit', icon: Wallet },
      {
        title: 'Pengeluaran & Petty Cash',
        url: '/keuangan/pengeluaran',
        icon: CreditCard,
      },
    ],
  },
  {
    group: 'Accounting',
    items: [
      { title: 'Buku Besar & CoA', url: '/accounting/coa', icon: BookOpen },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className='border-r border-border bg-sidebar transition-all dark:sidebar-gradient-dark sidebar-gradient-light'>
      <SidebarContent className='py-4'>
        {navItems.map((group, idx) => (
          <SidebarGroup key={idx}>
            <SidebarGroupLabel className='text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-1'>
              {group.group}
            </SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                      className={`transition-all ${isActive ? 'bg-primary/10 text-primary border-l-4 border-primary hover:bg-primary/15 hover:text-primary' : 'text-muted-foreground hover:bg-card hover:text-foreground'}`}
                    >
                      <Link href={item.url} className='flex items-center gap-3'>
                        <item.icon className='w-4 h-4' />
                        <span className='font-medium'>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
