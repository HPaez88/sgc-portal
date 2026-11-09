// Subdirecciones de una dirección: nombre, encargado y correo. Las áreas eligen una de esta lista.
import React from 'react';
import { Plus, X } from 'lucide-react';

const campo = 'w-full p-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none';

export default function SubdireccionesEditor({ lista = [], onChange }) {
  const cambiar = (id, campoNombre, valor) => onChange(lista.map((s) => (s.id === id ? { ...s, [campoNombre]: valor } : s)));

  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Subdirecciones</p>
        <button type="button" onClick={() => onChange([...lista, { id: Date.now(), nombre: '', encargado: '', correo: '' }])}
          className="px-3 py-1.5 text-xs font-bold text-purple-800 bg-white border border-purple-200 hover:bg-purple-50 rounded-lg flex items-center gap-1">
          <Plus size={13} /> Agregar subdirección
        </button>
      </div>
      {lista.length === 0 ? (
        <p className="text-[11px] text-slate-500 italic">Esta dirección no tiene subdirecciones.</p>
      ) : (
        <ul className="space-y-2">
          {lista.map((s) => (
            <li key={s.id} className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr_1fr_auto] gap-2 items-center">
              <input className={campo} value={s.nombre} onChange={(e) => cambiar(s.id, 'nombre', e.target.value)} placeholder="Ej. Subdirección de Operación" aria-label="Nombre de la subdirección" />
              <input className={campo} value={s.encargado} onChange={(e) => cambiar(s.id, 'encargado', e.target.value)} placeholder="Encargado" aria-label="Encargado de la subdirección" />
              <input className={campo} type="email" value={s.correo} onChange={(e) => cambiar(s.id, 'correo', e.target.value)} placeholder="correo@oomapasc.gob.mx" aria-label="Correo del encargado" />
              <button type="button" onClick={() => onChange(lista.filter((x) => x.id !== s.id))} title="Quitar subdirección"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded justify-self-end">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
