import React from 'react';
import { CheckCircle2, AlertCircle, TrendingUp, BookOpen, Clock, Heart, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';

export const Card: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({ children, className, id }) => (
  <div id={id} className={cn("border border-neutral-800 bg-neutral-900/30 p-6", className)}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; isLoading?: boolean; size?: 'sm' | 'md' | 'lg' }> = ({ 
  children, className, variant = 'primary', isLoading, disabled, size = 'md', ...props 
}) => {
  const variants = {
    primary: 'bg-white text-black hover:bg-emerald-400 font-black uppercase tracking-[0.2em]',
    secondary: 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 font-bold uppercase tracking-wider',
    danger: 'bg-red-950/30 text-red-500 border border-red-900/50 hover:bg-red-900/30 font-bold uppercase tracking-wider',
    ghost: 'bg-transparent text-neutral-500 hover:text-white border border-transparent hover:border-neutral-800 font-bold uppercase tracking-wider',
  };

  const sizes = {
    sm: 'px-4 py-2 text-[10px]',
    md: 'px-6 py-4 text-xs',
    lg: 'px-8 py-5 text-sm',
  };

  return (
    <button 
      disabled={isLoading || disabled}
      className={cn(
        "flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : children}
    </button>
  );
};

export const Badge: React.FC<{ children: React.ReactNode; color?: 'emerald' | 'blue' | 'orange' | 'red' | 'neutral' }> = ({ children, color = 'neutral' }) => {
  const colors = {
    emerald: 'border-emerald-900/30 bg-emerald-950/30 text-emerald-400',
    blue: 'border-blue-900/30 bg-blue-950/30 text-blue-400',
    orange: 'border-orange-900/30 bg-orange-950/30 text-orange-400',
    red: 'border-red-900/30 bg-red-950/30 text-red-500',
    neutral: 'border-neutral-800 bg-neutral-900 text-neutral-400',
  };
  return (
    <span className={cn("inline-flex items-center border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider", colors[color])}>
      {children}
    </span>
  );
};
