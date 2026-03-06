'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, FileText, MoreHorizontal, Printer } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const activities = [
  {
    id: 'DO-2510-001',
    type: 'Pengisian Gas',
    date: '24 Okt 2025',
    desc: 'PT. Supplier Gas Bumi',
    amount: '12,000 Sm³',
    status: 'Selesai',
    isWarning: false,
  },
  {
    id: 'USE-2510-089',
    type: 'Pemakaian Gas',
    date: '24 Okt 2025',
    desc: 'PT. Industri Maju Abadi',
    amount: '4,500 Sm³',
    status: 'Selesai',
    isWarning: false,
  },
  {
    id: 'INV-2510-045',
    type: 'Invoice',
    date: '23 Okt 2025',
    desc: 'Tagihan PT. Tekno Pangan',
    amount: 'Rp 45.000.000',
    status: 'Pending',
    isWarning: true,
  },
];

export function RecentActivity() {
  return (
    <Card className='bg-card border-border shadow-sm'>
      <CardHeader>
        <CardTitle className='font-heading text-lg'>
          Aktivitas Transaksi Terbaru
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='overflow-x-auto rounded-md border border-border'>
          <table className='w-full text-sm text-left'>
            <thead className='bg-muted/40 text-muted-foreground font-heading'>
              <tr>
                <th className='px-4 py-3 font-semibold border-b border-border'>
                  ID Referensi
                </th>
                <th className='px-4 py-3 font-semibold border-b border-border'>
                  Keterangan
                </th>
                <th className='px-4 py-3 font-semibold border-b border-border'>
                  Nilai/Volume
                </th>
                <th className='px-4 py-3 font-semibold border-b border-border'>
                  Status
                </th>
                <th className='px-4 py-3 font-semibold border-b border-border text-center'>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border bg-background/50'>
              {activities.map((item) => (
                <tr
                  key={item.id}
                  className='hover:bg-muted/10 transition-colors'
                >
                  <td className='px-4 py-3'>
                    <div className='font-medium text-foreground'>{item.id}</div>
                    <div className='text-xs text-muted-foreground'>
                      {item.type}
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <div className='text-foreground'>{item.desc}</div>
                    <div className='text-xs text-muted-foreground'>
                      {item.date}
                    </div>
                  </td>
                  <td className='px-4 py-3 font-semibold text-foreground'>
                    {item.amount}
                  </td>
                  <td className='px-4 py-3'>
                    <Badge
                      variant={item.isWarning ? 'secondary' : 'default'}
                      className={
                        item.isWarning
                          ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                      }
                    >
                      {item.status}
                    </Badge>
                  </td>
                  <td className='px-4 py-3 text-center'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='h-8 w-8 text-muted-foreground hover:text-foreground'
                        >
                          <MoreHorizontal className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        className='bg-card border-border w-48'
                      >
                        <DropdownMenuItem className='cursor-pointer'>
                          <Eye className='mr-2 h-4 w-4' /> Lihat Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem className='cursor-pointer'>
                          <Printer className='mr-2 h-4 w-4' /> Cetak Dokumen
                        </DropdownMenuItem>
                        <DropdownMenuItem className='cursor-pointer text-primary focus:text-primary'>
                          <FileText className='mr-2 h-4 w-4' /> Export Excel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
