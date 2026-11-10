import React from 'react';
import { calculateExpiration } from '../logic/expiration';
import { AlertCircle, AlertTriangle, ShieldCheck, Clock } from 'lucide-react';

interface CountdownBadgeProps {
  expirationDate: string;
  referenceTime?: Date;
  compact?: boolean;
}

export const CountdownBadge: React.FC<CountdownBadgeProps> = ({
  expirationDate,
  referenceTime = new Date(),
  compact = false,
}) => {
  const calc = calculateExpiration(expirationDate, referenceTime);

  if (calc.isExpired) {
    return (
      <div className={`inline-flex items-center gap-1.5 font-medium rounded-lg border ${
        compact 
          ? 'px-2 py-0.5 text-xs bg-rose-950/70 text-rose-200 border-rose-700' 
          : 'px-2.5 py-1 text-xs bg-rose-950/80 text-rose-100 border-rose-600 shadow-sm'
      }`}>
        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
        <span className="font-bold text-rose-200">KEDALUWARSA</span>
        <span className="text-rose-300 font-mono text-[11px]">({calc.formattedCountdown})</span>
      </div>
    );
  }

  if (calc.isCritical) {
    return (
      <div className={`inline-flex items-center gap-1.5 font-medium rounded-lg border animate-pulse ${
        compact
          ? 'px-2 py-0.5 text-xs bg-red-950/80 text-red-100 border-red-600'
          : 'px-2.5 py-1 text-xs bg-red-950/90 text-red-100 border-red-500 shadow-sm'
      }`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <span className="font-bold text-red-300">KRITIS (≤7H)</span>
        <span className="font-mono font-bold text-white tracking-tight">{calc.formattedCountdown}</span>
      </div>
    );
  }

  if (calc.isWithin30Days) {
    return (
      <div className={`inline-flex items-center gap-1.5 font-medium rounded-lg border ${
        compact
          ? 'px-2 py-0.5 text-xs bg-amber-950/60 text-amber-200 border-amber-600'
          : 'px-2.5 py-1 text-xs bg-amber-950/70 text-amber-100 border-amber-500 shadow-sm'
      }`}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="font-bold text-amber-300">≤30 HARI</span>
        <span className="font-mono text-amber-100 font-medium">{calc.formattedCountdown}</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 font-medium rounded-lg border ${
      compact
        ? 'px-2 py-0.5 text-xs bg-emerald-950/60 text-emerald-200 border-emerald-700/70'
        : 'px-2.5 py-1 text-xs bg-emerald-950/70 text-emerald-100 border-emerald-600 shadow-sm'
    }`}>
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <span className="font-bold text-emerald-300">AMAN</span>
      <span className="font-mono text-emerald-100">{calc.formattedCountdown}</span>
    </div>
  );
};
