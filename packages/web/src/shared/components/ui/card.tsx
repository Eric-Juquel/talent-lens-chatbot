import type { ComponentPropsWithRef } from 'react';
import { cn } from '@/shared/lib/utils';

export function Card({ className, ...props }: ComponentPropsWithRef<'div'>) {
  return (
    <div
      className={cn('rounded-xl border border-border bg-card text-card-foreground shadow-sm', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentPropsWithRef<'div'>) {
  return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentPropsWithRef<'h3'>) {
  return <h3 className={cn('text-lg font-semibold leading-none', className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentPropsWithRef<'div'>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}
