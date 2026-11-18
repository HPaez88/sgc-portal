import React, { useState, useEffect } from 'react';
import { FileText, Save, Info, Lock } from 'lucide-react';
import ContenedorModal from '../common/ContenedorModal';
import { useToast } from '../common/Toast';
import { CAMPO_TEXTO, Encabezado, Leyenda } from '../common/estilosCampos';

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
      <form onSubmit={handleSubmit} className="space-y-4 p-1">
        <Leyenda />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
          <Encabezado n={1} titulo="Datos de la captura" ayuda="Vienen del portal; no se editan aquí." />
          <div className="grid gap-3 sm:grid-cols-3">
            {[['Área responsable', formularioConfig.areaResponsable], ['Captura', usuarioLogueado?.nombre || 'Usuario activo'], ['Corte', `${mes} ${ejercicio}`]].map(([etq, v]) => (
              <label key={etq} className="block">
                <span className="block text-xs font-bold text-slate-800 mb-1">{etq}</span>
                <input disabled value={v || ''} className={CAMPO_TEXTO} />
              </label>
            ))}
          </div>
          {formularioConfig.descripcion && <p className="text-sm text-slate-700 leading-relaxed">{formularioConfig.descripcion}</p>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          <Encabezado n={2} titulo="Información a capturar" ayuda="Todos los campos son obligatorios." color="bg-sky-800" />
          {formularioConfig.campos.map(campo => {
            const val = formData[campo.id] ?? '';
            const etiqueta = (
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <label htmlFor={`rd-${campo.id}`} className="block text-sm font-bold text-slate-800">
                  {campo.label} <span className="text-rose-600">*</span>
                </label>
                {campo.meta !== undefined && (
                  <span className="text-xs font-semibold text-sky-900 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-flex items-center gap-1">
                    <Lock size={11} /> Meta oficial: {campo.meta}{campo.tipo === 'porcentaje' ? '%' : ''}
                  </span>
                )}
              </div>
            );

            if (campo.tipo === 'texto_largo') {
              return (
                <div key={campo.id}>
                  {etiqueta}
                  <textarea id={`rd-${campo.id}`} rows={3} value={val} required
                    onChange={(e) => handleChange(campo.id, e.target.value, campo.tipo)}
                    className={CAMPO_TEXTO} placeholder="Describe el análisis técnico o justificación..." />
                </div>
              );
            }

            return (
              <div key={campo.id}>
                {etiqueta}
                <div className="relative sm:max-w-xs">
                  <input id={`rd-${campo.id}`} type="number" required min={0} placeholder="0"
                    step={campo.tipo === 'porcentaje' ? '0.1' : '1'}
                    max={campo.tipo === 'porcentaje' ? 100 : undefined}
                    value={val}
                    onChange={(e) => handleChange(campo.id, e.target.value, campo.tipo)}
                    className={`${CAMPO_TEXTO} text-right tabular-nums ${campo.tipo === 'porcentaje' ? 'pr-8' : ''}`} />
                  {campo.tipo === 'porcentaje' && <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-500">%</span>}
                </div>
              </div>
            );
          })}
        </section>
      </form>
    </ContenedorModal>
  );
}
