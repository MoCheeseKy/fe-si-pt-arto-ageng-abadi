import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function RecentActivity({ activities }: { activities: any[] }) {
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
              </tr>
            </thead>
            <tbody className='divide-y divide-border bg-background/50'>
              {activities.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className='text-center py-4 text-muted-foreground'
                  >
                    Belum ada aktivitas.
                  </td>
                </tr>
              ) : (
                activities.map((item, idx) => (
                  <tr key={idx} className='hover:bg-muted/10 transition-colors'>
                    <td className='px-4 py-3'>
                      <div className='font-medium text-foreground'>
                        {item.id}
                      </div>
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
                        variant='outline'
                        className={
                          item.isWarning
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                        }
                      >
                        {item.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
