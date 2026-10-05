import React, { useState } from 'react';
import {
  Layers,
  Download,
  FileDown,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  FileText,
  Sparkles,
  ShieldCheck,
  Plus,
  ArrowRight,
  Target
} from 'lucide-react';
import {
  PROYECTOS_PRESUPUESTO_EGRESOS
} from '../../constants/fichasGubernamentales';
import {
  exportarProyectoPresupuestoPDF,
  descargarProyectoPresupuestoDocx
} from '../../services/fichaTecnicaExporter';
import { useToast } from '../common/Toast';

export default function ProyectosPresupuestoTab({ esAdminOSGC = false }) {
  const toast = useToast();
  const [proyectos, setProyectos] = useState(PROYECTOS_PRESUPUESTO_EGRESOS);
  const [proyectoActivoId, setProyectoActivoId] = useState(PROYECTOS_PRESUPUESTO_EGRESOS[0].id);
  const [descargandoDocx, setDescargandoDocx] = useState(false);

  const proyectoActivo = proyectos.find(p => p.id === proyectoActivoId) || proyectos[0];

  const handleDescargarPDF = (proy) => {
    try {
      exportarProyectoPresupuestoPDF(proy);
      toast.success(`Formato de Proyecto [${proy.clave_programa}] descargado en PDF oficial`);
    } catch (err) {
      toast.error(`Error al generar PDF del proyecto: ${err.message}`);
    }
  };

  const handleDescargarWord = async (proy) => {
    setDescargandoDocx(true);
    try {
      await descargarProyectoPresupuestoDocx(proy);
      toast.success(`Formato de Proyecto [${proy.clave_programa}] descargado en Word (.docx)`);
    } catch (err) {
      toast.error(`Error al generar Word del proyecto: ${err.message}`);
    } finally {
      setDescargandoDocx(false);
    }
  };

  const fmtMonto = (m) => typeof m === 'number' ? `$${m.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (m || '$0.00');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner de Proyectos */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#002855] text-white shadow-md border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-sky-400/20 text-sky-300 border border-sky-400/30">
              TESORERÍA MUNICIPAL · CAJEME
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              PRESUPUESTO DE EGRESOS 2026
            </span>
          </div>
          <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <Layers size={20} className="text-sky-400" />
            Formatos Oficiales de Presentación de Proyectos Presupuestarios
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Estructuración obligatoria de proyectos institucionales por unidad responsable con desglose por Capítulos de Gasto CONAC (1000 a 7000), calendario trimestral y matriz de metas.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => handleDescargarPDF(proyectoActivo)}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Download size={14} />
            <span>Descargar PDF ({proyectoActivo.clave_programa})</span>
          </button>

          <button
            onClick={() => handleDescargarWord(proyectoActivo)}
            disabled={descargandoDocx}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <FileDown size={14} />
            <span>{descargandoDocx ? 'Generando...' : 'Descargar Word (.docx)'}</span>
          </button>
        </div>
      </div>

      {/* Selector de Proyectos */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto">
        {proyectos.map(p => (
          <button
            key={p.id}
            onClick={() => setProyectoActivoId(p.id)}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              proyectoActivoId === p.id
                ? 'bg-[#002855] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Building2 size={15} />
            <span>{p.unidad_responsable}</span>
            <span className="text-[10px] font-mono opacity-80">({p.clave_programa})</span>
          </button>
        ))}
      </div>

      {/* Visualizador de Formato Oficial del Proyecto */}
      <div className="bg-white rounded-2xl shadow-card-subtle border border-slate-200 p-6 space-y-6">
        {/* Encabezado del Proyecto */}
        <div className="border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[10.5px] font-mono font-black text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              PROGRAMA: {proyectoActivo.clave_programa}
            </span>
            <h4 className="text-base font-black text-slate-900 mt-1">
              {proyectoActivo.nombre_programa}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Unidad Responsable: <strong>{proyectoActivo.unidad_responsable}</strong> | Eje PMD: <strong>{proyectoActivo.eje_rector_pmd}</strong>
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Presupuesto Anual Solicitado</span>
            <span className="text-xl font-black text-[#002855]">
              {fmtMonto(proyectoActivo.presupuesto_capitulos?.total?.anual || 0)}
            </span>
          </div>
        </div>

        {/* Resumen, Justificación y Objetivo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase text-[#002855] block">Resumen Ejecutivo</span>
            <p className="text-xs text-slate-700 leading-relaxed">{proyectoActivo.resumen_ejecutivo}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase text-[#002855] block">Justificación</span>
            <p className="text-xs text-slate-700 leading-relaxed">{proyectoActivo.justificacion}</p>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
            <span className="text-[10px] font-extrabold uppercase text-[#002855] block">Objetivo General</span>
            <p className="text-xs text-slate-700 leading-relaxed font-bold">{proyectoActivo.objetivo}</p>
          </div>
        </div>

        {/* Matriz de Actividades e Indicadores */}
        <div className="space-y-3">
          <h5 className="font-black text-sm text-[#002855] flex items-center gap-2">
            <Target size={17} /> Matriz Oficial de Actividades, Metas y Calendario Trimestral
          </h5>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-xs text-left divide-y divide-slate-200">
              <thead className="bg-[#0B192C] text-white">
                <tr>
                  <th className="px-3 py-2.5 font-bold uppercase text-[10.5px]">Actividad Programada</th>
                  <th className="px-3 py-2.5 font-bold uppercase text-[10.5px]">Indicador de Medición</th>
                  <th className="px-3 py-2.5 font-bold uppercase text-[10.5px] text-center">Unidad</th>
                  <th className="px-3 py-2.5 font-bold uppercase text-[10.5px] text-center">Meta Anual</th>
                  <th className="px-2.5 py-2.5 font-bold uppercase text-[10.5px] text-center">I</th>
                  <th className="px-2.5 py-2.5 font-bold uppercase text-[10.5px] text-center">II</th>
                  <th className="px-2.5 py-2.5 font-bold uppercase text-[10.5px] text-center">III</th>
                  <th className="px-2.5 py-2.5 font-bold uppercase text-[10.5px] text-center">IV</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {proyectoActivo.actividades_indicadores?.map((act, idx) => {
                  const t = act.trimestres || {};
                  return (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                      <td className="px-3 py-2 text-slate-800 font-medium text-[11.5px] max-w-xs">{act.actividad}</td>
                      <td className="px-3 py-2 text-slate-800 font-bold text-[11.5px] max-w-xs">{act.indicador}</td>
                      <td className="px-3 py-2 text-slate-600 text-center text-[11px]">{act.unidad_medida}</td>
                      <td className="px-3 py-2 text-sky-900 font-black text-center text-[11.5px]">{act.meta}</td>
                      <td className="px-2.5 py-2 text-slate-700 text-center text-[11px] font-bold">{t.t1}</td>
                      <td className="px-2.5 py-2 text-slate-700 text-center text-[11px] font-bold">{t.t2}</td>
                      <td className="px-2.5 py-2 text-slate-700 text-center text-[11px] font-bold">{t.t3}</td>
                      <td className="px-2.5 py-2 text-slate-700 text-center text-[11px] font-bold">{t.t4}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cuantificación de Recursos por Capítulo CONAC */}
        <div className="space-y-3">
          <h5 className="font-black text-sm text-[#002855] flex items-center gap-2">
            <DollarSign size={17} /> Cuantificación de Recursos Presupuestarios por Capítulos de Gasto (Armonización CONAC)
          </h5>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-xs text-left divide-y divide-slate-200">
              <thead className="bg-[#1E3E62] text-white">
                <tr>
                  <th className="px-4 py-2.5 font-bold uppercase text-[10.5px]">Capítulo de Gasto</th>
                  <th className="px-4 py-2.5 font-bold uppercase text-[10.5px] text-right">Presupuesto Anual</th>
                  <th className="px-3 py-2.5 font-bold uppercase text-[10.5px] text-right">1er. Trimestre</th>
                  <th className="px-3 py-2.5 font-bold uppercase text-[10.5px] text-right">2do. Trimestre</th>
                  <th className="px-3 py-2.5 font-bold uppercase text-[10.5px] text-right">3er. Trimestre</th>
                  <th className="px-3 py-2.5 font-bold uppercase text-[10.5px] text-right">4to. Trimestre</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {Object.keys(proyectoActivo.presupuesto_capitulos || {}).map((k) => {
                  const cap = proyectoActivo.presupuesto_capitulos[k];
                  const isTotal = k === 'total';
                  return (
                    <tr key={k} className={isTotal ? 'bg-slate-100 font-black text-slate-950 border-t-2 border-slate-300' : 'hover:bg-slate-50'}>
                      <td className={`px-4 py-2 ${isTotal ? 'text-xs uppercase font-black text-[#002855]' : 'text-slate-800 text-[11.5px]'}`}>
                        {cap.capitulo}
                      </td>
                      <td className="px-4 py-2 text-right font-mono font-bold text-slate-900">{fmtMonto(cap.anual)}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700">{fmtMonto(cap.t1)}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700">{fmtMonto(cap.t2)}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700">{fmtMonto(cap.t3)}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-700">{fmtMonto(cap.t4)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Firmas Oficiales */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-center text-[11px] pt-6">
          <div className="space-y-1">
            <div className="w-48 mx-auto border-t border-slate-400 pt-1 font-extrabold text-slate-900">
              TITULAR DE LA UNIDAD RESPONSABLE
            </div>
            <p className="text-slate-700 font-bold">{proyectoActivo.titular}</p>
            <p className="text-slate-500 text-[10px]">{proyectoActivo.cargo_titular}</p>
          </div>

          <div className="space-y-1">
            <div className="w-48 mx-auto border-t border-slate-400 pt-1 font-extrabold text-slate-900">
              VALIDACIÓN TESORERÍA MUNICIPAL
            </div>
            <p className="text-slate-700 font-bold">LIC. LUIS ALBERTO RUIZ CORONADO</p>
            <p className="text-slate-500 text-[10px]">DIRECTOR GENERAL OOMAPASC</p>
          </div>
        </div>
      </div>
    </div>
  );
}
