import React from 'react';
import { getEstadoColor, getEstadoLabel } from '../../constants/estados';

export function StatusBadge({ estado, size = 'md' }) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs font-semibold',
    lg: 'px-4 py-1.5 text-sm font-semibold'
  };
  return (
    <span className={`inline-flex items-center rounded-full border ${getEstadoColor(estado)} ${sizeClasses[size]}`}>
      {getEstadoLabel(estado)}
    </span>
  );
}

export default StatusBadge;
