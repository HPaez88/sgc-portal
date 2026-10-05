import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  FileDown,
  X,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Edit3,
  Save,
  Activity,
  Target,
  UserCheck,
  Info,
  Check
} from 'lucide-react';
import ContenedorModal from '../common/ContenedorModal';
import { useToast } from '../common/Toast';
import {
  exportarFichaTecnicaPDF,
  descargarFichaTecnicaDocx
} from '../../services/fichaTecnicaExporter';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function ModalFichaTecnicaAyuntamiento({
  isOpen,
  onClose,
  ficha,
  fichaData,
  indicadorOriginal,
  valoresMensuales = {},
  esAdminOSGC = false,
  onGuardarFicha,
  onGuardarFichaPersonalizada
}) {
  const toast = useToast();
  const [modoEdicion, setModoEdicion] = useState(false);
  const [fichaEdit, setFichaEdit] = useState(null);
  const [descargandoDocx, setDescargandoDocx] = useState(false);

  const objetoFicha = ficha || fichaData;

  useEffect(() => {
    if (objetoFicha) {
      setFichaEdit(JSON.parse(JSON.stringify(objetoFicha)));
      setModoEdicion(false);
    }
  }, [objetoFicha, isOpen]);


  if (!isOpen || !fichaEdit) return null;

  const indNum = fichaEdit.indicador_numero ?? fichaEdit.indicador_id ?? 0;
  const alineacion = fichaEdit.alineacion || {};
  const identificacion = fichaEdit.identificacion || {};
  const cremaa = fichaEdit.atributos_cremaa || {};
  const variables = fichaEdit.caracteristicas_variables || {};
  const transversalidad = fichaEdit.transversalidad || {};
  const infoAdic = fichaEdit.informacion_adicional || {};

  const handleDescargarPDF = () => {
    try {
      exportarFichaTecnicaPDF(fichaEdit, valoresMensuales);
      toast.success(`Ficha Técnica #${indNum} descargada en PDF oficial`);
    } catch (err) {
      toast.error(`Error al generar PDF: ${err.message}`);
    }
  };

  const handleDescargarWord = async () => {
    setDescargandoDocx(true);
    try {
      await descargarFichaTecnicaDocx(fichaEdit);
      toast.success(`Ficha Técnica #${indNum} descargada en formato Word (.docx)`);
    } catch (err) {
      toast.error(`Error al generar Word: ${err.message}`);
    } finally {
      setDescargandoDocx(false);
    }
  };

  const handleGuardarCambios = () => {
    if (onGuardarFicha) {
      onGuardarFicha(fichaEdit);
    } else if (onGuardarFichaPersonalizada) {
      onGuardarFichaPersonalizada(indNum, fichaEdit);
    }
    setModoEdicion(false);
    toast.success('Parámetros de la Ficha Técnica guardados correctamente');
  };


  return (
    <ContenedorModal isOpen={isOpen} onClose={onClose} size="2xl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Oficial Ayuntamiento */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#002855] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10.5px] font-mono font-black bg-sky-400/20 text-sky-300 border border-sky-400/30">
                  INDICADOR #{indNum}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  PMD · Presupuesto de Egresos 2026
                </span>
              </div>
              <h3 className="text-base font-black text-white tracking-tight mt-0.5">
                Ficha Técnica Gubernamental (Ayuntamiento de Cajeme)
              </h3>
              <p className="text-xs text-slate-300 truncate max-w-xl">
                {identificacion.nombre_indicador}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {esAdminOSGC && (
              <button
                onClick={() => setModoEdicion(!modoEdicion)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  modoEdicion
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20'
                }`}
                title="Editar parámetros gubernamentales"
              >
                <Edit3 size={13} />
                <span>{modoEdicion ? 'Viendo Edición' : 'Editar Ficha'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar de Exportación */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-600 font-medium text-[11.5px]">
            <Building2 size={14} className="text-[#002855]" />
            <span>Organismo: <strong>OOMAPAS DE CAJEME</strong></span>
            <span className="text-slate-300">|</span>
            <span>Dimensión: <strong className="text-sky-700">{identificacion.dimension || 'Eficacia'}</strong></span>
            <span className="text-slate-300">|</span>
            <span>Tipo: <strong className="text-indigo-700">{identificacion.tipo_indicador || 'Gestión'}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDescargarPDF}
              className="px-3.5 py-1.5 bg-[#002855] hover:bg-[#001f42] text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer text-xs"
              title="Descargar Ficha Técnica en PDF Oficial del Ayuntamiento"
            >
              <Download size={13} className="text-sky-300" />
              <span>Descargar PDF</span>
            </button>

            <button
              onClick={handleDescargarWord}
              disabled={descargandoDocx}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer text-xs disabled:opacity-50"
              title="Descargar en formato editable Microsoft Word (.docx)"
            >
              <FileDown size={13} />
              <span>{descargandoDocx ? 'Generando...' : 'Descargar Word (.docx)'}</span>
            </button>
          </div>
        </div>

        {/* Body Ficha Técnica (6 Secciones Oficiales) */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-800">

          {/* SECCIÓN I: ALINEACIÓN PMD */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-2 bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white font-black text-xs flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-400 text-[#0B192C] flex items-center justify-center font-bold text-[10px]">I</span>
              <span>Alineación (Plan Municipal de Desarrollo - PMD)</span>
            </div>
            <div className="p-4 space-y-3 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">Eje Rector PMD</span>
                  {modoEdicion ? (
                    <input
                      type="text"
                      value={alineacion.eje_rector_pmd || ''}
                      onChange={(e) => setFichaEdit({ ...fichaEdit, alineacion: { ...alineacion, eje_rector_pmd: e.target.value } })}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  ) : (
                    <p className="font-bold text-slate-900">{alineacion.eje_rector_pmd}</p>
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">Programa PMD</span>
                  {modoEdicion ? (
                    <input
                      type="text"
                      value={alineacion.programa_pmd || ''}
                      onChange={(e) => setFichaEdit({ ...fichaEdit, alineacion: { ...alineacion, programa_pmd: e.target.value } })}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  ) : (
                    <p className="font-bold text-slate-900">{alineacion.programa_pmd}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">Objetivo PMD</span>
                  {modoEdicion ? (
                    <input
                      type="text"
                      value={alineacion.objetivo_pmd || ''}
                      onChange={(e) => setFichaEdit({ ...fichaEdit, alineacion: { ...alineacion, objetivo_pmd: e.target.value } })}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  ) : (
                    <p className="font-bold text-slate-900">{alineacion.objetivo_pmd}</p>
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">Tipo de Objetivo</span>
                  {modoEdicion ? (
                    <select
                      value={alineacion.tipo_objetivo || 'Cumplimiento'}
                      onChange={(e) => setFichaEdit({ ...fichaEdit, alineacion: { ...alineacion, tipo_objetivo: e.target.value } })}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="Cumplimiento">Cumplimiento</option>
                      <option value="Estratégico">Estratégico</option>
                      <option value="Informativo">Informativo</option>
                      <option value="Operativo">Operativo</option>
                    </select>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-extrabold text-[11px] border border-sky-200 inline-block">
                      {alineacion.tipo_objetivo || 'Cumplimiento'}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">Objetivo Institucional OOMAPASC</span>
                {modoEdicion ? (
                  <textarea
                    rows={2}
                    value={alineacion.objetivo_institucional || ''}
                    onChange={(e) => setFichaEdit({ ...fichaEdit, alineacion: { ...alineacion, objetivo_institucional: e.target.value } })}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                  />
                ) : (
                  <p className="text-slate-700 leading-relaxed">{alineacion.objetivo_institucional}</p>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN II: IDENTIFICACIÓN Y METAS */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-2 bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white font-black text-xs flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-400 text-[#0B192C] flex items-center justify-center font-bold text-[10px]">II</span>
              <span>Identificación del Indicador & Método de Cálculo</span>
            </div>
            <div className="p-4 space-y-3 bg-white">
              <div className="p-2.5 bg-sky-50/60 rounded-xl border border-sky-200">
                <span className="text-[10px] font-extrabold uppercase text-sky-900 block mb-0.5">Definición del Indicador</span>
                {modoEdicion ? (
                  <textarea
                    rows={2}
                    value={identificacion.definicion_indicador || ''}
                    onChange={(e) => setFichaEdit({ ...fichaEdit, identificacion: { ...identificacion, definicion_indicador: e.target.value } })}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                  />
                ) : (
                  <p className="text-slate-800 font-medium leading-relaxed">{identificacion.definicion_indicador}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">Método de Cálculo (Fórmula)</span>
                  {modoEdicion ? (
                    <input
                      type="text"
                      value={identificacion.metodo_calculo || ''}
                      onChange={(e) => setFichaEdit({ ...fichaEdit, identificacion: { ...identificacion, metodo_calculo: e.target.value } })}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  ) : (
                    <p className="font-mono font-bold text-slate-900 text-[11.5px]">{identificacion.metodo_calculo}</p>
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">Variables para el Cálculo</span>
                  {modoEdicion ? (
                    <input
                      type="text"
                      value={identificacion.variables_calculo || ''}
                      onChange={(e) => setFichaEdit({ ...fichaEdit, identificacion: { ...identificacion, variables_calculo: e.target.value } })}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  ) : (
                    <p className="text-slate-700">{identificacion.variables_calculo}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 block">Tipo</span>
                  <span className="font-black text-slate-900">{identificacion.tipo_indicador || 'Gestión'}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 block">Dimensión</span>
                  <span className="font-black text-slate-900">{identificacion.dimension || 'Eficacia'}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 block">Unidad</span>
                  <span className="font-black text-slate-900">{identificacion.unidad_medida || 'Porcentaje'}</span>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-500 block">Frecuencia</span>
                  <span className="font-black text-slate-900">{identificacion.frecuencia_medicion || 'Mensual'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-900 block mb-0.5">Meta Anual 2026</span>
                  <p className="font-black text-emerald-900 text-sm">{identificacion.meta_anual}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">Línea Base</span>
                  <p className="font-black text-slate-900 text-sm">{identificacion.linea_base}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">Sentido del Indicador</span>
                  <p className="font-black text-slate-900 text-sm">{identificacion.sentido_indicador || 'Ascendente'}</p>
                </div>
              </div>

              {/* Tabla de Cumplimiento Mensual (Ene - Dic) */}
              <div>
                <span className="text-[10.5px] font-extrabold uppercase text-slate-700 block mb-1.5">
                  Tabla Oficial de Cumplimiento y Metas por Período:
                </span>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-[11px] text-center divide-y divide-slate-200">
                    <thead className="bg-[#0B192C] text-white">
                      <tr>
                        {MESES.map(m => (
                          <th key={m} className="px-2 py-1.5 font-bold uppercase text-[10px]">{m}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-x divide-slate-100">
                      <tr>
                        {MESES.map(m => {
                          const val = valoresMensuales?.[m.toLowerCase()] ?? valoresMensuales?.[m] ?? (fichaEdit.distribucion_mensual?.[m] || 'NA');
                          return (
                            <td key={m} className="px-2 py-1.5 font-bold text-slate-800">
                              {val !== undefined && val !== '' ? String(val) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[10px] font-extrabold uppercase text-amber-900 block mb-0.5">Supuestos / Riesgos Externos</span>
                {modoEdicion ? (
                  <textarea
                    rows={2}
                    value={identificacion.supuestos || ''}
                    onChange={(e) => setFichaEdit({ ...fichaEdit, identificacion: { ...identificacion, supuestos: e.target.value } })}
                    className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                  />
                ) : (
                  <p className="text-amber-900">{identificacion.supuestos}</p>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN III: ATRIBUTOS CREMAA */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-2 bg-gradient-to-r from-[#0B192C] to-[#1E3E62] text-white font-black text-xs flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-sky-400 text-[#0B192C] flex items-center justify-center font-bold text-[10px]">III</span>
              <span>Atributos del Indicador (Criterios de Evaluación CREMAA)</span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-white">
              {['claridad', 'relevancia', 'economia', 'monitoreable', 'adecuado', 'aportacion_marginal'].map((key) => {
                const label = key.replace('_', ' ').toUpperCase();
                return (
                  <div key={key} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-extrabold uppercase text-[#002855] block mb-0.5">{label}</span>
                    {modoEdicion ? (
                      <textarea
                        rows={2}
                        value={cremaa[key] || ''}
                        onChange={(e) => setFichaEdit({
                          ...fichaEdit,
                          atributos_cremaa: { ...cremaa, [key]: e.target.value }
                        })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                      />
                    ) : (
                      <p className="text-slate-700 leading-relaxed">{cremaa[key] || 'Conforme a la metodología institucional'}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECCIONES IV, V Y VI: VARIABLES, TRANSVERSALIDAD Y FIRMAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* IV & V */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-4 bg-white">
              <h4 className="font-extrabold text-xs text-[#002855] border-b border-slate-100 pb-1.5">
                IV. Características de las Variables & V. Transversalidad
              </h4>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">Medios de Verificación</span>
                <p className="text-slate-700">{variables.medios_verificacion}</p>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">Método de Recopilación</span>
                <p className="text-slate-700">{variables.metodo_recopilacion}</p>
              </div>
              <div className="p-2 bg-sky-50 rounded-xl border border-sky-200">
                <span className="text-[10px] font-extrabold uppercase text-sky-900 block mb-0.5">Transversalidad (Género)</span>
                <p className="text-sky-950 font-bold">Mujeres: Sí (X)  |  Hombres: Sí (X)  |  Otro: No aplica</p>
              </div>
            </div>

            {/* VI. Información Adicional */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-3 p-4 bg-white">
              <h4 className="font-extrabold text-xs text-[#002855] border-b border-slate-100 pb-1.5">
                VI. Información Adicional & Validación
              </h4>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">Titular de la Unidad Responsable</span>
                <p className="font-bold text-slate-900">{infoAdic.titular_unidad} — {infoAdic.cargo_titular}</p>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">Fecha de Elaboración</span>
                <p className="text-slate-700">{infoAdic.fecha_elaboracion || '08 de Noviembre 2024'}</p>
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-slate-500 block mb-0.5">Notas Institucionales</span>
                <p className="text-slate-600">{infoAdic.notas}</p>
              </div>
            </div>
          </div>

          {/* Bloque de Firmas */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-center text-[11px] pt-6">
            <div className="space-y-1">
              <div className="w-48 mx-auto border-t border-slate-400 pt-1 font-extrabold text-slate-900">
                ELABORÓ / TITULAR DE ÁREA
              </div>
              <p className="text-slate-700 font-bold">{infoAdic.titular_unidad || 'Encargado de Área'}</p>
              <p className="text-slate-500 text-[10px]">{infoAdic.cargo_titular || 'Titular de Proceso'}</p>
            </div>

            <div className="space-y-1">
              <div className="w-48 mx-auto border-t border-slate-400 pt-1 font-extrabold text-slate-900">
                VALIDACIÓN INSTITUCIONAL SGC
              </div>
              <p className="text-slate-700 font-bold">Mtra. Mariana Pérez Chávez</p>
              <p className="text-slate-500 text-[10px]">Coordinadora del Sistema de Gestión de Calidad</p>
            </div>
          </div>
        </div>

        {/* Footer Modal con Botones */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-600" />
            Formato oficial listo para entrega a Tesorería Municipal y Secretaría del Ayuntamiento.
          </span>

          <div className="flex items-center gap-2">
            {modoEdicion && (
              <button
                onClick={handleGuardarCambios}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Save size={14} /> Guardar Parámetros
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </ContenedorModal>
  );
}
