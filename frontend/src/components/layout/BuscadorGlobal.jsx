// Buscador global del encabezado: resultados agrupados con su total, flechas/Enter, Ctrl+K y abre el registro.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { buscarGlobal } from '../../constants/busquedaGlobal';
import { INDICADORES } from '../../constants/indicadores';
import { leerEstadoTexto } from '../../services/estadoService';

export default function BuscadorGlobal({ modulos = [], setActiveTab }) {
  const { accionesCorrectivas = [], planesMejora = [], riesgos = [], documentos = [], areasDetalle = [], usuarios = [], usuarioLogueado, puedeTodasAreas, areaUsuario, registrarMovimiento } = useSGC();
  const [texto, setTexto] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const entrada = useRef(null);
  const caja = useRef(null);

  const esAdmin = ['Super Admin', 'Admin'].includes(usuarioLogueado?.rol);
  const grupos = useMemo(() => {
    if (texto.trim().length < 2) return [];
    let reportes = [];
    try { reportes = JSON.parse(leerEstadoTexto('sgc-reportes-correccion') || '[]') || []; } catch { reportes = []; }
    return buscarGlobal(texto, { modulos, acciones: accionesCorrectivas, planes: planesMejora, reportes, riesgos: Array.isArray(riesgos) ? riesgos : [],
      indicadores: INDICADORES, documentos: Array.isArray(documentos) ? documentos : [], areas: areasDetalle, usuarios, puedeTodasAreas, areaUsuario, esAdmin });
  }, [texto, modulos, accionesCorrectivas, planesMejora, riesgos, documentos, areasDetalle, usuarios, puedeTodasAreas, areaUsuario, esAdmin]);
  const planos = grupos.flatMap((g) => g.items);

  // Ctrl+K desde cualquier pantalla; clic fuera cierra.
  useEffect(() => {
    const tecla = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); entrada.current?.focus(); setAbierto(true); } };
    const fuera = (e) => { if (caja.current && !caja.current.contains(e.target)) setAbierto(false); };
    window.addEventListener('keydown', tecla);
    document.addEventListener('mousedown', fuera);
    return () => { window.removeEventListener('keydown', tecla); document.removeEventListener('mousedown', fuera); };
  }, []);

  const ir = (item) => {
    if (!item) return;
    if (item.destino.abrir) { try { sessionStorage.setItem(item.destino.abrir.clave, String(item.destino.abrir.id)); } catch { /* solo navega */ } }
    setActiveTab?.(item.destino.tab);
    registrarMovimiento?.({ modulo: 'PORTAL', accion: 'CONSULTA_BUSCADOR', descripcion: `Búsqueda "${texto.trim()}" → ${item.titulo}`, folio: item.titulo });
    setAbierto(false); setTexto('');
  };

  const teclas = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActivo((i) => Math.min(i + 1, planos.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActivo((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); ir(planos[activo]); }
    else if (e.key === 'Escape') { setAbierto(false); entrada.current?.blur(); }
  };

  let indice = -1;
  return (
    <div ref={caja} className="relative hidden md:block">
      <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 hover:bg-white rounded-lg w-72 lg:w-80 border border-slate-200 focus-within:border-marca-azul focus-within:bg-white focus-within:ring-2 focus-within:ring-marca-azul/15 transition-all">
        <Search size={15} className="text-slate-400 shrink-0" />
        <input ref={entrada} type="text" value={texto} role="combobox" aria-expanded={abierto && texto.trim().length >= 2} aria-label="Buscar en todo el portal"
          onChange={(e) => { setTexto(e.target.value); setActivo(0); setAbierto(true); }} onFocus={() => setAbierto(true)} onKeyDown={teclas}
          placeholder="Buscar folios, áreas, indicadores…" className="bg-transparent border-none focus:outline-none focus:shadow-none text-xs w-full text-slate-700" />
        <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-500 bg-white border border-slate-200 rounded">Ctrl K</kbd>
      </div>
      {abierto && texto.trim().length >= 2 && (
        <div role="listbox" className="absolute z-50 mt-1 w-[30rem] max-w-[90vw] max-h-[70vh] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl p-1.5">
          {!grupos.length && <p className="px-3 py-4 text-sm text-slate-500">Sin resultados para «{texto.trim()}».</p>}
          {grupos.map((g) => (
            <div key={g.grupo} className="py-1">
              <p className="px-3 py-1 text-[11px] font-extrabold text-marca-azul-oscuro uppercase tracking-wider">{g.grupo} <span className="text-slate-500">· {g.total}</span></p>
              {g.items.map((item) => {
                indice += 1;
                const i = indice;
                return (
                  <button key={`${g.grupo}-${i}`} type="button" role="option" aria-selected={i === activo} onMouseEnter={() => setActivo(i)} onMouseDown={(e) => { e.preventDefault(); ir(item); }}
                    className={`w-full text-left px-3 py-2 rounded-lg ${i === activo ? 'bg-sky-50' : ''}`}>
                    <span className="block text-sm font-semibold text-slate-900">{item.titulo}</span>
                    <span className="block text-[11px] text-slate-600 truncate">{item.detalle}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
