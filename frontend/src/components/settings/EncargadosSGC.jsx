// Encargados del SGC de un área o dirección: usuarios del portal que atienden los temas ISO ahí.
// Se guardan como lista de correos (encargados_sgc) en el catálogo; el usuario conserva su rol
// (p. ej. una auditora también puede ser encargada del SGC de su área).
import React, { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { getRolColor } from '../../constants';
import { puedeVerTodasAreas } from '../../constants/workflow';

export default function EncargadosSGC({ lista = [], onChange, usuarios = [], onCrear, area }) {
  const [sel, setSel] = useState('');
  const porCorreo = Object.fromEntries(usuarios.map((u) => [String(u.email).toLowerCase(), u]));
  const disponibles = usuarios.filter((u) => u.activo !== false && !lista.includes(String(u.email).toLowerCase()))
    .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es', { sensitivity: 'base' }));

  const agregar = () => {
    if (!sel) return;
    onChange([...lista, sel]);
    setSel('');
  };

  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-4 space-y-3">
      <div>
        <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Encargados del SGC</p>
        <p className="text-[11px] text-slate-500 mt-0.5">Quienes atienden los temas ISO aquí. Pueden ser varios y conservan su rol (un auditor también puede ser encargado).</p>
      </div>

      {lista.length === 0 ? (
        <p className="text-[11px] text-slate-500 italic">Sin encargados del SGC todavía.</p>
      ) : (
        <ul className="space-y-1.5">
          {lista.map((correo) => {
            const u = porCorreo[correo];
            const otraArea = area && u && !puedeVerTodasAreas(u) && u.area && u.area !== 'Por asignar' && u.area !== area;
            return (
              <li key={correo} className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{u?.nombre || correo}</p>
                  <p className="text-[11px] text-slate-500 truncate">{correo}{!u && ' · no es usuario del portal'}</p>
                  {otraArea && <p className="text-[11px] text-amber-700">Solo ve la información de su área principal: {u.area}</p>}
                </div>
                {u && <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getRolColor(u.rol)}`}>{u.rol}</span>}
                <button type="button" onClick={() => onChange(lista.filter((c) => c !== correo))} title="Quitar como encargado"
                  className="p-1 text-slate-400 hover:text-rose-600 rounded">
                  <X size={14} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <select value={sel} onChange={(e) => setSel(e.target.value)}
          className="flex-1 min-w-[220px] p-2 bg-white border border-slate-200 rounded-lg text-xs">
          <option value="">Agregar un usuario existente…</option>
          {disponibles.map((u) => (
            <option key={u.id} value={String(u.email).toLowerCase()}>{u.nombre} · {u.rol} · {u.area || 'sin área'}</option>
          ))}
        </select>
        <button type="button" onClick={agregar} disabled={!sel}
          className="px-3 py-2 text-xs font-bold text-sky-800 bg-white border border-sky-200 hover:bg-sky-50 disabled:opacity-50 rounded-lg">
          Agregar
        </button>
        <button type="button" onClick={onCrear}
          className="px-3 py-2 text-xs font-bold text-white bg-sky-700 hover:bg-sky-800 rounded-lg flex items-center gap-1">
          <UserPlus size={13} /> Crear usuario nuevo
        </button>
      </div>
    </div>
  );
}
