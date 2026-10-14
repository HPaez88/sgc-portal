import React, { useState, useEffect } from 'react';
import {
  Layers,
  Save,
  X,
  Plus,
  Trash2,
  DollarSign,
  Target,
  FileText,
  Building2,
  Calendar,
  Sparkles,
  Divide
} from 'lucide-react';
import ContenedorModal from '../common/ContenedorModal';

const CAPITULOS_CONAC_BASE = [
  { key: 'c1000', capitulo: '1000 Servicios Personales' },
  { key: 'c2000', capitulo: '2000 Materiales y Suministros' },
  { key: 'c3000', capitulo: '3000 Servicios Generales' },
  { key: 'c4000', capitulo: '4000 Transferencias, Asignaciones, Subsidios y Otras Ayudas' },
  { key: 'c5000', capitulo: '5000 Bienes Muebles, Inmuebles e Intangibles' },
  { key: 'c6000', capitulo: '6000 Inversión Pública' },
  { key: 'c7000', capitulo: '7000 Inversiones Financieras y Otras Provisiones' }
];

const UNIDADES_RESPONSABLES_CATALOGO = [
  'DIRECCIÓN GENERAL',
  'DIRECCIÓN ADMINISTRATIVA',
  'DIRECCIÓN COMERCIAL',
  'DIRECCIÓN TÉCNICA',
  'DIRECCIÓN DE OPERACIÓN Y MANTENIMIENTO',
  'ÓRGANO DE CONTROL INTERNO',
  'DIRECCIÓN GENERAL / LÍNEA OOMAPASC',
  'COORDINACIÓN DE CALIDAD Y SGC'
];

