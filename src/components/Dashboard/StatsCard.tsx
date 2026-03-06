import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  detail: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  detail,
}: StatsCardProps) {
  return (
    <Card className='bg-card border-border shadow-sm hover:shadow-md transition-shadow'>
      <CardHeader className='flex flex-row items-center justify-between pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {title}
        </CardTitle>
        <Icon className='h-4 w-4 text-primary opacity-80' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold text-foreground'>{value}</div>
        <p className='text-xs text-muted-foreground mt-1'>{detail}</p>
      </CardContent>
    </Card>
  );
}
