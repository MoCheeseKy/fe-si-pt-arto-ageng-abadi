'use client';

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

const data = [
  { month: 'Jan', pengisian: 42000, pemakaian: 38000 },
  { month: 'Feb', pengisian: 45000, pemakaian: 41000 },
  { month: 'Mar', pengisian: 48000, pemakaian: 46000 },
  { month: 'Apr', pengisian: 43000, pemakaian: 44000 },
  { month: 'Mei', pengisian: 50000, pemakaian: 48000 },
  { month: 'Jun', pengisian: 55000, pemakaian: 52000 },
];

export function TrendChart() {
  return (
    <Card className='bg-card border-border shadow-sm'>
      <CardHeader>
        <CardTitle className='font-heading text-lg'>
          Tren Volume Gas (Sm³)
        </CardTitle>
        <CardDescription>
          Komparasi pengisian vs pemakaian 6 bulan terakhir
        </CardDescription>
      </CardHeader>
      <CardContent className='h-[300px] w-full mt-4'>
        <ResponsiveContainer width='100%' height='100%'>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id='colorPengisian' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-primary)'
                  stopOpacity={0.3}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-primary)'
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id='colorPemakaian' x1='0' y1='0' x2='0' y2='1'>
                <stop
                  offset='5%'
                  stopColor='var(--color-secondary)'
                  stopOpacity={0.3}
                />
                <stop
                  offset='95%'
                  stopColor='var(--color-secondary)'
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray='3 3'
              vertical={false}
              stroke='var(--border)'
            />
            <XAxis
              dataKey='month'
              stroke='var(--muted-foreground)'
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke='var(--muted-foreground)'
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '8px',
                color: 'var(--foreground)',
              }}
              itemStyle={{ color: 'var(--foreground)' }}
            />
            <Area
              type='monotone'
              dataKey='pengisian'
              name='Pengisian'
              stroke='var(--color-primary)'
              strokeWidth={2}
              fillOpacity={1}
              fill='url(#colorPengisian)'
            />
            <Area
              type='monotone'
              dataKey='pemakaian'
              name='Pemakaian'
              stroke='var(--color-secondary)'
              strokeWidth={2}
              fillOpacity={1}
              fill='url(#colorPemakaian)'
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
