import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  FileDown,
  Eye,
  Building2,
  Layers,
  Sparkles,
  Target,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Bookmark
} from 'lucide-react';
import {
  INDICADORES
} from '../../constants/indicadores';
import {
  obtenerFichaTecnicaIndicador,
  CONFIG_AYUNTAMIENTO_CAJEME
} from '../../constants/fichasGubernamentales';
import {
  exportarFichaTecnicaPDF,
  descargarFichaTecnicaDocx
} from '../../services/fichaTecnicaExporter';
import { useToast } from '../common/Toast';
import ModalFichaTecnicaAyuntamiento from './ModalFichaTecnicaAyuntamiento';

export default function FichasGubernamentalesTab({
  indicadoresData = {},
  fichasPersonalizadas = {},
  setFichasPersonalizadas,
  esAdminOSGC = false
}) {
  const toast = useToast();
  const [busqueda, setBusqueda] = useState('');
  const [filtroProceso, setFiltroProceso] = useState('');
  const [filtroDimension, setFiltroDimension] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroDireccion, setFiltroDireccion] = useState('');

  // Modal Ficha
  const [fichaModal, setFichaModal] = useState({ open: false, ficha: null, indOriginal: null });

  // Procesos únicos
  const procesosUnicos = useMemo(() => {
    return Array.from(new Set(INDICADORES.map(i => i.proceso))).filter(Boolean);
  }, []);

  const direccionesUnicas = useMemo(() => {
    return Array.from(new Set(INDICADORES.map(i => i.direccion))).filter(Boolean);
  }, []);

  // Catálogo completo de fichas técnicas
  const fichasList = useMemo(() => {
    return INDICADORES.map(ind => {
      const ficha = obtenerFichaTecnicaIndicador(ind, fichasPersonalizadas);
      return {
        indicador: ind,
        ficha
      };
    });
  }, [fichasPersonalizadas]);

  // Filtrado
  const fichasFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase().trim();
    return fichasList.filter(({ indicador, ficha }) => {
      const idNum = String(indicador.numero !== undefined ? indicador.numero : indicador.id);
      const nombre = (indicador.nombre || '').toLowerCase();
      const proceso = (indicador.proceso || '').toLowerCase();
      const area = (indicador.area || '').toLowerCase();
      const dir = (indicador.direccion || '').toLowerCase();
      const tipo = (ficha.identificacion.tipo_indicador || '').toLowerCase();
      const dim = (ficha.identificacion.dimension || '').toLowerCase();

      const matchQ = !q || idNum.includes(q) || nombre.includes(q) || proceso.includes(q) || area.includes(q);
      const matchProc = !filtroProceso || indicador.proceso === filtroProceso;
      const matchDir = !filtroDireccion || indicador.direccion === filtroDireccion;
      const matchDim = !filtroDimension || ficha.identificacion.dimension === filtroDimension;
      const matchTipo = !filtroTipo || ficha.identificacion.tipo_indicador === filtroTipo;

      return matchQ && matchProc && matchDir && matchDim && matchTipo;
    });
  }, [fichasList, busqueda, filtroProceso, filtroDireccion, filtroDimension, filtroTipo]);

  const handleDescargarPDF = (ficha, e) => {
    e.stopPropagation();
    try {
      const indNum = ficha.indicador_numero ?? ficha.indicador_id ?? 0;
      exportarFichaTecnicaPDF(ficha, {});
      toast.success(`Ficha Técnica #${indNum} descargada en PDF oficial`);
    } catch (err) {
      toast.error(`Error al generar PDF: ${err.message}`);
    }
  };

  const handleDescargarWord = async (ficha, e) => {
    e.stopPropagation();
    try {
      const indNum = ficha.indicador_numero ?? ficha.indicador_id ?? 0;
      await descargarFichaTecnicaDocx(ficha);
      toast.success(`Ficha Técnica #${indNum} descargada en Word (.docx)`);
    } catch (err) {
      toast.error(`Error al generar Word: ${err.message}`);
    }
  };

  const handleGuardarFicha = (indId, nuevaFicha) => {
    if (setFichasPersonalizadas) {
      setFichasPersonalizadas(prev => ({
        ...(prev || {}),
        [indId]: nuevaFicha
      }));
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner Oficial PMD */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0B192C] via-[#1E3E62] to-[#002855] text-white shadow-md border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold bg-sky-400/20 text-sky-300 border border-sky-400/30">
              H. AYUNTAMIENTO DE CAJEME · PMD
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              OOMAPASC 2026
            </span>
          </div>
          <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <FileText size={20} className="text-sky-400" />
            Catálogo Oficial de Fichas Técnicas Gubernamentales
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Formatos armonizados para la entrega a Tesorería Municipal y Secretaría del Ayuntamiento con las 6 secciones normativas: Alineación PMD, Identificación, Criterios CREMAA, Medios de Verificación y Firmas de Titulares.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="p-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10 text-center">
            <span className="text-[10px] font-bold text-sky-200 block uppercase">Fichas Oficiales</span>
            <span className="text-xl font-black text-white">{fichasList.length}</span>
          </div>
          <div className="p-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10 text-center">
            <span className="text-[10px] font-bold text-emerald-200 block uppercase">Filtradas</span>
            <span className="text-xl font-black text-emerald-400">{fichasFiltradas.length}</span>
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="p-4 bg-white rounded-2xl shadow-card-subtle border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por número (#0 a #99), nombre del indicador, proceso, área..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500/20 focus:bg-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <select
            value={filtroDireccion}
            onChange={(e) => setFiltroDireccion(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="">Todas las Direcciones</option>
            {direccionesUnicas.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={filtroProceso}
            onChange={(e) => setFiltroProceso(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="">Todos los Procesos</option>
            {procesosUnicos.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="">Todos los Tipos</option>
            <option value="Estratégico">Estratégico</option>
            <option value="Gestión">Gestión</option>
            <option value="Impacto">Impacto</option>
          </select>

          {(busqueda || filtroProceso || filtroDireccion || filtroTipo || filtroDimension) && (
            <button
              onClick={() => {
                setBusqueda('');
                setFiltroProceso('');
                setFiltroDireccion('');
                setFiltroTipo('');
                setFiltroDimension('');
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Grid de Fichas Técnicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {fichasFiltradas.map(({ indicador, ficha }) => {
          const idNum = indicador.numero !== undefined ? indicador.numero : indicador.id;
          const ident = ficha.identificacion;
          const alineacion = ficha.alineacion;

          return (
            <div
              key={indicador.id}
              onClick={() => setFichaModal({ open: true, ficha, indOriginal: indicador })}
              className="bg-white hover:bg-slate-50/70 p-5 rounded-2xl border border-slate-200/90 hover:border-sky-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-3">
                {/* Header Card */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-black bg-[#0B192C] text-white shadow-2xs">
                      #{idNum}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      ident.tipo_indicador === 'Estratégico'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}>
                      {ident.tipo_indicador || 'Gestión'}
                    </span>
                  </div>

                  <span className="text-[10.5px] font-mono font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Meta: {ident.meta_anual}
                  </span>
                </div>

                {/* Título y Proceso */}
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-sky-950 line-clamp-2 leading-snug">
                    {indicador.nombre}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
                    <Building2 size={12} className="text-slate-400" />
                    <span>{indicador.area}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-600">{indicador.proceso}</span>
                  </p>
                </div>

                {/* Ficha Resumen */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Eje PMD:</span>
                    <span className="font-bold text-slate-800 text-right truncate max-w-[150px]">{alineacion.eje_rector_pmd}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Dimensión:</span>
                    <span className="font-bold text-sky-800">{ident.dimension}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Frecuencia:</span>
                    <span className="font-bold text-slate-800">{ident.frecuencia_medicion}</span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setFichaModal({ open: true, ficha, indOriginal: indicador });
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye size={13} className="text-sky-700" />
                  <span>Ver Ficha</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handleDescargarPDF(ficha, e)}
                    className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    title="Descargar PDF Oficial"
                  >
                    <Download size={13} />
                  </button>
                  <button
                    onClick={(e) => handleDescargarWord(ficha, e)}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    title="Descargar Word (.docx)"
                  >
                    <FileDown size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Ficha Técnica Ayuntamiento */}
      {fichaModal.open && fichaModal.ficha && (
        <ModalFichaTecnicaAyuntamiento
          isOpen={fichaModal.open}
          onClose={() => setFichaModal({ open: false, ficha: null, indOriginal: null })}
          ficha={fichaModal.ficha}
          indicadorOriginal={fichaModal.indOriginal}
          valoresMensuales={indicadoresData?.resultados || {}}
          esAdminOSGC={esAdminOSGC}
          onGuardarFichaPersonalizada={handleGuardarFicha}
        />
      )}
    </div>
  );
}
