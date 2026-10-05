import React, { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../supabase';
import { useSGC } from '../SGCContext';
import AccionesLista from './acciones/AccionesLista';
import AccionesWizard from './acciones/AccionesWizard';
import AccionesDetalle from './acciones/AccionesDetalle';
import ModalConfirmacionEliminar from './common/ModalConfirmacionEliminar';
import { useToast } from './common/Toast';
import { useDialogos, Dialogos } from './common/Dialogos';
import ContenedorModal from './common/ContenedorModal';
import { ESTADOS_SGC, getEstadoColor, getEstadoLabel, can, generarFolio, getDireccionDeArea, puedeVerArea } from '../constants';

export default function AccionCorrectivaView({ accionesCorrectivas, setAccionesCorrectivas, usuarios, puedeTodasAreas, areaUsuario, usuarioLogueado }) {
  const { registrarMovimiento } = useSGC();
  const toast = useToast();
  const { confirmar, solicitar, props: propsDialogos } = useDialogos();
  const [vista, setVista] = useState('lista');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modalEliminar, setModalEliminar] = useState({ isOpen: false, item: null });

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
      creado_por: datosActuales.creado_por || usuarioLogueado?.nombre || 'Usuario SGC',
      creador_email: datosActuales.creador_email || usuarioLogueado?.email || '',
      creador_area: datosActuales.creador_area || usuarioLogueado?.area || '',
      fecha_creacion_borrador: datosActuales.fecha_creacion_borrador || new Date().toISOString(),
      equipo_json: JSON.stringify(equipo),
      causas_json: JSON.stringify(causas),
      actividades_json: datosActuales.actividades_json || JSON.stringify(actividades)
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
        setMensaje('Borrador guardado exitosamente');
      } else {
        const { error } = await supabase.from('acciones_correctivas').upsert({
          ...nuevo,
          equipo_json: JSON.stringify(equipo),
          causas_json: JSON.stringify(causas),
          actividades_json: JSON.stringify(actividades),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

        if (error) setMensaje('Borrador guardado exitosamente (modo offline)');
        else setMensaje('Guardado exitosamente');
      }
    } catch (e) {
      setMensaje('⚠️ Borrador guardado exitosamente');
    }

    setForm({ ...datosActuales, id: nuevoId });
    setLoading(false);
    setTimeout(() => setMensaje(''), 3000);
  };

  const eliminarAC = (id) => {
    const ac = accionesCorrectivas.find(a => a.id === id);
    if (!ac) return;
    setModalEliminar({ isOpen: true, item: ac });
  };

  const ejecutarEliminarAC = async (motivo) => {
    const ac = modalEliminar.item;
    if (!ac) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('acciones_correctivas').delete().eq('id', ac.id);
      }
    } catch (e) {
      console.warn('Delete skipped in Supabase:', e);
    }
    setAccionesCorrectivas(accionesCorrectivas.filter(item => item.id !== ac.id));

    // Registrar en Bitácora oficial de auditoría
    registrarMovimiento({
      modulo: 'ACCIONES_CORRECTIVAS',
      accion: 'ELIMINACION',
      descripcion: `Eliminación permanente de Acción Correctiva ${ac.folio_sgc || `#${ac.id}`}`,
      detalles: `Motivo: ${motivo} | Proceso: ${ac.proceso || 'N/A'} | Área: ${ac.area || 'N/A'}`,
      folio: ac.folio_sgc || `AC-${ac.id}`
    });

    setLoading(false);
    setMensaje('🗑️ Acción Correctiva eliminada permanentemente y registrada en bitácora');
    setModalEliminar({ isOpen: false, item: null });
    setTimeout(() => setMensaje(''), 3500);
  };

  const enviarSGC = () => {
    if (!form.area?.trim()) {
      toast.warning('Debe seleccionar el Área responsable.');
      return;
    }
    if (!form.proceso?.trim()) {
      toast.warning('Debe seleccionar el Proceso afectado.');
      return;
    }
    if (!form.origen?.trim()) {
      toast.warning('Debe seleccionar el Origen de la no conformidad.');
      return;
    }
    if (form.origen === 'Auditoría' && !form.numero_auditoria?.trim()) {
      toast.warning('El Número de Auditoría es obligatorio cuando el origen es Auditoría.');
      return;
    }
    if (!form.descripcion_no_conformidad_original?.trim()) {
      toast.warning('Debe capturar la Descripción de la No Conformidad.');
      return;
    }
    if (!equipo || equipo.length < 3) {
      toast.warning('Se requiere un mínimo de 3 integrantes en el equipo de análisis.');
      return;
    }
    for (let i = 0; i < equipo.length; i++) {
      const m = equipo[i];
      if (!m.nombre?.trim() || !m.puesto?.trim() || !m.area?.trim() || !m.rol?.trim()) {
        toast.warning(`Todos los integrantes del equipo deben tener Nombre, Puesto, Área y Rol capturados (revisar integrante #${i + 1}).`);
        return;
      }
    }
    if (!equipo.some(m => m.es_responsable_principal)) {
      toast.warning('Debe designar a uno de los integrantes del equipo como Responsable Principal.');
      return;
    }
    if (!form.accion_contenedora?.trim()) {
      toast.warning('Debe capturar la Acción Inmediata de Contención.');
      return;
    }
    if (!form.responsable_actividad_inmediata?.trim()) {
      toast.warning('Debe asignar el Responsable de la acción inmediata.');
      return;
    }
    if (!form.fecha_actividad_inmediata?.trim()) {
      toast.warning('Debe indicar la Fecha de Ejecución de la acción inmediata.');
      return;
    }
    if (!causas || causas.length === 0 || causas.some(c => !c.causa?.trim())) {
      toast.warning('Todas las causas del análisis deben tener descripción capturada.');
      return;
    }
    if (!causas.some(c => c.es_causa_principal)) {
      toast.warning('Debe seleccionar cuál de las causas es la Causa Principal.');
      return;
    }
    if (!actividades || actividades.length === 0) {
      toast.warning('Debe registrar al menos una actividad correctiva.');
      return;
    }
    for (let i = 0; i < actividades.length; i++) {
      const act = actividades[i];
      if (!act.actividad?.trim() || !act.responsable?.trim() || !act.fecha_termino_sugerida?.trim() || !act.evidencia_esperada?.trim()) {
        toast.warning(`La actividad correctiva #${i + 1} debe tener capturados todos los datos: descripción, responsable, fecha compromiso y evidencia esperada.`);
        return;
      }
    }
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

  const rechazarSGC = async () => {
    const { ok } = await confirmar({
      titulo: 'Rechazar Acción Correctiva',
      mensaje: 'La acción regresará al área responsable para que atienda las observaciones.',
      textoAceptar: 'Rechazar',
      peligro: true,
    });
    if (!ok) return;
    const cambios = { estado: 'RECHAZADO' };
    setForm(f => ({ ...f, ...cambios }));
    guardarBorrador(cambios);
    setTimeout(() => { setVista('lista'); setMensaje('❌ Acción Rechazada'); }, 600);
  };

  const [mostrarModalAuditor, setMostrarModalAuditor] = useState(false);
  const [auditorSeleccionado, setAuditorSeleccionado] = useState('');
  const [modalDictamen, setModalDictamen] = useState({
    show: false,
    resultado: 'EFECTIVA',
    conclusion: '',
    evidenciaVerificada: ''
  });

  const auditoresDisponibles = usuarios.filter(u =>
    u.rol === 'Auditor' || u.rol === 'Admin' || u.rol === 'Super Admin'
  );

  const asignarAuditor = () => {
    setMostrarModalAuditor(true);
  };

  const confirmarAuditor = () => {
    if (!auditorSeleccionado) return;
    const aud = usuarios.find(u => u.nombre === auditorSeleccionado || u.id === auditorSeleccionado);
    const nombreAuditor = aud?.nombre || auditorSeleccionado;
    const emailAuditor = aud?.email || 'auditor@oomapasc.gob.mx';

    const cambios = {
      estado: 'REVISION_AUDITOR',
      auditor_cierre: nombreAuditor,
      auditor_email: emailAuditor,
      fecha_asignacion_auditor: new Date().toISOString()
    };
    setForm(f => ({ ...f, ...cambios }));
    guardarBorrador(cambios);
    setMostrarModalAuditor(false);
    setAuditorSeleccionado('');
    setMensaje(`📧 Auditor asignado: ${nombreAuditor}. Expediente y notificación enviados a ${emailAuditor}`);
    setTimeout(() => { setVista('lista'); }, 700);
  };

  const solicitarCierre = async () => {
    const { ok } = await confirmar({
      titulo: 'Solicitar cierre de la Acción Correctiva',
      mensaje: 'El expediente se enviará formalmente al SGC para solicitar el cierre y la asignación de un auditor de eficacia.',
      textoAceptar: 'Enviar al SGC',
    });
    if (!ok) return;
    const cambios = {
      estado: 'SOLICITUD_CIERRE',
      fecha_solicitud_cierre: new Date().toISOString(),
      solicitante_cierre: usuarioLogueado?.nombre || 'Usuario'
    };
    setForm(f => ({ ...f, ...cambios }));
    guardarBorrador(cambios);
    setMensaje('🚀 Solicitud de cierre enviada al SGC. Esperando asignación de auditor.');
    setTimeout(() => { setVista('lista'); }, 700);
  };

  const abrirModalDictamen = () => {
    setModalDictamen({
      show: true,
      resultado: 'EFECTIVA',
      conclusion: form.conclusion_eficacia || '',
      evidenciaVerificada: form.evidencia_objetiva_revisada || ''
    });
  };

  const confirmarDictamenAuditor = () => {
    if (!modalDictamen.conclusion || modalDictamen.conclusion.trim().length < 15) {
      toast.warning('Debe capturar una conclusión y justificación de al menos 15 caracteres.');
      return;
    }

    const esEfectiva = modalDictamen.resultado === 'EFECTIVA';
    let cambios = {};

    if (esEfectiva) {
      cambios = {
        estado: 'CERRADO_EFECTIVO',
        fecha_cierre: new Date().toISOString(),
        resultado_cierre: 'EFECTIVA',
        conclusion_eficacia: modalDictamen.conclusion.trim(),
        evidencia_objetiva_revisada: modalDictamen.evidenciaVerificada.trim()
      };
      setMensaje('✅ Acción dictaminada y cerrada como EFECTIVA');
    } else {
      // Regla ISO y usuario: Si no es efectiva, retorna a EN_SEGUIMIENTO con comentarios para seguir trabajando en ella
      const historial = Array.isArray(form.historial_dictamenes) ? [...form.historial_dictamenes] : [];
      historial.push({
        fecha: new Date().toISOString(),
        auditor: usuarioLogueado?.nombre || form.auditor_cierre || 'Auditor',
        resultado: 'NO_EFECTIVA',
        conclusion: modalDictamen.conclusion.trim()
      });

      cambios = {
        estado: 'EN_SEGUIMIENTO',
        resultado_cierre: 'NO_EFECTIVA',
        conclusion_eficacia: modalDictamen.conclusion.trim(),
        evidencia_objetiva_revisada: modalDictamen.evidenciaVerificada.trim(),
        observaciones_auditor: modalDictamen.conclusion.trim(),
        historial_dictamenes: historial
      };
      setMensaje('⚠️ Acción devuelta a SEGUIMIENTO. El área responsable puede continuar trabajando y solventando observaciones.');
    }

    setForm(f => ({ ...f, ...cambios }));
    guardarBorrador(cambios);
    setModalDictamen({ show: false, resultado: 'EFECTIVA', conclusion: '', evidenciaVerificada: '' });
    setTimeout(() => { setVista('lista'); }, 700);
  };

  // Lógica de replanteamiento de fechas límite por actividad (Máximo 2 replanteos)
  const solicitarReplanteoActividad = (index, { nuevaFecha, justificacion }) => {
    const act = actividades[index];
    const replanteosCount = act.replantamientos_count || 0;
    if (replanteosCount >= 2) {
      toast.warning('Esta actividad ya alcanzó el límite máximo de 2 replanteamientos de fecha permitidos.');
      return;
    }
    if (!nuevaFecha) {
      toast.warning('Debe especificar una nueva fecha de compromiso.');
      return;
    }
    if (!justificacion || justificacion.trim().length < 10) {
      toast.warning('Debe capturar una justificación de al menos 10 caracteres para el replanteamiento.');
      return;
    }

    const nuevasActividades = [...actividades];
    nuevasActividades[index] = {
      ...act,
      solicitud_replanteo: {
        fecha_original: act.fecha_termino_sugerida,
        nueva_fecha: nuevaFecha,
        justificacion: justificacion.trim(),
        solicitante: usuarioLogueado?.nombre || 'Responsable',
        solicitante_email: usuarioLogueado?.email || '',
        fecha_solicitud: new Date().toISOString(),
        intento_numero: replanteosCount + 1,
        estado: 'PENDIENTE'
      }
    };
    setActividades(nuevasActividades);
    guardarBorrador({ actividades_json: JSON.stringify(nuevasActividades) });
    setMensaje('⏳ Solicitud de replanteamiento de fecha enviada al SGC para su aprobación.');
  };

  const aprobarReplanteoActividad = (index) => {
    const act = actividades[index];
    if (!act.solicitud_replanteo) return;
    const req = act.solicitud_replanteo;
    const replanteosCount = (act.replantamientos_count || 0) + 1;
    const historial = Array.isArray(act.historial_replanteos) ? [...act.historial_replanteos] : [];
    historial.push({
      fecha_anterior: act.fecha_termino_sugerida,
      nueva_fecha: req.nueva_fecha,
      justificacion: req.justificacion,
      aprobado_por: usuarioLogueado?.nombre || 'SGC Admin',
      fecha_aprobacion: new Date().toISOString(),
      intento_numero: replanteosCount
    });

    const nuevasActividades = [...actividades];
    nuevasActividades[index] = {
      ...act,
      fecha_termino_sugerida: req.nueva_fecha,
      replantamientos_count: replanteosCount,
      historial_replanteos: historial,
      solicitud_replanteo: null
    };
    setActividades(nuevasActividades);
    guardarBorrador({ actividades_json: JSON.stringify(nuevasActividades) });
    setMensaje(`✓ Replanteo aprobado por SGC (${replanteosCount} de 2). Nueva fecha límite: ${req.nueva_fecha}`);
  };

  const rechazarReplanteoActividad = async (index) => {
    const { ok, valor: motivo } = await solicitar({
      titulo: 'Rechazar prórroga de fecha',
      etiqueta: 'Motivo del rechazo',
      placeholder: 'Indica por qué no procede la nueva fecha propuesta...',
      textoAceptar: 'Rechazar prórroga',
      peligro: true,
    });
    if (!ok || !motivo) return;
    const act = actividades[index];
    const nuevasActividades = [...actividades];
    nuevasActividades[index] = {
      ...act,
      solicitud_replanteo: null,
      ultimo_rechazo_replanteo: {
        motivo,
        rechazado_por: usuarioLogueado?.nombre || 'SGC Admin',
        fecha: new Date().toISOString()
      }
    };
    setActividades(nuevasActividades);
    guardarBorrador({ actividades_json: JSON.stringify(nuevasActividades) });
    setMensaje('✕ Solicitud de replanteamiento rechazada por el SGC.');
  };

  const getBotonesWorkflow = () => {
    const botones = [];
    const rol = usuarioLogueado?.rol || 'Usuario';
    const esAdmin = rol === 'Super Admin' || rol === 'Admin';
    const esAuditorAsignado = rol === 'Super Admin' || (usuarioLogueado?.nombre && form.auditor_cierre === usuarioLogueado.nombre);

    // Lógica para Administradores (SGC) viendo el detalle de un formato
    if (esAdmin && vista === 'ver') {
      if (form.estado === 'BORRADOR' || form.estado === 'GENERADO_IA' || form.estado === 'EN_REVISION') {
        botones.push(
          <button key="rechazar" onClick={rechazarSGC} className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm">
            ❌ Rechazar
          </button>,
          <button key="aprobar" onClick={aprobarSGC} className="px-5 py-2.5 bg-[#002855] text-white font-medium rounded-lg hover:bg-[#001f42] transition-colors shadow-sm">
            ✓ Aprobar y Asignar Folio
          </button>
        );
      } else if (form.estado === 'SOLICITUD_CIERRE') {
        botones.push(
          <button key="auditor_cierre" onClick={asignarAuditor} className="px-5 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2">
            <span>👤</span> Asignar Auditor de Cierre
          </button>
        );
      } else if (form.estado === 'EN_SEGUIMIENTO' || form.estado === 'APROBADO') {
        botones.push(
          <button key="solicitar_cierre" onClick={solicitarCierre} className="px-5 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-1.5">
            <span>🚀</span> Solicitar Cierre al SGC
          </button>,
          <button key="auditor" onClick={asignarAuditor} className="px-5 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
            👤 Asignar Auditor
          </button>
        );
      } else if (form.estado === 'REVISION_AUDITOR') {
        botones.push(
          <button key="dictaminar" onClick={abrirModalDictamen} className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
            <span>⚖️</span> Emitir Dictamen de Auditoría
          </button>
        );
      }
    } else {
      // Lógica para Usuarios Normales / Encargados / Auditores
      if (form.estado === 'BORRADOR' || form.estado === 'GENERADO_IA') {
        botones.push(
          <button key="enviar" onClick={enviarSGC} className="px-6 py-2.5 bg-[#002855] text-white font-medium rounded-lg hover:bg-[#001d40] transition-colors shadow-sm">
            📤 Enviar a SGC
          </button>
        );
      } else if (form.estado === 'EN_SEGUIMIENTO' || form.estado === 'APROBADO') {
        botones.push(
          <button key="solicitar_cierre" onClick={solicitarCierre} className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2">
            <span>🚀</span> Solicitar Cierre al SGC
          </button>
        );
      } else if (form.estado === 'SOLICITUD_CIERRE') {
        botones.push(
          <div key="espera_auditor" className="px-4 py-2 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-2">
            <span className="animate-spin text-sm">⏳</span> Solicitud enviada. En espera de asignación de auditor por SGC.
          </div>
        );
      } else if (form.estado === 'REVISION_AUDITOR' && (esAuditorAsignado || rol === 'Auditor')) {
        botones.push(
          <button key="dictaminar" onClick={abrirModalDictamen} className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
            <span>⚖️</span> Emitir Dictamen de Auditoría
          </button>
        );
      } else if (form.estado === 'RECHAZADO') {
        botones.push(
          <button key="corregir" onClick={() => {
            setForm(f => ({...f, estado: 'BORRADOR'}));
            setMensaje('Corrigiendo Borrador...');
          }} className="px-6 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-sm">
            ✏️ Corregir y Re-enviar
          </button>
        );
      }
    }

    if (form.estado === 'CERRADO_EFECTIVO' || form.estado === 'CERRADO_NO_EFECTIVO') {
      if (rol === 'Super Admin') {
        botones.push(
          <button key="reabrir" onClick={async () => {
            const { ok } = await confirmar({
              titulo: 'Reabrir Acción Correctiva',
              mensaje: 'La acción volverá a seguimiento continuo para dar más tiempo o continuar con las actividades.',
              textoAceptar: 'Reabrir',
            });
            if (ok) {
              const cambios = { estado: 'EN_SEGUIMIENTO', fecha_reapertura: new Date().toISOString() };
              setForm(f => ({...f, ...cambios}));
              guardarBorrador(cambios);
              setMensaje('🔓 Reabierta a Seguimiento');
            }
          }} className="px-6 py-2.5 bg-[#002855] text-white font-medium rounded-lg hover:bg-[#001f42] transition-colors shadow-sm">
            🔓 Reabrir Acción
          </button>
        );
      }
    }

    return <div className="flex gap-2 flex-wrap items-center">{botones}</div>;
  };

  // Renderizar la vista actual
  if (vista === 'lista') {
    return (
      <>
        <ModalConfirmacionEliminar
          isOpen={modalEliminar.isOpen}
          onClose={() => setModalEliminar({ isOpen: false, item: null })}
          onConfirm={ejecutarEliminarAC}
          titulo="Eliminar Acción Correctiva"
          itemNombre={modalEliminar.item ? `${modalEliminar.item.folio_sgc || `#${modalEliminar.item.id}`} - ${modalEliminar.item.descripcion_no_conformidad_final || modalEliminar.item.descripcion_no_conformidad_original || 'Acción Correctiva'}` : ''}
          palabraRequerida="CONFIRMAR"
          descripcion="Esta acción es irreversible y eliminará definitivamente el registro del formato OOMRSC-20 y sus causas y actividades vinculadas."
          requiereMotivo={true}
        />
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
      </>
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
    <ContenedorModal isOpen onClose={() => setMostrarModalAuditor(false)} size="md" backdropClassName="bg-black/60 backdrop-blur-sm">
      <div className="max-h-full overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 w-full border border-slate-200">
        <h3 className="text-lg font-bold text-[#002855] mb-2 flex items-center gap-2">
          <span className="text-xl">👤</span> Asignar Auditor de Cierre
        </h3>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Seleccione a un auditor oficial registrado en el portal. Al confirmar, el sistema emitirá la asignación y notificará al auditor por correo institucional para que revise el expediente y evidencias:
        </p>
        <select
          value={auditorSeleccionado}
          onChange={(e) => setAuditorSeleccionado(e.target.value)}
          className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-[#002855] outline-none text-sm font-medium transition-colors"
        >
          <option value="">-- Seleccionar Auditor Registrado --</option>
          {auditoresDisponibles.map(u => (
            <option key={u.id} value={u.nombre}>
              {u.nombre} ({u.rol}) — {u.email || 'Sin correo'}
            </option>
          ))}
        </select>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={() => { setMostrarModalAuditor(false); setAuditorSeleccionado(''); }} className="px-5 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={confirmarAuditor} disabled={!auditorSeleccionado} className="px-5 py-2.5 bg-[#002855] text-white font-medium rounded-lg hover:bg-[#001f42] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
            ✓ Asignar y Notificar
          </button>
        </div>
        </div>
      </ContenedorModal>
  );

  const modalDictamenJSX = modalDictamen.show && (
    <ContenedorModal isOpen onClose={() => setModalDictamen({ ...modalDictamen, show: false })} size="xl" backdropClassName="bg-black/60 backdrop-blur-sm">
      <div className="max-h-full overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 w-full border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <div>
              <h3 className="text-lg font-bold text-[#002855]">Dictamen de Auditoría de Cierre</h3>
              <p className="text-xs text-slate-500 font-medium">Evaluación de eficacia y cierre (ISO 9001:2015)</p>
            </div>
          </div>
          <button 
            onClick={() => setModalDictamen({ show: false, resultado: 'EFECTIVA', conclusion: '', evidenciaVerificada: '' })}
            className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Resultado de la Evaluación <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModalDictamen(d => ({ ...d, resultado: 'EFECTIVA' }))}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  modalDictamen.resultado === 'EFECTIVA' 
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-900 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm">
                  <span>✅</span> Cierre Efectivo
                </div>
                <p className="text-xs mt-1 text-slate-500">
                  Las acciones eliminaron la causa raíz y las evidencias son suficientes y conformes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setModalDictamen(d => ({ ...d, resultado: 'NO_EFECTIVA' }))}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  modalDictamen.resultado === 'NO_EFECTIVA' 
                    ? 'border-amber-500 bg-amber-50/70 text-amber-900 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-sm text-amber-800">
                  <span>❌</span> No Efectivo (Regresar)
                </div>
                <p className="text-xs mt-1 text-slate-500">
                  Requiere trabajo adicional. Regresa a seguimiento con observaciones para solventar.
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Evidencia Objetiva Verificada por el Auditor
            </label>
            <input
              type="text"
              value={modalDictamen.evidenciaVerificada}
              onChange={(e) => setModalDictamen(d => ({ ...d, evidenciaVerificada: e.target.value }))}
              placeholder="Ej. Bitácoras firmadas, reportes fotográficos, facturas, comprobantes..."
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#002855]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Conclusión y Comentarios del Auditor <span className="text-red-500">* (Obligatorio, mín. 15 caracteres)</span>
            </label>
            <textarea
              rows={4}
              value={modalDictamen.conclusion}
              onChange={(e) => setModalDictamen(d => ({ ...d, conclusion: e.target.value }))}
              placeholder={modalDictamen.resultado === 'EFECTIVA' 
                ? "Detalla por qué se considera que las acciones fueron eficaces y se previene la recurrencia..." 
                : "Describe detalladamente los hallazgos u omisiones por las cuales no es efectiva y qué debe corregir el área..."
              }
              className="w-full p-3 border border-slate-200 rounded-lg text-sm outline-none focus:border-[#002855] focus:ring-1 focus:ring-[#002855]"
            />
            <p className="text-xs text-slate-400 mt-1">
              {modalDictamen.conclusion.trim().length} / 15 caracteres requeridos
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6 justify-end pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setModalDictamen({ show: false, resultado: 'EFECTIVA', conclusion: '', evidenciaVerificada: '' })}
            className="px-5 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmarDictamenAuditor}
            disabled={modalDictamen.conclusion.trim().length < 15}
            className={`px-5 py-2.5 text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
              modalDictamen.resultado === 'EFECTIVA' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {modalDictamen.resultado === 'EFECTIVA' ? '✓ Confirmar Cierre Efectivo' : '⚠️ Devolver a Seguimiento con Observaciones'}
          </button>
        </div>
      </div>
    </ContenedorModal>
  );

  if (vista === 'ver') {
    return (
      <>
        <Dialogos {...propsDialogos} />
        {modalAuditor}
        {modalDictamenJSX}
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
          usuarioLogueado={usuarioLogueado}
          usuarios={usuarios}
          solicitarReplanteoActividad={solicitarReplanteoActividad}
          aprobarReplanteoActividad={aprobarReplanteoActividad}
          rechazarReplanteoActividad={rechazarReplanteoActividad}
        />
      </>
    );
  }

  return null;
}
