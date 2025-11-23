'use client';

import { CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';
import { AutoSaveStatus } from '@/lib/hooks/use-auto-save';

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSavedAt: Date | null;
  className?: string;
}

export function AutoSaveIndicator({
  status,
  lastSavedAt,
  className = '',
}: AutoSaveIndicatorProps) {
  const getStatusInfo = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Saving...',
          className: 'text-blue-600',
          iconClassName: 'animate-spin',
        };
      case 'saved':
        return {
          icon: CheckCircle2,
          text: lastSavedAt
            ? `Saved at ${lastSavedAt.toLocaleTimeString()}`
            : 'Saved',
          className: 'text-green-600',
          iconClassName: '',
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Save failed',
          className: 'text-red-600',
          iconClassName: '',
        };
      default:
        return {
          icon: Clock,
          text: 'Not saved',
          className: 'text-muted-foreground',
          iconClassName: '',
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div
      className={`flex items-center gap-2 text-sm ${statusInfo.className} ${className}`}
    >
      <Icon className={`h-4 w-4 ${statusInfo.iconClassName}`} />
      <span>{statusInfo.text}</span>
    </div>
  );
}

