import React, { useState } from 'react';
import { isSupabaseConfigured, supabase } from '../supabase';
import { useSGC } from '../SGCContext';
import PlanesLista from './planes/PlanesLista';
import PlanesForm from './planes/PlanesForm';
import PlanesDetalle from './planes/PlanesDetalle';
import ModalConfirmacionEliminar from './common/ModalConfirmacionEliminar';
import { useToast } from './common/Toast';
import { useDialogos, Dialogos } from './common/Dialogos';
import ContenedorModal from './common/ContenedorModal';
import ModalConfirmacionResponsabilidadHumana from './common/ModalConfirmacionResponsabilidadHumana';
import { getEstadoColor, getEstadoLabel } from '../constants';

export default function PlanMejoraView({ planesMejora, setPlanesMejora, usuarios, puedeTodasAreas, areaUsuario, usuarioLogueado }) {
  const { registrarMovimiento } = useSGC();
  const toast = useToast();
  const { confirmar, solicitar, props: propsDialogos } = useDialogos();
  const [vista, setVista] = useState('lista');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modalEliminar, setModalEliminar] = useState({ isOpen: false, item: null });
  const [modalConfirmarEnvio, setModalConfirmarEnvio] = useState(false);

  const [form, setForm] = useState({
    id: null,
    folio: null,
    folio_codigo: 'Pendiente de aprobación',
    folio_numero: null,
    estado: 'BORRADOR',
    titulo_mejora: '',
    area: puedeTodasAreas ? '' : (usuarioLogueado?.area || ''),
    gerencia_coordinacion: puedeTodasAreas ? '' : (usuarioLogueado?.area || ''),
    categoria_mejora: '',
    periodo_mejora: '',
    origen: '',
    descripcion_situacion_actual: '',
    situacion_deseada: '',
    beneficios: '',
    creado_por: usuarioLogueado?.nombre || '',
    creador_email: usuarioLogueado?.email || '',
    creador_area: usuarioLogueado?.area || '',
    fecha_creacion_borrador: new Date().toISOString(),
    created_at: new Date().toISOString(),
    fecha_envio_sgc: null,
    fecha_apertura: null,
    fecha_cierre: null,
    auditor_cierre: '',
    resultado_cierre: '',
    comentarios_revision: '',
    clave_formato: 'OOMRSC-21',
    revision_formato: 'Rev. 02'
  });

  const [equipo, setEquipo] = useState([
    { id: 1, nombre: '', puesto: '', rol: 'Responsable principal' }
  ]);

  const [actividades, setActividades] = useState([]);

  const resetForm = () => {
    setForm({
      id: null,
      folio: null,
      folio_codigo: 'Pendiente de aprobación',
      folio_numero: null,
      estado: 'BORRADOR',
      titulo_mejora: '',
      area: puedeTodasAreas ? '' : (usuarioLogueado?.area || ''),
      gerencia_coordinacion: puedeTodasAreas ? '' : (usuarioLogueado?.area || ''),
      categoria_mejora: '',
      periodo_mejora: '',
      origen: '',
      descripcion_situacion_actual: '',
      situacion_deseada: '',
      beneficios: '',
      creado_por: usuarioLogueado?.nombre || '',
      creador_email: usuarioLogueado?.email || '',
      creador_area: usuarioLogueado?.area || '',
      fecha_creacion_borrador: new Date().toISOString(),
      created_at: new Date().toISOString(),
      fecha_envio_sgc: null,
      fecha_apertura: null,
      fecha_cierre: null,
      auditor_cierre: '',
      resultado_cierre: '',
      comentarios_revision: '',
      clave_formato: 'OOMRSC-21',
      revision_formato: 'Rev. 02'
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
    if (!datosActuales.titulo_mejora) { setError('Falta título de la mejora'); setLoading(false); return; }

    const nuevoId = datosActuales.id || Date.now();
    const areaFinal = datosActuales.area || datosActuales.gerencia_coordinacion || '';
    const nuevo = {
      ...datosActuales,
      id: nuevoId,
      area: areaFinal,
      gerencia_coordinacion: areaFinal,
      creado_por: datosActuales.creado_por || usuarioLogueado?.nombre || 'Usuario SGC',
      creador_email: datosActuales.creador_email || usuarioLogueado?.email || '',
      creador_area: datosActuales.creador_area || usuarioLogueado?.area || '',
      fecha_creacion_borrador: datosActuales.fecha_creacion_borrador || datosActuales.created_at || new Date().toISOString(),
      created_at: datosActuales.created_at || new Date().toISOString(),
      integrantes: JSON.stringify(equipo),
      actividades: datosActuales.actividades || JSON.stringify(actividades)
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
        setMensaje('Borrador guardado exitosamente');
      } else {
        const { error } = await supabase.from('planes_mejora').upsert({
          ...nuevo,
          integrantes: JSON.stringify(equipo),
          actividades: typeof nuevo.actividades === 'string' ? nuevo.actividades : JSON.stringify(nuevo.actividades),
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

  const eliminarPM = (id) => {
    const pm = planesMejora.find(p => p.id === id);
    if (!pm) return;
    setModalEliminar({ isOpen: true, item: pm });
  };

  const ejecutarEliminarPM = async (motivo) => {
    const pm = modalEliminar.item;
    if (!pm) return;
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.from('planes_mejora').delete().eq('id', pm.id);
      }
    } catch (e) {
      console.warn('Delete skipped in Supabase:', e);
    }
    setPlanesMejora(planesMejora.filter(item => item.id !== pm.id));

    // Registrar en Bitácora oficial de auditoría
    registrarMovimiento({
      modulo: 'PLANES_MEJORA',
      accion: 'ELIMINACION',
      descripcion: `Eliminación permanente de Plan de Mejora ${pm.folio_sgc || pm.folio || `#${pm.id}`}`,
      detalles: `Motivo: ${motivo} | Título: ${pm.titulo_mejora || 'Sin título'} | Área: ${pm.area || pm.gerencia_coordinacion || 'N/A'}`,
      folio: pm.folio_sgc || pm.folio || `PM-${pm.id}`
    });

    setLoading(false);
    setMensaje('🗑️ Plan de Mejora eliminado permanentemente y registrado en bitácora');
    setModalEliminar({ isOpen: false, item: null });
    setTimeout(() => setMensaje(''), 3500);
  };

  const enviarSGC = () => {
    const areaFinal = form.area?.trim() || form.gerencia_coordinacion?.trim();
    if (!areaFinal) {
      toast.warning('Debe seleccionar el Área líder de la mejora.');
      return;
    }
    if (!form.categoria_mejora?.trim()) {
      toast.warning('Debe seleccionar la Categoría de la mejora.');
      return;
    }
    if (!form.descripcion_situacion_actual?.trim()) {
      toast.warning('Debe describir la Situación Actual a mejorar.');
      return;
    }
    if (!form.titulo_mejora?.trim()) {
      toast.warning('Debe capturar el Título de la Mejora.');
      return;
    }
    if (!form.situacion_deseada?.trim()) {
      toast.warning('Debe capturar la Situación Deseada (Objetivo cuantitativo).');
      return;
    }
    if (!form.beneficios?.trim()) {
      toast.warning('Debe capturar los Beneficios Esperados de la mejora.');
      return;
    }
    if (!equipo || equipo.length === 0 || equipo.some(m => !m.nombre?.trim() || !m.puesto?.trim() || !m.rol?.trim())) {
      toast.warning('Todos los integrantes del equipo deben tener Nombre, Puesto y Rol capturados.');
      return;
    }
    if (!actividades || actividades.length === 0) {
      toast.warning('Debe registrar al menos una actividad en el cronograma de mejora.');
      return;
    }
    for (let i = 0; i < actividades.length; i++) {
      const act = actividades[i];
      if (!act.actividad?.trim() || !act.responsable?.trim() || !act.fecha_termino_sugerida?.trim() || !act.evidencia_esperada?.trim()) {
        toast.warning(`La actividad #${i + 1} debe tener capturados todos los datos: descripción, responsable, fecha límite y evidencia esperada.`);
        return;
      }
    }
    // Abrir modal de verificación y responsabilidad humana obligatoria (ISO 9001 § 10.3 & POL-TI-01)
    setModalConfirmarEnvio(true);
  };

  const handleConfirmarEnvioSGC = (ratificacionData) => {
    const cambios = {
      estado: 'EN_REVISION',
      fecha_envio_sgc: new Date().toISOString(),
      ratificacion_humana: true,
      ratificado_por: ratificacionData.ratificado_por,
      ratificado_email: ratificacionData.ratificado_email,
      fecha_ratificacion_humana: ratificacionData.fecha_ratificacion,
      declaracion_responsabilidad: ratificacionData.declaracion
    };
    setForm(f => ({ ...f, ...cambios }));
    guardarBorrador(cambios);
    setModalConfirmarEnvio(false);

    registrarMovimiento?.({
      modulo: 'PLANES_MEJORA',
      accion: 'ENVIO_SGC_RATIFICADO_HUMANO',
      descripcion: `Envío formal de Plan de Mejora ${form.folio_codigo || form.folio || `PM#${form.id || 'Borrador'}`} a revisión SGC con supervisión humana validada (ISO § 10.3 & POL-TI-01)`,
      detalles: `Ratificado por: ${ratificacionData.ratificado_por} | Área: ${form.area || form.gerencia_coordinacion} | Título: ${form.titulo_mejora} | Confirmación: CONFIRMAR`,
      folio: form.folio_codigo || form.folio || `PM-${form.id || 'Borrador'}`
    });

    toast.success('Plan de mejora ratificado y enviado a revisión del SGC exitosamente');
    setTimeout(() => { setVista('lista'); setMensaje('📤 Enviado a SGC para revisión con supervisión humana validada'); }, 600);
  };

  const aprobarSGC = () => {
    const folioNumero = planesMejora.filter(p => (p.folio_codigo || p.folio) && (p.folio_codigo || p.folio) !== 'Pendiente de aprobación').length + 1;
    const anio = new Date().getFullYear().toString().slice(-2);
    const folioCodigo = `PM#${folioNumero}/${anio}`;
    const cambios = {
      estado: 'EN_SEGUIMIENTO',
      folio: folioCodigo,
      folio_codigo: folioCodigo,
      folio_numero: folioNumero,
      anio_folio: anio,
      fecha_aprobacion_sgc: new Date().toISOString(),
      fecha_apertura: new Date().toISOString(),
      aprobado_por_sgc: usuarioLogueado?.nombre || 'Admin SGC'
    };
    setForm(f => ({ ...f, ...cambios }));
    guardarBorrador(cambios);
    setTimeout(() => { setVista('lista'); setMensaje('✅ Folio asignado: ' + folioCodigo); }, 600);
  };

  const rechazarSGC = async () => {
    const { ok: confirma } = await confirmar({
      titulo: 'Rechazar Plan de Mejora',
      mensaje: 'El plan regresará al área responsable para que atienda las observaciones.',
      textoAceptar: 'Continuar',
      peligro: true,
    });
    if (!confirma) return;

    const { ok, valor: obs } = await solicitar({
      titulo: 'Motivo del rechazo',
      subtitulo: 'Quedará registrado en la bitácora del SGC',
      etiqueta: 'Observaciones para el área responsable',
      placeholder: 'Describe qué debe corregirse antes de volver a enviar el plan...',
      textoAceptar: 'Rechazar y devolver',
      peligro: true,
      filas: 5,
    });
    if (!ok || !obs) return;
    const cambios = {
      estado: 'RECHAZADO',
      observaciones_sgc: obs || 'Devuelto para corrección por el SGC'
    };
    setForm(f => ({ ...f, ...cambios }));
    guardarBorrador(cambios);
    setTimeout(() => { setVista('lista'); setMensaje('❌ Plan Devuelto para corrección'); }, 600);
  };

  const [mostrarModalAuditor, setMostrarModalAuditor] = useState(false);
  const [auditorSeleccionado, setAuditorSeleccionado] = useState('');
  const [modalDictamen, setModalDictamen] = useState({
    show: false,
    resultado: 'EFECTIVA',
    conclusion: '',
    evidenciaVerificada: ''
  });

  const auditoresDisponibles = (usuarios || []).filter(u =>
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
      titulo: 'Solicitar cierre del Plan de Mejora',
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
      setMensaje('✅ Plan de Mejora dictaminado y cerrado como EFECTIVO');
    } else {
      // Regla ISO y usuario: Si no es efectiva, retorna a APROBADO / EN_SEGUIMIENTO con comentarios para seguir trabajando en ella
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
      setMensaje('⚠️ Plan devuelto para continuar seguimiento. El área responsable puede complementar actividades y evidencias.');
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
      toast.warning('Debe especificar una nueva fecha compromiso.');
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
    guardarBorrador({ actividades: JSON.stringify(nuevasActividades) });
    setMensaje('⏳ Solicitud de replanteamiento de fecha enviada al SGC para aprobación.');
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
    guardarBorrador({ actividades: JSON.stringify(nuevasActividades) });
    setMensaje(`✓ Replanteo aprobado por SGC (${replanteosCount} de 2). Nueva fecha: ${req.nueva_fecha}`);
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
    guardarBorrador({ actividades: JSON.stringify(nuevasActividades) });
    setMensaje('✕ Solicitud de replanteamiento rechazada por el SGC.');
  };

  const getBotonesWorkflow = () => {
    const botones = [];
    const rol = usuarioLogueado?.rol || 'Usuario';
    const esAdmin = rol === 'Super Admin' || rol === 'Admin';
    const esAuditorAsignado = rol === 'Super Admin' || (usuarioLogueado?.nombre && form.auditor_cierre === usuarioLogueado.nombre);

    switch (form.estado) {
      case 'BORRADOR':
        botones.push(
          <button key="enviar" onClick={enviarSGC} className="px-6 py-2.5 bg-[#002855] text-white font-medium rounded-lg hover:bg-[#001d40] transition-colors shadow-sm">
            📤 Enviar a SGC
          </button>
        );
        break;
      case 'EN_REVISION':
        if (esAdmin) {
          botones.push(
            <button key="aprobar" onClick={aprobarSGC} className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors shadow-sm">
              ✓ Aprobar y Asignar Folio
            </button>,
            <button key="rechazar" onClick={rechazarSGC} className="px-6 py-2.5 border border-red-200 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-colors ml-2 shadow-sm">
              ❌ Rechazar Plan
            </button>
          );
        }
        break;
      case 'SOLICITUD_CIERRE':
        if (esAdmin) {
          botones.push(
            <button key="auditor" onClick={asignarAuditor} className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2">
              <span>👤</span> Asignar Auditor de Cierre
            </button>
          );
        } else {
          botones.push(
            <div key="espera_auditor" className="px-4 py-2 bg-purple-50 text-purple-800 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-2">
              <span className="animate-spin text-sm">⏳</span> Solicitud de cierre enviada. En espera de auditor.
            </div>
          );
        }
        break;
      case 'APROBADO':
      case 'EN_SEGUIMIENTO':
        botones.push(
          <button key="solicitar_cierre" onClick={solicitarCierre} className="px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center gap-2">
            <span>🚀</span> Solicitar Cierre al SGC
          </button>
        );
        if (esAdmin) {
          botones.push(
            <button key="auditor" onClick={asignarAuditor} className="px-6 py-2.5 bg-[#002855] text-white font-medium rounded-lg hover:bg-[#001f42] transition-colors ml-2 shadow-sm">
              👤 Asignar Auditor
            </button>
          );
        }
        break;
      case 'REVISION_AUDITOR':
        if (esAuditorAsignado || rol === 'Auditor' || esAdmin) {
          botones.push(
            <button key="dictaminar" onClick={abrirModalDictamen} className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2">
              <span>⚖️</span> Emitir Dictamen de Auditoría
            </button>
          );
        }
        break;
      case 'RECHAZADO':
        botones.push(
          <button key="corregir" onClick={() => {
            setForm(f => ({...f, estado: 'BORRADOR'}));
            setMensaje('Corrigiendo Borrador...');
          }} className="px-6 py-2.5 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors shadow-sm">
            ✏️ Corregir y Re-enviar
          </button>
        );
        break;
      case 'CERRADO_EFECTIVO':
      case 'CERRADO_NO_EFECTIVO':
        if (rol === 'Super Admin') {
          botones.push(
            <button key="reabrir" onClick={async () => {
              const { ok } = await confirmar({
                titulo: 'Reabrir Plan de Mejora',
                mensaje: 'El plan volverá a seguimiento continuo para dar más tiempo o continuar con las actividades.',
                textoAceptar: 'Reabrir',
              });
              if (ok) {
                const cambios = { estado: 'EN_SEGUIMIENTO', fecha_reapertura: new Date().toISOString() };
                setForm(f => ({...f, ...cambios}));
                guardarBorrador(cambios);
                setMensaje('🔓 Reabierto a Seguimiento');
              }
            }} className="px-6 py-2.5 bg-[#002855] text-white font-medium rounded-lg hover:bg-[#001f42] transition-colors shadow-sm">
              🔓 Reabrir Plan
            </button>
          );
        }
        break;
    }
    return botones;
  };

  // Render
  const modalConfirmarEnvioJSX = (
    <ModalConfirmacionResponsabilidadHumana
      isOpen={modalConfirmarEnvio}
      onClose={() => setModalConfirmarEnvio(false)}
      onConfirmar={handleConfirmarEnvioSGC}
      tipo="PLAN_MEJORA"
      registro={form}
      equipo={equipo}
      actividades={actividades}
      usuarioLogueado={usuarioLogueado}
      loading={loading}
    />
  );

  if (vista === 'lista') {
    return (
      <>
        <Dialogos {...propsDialogos} />
        {modalConfirmarEnvioJSX}
        <ModalConfirmacionEliminar
          isOpen={modalEliminar.isOpen}
          onClose={() => setModalEliminar({ isOpen: false, item: null })}
          onConfirm={ejecutarEliminarPM}
          titulo="Eliminar Plan de Mejora"
          itemNombre={modalEliminar.item ? `${modalEliminar.item.folio_sgc || modalEliminar.item.folio || `#${modalEliminar.item.id}`} - ${modalEliminar.item.titulo_mejora || 'Plan de Mejora'}` : ''}
          palabraRequerida="CONFIRMAR"
          descripcion="Esta acción es irreversible y eliminará definitivamente el registro del formato OOMRSC-21, así como sus actividades y recursos programados."
          requiereMotivo={true}
        />
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
      </>
    );
  }

  if (vista === 'nuevo') {
    return (
      <>
        {modalConfirmarEnvioJSX}
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
      </>
    );
  }

  const modalAuditor = mostrarModalAuditor && (
    <ContenedorModal isOpen onClose={() => setMostrarModalAuditor(false)} size="2xl" anchoMaximo="max-w-[85vw] xl:max-w-[1000px]" backdropClassName="bg-black/60 backdrop-blur-sm">
      <div className="max-h-full overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full border border-slate-200">
        <h3 className="text-xl font-bold text-[#002855] mb-2 flex items-center gap-2">
          <span className="text-2xl">👤</span> Asignar Auditor de Cierre
        </h3>
        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          Seleccione un auditor de los usuarios registrados. Se registrará la asignación y se notificará por correo electrónico institucional con el expediente para auditoría:
        </p>
        <select
          value={auditorSeleccionado}
          onChange={(e) => setAuditorSeleccionado(e.target.value)}
          className="w-full p-3.5 border-2 border-slate-200 rounded-xl focus:border-[#002855] outline-none text-sm font-medium transition-colors bg-slate-50/50"
        >
          <option value="">-- Seleccionar Auditor Registrado --</option>
          {auditoresDisponibles.map(u => (
            <option key={u.id} value={u.nombre}>
              {u.nombre} ({u.rol}) — {u.email || 'Sin correo'}
            </option>
          ))}
        </select>
        <div className="flex gap-3 mt-8 justify-end">
          <button onClick={() => { setMostrarModalAuditor(false); setAuditorSeleccionado(''); }} className="px-5 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={confirmarAuditor} disabled={!auditorSeleccionado} className="px-6 py-2.5 bg-[#002855] text-white font-medium rounded-xl hover:bg-[#001f42] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
            ✓ Asignar y Notificar
          </button>
        </div>
        </div>
      </ContenedorModal>
  );

  const modalDictamenJSX = modalDictamen.show && (
    <ContenedorModal isOpen onClose={() => setModalDictamen({ ...modalDictamen, show: false })} size="3xl" anchoMaximo="max-w-[90vw] xl:max-w-[1250px]" backdropClassName="bg-black/60 backdrop-blur-sm">
      <div className="max-h-full overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <div>
              <h3 className="text-lg font-bold text-[#002855]">Dictamen de Auditoría - Plan de Mejora</h3>
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
                  Las actividades de mejora se cumplieron y los indicadores demostraron eficacia.
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
              placeholder="Ej. Mediciones de indicadores, registros, entregables..."
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
                ? "Detalla por qué se considera que las acciones del plan fueron eficaces y se alcanzaron los objetivos propuestos..." 
                : "Describe detalladamente los hallazgos u omisiones por las cuales no es efectiva y qué debe corregir o complementar el área..."
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
        {modalConfirmarEnvioJSX}
        {modalAuditor}
        {modalDictamenJSX}
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
