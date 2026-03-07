// src/app/(dashboard)/overview/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  Droplet,
  Users,
  FileWarning,
  Wallet,
  Activity,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

import { api } from '@/lib/api';
import { StatsCard } from '@/components/Dashboard/StatsCard';
import { TrendChart } from '@/components/Dashboard/TrendChart';
import { DepositWidget } from '@/components/Dashboard/DepositWidget';
import { RecentActivity } from '@/components/Dashboard/RecentActivity';

export default function OverviewPage() {
  const [stats, setStats] = useState({
    pendapatan: 0,
    volPengisian: 0,
    volPemakaian: 0,
    customers: 0,
    invBelumBayar: 0,
    deposit: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [invRes, purRes, dpRes, evcRes, turbRes, custRes, depRes] =
          await Promise.all([
            api.get<any>('/v1/invoices'),
            api.get<any>('/v1/purchases'),
            api.get<any>('/v1/usage-delta-pressures'),
            api.get<any>('/v1/usage-evcs'),
            api.get<any>('/v1/usage-turbines'),
            api.get<any>('/v1/customers'),
            api.get<any>('/v1/deposits'),
          ]);

        const invoices = Array.isArray(invRes.data)
          ? invRes.data
          : invRes.data?.rows || [];
        const purchases = Array.isArray(purRes.data)
          ? purRes.data
          : purRes.data?.rows || [];
        const usages = [
          ...(Array.isArray(dpRes.data) ? dpRes.data : dpRes.data?.rows || []),
          ...(Array.isArray(evcRes.data)
            ? evcRes.data
            : evcRes.data?.rows || []),
          ...(Array.isArray(turbRes.data)
            ? turbRes.data
            : turbRes.data?.rows || []),
        ];
        const customers = Array.isArray(custRes.data)
          ? custRes.data
          : custRes.data?.rows || [];
        const deposits = Array.isArray(depRes.data)
          ? depRes.data
          : depRes.data?.rows || [];

        // 1. Calculate KPIs
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const totalPendapatan = invoices
          .filter((i: any) => i.date?.startsWith(currentMonth))
          .reduce((acc: number, i: any) => acc + (i.total_bill || 0), 0);
        const volumePengisian = purchases
          .filter((p: any) => p.date?.startsWith(currentMonth))
          .reduce((acc: number, p: any) => acc + (p.volume_mmscf || 0), 0);
        const volumePemakaian = usages
          .filter((u: any) => u.date?.startsWith(currentMonth))
          .reduce(
            (acc: number, u: any) =>
              acc + (u.total_sm3 || u.evc_difference_sm3 || 0),
            0,
          );
        const totalDeposit = deposits.reduce(
          (acc: number, d: any) => acc + (d.amount || 0),
          0,
        );

        setStats({
          pendapatan: totalPendapatan,
          volPengisian: volumePengisian,
          volPemakaian: volumePemakaian,
          customers: customers.length,
          invBelumBayar: invoices.length,
          deposit: totalDeposit,
        });

        // 2. Chart Data (Jan - Dec Current Year)
        const months = [
          'Jan',
          'Feb',
          'Mar',
          'Apr',
          'Mei',
          'Jun',
          'Jul',
          'Ags',
          'Sep',
          'Okt',
          'Nov',
          'Des',
        ];
        const year = new Date().getFullYear();
        const cData = months.map((m, idx) => {
          const monthStr = `${year}-${String(idx + 1).padStart(2, '0')}`;
          const p = purchases
            .filter((x: any) => x.date?.startsWith(monthStr))
            .reduce((a: any, b: any) => a + (b.volume_mmscf || 0), 0);
          const u = usages
            .filter((x: any) => x.date?.startsWith(monthStr))
            .reduce(
              (a: any, b: any) =>
                a + (b.total_sm3 || b.evc_difference_sm3 || 0),
              0,
            );
          return { month: m, pengisian: p, pemakaian: u };
        });
        setChartData(cData);

        // 3. Deposit Warnings (Ambil 3 deposit paling kecil)
        const getCustomerName = (id: string) =>
          customers.find((c: any) => c.id === id)?.company_name || 'Unknown';
        const sortedDeposits = [...deposits]
          .sort((a, b) => a.amount - b.amount)
          .slice(0, 3)
          .map((d) => ({
            name: getCustomerName(d.customer_id),
            amount: d.amount,
          }));
        setWarnings(sortedDeposits);

        // 4. Recent Activities (Gabung Invoice, Purchase, Usage -> Sortir by date DESC -> Ambil 5)
        let acts: any[] = [];
        invoices.forEach((i: any) =>
          acts.push({
            id: i.invoice_number || 'INV',
            type: 'Invoice Terbit',
            date: i.date,
            desc: getCustomerName(i.customer_id),
            amount: `Rp ${(i.total_bill || 0).toLocaleString('id-ID')}`,
            status: 'Pending',
            isWarning: true,
            rawDate: new Date(i.date).getTime(),
          }),
        );
        purchases.forEach((p: any) =>
          acts.push({
            id: p.do_number || 'PO',
            type: 'Pengisian Gas',
            date: p.date,
            desc: 'Supplier Mother Station',
            amount: `${p.volume_mmscf || 0} MMSCF`,
            status: 'Selesai',
            isWarning: false,
            rawDate: new Date(p.date).getTime(),
          }),
        );
        usages.forEach((u: any) =>
          acts.push({
            id: 'USE',
            type: 'Pemakaian Gas',
            date: u.date,
            desc: getCustomerName(u.customer_id),
            amount: `${(u.total_sm3 || u.evc_difference_sm3 || 0).toFixed(2)} Sm3`,
            status: 'Tercatat',
            isWarning: false,
            rawDate: new Date(u.date).getTime(),
          }),
        );

        acts.sort((a, b) => b.rawDate - a.rawDate);
        setActivities(
          acts
            .slice(0, 5)
            .map((a) => ({
              ...a,
              date: format(new Date(a.date), 'dd MMM yyyy'),
            })),
        );
      } catch (error) {
        console.error('Gagal load dashboard', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className='h-[80vh] flex flex-col justify-center items-center text-muted-foreground'>
        <Loader2 className='w-8 h-8 animate-spin mb-4 text-primary' /> Memuat
        Data Dashboard...
      </div>
    );
  }

  return (
    <div className='space-y-6 animate-in fade-in zoom-in-95 duration-500'>
      <div>
        <h2 className='text-2xl font-heading font-bold tracking-tight'>
          Dashboard Eksekutif
        </h2>
        <p className='text-muted-foreground text-sm mt-1'>
          Ringkasan operasional gas dan finansial terkini (Live Data).
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        <StatsCard
          title='Total Pendapatan (Bulan Ini)'
          value={`Rp ${stats.pendapatan.toLocaleString('id-ID')}`}
          icon={TrendingUp}
          detail='Akumulasi dari tagihan invoice'
        />
        <StatsCard
          title='Volume Pengisian (MMSCF)'
          value={stats.volPengisian.toLocaleString('id-ID')}
          icon={Droplet}
          detail='Bulan ini'
        />
        <StatsCard
          title='Volume Pemakaian (Sm³)'
          value={stats.volPemakaian.toLocaleString('id-ID')}
          icon={Activity}
          detail='Bulan ini'
        />
        <StatsCard
          title='Customer Terdaftar'
          value={stats.customers.toString()}
          icon={Users}
          detail='Total database aktif'
        />
        <StatsCard
          title='Total Invoice Diterbitkan'
          value={stats.invBelumBayar.toString()}
          icon={FileWarning}
          detail='Menunggu konfirmasi pelunasan'
        />
        <StatsCard
          title='Total Deposit Tersimpan'
          value={`Rp ${stats.deposit.toLocaleString('id-ID')}`}
          icon={Wallet}
          detail='Kondisi likuiditas aman'
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2'>
          <TrendChart data={chartData} />
        </div>
        <div className='lg:col-span-1'>
          <DepositWidget warnings={warnings} />
        </div>
      </div>

      <div className='grid grid-cols-1'>
        <RecentActivity activities={activities} />
      </div>
    </div>
  );
}
