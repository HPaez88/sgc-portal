import React, { useState } from 'react';
import { AREAS, DIRECCIONES, PROCESOS } from '../../constants';
import { Plus, ShieldAlert, Target, Shield, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RiesgosView({ riesgos, setRiesgos, usuarios, puedeTodasAreas, areaUsuario }) {
  const safeRiesgos = riesgos || [];
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoRiesgo, setNuevoRiesgo] = useState({ 
    riesgo: '', causa: '', efecto: '', probabilidad: 2, impacto: 2, 
    control: '', tipo: 'Riesgo', area: '', direccion: '', proceso: '',
    plan_accion: '', fecha_termino: '', evaluacion: '', estado_plan: 'SIN_PLAN'
  });

  const getNivel = (prob, imp) => prob * imp;
  
  const getColorNivelBadge = (nivel) => {
    if (nivel >= 15) return "bg-red-100 text-red-700 border-red-200";
    if (nivel >= 10) return "bg-orange-100 text-orange-700 border-orange-200";
    if (nivel >= 5) return "bg-yellow-100 text-yellow-700 border-yellow-300";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  const agregarRiesgo = () => {
    if (!nuevoRiesgo.riesgo) return;
    setRiesgos(prev => [...(prev || []), { ...nuevoRiesgo, id: (prev || []).length + 1 }]);
    setNuevoRiesgo({ riesgo: '', causa: '', efecto: '', probabilidad: 2, impacto: 2, control: '', tipo: 'Riesgo', area: '', direccion: '', proceso: '', plan_accion: '', fecha_termino: '', evaluacion: '', estado_plan: 'SIN_PLAN' });
    setMostrarModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Resumen / Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <div className="glass-card-dark p-5 rounded-xl border border-cyan-500/20 shadow-sm flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-16 h-16 bg-red-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={18} className="text-red-500" />
            <p className="text-sm font-bold text-slate-400">Riesgos Altos</p>
          </div>
          <p className="text-3xl font-black text-red-600">{safeRiesgos.filter(r => r.tipo === 'Riesgo' && getNivel(r.probabilidad, r.impacto) >= 10).length}</p>
        </div>
        <div className="glass-card-dark p-5 rounded-xl border border-cyan-500/20 shadow-sm flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-16 h-16 bg-amber-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <p className="text-sm font-bold text-slate-400">Riesgos Medios</p>
          </div>
          <p className="text-3xl font-black text-amber-500">{safeRiesgos.filter(r => r.tipo === 'Riesgo' && getNivel(r.probabilidad, r.impacto) >= 5 && getNivel(r.probabilidad, r.impacto) < 10).length}</p>
        </div>
        <div className="glass-card-dark p-5 rounded-xl border border-cyan-500/20 shadow-sm flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-16 h-16 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-2 mb-2">
            <Shield size={18} className="text-emerald-500" />
            <p className="text-sm font-bold text-slate-400">Riesgos Bajos</p>
          </div>
          <p className="text-3xl font-black text-emerald-500">{safeRiesgos.filter(r => r.tipo === 'Riesgo' && getNivel(r.probabilidad, r.impacto) < 5).length}</p>
        </div>
        <div className="glass-card-dark p-5 rounded-xl border border-cyan-500/20 shadow-sm flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-16 h-16 bg-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center gap-2 mb-2">
            <Target size={18} className="text-blue-500" />
            <p className="text-sm font-bold text-slate-400">Oportunidades</p>
          </div>
          <p className="text-3xl font-black text-blue-600">{safeRiesgos.filter(r => r.tipo === 'Oportunidad').length}</p>
        </div>
      </div>

      {/* Tabla Matriz */}
      <div className="glass-card-dark rounded-2xl shadow-sm border border-cyan-500/20 overflow-hidden">
        <div className="px-6 py-4 glass-card-dark-header border-b border-cyan-500/20 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-2xl bg-cyan-100 p-2 rounded-lg"><ShieldAlert className="text-cyan-600" /></span>
            <div>
              <h2 className="text-xl font-bold text-white">Matriz de Riesgos y Oportunidades</h2>
              <p className="text-sm text-slate-400 font-medium">Gestión y evaluación de riesgos por proceso</p>
            </div>
          </div>
          <button onClick={() => setMostrarModal(true)} className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-bold hover:bg-cyan-600 transition-colors shadow-sm">
            <Plus size={16} strokeWidth={3} /> Nuevo Riesgo
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="p-4 text-sm font-bold text-slate-300 whitespace-nowrap">Riesgo / Oportunidad</th>
                <th className="p-4 text-sm font-bold text-slate-300">Área / Proceso</th>
                <th className="p-4 text-sm font-bold text-slate-300 text-center">Prob.</th>
                <th className="p-4 text-sm font-bold text-slate-300 text-center">Imp.</th>
                <th className="p-4 text-sm font-bold text-slate-300 text-center">Nivel</th>
                <th className="p-4 text-sm font-bold text-slate-300">Plan de Acción (Control)</th>
                <th className="p-4 text-sm font-bold text-slate-300">Fecha Límite</th>
                <th className="p-4 text-sm font-bold text-slate-300">Evaluación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-500/10">
              {safeRiesgos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">No hay riesgos registrados.</td>
                </tr>
              ) : safeRiesgos.map(r => {
                const nivel = getNivel(r.probabilidad, r.impacto);
                return (
                  <tr key={r.id} className="hover:bg-white/5/50 transition-colors">
                    <td className="p-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${r.tipo === 'Oportunidad' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                          {r.tipo}
                        </span>
                        <p className="font-medium text-white">{r.riesgo}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-semibold text-slate-300">{r.area || '-'}</p>
                      <p className="text-xs text-slate-400">{r.proceso || '-'}</p>
                    </td>
                    <td className="p-4 text-center">
                      <select 
                        value={r.probabilidad}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setRiesgos(prev => prev.map(x => x.id === r.id ? {...x, probabilidad: val} : x));
                        }}
                        className="p-1.5 text-center text-sm font-bold text-slate-300 glass-card-dark-header border border-cyan-500/20 rounded-lg hover:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                      >
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      <select 
                        value={r.impacto}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setRiesgos(prev => prev.map(x => x.id === r.id ? {...x, impacto: val} : x));
                        }}
                        className="p-1.5 text-center text-sm font-bold text-slate-300 glass-card-dark-header border border-cyan-500/20 rounded-lg hover:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                      >
                        {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </td>
                    <td className="p-4 text-center">
                      <div className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full font-black border ${getColorNivelBadge(nivel)}`}>
                        {nivel}
                      </div>
                    </td>
                    <td className="p-4">
                      <textarea 
                        value={r.plan_accion || ''}
                        onChange={(e) => setRiesgos(prev => prev.map(x => x.id === r.id ? {...x, plan_accion: e.target.value} : x))}
                        placeholder="Describir acción..."
                        className="p-2 text-sm glass-card-dark-header border border-cyan-500/20 rounded-lg w-full resize-none h-10 focus:h-20 focus:glass-card-dark focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                      />
                    </td>
                    <td className="p-4">
                      <input 
                        type="date"
                        value={r.fecha_termino || ''}
                        onChange={(e) => setRiesgos(prev => prev.map(x => x.id === r.id ? {...x, fecha_termino: e.target.value} : x))}
                        className="p-1.5 text-sm font-medium text-slate-300 glass-card-dark-header border border-cyan-500/20 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </td>
                    <td className="p-4">
                      <select 
                        value={r.evaluacion || ''}
                        onChange={(e) => setRiesgos(prev => prev.map(x => x.id === r.id ? {...x, evaluacion: e.target.value} : x))}
                        className="p-1.5 text-sm font-bold text-slate-300 glass-card-dark-header border border-cyan-500/20 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="">Evaluar...</option>
                        <option value="Bueno" className="text-emerald-600">🟢 Efectivo</option>
                        <option value="Regular" className="text-amber-500">🟡 Parcial</option>
                        <option value="Malo" className="text-red-500">🔴 Inefectivo</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Riesgo */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card-dark rounded-2xl p-0 w-full max-w-xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="px-6 py-4 bg-gradient-to-r from-[#002855] to-[#00152e] flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2"><ShieldAlert size={18} /> Registrar Riesgo / Oportunidad</h3>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Tipo de Registro</label>
                <div className="flex bg-[#00152e]/50 p-1 rounded-lg border border-cyan-500/20">
                  <button 
                    onClick={() => setNuevoRiesgo({...nuevoRiesgo, tipo: 'Riesgo'})} 
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${nuevoRiesgo.tipo === 'Riesgo' ? 'glass-card-dark shadow-sm text-red-600' : 'text-slate-400 hover:bg-white/5'}`}
                  >Riesgo</button>
                  <button 
                    onClick={() => setNuevoRiesgo({...nuevoRiesgo, tipo: 'Oportunidad'})} 
                    className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${nuevoRiesgo.tipo === 'Oportunidad' ? 'glass-card-dark shadow-sm text-blue-600' : 'text-slate-400 hover:bg-white/5'}`}
                  >Oportunidad</button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-1.5">Descripción del {nuevoRiesgo.tipo}</label>
                <input value={nuevoRiesgo.riesgo} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, riesgo: e.target.value})} className="w-full p-2.5 glass-card-dark-header border border-cyan-500/20 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:glass-card-dark outline-none" placeholder={`Describa el ${nuevoRiesgo.tipo.toLowerCase()}...`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">Área / Departamento</label>
                  <select value={nuevoRiesgo.area} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, area: e.target.value})} className="w-full p-2.5 glass-card-dark-header border border-cyan-500/20 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none">
                    <option value="">Seleccionar...</option>
                    {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1.5">Proceso Relacionado</label>
                  <select value={nuevoRiesgo.proceso} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, proceso: e.target.value})} className="w-full p-2.5 glass-card-dark-header border border-cyan-500/20 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none">
                    <option value="">Seleccionar...</option>
                    {PROCESOS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 p-4 glass-card-dark-header rounded-xl border border-cyan-500/20">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1.5 flex justify-between">Probabilidad <span>{nuevoRiesgo.probabilidad}</span></label>
                  <input type="range" min="1" max="5" value={nuevoRiesgo.probabilidad} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, probabilidad: parseInt(e.target.value)})} className="w-full accent-cyan-500" />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1"><span>Baja (1)</span><span>Alta (5)</span></div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-1.5 flex justify-between">Impacto <span>{nuevoRiesgo.impacto}</span></label>
                  <input type="range" min="1" max="5" value={nuevoRiesgo.impacto} onChange={(e) => setNuevoRiesgo({...nuevoRiesgo, impacto: parseInt(e.target.value)})} className="w-full accent-cyan-500" />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1"><span>Leve (1)</span><span>Crítico (5)</span></div>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 glass-card-dark-header border-t border-slate-100 flex gap-3">
              <button onClick={() => setMostrarModal(false)} className="flex-1 px-4 py-2.5 border border-cyan-500/20 glass-card-dark font-bold text-slate-300 rounded-lg hover:glass-card-dark-header transition-colors">Cancelar</button>
              <button onClick={agregarRiesgo} disabled={!nuevoRiesgo.riesgo} className="flex-1 px-4 py-2.5 bg-cyan-500 text-white font-bold rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex justify-center items-center gap-2">
                <CheckCircle2 size={18} /> Registrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}