import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileWarning, PlusCircle } from 'lucide-react';

const warnings = [
  {
    name: 'PT. Industri Maju Abadi',
    sisa: 'Rp 2.500.000',
    minimum: 'Rp 5.000.000',
  },
  { name: 'PT. Tekno Pangan', sisa: 'Rp 500.000', minimum: 'Rp 10.000.000' },
];

export function DepositWidget() {
  return (
    <Card className='bg-card border-border shadow-sm border-t-4 border-t-destructive h-full flex flex-col'>
      <CardHeader className='pb-3'>
        <CardTitle className='font-heading text-destructive flex items-center gap-2 text-base'>
          <FileWarning className='w-4 h-4' />
          Warning Deposit Kritis
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4 flex-1'>
        {warnings.map((c, i) => (
          <div
            key={i}
            className='p-3 rounded-lg bg-background border border-border transition-colors hover:border-destructive/50'
          >
            <div className='flex justify-between items-start mb-1'>
              <span className='text-sm font-semibold text-foreground truncate mr-2'>
                {c.name}
              </span>
              <Badge variant='destructive' className='text-[10px] shrink-0'>
                Kritis
              </Badge>
            </div>
            <div className='flex justify-between text-xs mt-2'>
              <span className='text-muted-foreground'>Sisa Saldo:</span>
              <span className='font-bold text-destructive'>{c.sisa}</span>
            </div>
            <div className='flex justify-between text-xs mt-1'>
              <span className='text-muted-foreground'>Batas Minimum:</span>
              <span className='text-foreground'>{c.minimum}</span>
            </div>
          </div>
        ))}

        <div className='pt-2'>
          <Button
            variant='outline'
            className='w-full text-xs h-9 border-dashed border-border hover:border-primary hover:text-primary transition-all bg-transparent'
          >
            <PlusCircle className='w-3 h-3 mr-2' />
            Top Up Saldo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
