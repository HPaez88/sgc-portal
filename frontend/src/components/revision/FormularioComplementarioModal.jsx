import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Save, 
  X, 
  User, 
  Calendar, 
  AlertTriangle,
  Info,
  Building2
} from 'lucide-react';
import ContenedorModal from '../common/ContenedorModal';
import { useToast } from '../common/Toast';

export default function FormularioComplementarioModal({
  abierto,
  onCerrar,
  formularioConfig,
  datosActuales = {},
  onGuardar,
  usuarioLogueado,
  mes,
  ejercicio
}) {
  const toast = useToast();
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (formularioConfig) {
      const inicial = {};
      formularioConfig.campos.forEach(campo => {
        inicial[campo.id] = datosActuales[campo.id] !== undefined ? datosActuales[campo.id] : (campo.default ?? '');
      });
      setFormData(inicial);
    }
  }, [formularioConfig, datosActuales, abierto]);

  if (!abierto || !formularioConfig) return null;

  const handleChange = (campoId, val, tipo) => {
    let finalVal = val;
    if (tipo === 'numero' || tipo === 'porcentaje') {
      finalVal = val === '' ? '' : Number(val);
    }
    setFormData(prev => ({ ...prev, [campoId]: finalVal }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validar campos requeridos
    for (const campo of formularioConfig.campos) {
      if (formData[campo.id] === '' || formData[campo.id] === undefined) {
        toast.advertencia(`El campo "${campo.label}" es obligatorio.`);
        return;
      }
    }

    const payload = {
      ...formData,
      capturadoPor: usuarioLogueado?.nombre || 'Usuario SGC',
      usuarioId: usuarioLogueado?.id,
      fechaCaptura: new Date().toISOString().split('T')[0],
      fechaHoraCaptura: new Date().toISOString()
    };

    onGuardar(formularioConfig.id, payload);
    toast.exito(`Formulario "${formularioConfig.nombre}" guardado con éxito.`);
    onCerrar();
  };

  return (
    <ContenedorModal
      abierto={abierto}
      onCerrar={onCerrar}
      tamano="2xl"
      anchoMaximo="max-w-[88vw] xl:max-w-[1300px]"
      titulo={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                {formularioConfig.codigo}
              </span>
              <span className="text-xs text-slate-500">
                Corte: {mes} {ejercicio}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              {formularioConfig.nombre}
            </h3>
          </div>
        </div>
      }
      pie={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Info size={14} className="text-sky-500 shrink-0" />
            <span>Los datos se integran a la Revisión por la Dirección (OOMRSC-04).</span>
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
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <Save size={16} />
              <span>Guardar Información</span>
            </button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-1">
        {/* Banner de Área y Responsabilidad */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <Building2 size={16} className="text-sky-600 shrink-0" />
            <span>Área Responsable: <strong className="text-slate-900">{formularioConfig.areaResponsable}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <User size={16} className="text-emerald-600 shrink-0" />
            <span>Captura: <strong className="text-slate-900">{usuarioLogueado?.nombre || 'Usuario Activo'}</strong></span>
          </div>
        </div>

        {/* Descripción */}
        <p className="text-xs text-slate-600 leading-relaxed">
          {formularioConfig.descripcion}
        </p>

        {/* Campos dinámicos */}
        <div className="space-y-4 pt-2">
          {formularioConfig.campos.map(campo => {
            const val = formData[campo.id] ?? '';

            if (campo.tipo === 'texto_largo') {
              return (
                <div key={campo.id} className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {campo.label} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={val}
                    onChange={(e) => handleChange(campo.id, e.target.value, campo.tipo)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 placeholder:text-slate-400"
                    placeholder="Describe el análisis técnico o justificación..."
                    required
                  />
                </div>
              );
            }

            return (
              <div key={campo.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    {campo.label} <span className="text-rose-500">*</span>
                  </label>
                  {campo.meta !== undefined && (
                    <span className="text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      Meta Oficial: {campo.meta}{campo.tipo === 'porcentaje' ? '%' : ''}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step={campo.tipo === 'porcentaje' ? '0.1' : '1'}
                    min={0}
                    max={campo.tipo === 'porcentaje' ? 100 : undefined}
                    value={val}
                    onChange={(e) => handleChange(campo.id, e.target.value, campo.tipo)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-900 pr-10"
                    placeholder="0"
                    required
                  />
                  {campo.tipo === 'porcentaje' && (
                    <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                      %
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </form>
    </ContenedorModal>
  );
}
