import React from 'react';
import { getEstadoColor, getEstadoLabel } from '../../constants/estados';

export function StatusBadge({ estado, size = 'md', showDot = true }) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  };

  const getDotColor = (est) => {
    switch (est) {
      case 'APROBADO':
      case 'CERRADO':
      case 'EFECTIVA':
        return 'bg-emerald-500';
      case 'EN_SEGUIMIENTO':
      case 'EN_REVISION':
        return 'bg-sky-500';
      case 'RECHAZADO':
      case 'NO_EFECTIVA':
        return 'bg-rose-500';
      case 'BORRADOR':
        return 'bg-slate-400';
      default:
        return 'bg-amber-500';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs font-medium tracking-tight ${getEstadoColor(estado)} ${sizeClasses[size]}`}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(estado)}`} />
      )}
      {getEstadoLabel(estado)}
    </span>
  );
}

export default StatusBadge;
