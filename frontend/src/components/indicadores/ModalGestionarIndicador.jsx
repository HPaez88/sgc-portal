import React, { useState, useEffect } from 'react';
import {
  Target,
  X,
  Save,
  ShieldCheck,
  AlertTriangle,
  Info,
  Layers,
  Building2,
  Calendar,
  Percent,
  CheckCircle2
} from 'lucide-react';
import ContenedorModal from '../common/ContenedorModal';
import { useToast } from '../common/Toast';

const PERIODICIDADES = ['Mensual', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'];
const UNIDADES = ['Porcentaje', 'Cantidad', 'Días', 'Actas', 'Pesos ($)', 'Metros Cúbicos (m³)', 'Reportes', 'Horas', 'Eventos'];

export default function ModalGestionarIndicador({
  isOpen,
  onClose,
  indicadorAEditar = null,
  onGuardarIndicador,
  direccionesDisponibles = [],
  procesosDisponibles = [],
  areasDisponibles = [],
  totalIndicadores = 100
}) {
  const toast = useToast();
  const esEdicion = !!indicadorAEditar;

  const [numero, setNumero] = useState(totalIndicadores);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('General');
  const [area, setArea] = useState('Sistema de Gestión de Calidad');
  const [proceso, setProceso] = useState('Responsabilidad de la Dirección');
  const [periodicidad, setPeriodicidad] = useState('Trimestral');
  const [unidad, setUnidad] = useState('Porcentaje');
  const [metaAnual, setMetaAnual] = useState(85);
  const [metasTrimestrales, setMetasTrimestrales] = useState({ T1: 20, T2: 20, T3: 20, T4: 25 });
  const [impacto, setImpacto] = useState('Bajo');
  const [esMenor, setEsMenor] = useState(false);
  const [formula, setFormula] = useState('');
  const [observacionDefault, setObservacionDefault] = useState('');

  useEffect(() => {
    if (indicadorAEditar) {
      setNumero(indicadorAEditar.numero !== undefined ? indicadorAEditar.numero : indicadorAEditar.id);
      setNombre(indicadorAEditar.nombre || '');
      setDireccion(indicadorAEditar.direccion || 'General');
      setArea(indicadorAEditar.area || 'Sistema de Gestión de Calidad');
      setProceso(indicadorAEditar.proceso || 'Responsabilidad de la Dirección');
      setPeriodicidad(indicadorAEditar.periodicidad || 'Trimestral');
      setUnidad(indicadorAEditar.unidad || 'Porcentaje');
      setMetaAnual(indicadorAEditar.meta_anual || indicadorAEditar.meta || 85);
      setMetasTrimestrales({
        T1: indicadorAEditar.metas_trimestrales?.T1 ?? 20,
        T2: indicadorAEditar.metas_trimestrales?.T2 ?? 20,
        T3: indicadorAEditar.metas_trimestrales?.T3 ?? 20,
        T4: indicadorAEditar.metas_trimestrales?.T4 ?? 25
      });
      setImpacto(indicadorAEditar.impacto || 'Bajo');
      setEsMenor(!!indicadorAEditar.es_menor);
      setFormula(indicadorAEditar.formula || '');
      setObservacionDefault(indicadorAEditar.observacion_default || '');
    } else {
      setNumero(totalIndicadores);
      setNombre('');
      setDireccion(direccionesDisponibles[0] || 'General');
      setArea(areasDisponibles[0] || 'Sistema de Gestión de Calidad');
      setProceso(procesosDisponibles[0] || 'Responsabilidad de la Dirección');
      setPeriodicidad('Trimestral');
      setUnidad('Porcentaje');
      setMetaAnual(85);
      setMetasTrimestrales({ T1: 20, T2: 20, T3: 20, T4: 25 });
      setImpacto('Bajo');
      setEsMenor(false);
      setFormula('');
      setObservacionDefault('');
    }
  }, [indicadorAEditar, isOpen, totalIndicadores, direccionesDisponibles, areasDisponibles, procesosDisponibles]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error('Por favor escribe el nombre descriptivo del indicador.');
      return;
    }

    const payload = {
      id: esEdicion ? indicadorAEditar.id : Number(numero),
      numero: Number(numero),
      nombre: nombre.trim(),
      direccion,
      area,
      proceso,
      periodicidad,
      unidad,
      meta: Number(metaAnual),
      meta_anual: Number(metaAnual),
      metas_trimestrales: {
        T1: Number(metasTrimestrales.T1),
        T2: Number(metasTrimestrales.T2),
        T3: Number(metasTrimestrales.T3),
        T4: Number(metasTrimestrales.T4)
      },
      impacto,
      es_menor: esMenor,
      formula: formula.trim(),
      observacion_default: observacionDefault.trim(),
      valor_default: esEdicion ? (indicadorAEditar.valor_default ?? null) : null,
      accion_default: esEdicion ? (indicadorAEditar.accion_default || 'NA') : 'NA'
    };

    onGuardarIndicador(payload, esEdicion);
    toast.exito(
      esEdicion
        ? `Indicador #${numero} actualizado exitosamente.`
        : `Nuevo Indicador Oficial #${numero} registrado en el catálogo OOMRSC-05.`
    );
    onClose();
  };

  return (
    <ContenedorModal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#002855] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Target size={22} />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                {esEdicion ? `Modificar Indicador Oficial #${numero}` : 'Crear Nuevo Indicador Oficial (OOMRSC-05)'}
              </h3>
              <p className="text-xs text-sky-200/80 font-medium">
                Módulo Administrativo del SGC · Cuadro de Control de Desempeño
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Fila 1: Número, Nombre e Impacto */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Número (# Indicador): <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                value={numero}
                onChange={(e) => setNumero(Number(e.target.value))}
                required
                className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre / Objetivo del Indicador: <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Cumplir con el programa de mantenimiento preventivo..."
                required
                className="w-full text-xs font-bold px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-900"
              />
            </div>
          </div>

          {/* Fila 2: Dirección, Área y Proceso */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dirección Adscrita: <span className="text-rose-500">*</span>
              </label>
              <select
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {direccionesDisponibles.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Área Responsable: <span className="text-rose-500">*</span>
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {areasDisponibles.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Proceso SGC: <span className="text-rose-500">*</span>
              </label>
              <select
                value={proceso}
                onChange={(e) => setProceso(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {procesosDisponibles.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 3: Periodicidad, Unidad, Meta Anual y Criterio */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Periodicidad:</label>
              <select
                value={periodicidad}
                onChange={(e) => setPeriodicidad(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {PERIODICIDADES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unidad de Medida:</label>
              <select
                value={unidad}
                onChange={(e) => setUnidad(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Meta Anual ({unidad === 'Porcentaje' ? '%' : unidad}):
              </label>
              <input
                type="number"
                step="any"
                value={metaAnual}
                onChange={(e) => setMetaAnual(Number(e.target.value))}
                required
                className="w-full text-xs font-black px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Criterio de Evaluación:</label>
              <select
                value={esMenor ? 'MENOR' : 'MAYOR'}
                onChange={(e) => setEsMenor(e.target.value === 'MENOR')}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                <option value="MAYOR">Mayor o igual es mejor (≥ Meta)</option>
                <option value="MENOR">Menor o igual es mejor (≤ Meta)</option>
              </select>
            </div>
          </div>

          {/* Fila 4: Metas Trimestrales */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              Desglose de Metas Trimestrales (MIR):
            </span>
            <div className="grid grid-cols-4 gap-3">
              {['T1', 'T2', 'T3', 'T4'].map(t => (
                <div key={t}>
                  <label className="block text-[11px] font-mono font-bold text-slate-500 mb-1">
                    Meta {t}:
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={metasTrimestrales[t] ?? ''}
                    onChange={(e) => setMetasTrimestrales({ ...metasTrimestrales, [t]: Number(e.target.value) })}
                    className="w-full text-xs font-bold px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Fila 5: Impacto y Consecuencia de Falla (Regla de Negocio SGC) */}
          <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-purple-950 flex items-center gap-1.5">
                <AlertTriangle size={15} className="text-purple-600" />
                Nivel de Impacto & Regla Automática de No Conformidad:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setImpacto('Alto')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    impacto === 'Alto'
                      ? 'bg-purple-700 text-white shadow-sm'
                      : 'bg-white text-purple-700 border border-purple-300'
                  }`}
                >
                  Alto Impacto (Detona AC)
                </button>
                <button
                  type="button"
                  onClick={() => setImpacto('Bajo')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    impacto === 'Bajo'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-300'
                  }`}
                >
                  Bajo Impacto (Detona RC)
                </button>
              </div>
            </div>

            <p className="text-[11.5px] text-purple-900/90 leading-relaxed">
              {impacto === 'Alto' ? (
                <span>
                  🚨 <strong>Alto Impacto:</strong> En caso de que este indicador caiga en semáforo crítico (≤79%), el sistema <strong>solicitará automáticamente una Acción Correctiva formal (OOMRSC-20)</strong> con investigación de causa raíz e intervención de auditor.
                </span>
              ) : (
                <span>
                  ⚠️ <strong>Bajo Impacto:</strong> En caso de desviación en este indicador, el sistema <strong>solicitará un Reporte de Corrección (RC)</strong> para seguimiento operativo del área.
                </span>
              )}
            </p>
          </div>

          {/* Fila 6: Fórmula y Observaciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Método de Cálculo / Fórmula:
              </label>
              <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="Ej. (Accidentes Ocurridos / Total Personal) * 100"
                className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observación / Criterio Default:
              </label>
              <input
                type="text"
                value={observacionDefault}
                onChange={(e) => setObservacionDefault(e.target.value)}
                placeholder="Texto explicativo default para la captura técnica..."
                className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Footer Botones */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Formato Oficial: OOMRSC-05 Rev. 37
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold bg-[#002855] hover:bg-[#0B192C] text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save size={14} />
                <span>{esEdicion ? 'Guardar Cambios' : 'Registrar Indicador'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </ContenedorModal>
  );
}
