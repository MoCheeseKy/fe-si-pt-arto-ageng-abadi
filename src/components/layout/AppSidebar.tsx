'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  LayoutDashboard,
  Users,
  Truck,
  Factory,
  FileText,
  Wallet,
  Receipt,
  CreditCard,
  BookOpen,
  ShieldCheck,
  Coins,
  UserCircle,
  PieChart,
  FileSpreadsheet,
  Banknote,
  FileSignature,
  ChevronDown,
  Database,
  Briefcase,
  Landmark,
  Calculator,
  Settings,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const navItems = [
  {
    group: 'Overview',
    icon: Home,
    items: [{ title: 'Dashboard', url: '/overview', icon: LayoutDashboard }],
  },
  {
    group: 'Master Data',
    icon: Database,
    items: [
      { title: 'Customer', url: '/master-data/customer', icon: Users },
      { title: 'Supplier', url: '/master-data/supplier', icon: Factory },
      { title: 'Driver', url: '/master-data/driver', icon: Truck },
      { title: 'Karyawan', url: '/master-data/karyawan', icon: UserCircle },
    ],
  },
  {
    group: 'Operasional',
    icon: Briefcase,
    items: [
      { title: 'Pengisian Gas', url: '/operasional/pengisian', icon: Truck },
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
    icon: Landmark,
    items: [
      { title: 'Invoice', url: '/keuangan/invoice', icon: Receipt },
      { title: 'Deposit Wallet', url: '/keuangan/deposit', icon: Wallet },
      { title: 'Pengeluaran', url: '/keuangan/pengeluaran', icon: CreditCard },
      { title: 'Petty Cash', url: '/keuangan/petty-cash', icon: Coins },
      { title: 'Kasbon', url: '/keuangan/kasbon', icon: Banknote },
      { title: 'Payroll (Gaji)', url: '/keuangan/gaji', icon: FileSignature },
    ],
  },
  {
    group: 'Accounting',
    icon: Calculator,
    items: [
      { title: 'Buku Besar', url: '/accounting/coa', icon: BookOpen },
      { title: 'Jurnal Umum', url: '/accounting/jurnal', icon: FileText },
      { title: 'Laporan Keuangan', url: '/accounting/laporan', icon: PieChart },
      { title: 'Reporting Excel', url: '/reporting', icon: FileSpreadsheet },
    ],
  },
  {
    group: 'Pengaturan',
    icon: Settings,
    items: [
      {
        title: 'User Management',
        url: '/master-data/user-management',
        icon: Users,
      },
      { title: 'Role Access', url: '/role-access', icon: ShieldCheck },
    ],
  },
];

function NavContent() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <>
      {/* HEADER — hidden saat collapsed */}
      <SidebarHeader
        className={`h-[80px] flex flex-col justify-center px-4 border-b border-[#1E293B]/60 ${isCollapsed ? 'hidden' : ''}`}
      >
        <Link
          href='/overview'
          className='flex items-center gap-3 overflow-hidden group'
        >
          <div className='relative w-10 h-10 shrink-0 transition-transform duration-300 group-hover:scale-105'>
            <Image
              src='/logo.png'
              alt='Logo PT Arto Ageng Abadi'
              fill
              className='object-contain drop-shadow-md'
              priority
            />
          </div>
          <div className='flex flex-col truncate'>
            <span className='font-extrabold text-[15px] text-white tracking-tight leading-tight'>
              Arto Ageng Abadi
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* CONTENT */}
      <SidebarContent className='py-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-800'>
        <SidebarMenu className='px-2 space-y-1'>
          {navItems.map((group, idx) => {
            const hasActiveItem = group.items.some((item) =>
              pathname.startsWith(item.url),
            );

            // COLLAPSED MODE — icon + popover flyout
            if (isCollapsed) {
              return (
                <SidebarMenuItem key={idx}>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className={`
                          flex items-center justify-center w-10 h-10 rounded-lg mx-auto
                          transition-all duration-200
                          ${
                            hasActiveItem
                              ? 'text-[#DC2626] bg-[rgba(220,38,38,0.12)]'
                              : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                          }
                        `}
                      >
                        <group.icon className='w-5 h-5 shrink-0' />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side='right'
                      align='start'
                      sideOffset={12}
                      className='w-52 p-0 bg-[#0D1424] border border-[#1E293B] shadow-[8px_8px_32px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden'
                    >
                      {/* Flyout header */}
                      <div className='px-4 py-2.5 border-b border-[#1E293B]/60'>
                        <span className='flex items-center gap-2 uppercase font-bold text-[10px] tracking-widest text-slate-400'>
                          <group.icon className='w-3.5 h-3.5 text-[#DC2626]' />
                          {group.group}
                        </span>
                      </div>
                      {/* Flyout items */}
                      <div className='p-1.5 space-y-0.5'>
                        {group.items.map((item) => {
                          const isActive = pathname.startsWith(item.url);
                          return (
                            <Link
                              key={item.title}
                              href={item.url}
                              className={`
                                relative flex items-center gap-3 h-9 w-full px-3 rounded-lg
                                transition-all duration-200
                                ${
                                  isActive
                                    ? 'bg-[rgba(220,38,38,0.12)] text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                                }
                              `}
                            >
                              {isActive && (
                                <div className='absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-[#DC2626] rounded-r-full' />
                              )}
                              <item.icon
                                className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#DC2626]' : 'text-slate-500'}`}
                              />
                              <span className='font-medium text-[13px]'>
                                {item.title}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </SidebarMenuItem>
              );
            }

            // EXPANDED MODE — collapsible group
            return (
              <SidebarMenuItem key={idx}>
                <Collapsible defaultOpen className='w-full group/collapsible'>
                  <CollapsibleTrigger
                    className={`
                    flex w-full items-center gap-2 h-10 px-2 rounded-lg
                    transition-all duration-200 cursor-pointer
                    ${
                      hasActiveItem
                        ? 'text-[#DC2626]'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    }
                  `}
                  >
                    <group.icon className='w-5 h-5 shrink-0' />
                    <span className='uppercase font-bold text-[11px] tracking-widest flex-1 text-left ml-1'>
                      {group.group}
                    </span>
                    <ChevronDown className='h-4 w-4 shrink-0 transition-transform duration-300 group-data-[state=open]/collapsible:rotate-180' />
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className='border-l border-slate-800/60 ml-4 pl-3 mt-1 space-y-0.5'>
                      {group.items.map((item) => {
                        const isActive = pathname.startsWith(item.url);
                        return (
                          <Link
                            key={item.title}
                            href={item.url}
                            className={`
                              relative flex items-center gap-3 h-9 w-full px-3 rounded-lg
                              transition-all duration-200 border border-transparent
                              ${
                                isActive
                                  ? 'bg-[radial-gradient(ellipse_at_left,_rgba(220,38,38,0.15),_transparent_70%)] text-white border-white/5'
                                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                              }
                            `}
                          >
                            {isActive && (
                              <div className='absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-[#DC2626] rounded-r-full shadow-[0_0_10px_rgba(220,38,38,0.8)]' />
                            )}
                            <item.icon
                              className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#DC2626]' : 'text-slate-500'}`}
                            />
                            <span className='font-medium text-[13px]'>
                              {item.title}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
    </>
  );
}

export function AppSidebar() {
  return (
    <Sidebar
      collapsible='icon'
      className='border-r border-[#1E293B] bg-[#070C15] text-slate-300 shadow-[4px_0_24px_rgba(0,0,0,0.2)]'
    >
      <NavContent />
    </Sidebar>
  );
}
