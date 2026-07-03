import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function GlassCard({ children, className, hoverable = false, ...props }: GlassCardProps) {
  return (
    <div
      className={twMerge(
        "glass-panel rounded-2xl p-6 text-slate-100",
        hoverable && "glass-panel-hover",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
