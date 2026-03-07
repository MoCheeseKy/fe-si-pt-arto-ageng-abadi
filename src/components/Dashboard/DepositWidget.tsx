import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileWarning } from 'lucide-react';

export function DepositWidget({ warnings }: { warnings: any[] }) {
  return (
    <Card className='bg-card border-border shadow-sm border-t-4 border-t-destructive h-full flex flex-col'>
      <CardHeader className='pb-3'>
        <CardTitle className='font-heading text-destructive flex items-center gap-2 text-base'>
          <FileWarning className='w-4 h-4' /> Deposit Terendah
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 flex-1'>
        {warnings.length === 0 ? (
          <p className='text-xs text-muted-foreground'>
            Tidak ada data deposit.
          </p>
        ) : (
          warnings.map((c, i) => (
            <div
              key={i}
              className='p-3 rounded-lg bg-background border border-border transition-colors hover:border-destructive/50'
            >
              <div className='flex justify-between items-start mb-1'>
                <span className='text-sm font-semibold text-foreground truncate mr-2'>
                  {c.name}
                </span>
                {c.amount < 5000000 && (
                  <Badge variant='destructive' className='text-[10px] shrink-0'>
                    Kritis
                  </Badge>
                )}
              </div>
              <div className='flex justify-between text-xs mt-2'>
                <span className='text-muted-foreground'>Sisa Saldo:</span>
                <span
                  className={`font-bold ${c.amount < 5000000 ? 'text-destructive' : 'text-emerald-500'}`}
                >
                  Rp {c.amount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