export default function ModalGestionProyectoPresupuestario({
  abierto,
  onCerrar,
  proyecto = null,
  onGuardar
}) {
  const [tab, setTab] = useState('generales'); // 'generales' | 'narrativa' | 'actividades' | 'conac'

  // Datos Generales
  const [clavePrograma, setClavePrograma] = useState('PP10');
  const [nombrePrograma, setNombrePrograma] = useState('');
  const [unidadResponsable, setUnidadResponsable] = useState('DIRECCIÓN GENERAL');
  const [ejeRectorPmd, setEjeRectorPmd] = useState('CAJEME LIMPIO Y ORDENADO');
  const [programaPmd, setProgramaPmd] = useState('DESARROLLO CON SERVICIOS PÚBLICOS DE CALIDAD');
  const [tipoProyecto, setTipoProyecto] = useState('Operación Básica del Área');
  const [nombreProyecto, setNombreProyecto] = useState('');
  const [fechaInicio, setFechaInicio] = useState('01-enero-2026');
  const [fechaConclusion, setFechaConclusion] = useState('31-diciembre-2026');
  const [titular, setTitular] = useState('LIC. LUIS ALBERTO RUIZ CORONADO');
  const [cargoTitular, setCargoTitular] = useState('DIRECTOR GENERAL');

  // Narrativa
  const [resumenEjecutivo, setResumenEjecutivo] = useState('');
  const [justificacion, setJustificacion] = useState('');
  const [objetivo, setObjetivo] = useState('');

  // Matriz de Actividades
  const [actividades, setActividades] = useState([
    {
      actividad: 'Cumplimiento oportuno de metas institucionales del área.',
      indicador: 'Porcentaje de metas alcanzadas en tiempo y forma',
      unidad_medida: 'Porcentaje',
      meta: '85%',
      trimestres: { t1: '20%', t2: '20%', t3: '20%', t4: '25%' }
    }
  ]);

  // Cuantificación CONAC
  const [capitulos, setCapitulos] = useState(() => {
    const init = {};
    CAPITULOS_CONAC_BASE.forEach(c => {
      init[c.key] = { capitulo: c.capitulo, anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 };
    });
    return init;
  });

  // Inicializar o resetear cuando cambia el proyecto o se abre
  useEffect(() => {
    if (proyecto) {
      setClavePrograma(proyecto.clave_programa || 'PP10');
      setNombrePrograma(proyecto.nombre_programa || '');
      setUnidadResponsable(proyecto.unidad_responsable || 'DIRECCIÓN GENERAL');
      setEjeRectorPmd(proyecto.eje_rector_pmd || 'CAJEME LIMPIO Y ORDENADO');
      setProgramaPmd(proyecto.programa_pmd || 'DESARROLLO CON SERVICIOS PÚBLICOS DE CALIDAD');
      setTipoProyecto(proyecto.tipo_proyecto || 'Operación Básica del Área');
      setNombreProyecto(proyecto.nombre_proyecto || '');
      setFechaInicio(proyecto.fecha_inicio || '01-enero-2026');
      setFechaConclusion(proyecto.fecha_conclusion || '31-diciembre-2026');
      setTitular(proyecto.titular || 'LIC. LUIS ALBERTO RUIZ CORONADO');
      setCargoTitular(proyecto.cargo_titular || 'DIRECTOR GENERAL');

      setResumenEjecutivo(proyecto.resumen_ejecutivo || '');
      setJustificacion(proyecto.justificacion || '');
      setObjetivo(proyecto.objetivo || '');

      if (proyecto.actividades_indicadores?.length > 0) {
        setActividades(JSON.parse(JSON.stringify(proyecto.actividades_indicadores)));
      }

      if (proyecto.presupuesto_capitulos) {
        const caps = {};
        CAPITULOS_CONAC_BASE.forEach(c => {
          const ex = proyecto.presupuesto_capitulos[c.key];
          caps[c.key] = ex ? { ...ex } : { capitulo: c.capitulo, anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 };
        });
        setCapitulos(caps);
      }
    } else {
      // Valores por defecto para nuevo proyecto
      setClavePrograma('PP11');
      setNombrePrograma('PP11 NUEVO PROYECTO INSTITUCIONAL OOMAPASC');
      setUnidadResponsable('DIRECCIÓN ADMINISTRATIVA');
      setEjeRectorPmd('CAJEME LIMPIO Y ORDENADO');
      setProgramaPmd('DESARROLLO CON SERVICIOS PÚBLICOS DE CALIDAD');
      setTipoProyecto('Operación Básica del Área');
      setNombreProyecto('Gestión eficiente y aseguramiento presupuestario del área');
      setFechaInicio('01-enero-2026');
      setFechaConclusion('31-diciembre-2026');
      setTitular('LIC. LUIS ALBERTO RUIZ CORONADO');
      setCargoTitular('DIRECTOR GENERAL');

      setResumenEjecutivo('Contribuir a los objetivos del Organismo mediante la administración responsable y aplicación de recursos con base en los principios de eficiencia, eficacia y calidad ISO 9001.');
      setJustificacion('El cumplimiento oportuno de las metas institucionales de OOMAPASC exige una presupuestación armonizada conforme a los lineamientos del CONAC y de la Tesorería Municipal de Cajeme.');
      setObjetivo('Administrar y controlar las actividades programadas asegurando el cumplimiento de metas y la continuidad operativa.');

      setActividades([
        {
          actividad: 'Cumplimiento oportuno de metas institucionales del área.',
          indicador: 'Porcentaje de metas alcanzadas en tiempo y forma',
          unidad_medida: 'Porcentaje',
          meta: '85%',
          trimestres: { t1: '20%', t2: '20%', t3: '20%', t4: '25%' }
        }
      ]);

      const caps = {};
      CAPITULOS_CONAC_BASE.forEach(c => {
        caps[c.key] = { capitulo: c.capitulo, anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 };
      });
      setCapitulos(caps);
    }
    setTab('generales');
  }, [proyecto, abierto]);

  // Manejo de Capítulos CONAC
  const handleCambioCapitulo = (key, campo, valor) => {
    const num = isNaN(Number(valor)) ? 0 : Number(valor);
    setCapitulos(prev => {
      const actual = { ...prev[key], [campo]: num };
      // Si cambia trimestres, auto-actualizar anual
      if (['t1', 't2', 't3', 't4'].includes(campo)) {
        actual.anual = Number(actual.t1 || 0) + Number(actual.t2 || 0) + Number(actual.t3 || 0) + Number(actual.t4 || 0);
      }
      return { ...prev, [key]: actual };
    });
  };

  const handleDistribuirEquitativo = (key) => {
    setCapitulos(prev => {
      const cap = prev[key];
      const montoAnual = Number(cap.anual || 0);
      const porT = Math.round((montoAnual / 4) * 100) / 100;
      const t4 = Math.round((montoAnual - (porT * 3)) * 100) / 100;
      return {
        ...prev,
        [key]: {
          ...cap,
          t1: porT,
          t2: porT,
          t3: porT,
          t4: t4
        }
      };
    });
  };

  // Cálculo de totales CONAC
  const totalGeneral = Object.keys(capitulos).reduce((acc, k) => {
    const c = capitulos[k];
    acc.anual += Number(c.anual || 0);
    acc.t1 += Number(c.t1 || 0);
    acc.t2 += Number(c.t2 || 0);
    acc.t3 += Number(c.t3 || 0);
    acc.t4 += Number(c.t4 || 0);
    return acc;
  }, { capitulo: 'Monto solicitado total', anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 });

  // Manejo de Actividades
  const handleAgregarActividad = () => {
    setActividades(prev => [
      ...prev,
      {
        actividad: '',
        indicador: '',
        unidad_medida: 'Porcentaje',
        meta: '100%',
        trimestres: { t1: '25%', t2: '25%', t3: '25%', t4: '25%' }
      }
    ]);
  };

  const handleEliminarActividad = (index) => {
    setActividades(prev => prev.filter((_, i) => i !== index));
  };

  const handleCambioActividad = (index, campo, valor) => {
    setActividades(prev => {
      const arr = [...prev];
      if (['t1', 't2', 't3', 't4'].includes(campo)) {
        arr[index] = {
          ...arr[index],
          trimestres: { ...arr[index].trimestres, [campo]: valor }
        };
      } else {
        arr[index] = { ...arr[index], [campo]: valor };
      }
      return arr;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const proyectoFinal = {
      id: proyecto?.id || `${clavePrograma.replace(/\s+/g, '-')}-${Date.now()}`,
      clave_programa: clavePrograma.trim() || 'PP',
      nombre_programa: nombrePrograma.trim() || `${clavePrograma} PROYECTO INSTITUCIONAL`,
      unidad_responsable: unidadResponsable,
      eje_rector_pmd: ejeRectorPmd,
      programa_pmd: programaPmd,
      tipo_proyecto: tipoProyecto,
      nombre_proyecto: nombreProyecto,
      resumen_ejecutivo: resumenEjecutivo,
      justificacion: justificacion,
      objetivo: objetivo,
      fecha_inicio: fechaInicio,
      fecha_conclusion: fechaConclusion,
      titular: titular,
      cargo_titular: cargoTitular,
      actividades_indicadores: actividades,
      presupuesto_capitulos: {
        ...capitulos,
        total: totalGeneral
      },
      updatedAt: new Date().toISOString()
    };

    onGuardar?.(proyectoFinal, !!proyecto);
    onCerrar();
  };

  const fmtMonto = (m) => typeof m === 'number' ? `$${m.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (m || '$0.00');

  return (
    <ContenedorModal
      abierto={abierto}
      onCerrar={onCerrar}
      tamano="2xl"
      anchoMaximo="max-w-[94vw] xl:max-w-[1550px]"
      titulo={
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#002855]/10 border border-[#002855]/20 flex items-center justify-center text-[#002855] shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              {proyecto ? `MODIFICAR FICHA DE PROYECTO · ${proyecto.clave_programa}` : 'CREAR NUEVA FICHA DE PROYECTO PRESUPUESTARIO 2026'}
            </span>
            <h3 className="text-base font-bold text-slate-900 leading-tight mt-0.5">
              {nombrePrograma || 'Formato Oficial de Presentación de Proyectos (Tesorería Cajeme)'}
            </h3>
          </div>
        </div>
      }
      pie={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>Presupuesto Total Solicitado:</span>
            <strong className="text-emerald-700 font-bold text-sm">{fmtMonto(totalGeneral.anual)}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-extrabold bg-[#002855] hover:bg-[#0B192C] text-white rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Save size={15} />
              <span>{proyecto ? 'Guardar Cambios' : 'Crear Proyecto'}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Navegación de Pestañas del Modal */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-200 pb-3">
          {[
            { id: 'generales', label: '1. Datos Generales', icon: Building2 },
            { id: 'narrativa', label: '2. Narrativa y Objetivos', icon: FileText },
            { id: 'actividades', label: `3. Actividades (${actividades.length})`, icon: Target },
            { id: 'conac', label: '4. Capítulos CONAC', icon: DollarSign }
          ].map(t => {
            const Icon = t.icon;
            const esActiva = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border ${
                  esActiva
                    ? 'bg-[#002855] text-white border-[#002855] shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <Icon size={14} className={esActiva ? 'text-sky-300' : 'text-slate-400'} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: DATOS GENERALES */}
        {tab === 'generales' && (
          <div className="space-y-4 text-xs animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Clave de Programa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={clavePrograma}
                  onChange={(e) => setClavePrograma(e.target.value.toUpperCase())}
                  placeholder="Ej. PP10, PP09, PP11"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre Oficial del Programa Presupuestario <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={nombrePrograma}
                  onChange={(e) => setNombrePrograma(e.target.value)}
                  placeholder="Ej. PP10 GESTIÓN Y FORTALECIMIENTO DEL OOMAPASC"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-bold text-slate-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Unidad Responsable (UR) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={unidadResponsable}
                  onChange={(e) => setUnidadResponsable(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-semibold text-slate-900"
                >
                  {UNIDADES_RESPONSABLES_CATALOGO.map(ur => (
                    <option key={ur} value={ur}>{ur}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tipo de Proyecto
                </label>
                <select
                  value={tipoProyecto}
                  onChange={(e) => setTipoProyecto(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 font-semibold text-slate-900"
                >
                  <option value="Operación Básica del Área">Operación Básica del Área</option>
                  <option value="Proyecto de Inversión Pública">Proyecto de Inversión Pública</option>
                  <option value="Programa Especial Institucional">Programa Especial Institucional</option>
                  <option value="Mantenimiento Mayor de Redes">Mantenimiento Mayor de Redes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Eje Rector PMD
                </label>
                <input
                  type="text"
                  value={ejeRectorPmd}
                  onChange={(e) => setEjeRectorPmd(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Programa PMD
                </label>
                <input
                  type="text"
                  value={programaPmd}
                  onChange={(e) => setProgramaPmd(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Nombre Descriptivo del Proyecto
              </label>
              <input
                type="text"
                value={nombreProyecto}
                onChange={(e) => setNombreProyecto(e.target.value)}
                placeholder="Descripción del objetivo de operación del proyecto"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-900 font-medium"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Titular de la Unidad Responsable
                </label>
                <input
                  type="text"
                  value={titular}
                  onChange={(e) => setTitular(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-900 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cargo del Titular
                </label>
                <input
                  type="text"
                  value={cargoTitular}
                  onChange={(e) => setCargoTitular(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-900 font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: NARRATIVA Y OBJETIVOS */}
        {tab === 'narrativa' && (
          <div className="space-y-4 text-xs animate-fade-in">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">
                  Resumen Ejecutivo (Máx. 150 palabras) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {resumenEjecutivo.trim().split(/\s+/).filter(Boolean).length} palabras
                </span>
              </div>
              <textarea
                rows={3}
                value={resumenEjecutivo}
                onChange={(e) => setResumenEjecutivo(e.target.value)}
                placeholder="Describe brevemente la finalidad, beneficiarios y contribución del proyecto..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-900 leading-relaxed"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">
                  Justificación Técnica y Operativa (Máx. 350 palabras) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {justificacion.trim().split(/\s+/).filter(Boolean).length} palabras
                </span>
              </div>
              <textarea
                rows={4}
                value={justificacion}
                onChange={(e) => setJustificacion(e.target.value)}
                placeholder="Fundamenta la necesidad pública, operativa o legal que atiende este proyecto institucional..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-900 leading-relaxed"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">
                  Objetivo General del Proyecto (Máx. 50 palabras) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {objetivo.trim().split(/\s+/).filter(Boolean).length} palabras
                </span>
              </div>
              <textarea
                rows={2}
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                placeholder="Objetivo concreto, medible y alcanzable del proyecto presupuestario..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 text-slate-900 font-bold"
                required
              />
            </div>
          </div>
        )}

        {/* TAB 3: MATRIZ DE ACTIVIDADES E INDICADORES */}
        {tab === 'actividades' && (
          <div className="space-y-3 text-xs animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="text-slate-500">
                Define las actividades programadas, sus indicadores de medición y la calendarización trimestral (I a IV).
              </p>
              <button
                type="button"
                onClick={handleAgregarActividad}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <Plus size={14} />
                <span>Agregar Actividad</span>
              </button>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {actividades.map((act, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 relative group">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="font-mono font-bold text-sky-800 bg-sky-100/60 px-2 py-0.5 rounded text-[11px]">
                      Actividad #{idx + 1}
                    </span>
                    {actividades.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleEliminarActividad(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Eliminar actividad"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Actividad Programada:</label>
                      <input
                        type="text"
                        value={act.actividad}
                        onChange={(e) => handleCambioActividad(idx, 'actividad', e.target.value)}
                        placeholder="Descripción de la actividad..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Indicador de Medición:</label>
                      <input
                        type="text"
                        value={act.indicador}
                        onChange={(e) => handleCambioActividad(idx, 'indicador', e.target.value)}
                        placeholder="Nombre de la métrica o indicador..."
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-semibold"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Unidad:</label>
                      <input
                        type="text"
                        value={act.unidad_medida}
                        onChange={(e) => handleCambioActividad(idx, 'unidad_medida', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-sky-800 mb-0.5">Meta Anual:</label>
                      <input
                        type="text"
                        value={act.meta}
                        onChange={(e) => handleCambioActividad(idx, 'meta', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-sky-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Trim. I:</label>
                      <input
                        type="text"
                        value={act.trimestres?.t1 ?? ''}
                        onChange={(e) => handleCambioActividad(idx, 't1', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Trim. II:</label>
                      <input
                        type="text"
                        value={act.trimestres?.t2 ?? ''}
                        onChange={(e) => handleCambioActividad(idx, 't2', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Trim. III:</label>
                      <input
                        type="text"
                        value={act.trimestres?.t3 ?? ''}
                        onChange={(e) => handleCambioActividad(idx, 't3', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Trim. IV:</label>
                      <input
                        type="text"
                        value={act.trimestres?.t4 ?? ''}
                        onChange={(e) => handleCambioActividad(idx, 't4', e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-center"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CAPÍTULOS DE GASTO CONAC */}
        {tab === 'conac' && (
          <div className="space-y-3 text-xs animate-fade-in">
            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900 flex items-center justify-between">
              <span className="leading-relaxed">
                Ingresa el presupuesto en pesos (MXN) para cada Capítulo de Gasto CONAC. Puedes ingresar el monto anual y pulsar <strong>(Distribuir 25%)</strong> o capturar cada trimestre directamente.
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-[400px]">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#1E3E62] text-white font-bold sticky top-0 z-10 text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[200px]">Capítulo de Gasto CONAC</th>
                    <th className="py-2.5 px-2 text-right w-36">Presupuesto Anual</th>
                    <th className="py-2.5 px-2 text-right w-28">1er. Trimestre</th>
                    <th className="py-2.5 px-2 text-right w-28">2do. Trimestre</th>
                    <th className="py-2.5 px-2 text-right w-28">3er. Trimestre</th>
                    <th className="py-2.5 px-2 text-right w-28">4to. Trimestre</th>
                    <th className="py-2.5 px-2 text-center w-24">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {CAPITULOS_CONAC_BASE.map(c => {
                    const data = capitulos[c.key] || { anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 };
                    return (
                      <tr key={c.key} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {c.capitulo}
                        </td>
                        <td className="py-1 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={data.anual || ''}
                            onChange={(e) => handleCambioCapitulo(c.key, 'anual', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-mono font-bold text-slate-900"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-1 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={data.t1 || ''}
                            onChange={(e) => handleCambioCapitulo(c.key, 't1', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-mono text-slate-700"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-1 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={data.t2 || ''}
                            onChange={(e) => handleCambioCapitulo(c.key, 't2', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-mono text-slate-700"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-1 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={data.t3 || ''}
                            onChange={(e) => handleCambioCapitulo(c.key, 't3', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-mono text-slate-700"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-1 px-2 text-right">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={data.t4 || ''}
                            onChange={(e) => handleCambioCapitulo(c.key, 't4', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-mono text-slate-700"
                            placeholder="0"
                          />
                        </td>
                        <td className="py-1 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDistribuirEquitativo(c.key)}
                            disabled={!data.anual}
                            className="px-2 py-1 text-[10px] font-bold text-sky-700 hover:bg-sky-50 border border-sky-300 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Distribuir monto anual en partes iguales entre los 4 trimestres"
                          >
                            25% c/trim
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Fila de Totales */}
                  <tr className="bg-slate-100/90 font-black text-slate-900 border-t-2 border-slate-300">
                    <td className="py-3 px-3 uppercase text-xs text-[#002855]">
                      Monto Solicitado Total
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-sm text-[#002855]">
                      {fmtMonto(totalGeneral.anual)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-slate-800">
                      {fmtMonto(totalGeneral.t1)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-slate-800">
                      {fmtMonto(totalGeneral.t2)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-slate-800">
                      {fmtMonto(totalGeneral.t3)}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-slate-800">
                      {fmtMonto(totalGeneral.t4)}
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-[10px] text-emerald-700">
                      100.0%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </ContenedorModal>
  );
}
