import React, { useMemo, useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  ChevronRight, 
  X, 
  FileText, 
  Target, 
  ShieldAlert,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { FORMULARIOS_COMPLEMENTARIOS_CONFIG } from '../../constants/revisionDireccion';
import { INDICADORES } from '../../constants/indicadores';

export default function BannerObligacionesCaptura({ setActiveTab }) {
  const {
    usuarioLogueado,
    indicadoresData = {},
    puedeTodasAreas,
    areaUsuario
  } = useSGC();

  const [oculto, setOculto] = useState(false);

  // Leer asignaciones y revisiones actuales
  const diaActual = useMemo(() => new Date().getDate(), []);
  const diaLimite = 10; // Primeros 10 días del mes

  const asignacionesResponsables = useMemo(() => {
    try {
      const g = localStorage.getItem('sgc-asignaciones-formularios');
      if (g) return JSON.parse(g);
    } catch (e) { /* ignore */ }
    const def = {};
    FORMULARIOS_COMPLEMENTARIOS_CONFIG.forEach(f => {
      def[f.id] = f.responsableDefaultId;
    });
    return def;
  }, []);

  const revisionesGuardadas = useMemo(() => {
    try {
      const g = localStorage.getItem('sgc-revisiones-direccion');
      if (g) return JSON.parse(g);
    } catch (e) { /* ignore */ }
    return [];
  }, []);

  // Mes actual
  const mesActualNombre = useMemo(() => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[new Date().getMonth()];
  }, []);

  // Verificar formularios complementarios pendientes asignados al usuario
  const formulariosPendientes = useMemo(() => {
    if (!usuarioLogueado) return [];
    
    // Buscar la revisión del mes actual
    const rev = revisionesGuardadas.find(r => r.mes?.toLowerCase() === mesActualNombre.toLowerCase());
    const complementarios = rev?.formulariosComplementarios || {};

    return FORMULARIOS_COMPLEMENTARIOS_CONFIG.filter(form => {
      const asignadoId = asignacionesResponsables[form.id] || form.responsableDefaultId;
      const leCorresponde = usuarioLogueado.id === asignadoId || (usuarioLogueado.rol === 'Super Admin' && !complementarios[form.id]);
      const estaCapturado = !!complementarios[form.id];
      return leCorresponde && !estaCapturado;
    });
  }, [usuarioLogueado, revisionesGuardadas, mesActualNombre, asignacionesResponsables]);

  const esVencido = diaActual > diaLimite;
  const tienePendientes = formulariosPendientes.length > 0;

  if (oculto || !tienePendientes) return null;

  return (
    <div className={`p-4 rounded-2xl border shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
      esVencido
        ? 'bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 border-rose-300 text-rose-950'
        : 'bg-gradient-to-r from-amber-50 via-sky-50 to-indigo-50 border-amber-300 text-amber-950'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
          esVencido ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
        }`}>
          {esVencido ? <ShieldAlert size={20} /> : <Clock size={20} />}
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-mono text-[10px] font-black px-2 py-0.5 rounded tracking-wider ${
              esVencido ? 'bg-rose-200 text-rose-900 border border-rose-300' : 'bg-amber-200 text-amber-900 border border-amber-300'
            }`}>
              {esVencido ? 'PLAZO DE CAPTURA VENCIDO' : `PERÍODO DE CAPTURA ORDINARIO (DÍA ${diaActual} DE ${diaLimite})`}
            </span>
            <span className="text-xs font-bold">
              {mesActualNombre} 2026
            </span>
          </div>
          <p className="text-xs font-semibold leading-relaxed">
            {esVencido
              ? `Atención ${usuarioLogueado?.nombre}: Tienes ${formulariosPendientes.length} formulario(s) obligatorio(s) pendiente(s) para la Revisión por la Dirección (OOMRSC-04).`
              : `Hola ${usuarioLogueado?.nombre}, recuerda capturar tu información de Revisión por la Dirección antes del día ${diaLimite}. (${formulariosPendientes.length} pendiente[s]).`
            }
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          onClick={() => setActiveTab?.('revision_direccion')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 ${
            esVencido
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-amber-600 hover:bg-amber-700 text-white'
          }`}
        >
          <FileText size={14} />
          <span>Completar Captura Ahora</span>
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => setOculto(true)}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-black/5 rounded-lg transition-colors"
          title="Descartar aviso temporalmente"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
