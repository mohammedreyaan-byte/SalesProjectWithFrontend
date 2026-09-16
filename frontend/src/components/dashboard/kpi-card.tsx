'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface KPICardProps {
  label: string;
  value: number | string;
  change?: number;
  comparison?: string;
  icon?: React.ReactNode;
  format?: 'currency' | 'number' | 'raw';
  className?: string;
}

export function KPICard({ label, value, change, comparison, icon, format = 'currency', className }: KPICardProps) {
  const formattedValue = typeof value === 'number'
    ? format === 'currency'
      ? formatCurrency(value)
      : format === 'number'
      ? formatNumber(value)
      : value.toString()
    : value;

  const changeColor = change !== undefined
    ? change >= 0
      ? 'text-green-600 dark:text-green-400'
      : 'text-red-600 dark:text-red-400'
    : 'text-muted-foreground';

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold tracking-tight">{formattedValue}</p>
            {(change !== undefined || comparison) && (
              <div className="flex items-center gap-1 text-sm">
                {change !== undefined && (
                  <span className={cn('font-medium', changeColor)}>
                    {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                  </span>
                )}
                {comparison && (
                  <span className="text-muted-foreground">{comparison}</span>
                )}
              </div>
            )}
          </div>
          {icon && (
            <div className="p-3 rounded-lg bg-muted/50 text-muted-foreground shrink-0">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}