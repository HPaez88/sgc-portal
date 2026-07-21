import React from 'react';

export function StatCard({ title, value, icon: Icon, trend, trendUp, color = 'cyan' }) {
  return (
    <div className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer relative overflow-hidden">
      <div className="absolute -right-6 -top-6 bg-cyan-50/50 w-24 h-24 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white">{value}</h3>
        </div>
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md group-hover:rotate-6 transition-transform duration-300">
            <Icon size={24} />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm relative z-10">
          <span className={trendUp ? 'text-emerald-500 font-medium' : 'text-amber-500 font-medium'}>{trend}</span>
          <span className="text-slate-500 ml-2">vs mes anterior</span>
        </div>
      )}
    </div>
  );
}

export default StatCard;
