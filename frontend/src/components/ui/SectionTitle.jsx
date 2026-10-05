import React from 'react';

export function SectionTitle({ icon, title, subtitle, required, action }) {
  return (
    <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-4">
      <div className="flex items-center gap-2.5">
        {icon && (
          <span className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center text-sm font-bold">
            {icon}
          </span>
        )}
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5 m-0">
            {title}
            {required && <span className="text-rose-500 text-sm font-mono">*</span>}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 font-medium mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export default SectionTitle;
