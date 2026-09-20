import React from 'react';
import { LeadPriority } from '@/lib/types';
import { Flame, SunMedium, Snowflake } from 'lucide-react';

interface Props {
  priority: LeadPriority;
  interactive?: boolean;
  onChange?: (priority: LeadPriority) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function LeadPriorityBadge({
  priority,
  interactive = false,
  onChange,
  size = 'md',
}: Props) {
  const getBadgeStyle = (p: LeadPriority) => {
    switch (p) {
      case 'HOT':
        return 'bg-red-500/10 text-red-600 border-red-200 dark:border-red-900/50 dark:text-red-400';
      case 'WARM':
        return 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900/50 dark:text-amber-400';
      case 'COLD':
        return 'bg-sky-500/10 text-sky-600 border-sky-200 dark:border-sky-900/50 dark:text-sky-400';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getIcon = (p: LeadPriority, iconSize: number) => {
    switch (p) {
      case 'HOT':
        return <Flame size={iconSize} className="text-red-500" />;
      case 'WARM':
        return <SunMedium size={iconSize} className="text-amber-500" />;
      case 'COLD':
        return <Snowflake size={iconSize} className="text-sky-500" />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  if (interactive && onChange) {
    const priorities: LeadPriority[] = ['HOT', 'WARM', 'COLD'];
    return (
      <div className="inline-flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        {priorities.map((p) => {
          const isSelected = priority === p;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                isSelected
                  ? p === 'HOT'
                    ? 'bg-red-600 text-white shadow-sm'
                    : p === 'WARM'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {getIcon(p, 13)}
              {p}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border ${sizeClasses[size]} ${getBadgeStyle(
        priority
      )}`}
    >
      {getIcon(priority, iconSizes[size])}
      <span>{priority} LEAD</span>
    </span>
  );
}
