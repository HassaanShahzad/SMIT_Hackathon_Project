import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          className={cn(
            'flex min-h-[80px] w-full rounded-xl border border-[#F0F1F5] dark:border-[#222222] bg-white dark:bg-[#111111] px-3 py-2 text-sm text-[#1A1D26] dark:text-[#EDEDED] shadow-sm transition-colors placeholder:text-[#7D8592] dark:placeholder:text-[#888888] focus-visible:border-[#5D5FEF] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5D5FEF] disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-500',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
