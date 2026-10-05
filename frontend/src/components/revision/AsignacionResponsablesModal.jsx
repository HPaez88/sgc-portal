import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Save, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building2,
  Calendar
} from 'lucide-react';
import ContenedorModal from '../common/ContenedorModal';
import { useToast } from '../common/Toast';
import { FORMULARIOS_COMPLEMENTARIOS_CONFIG } from '../../constants/revisionDireccion';

export default function AsignacionResponsablesModal({
  abierto,
  onCerrar,
  usuarios = [],
  asignacionesActuales = {},
  onGuardarAsignaciones,
  diaLimiteCaptura = 10,
  onGuardarDiaLimite
}) {
  const toast = useToast();
  const [asignaciones, setAsignaciones] = useState(asignacionesActuales);
  const [diaLimite, setDiaLimite] = useState(diaLimiteCaptura);

  const handleUsuarioChange = (formularioId, usuarioId) => {
    setAsignaciones(prev => ({
      ...prev,
      [formularioId]: Number(usuarioId)
    }));
  };

  const handleGuardar = () => {
    if (onGuardarAsignaciones) {
      onGuardarAsignaciones(asignaciones);
    }
    if (onGuardarDiaLimite) {
      onGuardarDiaLimite(Number(diaLimite));
    }
    toast.exito('Asignación de responsables y reglas de captura actualizadas.');
    onCerrar();
  };

  return (
    <ContenedorModal
      abierto={abierto}
      onCerrar={onCerrar}
      tamano="lg"
      titulo={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 shrink-0">
            <Users size={20} />
          </div>
          <div>
            <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              GOBERNANZA SGC · OOMRSC-04
            </span>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              Asignación de Responsables de Formularios Complementarios
            </h3>
          </div>
        </div>
      }
      pie={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500">
            Los responsables asignados recibirán alertas de captura los primeros {diaLimite} días de cada mes.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <Save size={16} />
              <span>Guardar Asignaciones</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 p-1">
        {/* Regla de Plazo de Captura */}
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
              <Clock size={16} className="text-purple-600" />
              <span>Plazo Límite de Captura Mensual</span>
            </div>
            <p className="text-xs text-purple-700">
              Define hasta qué día del mes los usuarios tienen para capturar su información antes de activar la notificación restrictiva.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-700">Día límite:</span>
            <select
              value={diaLimite}
              onChange={(e) => setDiaLimite(Number(e.target.value))}
              className="px-3 py-1.5 text-sm font-bold bg-white border border-purple-300 rounded-lg text-purple-900 focus:ring-2 focus:ring-purple-500"
            >
              {[5, 7, 10, 12, 15, 20].map(dia => (
                <option key={dia} value={dia}>Día {dia} del mes</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabla de Formularios y Asignación de Usuarios */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
            Formularios Complementarios de la Revisión por la Dirección
          </h4>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
            {FORMULARIOS_COMPLEMENTARIOS_CONFIG.map(form => {
              const usuarioAsignadoId = asignaciones[form.id] || form.responsableDefaultId;
              const usuarioActual = usuarios.find(u => u.id === usuarioAsignadoId);

              return (
                <div key={form.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        {form.codigo}
                      </span>
                      <h5 className="font-bold text-sm text-slate-900">
                        {form.nombre}
                      </h5>
                    </div>
                    <p className="text-xs text-slate-600">
                      {form.descripcion}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Building2 size={13} className="text-sky-600" />
                        {form.areaResponsable}
                      </span>
                      <span>·</span>
                      <span>Rol Sugerido: <strong>{form.rolSugerido}</strong></span>
                    </div>
                  </div>

                  <div className="shrink-0 min-w-[240px]">
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Usuario Responsable:
                    </label>
                    <select
                      value={usuarioAsignadoId}
                      onChange={(e) => handleUsuarioChange(form.id, e.target.value)}
                      className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-purple-500 focus:bg-white"
                    >
                      {usuarios.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({u.area} - {u.rol})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ContenedorModal>
  );
}
