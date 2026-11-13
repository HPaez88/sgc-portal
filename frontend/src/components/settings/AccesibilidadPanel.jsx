// Configuración → Accesibilidad: cada usuario ajusta el tamaño de letra y el marcado de las tablas.
// Se guarda en este navegador para su cuenta y se aplica de inmediato en todo el portal.
import React, { useState } from 'react';
import { Type, Table2, RotateCcw, CheckCircle2 } from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { TAMANOS, PREFERENCIAS_INICIALES, leerPreferencias, guardarPreferencias, aplicarPreferencias } from '../../constants/accesibilidad';

function Opcion({ activa, onClick, children }) {
  return (
    <button type="button" aria-pressed={activa} onClick={onClick}
      className={`px-4 py-3 rounded-xl border-2 text-left transition-colors ${activa ? 'border-marca-azul-oscuro bg-sky-50 text-marca-azul-oscuro' : 'border-slate-200 bg-white text-slate-700 hover:border-marca-azul'}`}>
      <span className="flex items-center gap-2 font-bold">{activa && <CheckCircle2 size={16} />}{children}</span>
    </button>
  );
}

export default function AccesibilidadPanel() {
  const { usuarioLogueado } = useSGC();
  const [pref, setPref] = useState(() => leerPreferencias(usuarioLogueado?.email));
  const cambiar = (patch) => {
    const p = { ...pref, ...patch };
    setPref(p);
    guardarPreferencias(usuarioLogueado?.email, p);
    aplicarPreferencias(p);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-6">
      <header>
        <h3 className="text-base font-extrabold text-slate-900">Accesibilidad</h3>
        <p className="text-sm text-slate-600">Ajusta cómo ves el portal. Es mejor que el zoom del navegador: la pantalla se acomoda y no se pierde información. Se guarda para tu cuenta en este equipo.</p>
      </header>

      <section className="space-y-2">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Type size={16} className="text-marca-azul-oscuro" /> Tamaño de letra</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TAMANOS.map((t) => (
            <Opcion key={t.id} activa={pref.tamano === t.id} onClick={() => cambiar({ tamano: t.id })}>
              <span style={{ fontSize: `${15 * t.escala}px` }}>Aa</span> {t.etiqueta} <span className="text-xs font-normal text-slate-500">({Math.round(t.escala * 100)}%)</span>
            </Opcion>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Table2 size={16} className="text-marca-azul-oscuro" /> Líneas de las tablas</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Opcion activa={!pref.tablasMarcadas} onClick={() => cambiar({ tablasMarcadas: false })}>Normales</Opcion>
          <Opcion activa={pref.tablasMarcadas} onClick={() => cambiar({ tablasMarcadas: true })}>Marcadas (filas y columnas bien definidas)</Opcion>
        </div>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-bold text-slate-800">Vista previa</h4>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs">
            <caption className="sr-only">Ejemplo de tabla</caption>
            <thead className="bg-slate-50 text-slate-700 text-left">
              <tr><th scope="col" className="p-2">Folio</th><th scope="col" className="p-2">Descripción</th><th scope="col" className="p-2">Área</th><th scope="col" className="p-2">Estado</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr><td className="p-2 font-mono font-bold text-sky-700">AC#27/2026</td><td className="p-2">Reporte de supervisión sin revisión del jefe inmediato</td><td className="p-2">Control y Servicios</td><td className="p-2">En seguimiento</td></tr>
              <tr><td className="p-2 font-mono font-bold text-sky-700">PM#4/2026</td><td className="p-2">Estandarizar el formato del registro de acciones</td><td className="p-2">SGC</td><td className="p-2">Cerrado</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="button" onClick={() => cambiar(PREFERENCIAS_INICIALES)} className="px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5">
          <RotateCcw size={14} /> Restablecer valores normales
        </button>
      </div>
    </div>
  );
}
