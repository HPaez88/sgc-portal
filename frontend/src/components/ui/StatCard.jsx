import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendUp, 
  benchmark = 'vs mes anterior',
  accent = 'blue',
  onClick 
}) {
  const accentColors = {
    blue: {
      bar: 'from-sky-500 to-blue-600',
      iconBg: 'bg-sky-50 text-sky-600 border-sky-100',
      badge: 'bg-sky-50 text-sky-700 border-sky-200/60',
    },
    emerald: {
      bar: 'from-emerald-500 to-teal-600',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    },
    amber: {
      bar: 'from-amber-400 to-orange-500',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      badge: 'bg-amber-50 text-amber-700 border-amber-200/60',
    },
    rose: {
      bar: 'from-rose-500 to-red-600',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      badge: 'bg-rose-50 text-rose-700 border-rose-200/60',
    },
    indigo: {
      bar: 'from-indigo-500 to-navy-900',
      iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200/60',
    }
  };

  const selectedAccent = accentColors[accent] || accentColors.blue;

  return (
    <div 
      onClick={onClick}
      className="group bg-white rounded-xl border border-slate-200/80 shadow-card-subtle hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between p-5"
    >
      {/* Top Accent Micro-line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${selectedAccent.bar} opacity-85 group-hover:h-1.5 transition-all`} />

      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          {Icon && (
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${selectedAccent.iconBg} group-hover:scale-105 transition-transform duration-200 shrink-0`}>
              <Icon size={18} strokeWidth={2.2} />
            </div>
          )}
        </div>

        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono font-tabular">
            {value}
          </h3>
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded border text-[11px] ${
              trendUp ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-rose-50 text-rose-700 border-rose-200/60'
            }`}>
              {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {trend}
            </span>
            <span className="text-slate-400 font-medium text-[11px]">{benchmark}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatCard;
