import * as React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, children, disabled, ...props }, ref) => {
    const baseClasses =
      'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5D5FEF]/50 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer';

    const variants = {
      default:
        'bg-[#5D5FEF] hover:bg-[#4E50E6] text-white dark:bg-white dark:text-black dark:hover:bg-slate-200 shadow-sm active:scale-[0.98]',
      destructive:
        'bg-[#FF754C] text-white shadow-sm hover:bg-[#FF754C]/90 active:scale-[0.98]',
      outline:
        'border border-[#F0F1F5] dark:border-[#222222] bg-white dark:bg-[#0A0A0A] text-[#1A1D26] dark:text-[#EDEDED] hover:bg-[#F6F7FB] dark:hover:bg-[#111111] active:scale-[0.98]',
      secondary:
        'bg-[#ECEBFF] dark:bg-[#1A1A1A] text-[#5D5FEF] dark:text-white hover:bg-[#ECEBFF]/80 dark:hover:bg-[#222222] active:scale-[0.98]',
      ghost:
        'text-[#7D8592] dark:text-[#888888] hover:bg-[#F6F7FB] dark:hover:bg-[#111111] hover:text-[#1A1D26] dark:hover:text-white',
      link:
        'text-[#5D5FEF] dark:text-indigo-400 underline-offset-4 hover:underline p-0 h-auto',
    };

    const sizes = {
      default: 'h-9 px-3.5 py-2',
      sm: 'h-7 rounded-lg px-2.5 text-xs',
      lg: 'h-11 rounded-xl px-6 text-base',
      icon: 'h-8 w-8',
    };

    return (
      <button
        type={props.type || 'button'}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
