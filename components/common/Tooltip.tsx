import type { ReactElement, ReactNode } from 'react';

type TooltipProps = {
  content: ReactNode;
  children: ReactElement;
  align?: 'left' | 'center' | 'right';
  className?: string;
};

const ALIGN_CLASSES: Record<'left' | 'center' | 'right', string> = {
  left: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  right: 'right-0',
};

export default function Tooltip({ content, children, align = 'center', className = '' }: TooltipProps) {
  return (
    <span className={`relative inline-flex ${className} group`}> 
      {children}
      <span
        className={`pointer-events-none absolute top-full z-40 mt-2 hidden min-w-[180px] max-w-xs rounded-lg bg-slate-900/95 px-3 py-2 text-[11px] leading-relaxed text-slate-100 shadow-xl transition group-hover:block group-focus-within:block ${ALIGN_CLASSES[align]}`}
        role="tooltip"
      >
        {content}
      </span>
    </span>
  );
}
