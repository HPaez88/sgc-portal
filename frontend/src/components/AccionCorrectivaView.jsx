import React, { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../supabase';
import AccionesLista from './acciones/AccionesLista';
import AccionesWizard from './acciones/AccionesWizard';
import AccionesDetalle from './acciones/AccionesDetalle';
import { ESTADOS_SGC, getEstadoColor, getEstadoLabel } from '../constants';

export default function AccionCorrectivaView({ accionesCorrectivas, setAccionesCorrectivas, usuarios, puedeTodasAreas, areaUsuario, usuarioLogueado }) {
  const [vista, setVista] = useState('lista');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  
  const [form, setForm] = useState({
    id: null,
    folio_numero: null,
    folio_codigo: 'Pendiente de aprobación',
    anio_folio: null,
    estado: 'BORRADOR',
    area: '',
    proceso: '',
    origen: '',
    numero_auditoria: '',
    descripcion_no_conformidad_original: '',
    comentarios_revision: '',
    descripcion_no_conformidad_ia: '',
    descripcion_no_conformidad_final: '',
    impacta_otros_procesos: 'NO',
    otros_procesos_afectados: '',
    accion_contenedora: '',
    actividad_inmediata: '',
    responsable_actividad_inmediata: '',
    fecha_actividad_inmediata: '',
    herramienta_analisis: 'Lluvia de ideas',
    requiere_actualizar_matriz_riesgos: 'NO',
    descripcion_riesgo_oportunidad: '',
    requiere_cambio_sgc: 'NO',
    fecha_creacion_borrador: new Date().toISOString(),
    fecha_generacion_ia: null,
    fecha_envio_sgc: null,
    fecha_aprobacion_sgc: null,
    fecha_apertura: null,
    fecha_cierre: null,
    usuario_solicitante: '',
    aprobado_por_sgc: '',
    auditor_cierre: '',
    resultado_cierre: '',
    evidencia_objetiva_revisada: '',
    conclusion_eficacia: '',
    clave_formato: 'OOMRSC-20',
    revision_formato: 'Rev. 18'
  });
  
  const [equipo, setEquipo] = useState([
    { id: 1, nombre: '', puesto: '', area: '', rol: 'Responsable principal', es_responsable_principal: true, firma_digital: '' }
  ]);
  
  const [causas, setCausas] = useState([
    { id: 1, numero: 1, causa: '', puntuacion_sugerida: 0, porcentaje_sugerido: 0, es_causa_principal: false },
    { id: 2, numero: 2, causa: '', puntuacion_sugerida: 0, porcentaje_sugerido: 0, es_causa_principal: false },
    { id: 3, numero: 3, causa: '', puntuacion_sugerida: 0, porcentaje_sugerido: 0, es_causa_principal: false },
    { id: 4, numero: 4, causa: '', puntuacion_sugerida: 0, porcentaje_sugerido: 0, es_causa_principal: false }
  ]);
  
  const [actividades, setActividades] = useState([]);

  const resetForm = () => {
    setForm({
      id: null, folio_numero: null, folio_codigo: 'Pendiente de aprobación', anio_folio: null,
      estado: 'BORRADOR', area: '', proceso: '', origen: '', numero_auditoria: '',
      descripcion_no_conformidad_original: '', descripcion_no_conformidad_ia: '', descripcion_no_conformidad_final: '',
      impacta_otros_procesos: 'NO', otros_procesos_afectados: '', accion_contenedora: '',
      actividad_inmediata: '', responsable_actividad_inmediata: '', fecha_actividad_inmediata: '',
      herramienta_analisis: 'Lluvia de ideas', requiere_actualizar_matriz_riesgos: 'NO', descripcion_riesgo_oportunidad: '',
      requiere_cambio_sgc: 'NO', fecha_creacion_borrador: new Date().toISOString(),
      fecha_generacion_ia: null, fecha_envio_sgc: null, fecha_aprobacion_sgc: null, fecha_apertura: null, fecha_cierre: null,
      usuario_solicitante: '', aprobado_por_sgc: '', auditor_cierre: '', resultado_cierre: '',
      evidencia_objetiva_revisada: '', conclusion_eficacia: '', clave_formato: 'OOMRSC-20', revision_formato: 'Rev. 18'
    });
    setEquipo([{ id: 1, nombre: '', puesto: '', area: '', rol: 'Responsable principal', es_responsable_principal: true, firma_digital: '' }]);
    setCausas([
      { id: 1, numero: 1, causa: '', puntuacion_sugerida: 0, porcentaje_sugerido: 0, es_causa_principal: false },
      { id: 2, numero: 2, causa: '', puntuacion_sugerida: 0, porcentaje_sugerido: 0, es_causa_principal: false },
      { id: 3, numero: 3, causa: '', puntuacion_sugerida: 0, porcentaje_sugerido: 0, es_causa_principal: false },
      { id: 4, numero: 4, causa: '', puntuacion_sugerida: 0, porcentaje_sugerido: 0, es_causa_principal: false }
    ]);
    setActividades([]);
    setStep(1);
    setError('');
    setMensaje('');
  };

  const guardarBorrador = async (overrideData = null) => {
    setLoading(true);
    setError('');
    
    const datosActuales = overrideData ? { ...form, ...overrideData } : form;
    
    if (!datosActuales.area) { setError('Selecciona el área'); setLoading(false); return; }
    if (!datosActuales.descripcion_no_conformidad_original) { setError('Describe la no conformidad'); setLoading(false); return; }
    
    const nuevoId = datosActuales.id || Date.now();
    
    const nuevo = {
      ...datosActuales,
      id: nuevoId,
      fecha_creacion_borrador: datosActuales.fecha_creacion_borrador || new Date().toISOString(),
      equipo_json: JSON.stringify(equipo),
      causas_json: JSON.stringify(causas),
      actividades_json: JSON.stringify(actividades)
    };
    
    let listasActualizadas;
    if (datosActuales.id) {
      listasActualizadas = accionesCorrectivas.map(ac => ac.id === datosActuales.id ? nuevo : ac);
    } else {
      listasActualizadas = [...accionesCorrectivas, nuevo];
    }
    setAccionesCorrectivas(listasActualizadas);
    
    try {
      if (!isSupabaseConfigured || !supabase) {
        setMensaje('Guardado local');
      } else {
        const { error } = await supabase.from('acciones_correctivas').upsert({
          ...nuevo,
          equipo_json: JSON.stringify(equipo),
          causas_json: JSON.stringify(causas),
          actividades_json: JSON.stringify(actividades),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        if (error) setMensaje('Guardado local (error en servidor)');
        else setMensaje('Guardado exitosamente');
      }
    } catch (e) {
      setMensaje('⚠️ Guardado local');
    }
    
    setForm({ ...datosActuales, id: nuevoId });
    setLoading(false);
    setTimeout(() => setMensaje(''), 3000);
  };

  const eliminarAC = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta acción correctiva?')) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('acciones_correctivas').delete().eq('id', id);
      }
    } catch (e) {
      console.warn('Delete skipped in Supabase:', e);
    }
    setAccionesCorrectivas(accionesCorrectivas.filter(ac => ac.id !== id));
    setLoading(false);
    setMensaje('🗑️ Eliminado');
    setTimeout(() => setMensaje(''), 3000);
  };

  const enviarSGC = () => {
    const cambios = { estado: 'EN_REVISION', fecha_envio_sgc: new Date().toISOString() };
    setForm(f => ({ ...f, ...cambios }));
    guardarBorrador(cambios);
    setTimeout(() => { setVista('lista'); setMensaje('📤 Enviado a SGC para revisión'); }, 600);
  };

  const aprobarSGC = () => {
    const folioNumero = accionesCorrectivas.filter(ac => ac.folio_codigo && ac.folio_codigo !== 'Pendiente de aprobación').length + 1;
    const anio = new Date().getFullYear().toString().slice(-2);
    const folioCodigo = `AC#${folioNumero}/${anio}`;
    const cambios = {
      estado: 'EN_SEGUIMIENTO', folio_numero: folioNumero, folio_codigo: folioCodigo,
      anio_folio: anio, fecha_aprobacion_sgc: new Date().toISOString(), fecha_apertura: new Date().toISOString(),
      aprobado_por_sgc: usuarioLogueado?.nombre || 'Admin SGC'
    };
    setForm(f => ({ ...f, ...cambios }));
    guardarBorrador(cambios);
    setTimeout(() => { setVista('lista'); setMensaje('✅ Folio asignado: ' + folioCodigo); }, 600);
  };

  const rechazarSGC = () => {
    if (!confirm('¿Seguro que deseas rechazar esta acción correctiva?')) return;
    const cambios = { estado: 'RECHAZADO' };
    setForm(f => ({ ...f, ...cambios }));
    guardarBorrador(cambios);
    setTimeout(() => { setVista('lista'); setMensaje('❌ Acción Rechazada'); }, 600);
  };

  const [mostrarModalAuditor, setMostrarModalAuditor] = useState(false);
  const [auditorSeleccionado, setAuditorSeleccionado] = useState('');

  const auditoresDisponibles = usuarios.filter(u => 
    u.rol === 'Auditor' || u.rol === 'Admin' || u.rol === 'Super Admin'
  );

  const asignarAuditor = () => {
    setMostrarModalAuditor(true);
  };

  const confirmarAuditor = () => {
    if (!auditorSeleccionado) return;
    const cambios = { estado: 'REVISION_AUDITOR', auditor_cierre: auditorSeleccionado };
    setForm(f => ({ ...f, ...cambios }));
    guardarBorrador(cambios);
    setMostrarModalAuditor(false);
    setAuditorSeleccionado('');
    setMensaje('📋 Auditor asignado: ' + auditorSeleccionado);
    setTimeout(() => { setVista('lista'); }, 600);
  };

  const cerrarAccion = (efectiva) => {
    const estadoCierre = efectiva ? 'CERRADO_EFECTIVO' : 'CERRADO_NO_EFECTIVO';
    const cambios = {
      estado: estadoCierre, fecha_cierre: new Date().toISOString(),
      resultado_cierre: efectiva ? 'EFECTIVA' : 'NO EFECTIVA'
    };
    setForm(f => ({ ...f, ...cambios }));
    guardarBorrador(cambios);
    setMensaje(efectiva ? '✅ Acción cerrada efectiva' : '❌ Acción cerrada no efectiva');
    setTimeout(() => { setVista('lista'); }, 600);
  };

  const getBotonesWorkflow = () => {
    const botones = [];

    // Lógica para Administradores (SGC) viendo el detalle de un formato
    if (puedeTodasAreas && vista === 'ver') {
      if (form.estado === 'BORRADOR' || form.estado === 'GENERADO_IA' || form.estado === 'EN_REVISION') {
        botones.push(
          <button key="rechazar" onClick={rechazarSGC} className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
            ❌ Rechazar
          </button>,
          <button key="aprobar" onClick={aprobarSGC} className="px-5 py-2.5 bg-[#002855] text-white font-medium rounded-lg hover:bg-[#001f42] transition-colors">
            ✓ Aprobar y Asignar Folio
          </button>,
          <button key="auditor" onClick={asignarAuditor} className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            👤 Asignar Auditor
          </button>
        );
      } else if (form.estado === 'EN_SEGUIMIENTO' || form.estado === 'APROBADO') {
        botones.push(
          <button key="auditor" onClick={asignarAuditor} className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            👤 Asignar Auditor
          </button>
        );
      } else if (form.estado === 'REVISION_AUDITOR') {
        botones.push(
          <button key="cerrar_efectiva" onClick={() => cerrarAccion(true)} className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            ✅ Cerrar (Efectiva)
          </button>,
          <button key="cerrar_no" onClick={() => cerrarAccion(false)} className="px-5 py-2.5 border border-red-200 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors ml-2">
            ❌ Cerrar (No Efectiva)
          </button>
        );
      }
    } else {
      // Lógica para Usuarios Normales o cuando se está creando (wizard)
      if (form.estado === 'BORRADOR' || form.estado === 'GENERADO_IA') {
        botones.push(
          <button key="enviar" onClick={enviarSGC} className="px-6 py-2.5 bg-[#002855] text-white font-medium rounded-lg hover:bg-[#001d40] transition-colors">
            📤 Enviar a SGC
          </button>
        );
      } else if (form.estado === 'REVISION_AUDITOR' && usuarioLogueado?.rol === 'Auditor') {
        botones.push(
          <button key="cerrar_efectiva" onClick={() => cerrarAccion(true)} className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            ✅ Cerrar (Efectiva)
          </button>,
          <button key="cerrar_no" onClick={() => cerrarAccion(false)} className="px-5 py-2.5 border border-red-200 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors ml-2">
            ❌ Cerrar (No Efectiva)
          </button>
        );
      } else if (form.estado === 'RECHAZADO') {
        botones.push(
          <button key="corregir" onClick={() => {
            setForm(f => ({...f, estado: 'BORRADOR'}));
            setMensaje('Corrigiendo Borrador...');
          }} className="px-6 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors">
            ✏️ Corregir y Re-enviar
          </button>
        );
      }
    }

    if (form.estado === 'CERRADO_EFECTIVO' || form.estado === 'CERRADO_NO_EFECTIVO') {
      if (usuarioLogueado?.rol === 'Super Admin') {
        botones.push(
          <button key="reabrir" onClick={() => {
            if (confirm('¿Reabrir esta acción correctiva?')) {
              const cambios = { estado: 'EN_SEGUIMIENTO', fecha_reapertura: new Date().toISOString() };
              setForm(f => ({...f, ...cambios}));
              guardarBorrador(cambios);
              setMensaje('🔓 Reabierta');
            }
          }} className="px-6 py-2.5 bg-[#002855] text-white font-medium rounded-lg hover:bg-[#001f42] transition-colors">
            🔓 Reabrir
          </button>
        );
      }
    }

    return <div className="flex gap-2 flex-wrap items-center">{botones}</div>;
  };

  // Renderizar la vista actual
  if (vista === 'lista') {
    return (
      <AccionesLista 
        accionesCorrectivas={accionesCorrectivas}
        setForm={setForm}
        setEquipo={setEquipo}
        setCausas={setCausas}
        setActividades={setActividades}
        setVista={setVista}
        setStep={setStep}
        resetForm={resetForm}
        eliminarAC={eliminarAC}
        usuarioLogueado={usuarioLogueado}
        getEstadoColor={getEstadoColor}
        getEstadoLabel={getEstadoLabel}
      />
    );
  }

  if (vista === 'nuevo') {
    return (
      <AccionesWizard 
        step={step}
        setStep={setStep}
        form={form}
        setForm={setForm}
        error={error}
        setError={setError}
        mensaje={mensaje}
        setMensaje={setMensaje}
        equipo={equipo}
        setEquipo={setEquipo}
        causas={causas}
        setCausas={setCausas}
        actividades={actividades}
        setActividades={setActividades}
        loading={loading}
        guardarBorrador={guardarBorrador}
        setVista={setVista}
        getBotonesWorkflow={getBotonesWorkflow}
        getEstadoColor={getEstadoColor}
        getEstadoLabel={getEstadoLabel}
      />
    );
  }

  const modalAuditor = mostrarModalAuditor && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card-dark rounded-2xl shadow-2xl p-6 w-full max-w-md animate-fade-in-up">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <span className="text-xl">👤</span> Asignar Auditor
        </h3>
        <p className="text-sm text-slate-400 mb-4">Selecciona un auditor de la lista de usuarios registrados:</p>
        <select 
          value={auditorSeleccionado} 
          onChange={(e) => setAuditorSeleccionado(e.target.value)}
          className="w-full p-3 border-2 border-cyan-500/20 rounded-xl focus:border-[#002855] outline-none text-sm font-medium transition-colors"
        >
          <option value="">-- Seleccionar Auditor --</option>
          {auditoresDisponibles.map(u => (
            <option key={u.id} value={u.nombre}>{u.nombre} ({u.rol} - {u.area})</option>
          ))}
        </select>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={() => { setMostrarModalAuditor(false); setAuditorSeleccionado(''); }} className="px-5 py-2.5 border border-cyan-500/20 text-slate-300 font-medium rounded-lg hover:glass-card-dark-header transition-colors">
            Cancelar
          </button>
          <button onClick={confirmarAuditor} disabled={!auditorSeleccionado} className="px-5 py-2.5 bg-[#002855] text-white font-medium rounded-lg hover:bg-[#001f42] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            ✓ Confirmar Auditor
          </button>
        </div>
      </div>
    </div>
  );

  if (vista === 'ver') {
    return (
      <>
        {modalAuditor}
        <AccionesDetalle 
          form={form}
          setForm={setForm}
          equipo={equipo}
          causas={causas}
          actividades={actividades}
          setActividades={setActividades}
          setVista={setVista}
          getBotonesWorkflow={getBotonesWorkflow}
          getEstadoColor={getEstadoColor}
          getEstadoLabel={getEstadoLabel}
          guardarBorrador={guardarBorrador}
          setError={setError}
          mensaje={mensaje}
          setMensaje={setMensaje}
        />
      </>
    );
  }

  return null;
}
