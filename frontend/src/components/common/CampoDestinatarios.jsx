// Campo "Para" con autollenado desde el directorio del portal (usuarios, titulares y encargados SGC).
// Cada destinatario queda como etiqueta; los correos fuera del directorio se marcan y los mal escritos no entran.
import React, { useMemo, useRef, useState } from 'react';
import { X, UserRound, AlertTriangle } from 'lucide-react';
import { buscarContactos, esCorreoValido } from '../../constants/directorio';

export default function CampoDestinatarios({ valor = [], onChange, directorio = [], id }) {
  const [texto, setTexto] = useState('');
  const [activo, setActivo] = useState(0);
  const [error, setError] = useState('');
  const entrada = useRef(null);
  const porCorreo = useMemo(() => new Map(directorio.map((c) => [c.email, c])), [directorio]);
  const sugerencias = buscarContactos(directorio, texto, valor);

  const agregar = (correo) => {
    const c = String(correo || '').trim().toLowerCase();
    if (!c) return;
    if (!esCorreoValido(c)) { setError(`"${correo}" no es un correo válido. Elige un contacto de la lista.`); return; }
    if (!valor.includes(c)) onChange([...valor, c]);
    setTexto(''); setActivo(0); setError('');
    entrada.current?.focus();
  };
  const quitar = (c) => onChange(valor.filter((x) => x !== c));

  const teclas = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActivo((i) => Math.min(i + 1, sugerencias.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActivo((i) => Math.max(i - 1, 0)); }
    else if (['Enter', 'Tab', ',', ';'].includes(e.key) && texto.trim()) {
      e.preventDefault();
      agregar(sugerencias[activo]?.email || texto);
    } else if (e.key === 'Backspace' && !texto && valor.length) {
      quitar(valor[valor.length - 1]);
    } else if (e.key === 'Escape') {
      setTexto('');
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-lg focus-within:ring-2 focus-within:ring-marca-azul/25 focus-within:border-marca-azul"
        onClick={() => entrada.current?.focus()}>
        {valor.map((c) => {
          const contacto = porCorreo.get(c);
          return (
            <span key={c} title={contacto ? `${c}\n${contacto.detalles.join('\n')}` : 'No está en el directorio del portal'}
              className={`inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-xs font-semibold border ${contacto ? 'bg-sky-50 text-sky-900 border-sky-200' : 'bg-amber-50 text-amber-900 border-amber-300'}`}>
              {!contacto && <AlertTriangle size={12} aria-hidden="true" />}
              {contacto?.nombre || c}
              <button type="button" onClick={() => quitar(c)} aria-label={`Quitar ${contacto?.nombre || c}`} className="p-0.5 rounded-full hover:bg-black/10"><X size={12} /></button>
            </span>
          );
        })}
        <input id={id} ref={entrada} value={texto} onKeyDown={teclas} onBlur={() => { if (esCorreoValido(texto)) agregar(texto); }}
          onChange={(e) => { setTexto(e.target.value); setActivo(0); setError(''); }}
          placeholder={valor.length ? 'Agregar otro…' : 'Escribe un nombre, área o correo'}
          role="combobox" aria-expanded={sugerencias.length > 0} aria-autocomplete="list"
          className="flex-1 min-w-[12rem] bg-transparent outline-none text-sm py-1" />
      </div>
      {sugerencias.length > 0 && (
        <ul role="listbox" className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {sugerencias.map((c, i) => (
            <li key={c.email} role="option" aria-selected={i === activo}>
              <button type="button" onMouseDown={(e) => { e.preventDefault(); agregar(c.email); }} onMouseEnter={() => setActivo(i)}
                className={`w-full text-left px-3 py-2 flex gap-2 items-start ${i === activo ? 'bg-sky-50' : ''}`}>
                <UserRound size={15} className="text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">{c.nombre || c.email}</span>
                  <span className="block text-[11px] text-slate-600 truncate">{c.email}{c.detalles.length ? ` · ${c.detalles.join(' · ')}` : ''}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-[11px] font-semibold text-rose-600">{error}</p>}
      {valor.some((c) => !porCorreo.has(c)) && <p className="mt-1 text-[11px] text-amber-800">Los marcados en ámbar no están en el directorio del portal; revisa que estén bien escritos.</p>}
    </div>
  );
}
