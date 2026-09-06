import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'purple'
    | 'sky';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-[#5D5FEF] text-white border-transparent',
    secondary: 'bg-[#ECEBFF] dark:bg-[#1A1A1A] text-[#5D5FEF] dark:text-[#EDEDED] border-[#F0F1F5] dark:border-[#222222]',
    destructive: 'bg-[#FF754C] text-white border-transparent',
    outline: 'text-[#1A1D26] dark:text-[#EDEDED] border-[#F0F1F5] dark:border-[#222222]',
    success: 'bg-[#E3F7FF] dark:bg-[#1A1A1A] text-[#0098DA] dark:text-[#00D2B4] border-[#0098DA]/30',
    warning: 'bg-[#FFF8E1] dark:bg-[#1A1A1A] text-[#F57C00] dark:text-[#FFB74D] border-[#FFB74D]/30',
    purple: 'bg-[#ECEBFF] dark:bg-[#1A1A1A] text-[#6C5DD3] dark:text-purple-400 border-[#6C5DD3]/30',
    sky: 'bg-[#E3F7FF] dark:bg-[#1A1A1A] text-[#0098DA] dark:text-sky-400 border-[#0098DA]/30',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors select-none',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
