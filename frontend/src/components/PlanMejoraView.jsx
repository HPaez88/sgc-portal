import React, { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../supabase';
import PlanesLista from './planes/PlanesLista';
import PlanesForm from './planes/PlanesForm';
import PlanesDetalle from './planes/PlanesDetalle';
import { getEstadoColor, getEstadoLabel } from '../constants';

export default function PlanMejoraView({ planesMejora, setPlanesMejora, usuarios, puedeTodasAreas, areaUsuario, usuarioLogueado }) {
  const [vista, setVista] = useState('lista');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  
  const [form, setForm] = useState({
    id: null,
    folio: null,
    estado: 'BORRADOR',
    titulo_mejora: '',
    gerencia_coordinacion: '',
    categoria_mejora: '',
    periodo_mejora: '',
    origen: '',
    descripcion_situacion_actual: '',
    situacion_deseada: '',
    beneficios: '',
    created_at: new Date().toISOString(),
    fecha_envio_sgc: null,
    fecha_apertura: null,
    fecha_cierre: null,
    auditor_cierre: '',
    resultado_cierre: '',
    comentarios_revision: ''
  });
  
  const [equipo, setEquipo] = useState([
    { id: 1, nombre: '', puesto: '', rol: 'Responsable principal' }
  ]);
  
  const [actividades, setActividades] = useState([]);

  const resetForm = () => {
    setForm({
      id: null, folio: null, estado: 'BORRADOR', titulo_mejora: '', gerencia_coordinacion: '',
      categoria_mejora: '', periodo_mejora: '', origen: '', descripcion_situacion_actual: '',
      situacion_deseada: '', beneficios: '', created_at: new Date().toISOString(),
      fecha_envio_sgc: null, fecha_apertura: null, fecha_cierre: null, auditor_cierre: '',
      resultado_cierre: '', comentarios_revision: ''
    });
    setEquipo([{ id: 1, nombre: '', puesto: '', rol: 'Responsable principal' }]);
    setActividades([]);
    setStep(1);
    setError('');
    setMensaje('');
  };

  const handleVer = (pm) => {
    setForm(pm);
    
    // Cargar equipo
    if (pm.integrantes) {
      try {
        const parsed = typeof pm.integrantes === 'string' ? JSON.parse(pm.integrantes) : pm.integrantes;
        setEquipo(parsed.length > 0 ? parsed : [{ id: 1, nombre: '', puesto: '', rol: 'Responsable principal' }]);
      } catch(e) { console.log(e); }
    } else {
      setEquipo([{ id: 1, nombre: pm.responsable || '', puesto: '', rol: 'Responsable principal' }]);
    }
    
    // Cargar actividades
    if (pm.actividades) {
      try {
        const parsed = typeof pm.actividades === 'string' ? JSON.parse(pm.actividades) : pm.actividades;
        setActividades(parsed);
      } catch(e) { console.log(e); }
    } else {
      setActividades([]);
    }
    
    setVista('ver');
    setStep(1);
  };

  const guardarBorrador = async (overrideData = null) => {
    setLoading(true);
    setError('');
    
    const datosActuales = overrideData ? { ...form, ...overrideData } : form;
    if (!datosActuales.titulo_mejora) { setError('Falta título'); setLoading(false); return; }
    
    const nuevoId = datosActuales.id || Date.now();
    const nuevo = {
      ...datosActuales,
      id: nuevoId,
      created_at: datosActuales.created_at || new Date().toISOString(),
      integrantes: JSON.stringify(equipo),
      actividades: JSON.stringify(actividades)
    };
    
    let listasActualizadas;
    if (datosActuales.id) {
      listasActualizadas = planesMejora.map(pm => pm.id === datosActuales.id ? nuevo : pm);
    } else {
      listasActualizadas = [...planesMejora, nuevo];
    }
    setPlanesMejora(listasActualizadas);
    
    try {
      if (!isSupabaseConfigured || !supabase) {
        setMensaje('Guardado local');
      } else {
        const { error } = await supabase.from('planes_mejora').upsert({
          ...nuevo,
          integrantes: JSON.stringify(equipo),
          actividades: JSON.stringify(actividades),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        if (error) setMensaje('Guardado local');
        else setMensaje('Guardado exitosamente');
      }
    } catch (e) {
      setMensaje('⚠️ Guardado local');
    }
    
    setForm({ ...datosActuales, id: nuevoId });
    setLoading(false);
    setTimeout(() => setMensaje(''), 3000);
  };

  const eliminarPM = async (id) => {
    if (!confirm('¿Seguro de eliminar este plan de mejora?')) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('planes_mejora').delete().eq('id', id);
      }
    } catch (e) {
      console.warn('Delete skipped in Supabase:', e);
    }
    setPlanesMejora(planesMejora.filter(pm => pm.id !== id));
    setLoading(false);
    setMensaje('🗑️ Eliminado');
    setTimeout(() => setMensaje(''), 3000);
  };

  const enviarSGC = () => {
    setForm(f => ({ ...f, estado: 'EN_REVISION', fecha_envio_sgc: new Date().toISOString() }));
    guardarBorrador();
    setTimeout(() => { setVista('lista'); setMensaje('📤 Enviado a SGC para revisión'); }, 500);
  };

  const aprobarSGC = () => {
    const folioNumero = planesMejora.length + 1;
    const anio = new Date().getFullYear().toString().slice(-2);
    const folioCodigo = `PM#${folioNumero}/${anio}`;
    setForm(f => ({
      ...f, estado: 'APROBADO', folio: folioCodigo,
      fecha_apertura: new Date().toISOString()
    }));
    guardarBorrador();
    setTimeout(() => { setVista('lista'); setMensaje('✅ Aprobado: ' + folioCodigo); }, 500);
  };

  const asignarAuditor = () => {
    const auditor = prompt('Nombre del auditor para revisar cierre:');
    if (!auditor) return;
    setForm(f => ({ ...f, estado: 'REVISION_AUDITOR', auditor_cierre: auditor }));
    guardarBorrador();
    setMensaje('📋 Auditor asignado');
    setTimeout(() => { setVista('lista'); }, 500);
  };

  const cerrarAccion = (efectiva) => {
    const estadoCierre = efectiva ? 'CERRADO_EFECTIVO' : 'CERRADO_NO_EFECTIVO';
    setForm(f => ({
      ...f, estado: estadoCierre, fecha_cierre: new Date().toISOString(),
      resultado_cierre: efectiva ? 'EFECTIVA' : 'NO EFECTIVA'
    }));
    guardarBorrador();
    setMensaje(efectiva ? '✅ Plan cerrado' : '❌ Plan no efectivo');
    setTimeout(() => { setVista('lista'); }, 500);
  };

  const getBotonesWorkflow = () => {
    const botones = [];
    switch (form.estado) {
      case 'BORRADOR':
        botones.push(
          <button key="enviar" onClick={enviarSGC} className="px-6 py-2.5 bg-[#002855] text-white font-medium rounded-lg hover:bg-[#001d40] transition-colors">
            📤 Enviar a SGC
          </button>
        );
        break;
      case 'EN_REVISION':
        botones.push(
          <button key="aprobar" onClick={aprobarSGC} className="px-6 py-2.5 bg-[#002855] text-white font-medium rounded-lg hover:bg-[#001f42] transition-colors">
            ✓ Aprobar y Asignar Folio
          </button>
        );
        break;
      case 'APROBADO':
        botones.push(
          <button key="auditor" onClick={asignarAuditor} className="px-6 py-2.5 bg-[#002855] text-white font-medium rounded-lg hover:bg-[#001f42] transition-colors">
            👤 Asignar Auditor de Cierre
          </button>
        );
        break;
      case 'REVISION_AUDITOR':
        botones.push(
          <button key="efectiva" onClick={() => cerrarAccion(true)} className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors">
            ✅ Cierre Efectivo
          </button>,
          <button key="noefectiva" onClick={() => cerrarAccion(false)} className="px-6 py-2.5 border border-red-200 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors ml-2">
            ❌ Cierre No Efectivo
          </button>
        );
        break;
      case 'RECHAZADO':
        botones.push(
          <button key="corregir" onClick={() => {
            setForm(f => ({...f, estado: 'BORRADOR'}));
            setMensaje('Corrigiendo Borrador...');
          }} className="px-6 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors">
            ✏️ Corregir y Re-enviar
          </button>
        );
        break;
    }
    return botones;
  };

  // Render
  if (vista === 'lista') {
    return (
      <PlanesLista 
        planesMejora={planesMejora}
        setVista={setVista}
        setStep={setStep}
        resetForm={resetForm}
        handleVer={handleVer}
        eliminarPM={eliminarPM}
        usuarioLogueado={usuarioLogueado}
        getEstadoColor={getEstadoColor}
        getEstadoLabel={getEstadoLabel}
      />
    );
  }

  if (vista === 'nuevo') {
    return (
      <PlanesForm 
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
        actividades={actividades}
        setActividades={setActividades}
        loading={loading}
        guardarBorrador={guardarBorrador}
        setVista={setVista}
        getBotonesWorkflow={getBotonesWorkflow}
      />
    );
  }

  if (vista === 'ver') {
    return (
      <PlanesDetalle 
        form={form}
        setForm={setForm}
        equipo={equipo}
        actividades={actividades}
        setActividades={setActividades}
        setVista={setVista}
        getBotonesWorkflow={getBotonesWorkflow}
        getEstadoColor={getEstadoColor}
        getEstadoLabel={getEstadoLabel}
        guardarBorrador={guardarBorrador}
        setError={setError}
      />
    );
  }

  return null;
}
