import {
  TrendingUp,
  Droplet,
  Users,
  FileWarning,
  Wallet,
  Activity,
} from 'lucide-react';
import { StatsCard } from '@/components/Dashboard/StatsCard';
import { TrendChart } from '@/components/Dashboard/TrendChart';
import { DepositWidget } from '@/components/Dashboard/DepositWidget';
import { RecentActivity } from '@/components/Dashboard/RecentActivity';

export default function OverviewPage() {
  return (
    <div className='space-y-6 animate-in fade-in zoom-in-95 duration-500'>
      <div>
        <h2 className='text-2xl font-heading font-bold tracking-tight'>
          Dashboard Eksekutif
        </h2>
        <p className='text-muted-foreground text-sm mt-1'>
          Ringkasan operasional gas dan finansial terkini.
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        <StatsCard
          title='Total Pendapatan (Bulan Ini)'
          value='Rp 1.240.500.000'
          icon={TrendingUp}
          detail='+12.5% vs bulan lalu'
        />
        <StatsCard
          title='Volume Pengisian (Sm³)'
          value='45,230'
          icon={Droplet}
          detail='Dari 3 Supplier Aktif'
        />
        <StatsCard
          title='Volume Pemakaian (Sm³)'
          value='41,100'
          icon={Activity}
          detail='Terdistribusi ke 12 GTM'
        />
        <StatsCard
          title='Customer Aktif'
          value='24'
          icon={Users}
          detail='2 Kontrak mendekati expired'
        />
        <StatsCard
          title='Invoice Belum Dibayar'
          value='8'
          icon={FileWarning}
          detail='Total: Rp 320.500.000'
        />
        <StatsCard
          title='Total Deposit Tersimpan'
          value='Rp 450.000.000'
          icon={Wallet}
          detail='Kondisi likuiditas aman'
        />
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <div className='lg:col-span-2'>
          <TrendChart />
        </div>
        <div className='lg:col-span-1'>
          <DepositWidget />
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className='grid grid-cols-1'>
        <RecentActivity />
      </div>
    </div>
  );
}
