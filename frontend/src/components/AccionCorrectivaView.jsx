import { useState } from 'react';
import { supabase } from '../supabase';

const AREAS = [
  "Agencia Esperanza", "Agencia Marte R. Gómez", "Agencia Providencia", "Agencia Pueblo Yaqui",
  "Alcantarillado y Saneamiento", "Atención Ciudadana", "Comunicación e Imagen Institucional",
  "Contabilidad", "Contratos y Servicios", "Control de Calidad", "Control y Servicios",
  "Cultura del agua", "Informática", "Jurídico", "Licitaciones", "Línea OOMAPASC",
  "Mantenimiento de Redes", "Mantenimiento y Servicios Generales", "Órgano de Control Interno",
  "Padrón de Usuarios", "Plantas Potabilizadoras", "Programas Sociales", "Proyectos e Infraestructura",
  "Recursos Humanos", "Recursos Materiales", "Sectorización hidrométrica e innovación",
  "Seguridad Industrial", "Sistema de Gestión de Calidad", "Suburbano Técnico",
  "Supervisión y control de obras", "Trabajo Social", "Trámites Técnicos", "Verificación y Lectura"
];

const PROCESOS = [
  "Comercialización", "Comunicación", "Gestión de Recursos", "Mantenimiento y Calibración",
  "Medición Análisis y Mejora", "Producción", "Proyectos e Infraestructura", "Responsabilidad de la Dirección"
];

const ORIGENES = [
  "Análisis de datos", "Auditoría", "Ensayo no conforme", "Indicador", "Proceso",
  "Producto no conforme", "Reclamaciones de cliente"
];

const ROLES_EQUIPO = [
  "Responsable principal", "Integrante área involucrada", "Integrante externo", 
  "Enlace SGC", "Apoyo técnico", "Responsable de evidencias", "Auditor asignado"
];

const ESTADOS = [
  { id: 'BORRADOR', label: 'Borrador' },
  { id: 'GENERADO_IA', label: 'Pendiente' },
  { id: 'EN_REVISION_USUARIO', label: 'Pendiente' },
  { id: 'ENVIADO_SGC', label: 'En revisión SGC' },
  { id: 'DEVUELTO_SGC', label: 'Devuelto' },
  { id: 'APROBADO_SGC', label: 'Aprobado' },
  { id: 'FOLIO_ASIGNADO', label: 'Abierta' },
  { id: 'EN_SEGUIMIENTO', label: 'Abierta' },
  { id: 'CON_REPLANTEO', label: 'Abierta' },
  { id: 'REVISION_AUDITOR', label: 'En cierre' },
  { id: 'CERRADO_EFECTIVO', label: 'Cerrada efectiva' },
  { id: 'CERRADO_NO_EFECTIVO', label: 'Cerrada no efectiva' },
  { id: 'CANCELADO', label: 'Cancelado' }
];

export default function AccionCorrectivaView({ accionesCorrectivas, setAccionesCorrectivas, usuarios, puedeTodasAreas, areaUsuario, usuarioLogueado }) {
  const [vista, setVista] = useState('lista');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generandoIA, setGenerandoIA] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  
  // Filtros
  const [filtroAnio, setFiltroAnio] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroOrigen, setFiltroOrigen] = useState('');
  
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({...form, [name]: value});
    setError('');
  };

  const agregarIntegrante = () => {
    if (equipo.length < 10) {
      setEquipo([...equipo, { 
        id: Date.now(), 
        nombre: '', 
        puesto: '', 
        area: '', 
        rol: 'Integrante área involucrada', 
        es_responsable_principal: false, 
        firma_digital: '' 
      }]);
    }
  };

  const eliminarIntegrante = (id) => {
    if (equipo.length > 1) {
      setEquipo(equipo.filter(e => e.id !== id));
    }
  };

  const actualizarIntegrante = (id, campo, valor) => {
    const nuevo = equipo.map(e => {
      if (e.id === id) {
        const updated = { ...e, [campo]: valor };
        if (campo === 'es_responsable_principal' && valor) {
          updated.es_responsable_principal = true;
        }
        return updated;
      }
      if (campo === 'es_responsable_principal' && valor) {
        return { ...e, es_responsable_principal: false };
      }
      return e;
    });
    setEquipo(nuevo);
  };

  const validarCapturaInicial = () => {
    if (!form.area) return 'Selecciona el área';
    if (!form.proceso) return 'Selecciona el proceso';
    if (!form.origen) return 'Selecciona el origen';
    if (form.origen === 'Auditoría' && !form.numero_auditoria) return 'Ingresa el número de auditoría';
    if (!form.descripcion_no_conformidad_original) return 'Describe la no conformidad';
    return null;
  };

  const validarEquipo = () => {
    const equipoValido = equipo.filter(e => e.nombre.trim());
    if (equipoValido.length < 3) return 'Mínimo 3 integrantes: 1 responsable + 1 del área + 1 externo';
    const tieneResponsable = equipoValido.some(e => e.es_responsable_principal);
    if (!tieneResponsable) return 'Debes definir un responsable principal';
    return null;
  };

  const generarConIA = async () => {
    const errorCaptura = validarCapturaInicial();
    if (errorCaptura) { setError(errorCaptura); return; }
    
    const errorEquipo = validarEquipo();
    if (errorEquipo) { setError(errorEquipo); return; }
    
    setGenerandoIA(true);
    setError('');
    
    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      console.log('API Key exists:', !!apiKey);
      if (!apiKey) {
        setError('Configura VITE_GROQ_API_KEY en variable de entorno');
        setGenerandoIA(false);
        return;
      }

      const prompt = `Eres asistente del Sistema de Gestión de Calidad ISO 9001 para OOMAPASC de Cajeme.

Genera una propuesta de Acción Correctiva conforme al formato oficial OOMRSC-20 Rev. 18.

El usuario capturó:
- Área: ${form.area}
- Proceso: ${form.proceso}
- Origen: ${form.origen}
- Número de auditoría: ${form.numero_auditoria || 'N/A'}
- Descripción de la no conformidad: ${form.descripcion_no_conformidad_original}
- ¿Impacta otros procesos?: ${form.impacta_otros_procesos}
- Otros procesos afectados: ${form.otros_procesos_afectados || 'N/A'}
- Equipo de trabajo: ${JSON.stringify(equipo.filter(e => e.nombre.trim()).map(e => ({nombre: e.nombre, puesto: e.puesto, area: e.area, rol: e.rol})))}

Instrucciones obligatorias:
1. NO asignes folio ni fecha de apertura
2. NO apruebes ni cierres la acción
3. Usa únicamente el equipo proporcionado para responsables
4. Si no existe persona adecuada, usa "Responsable por definir"
5. Genera UNA acción contenedora inmediata (temporal, ejecutable)
6. Genera hast4 causas mediante lluvia de ideas (enfoca en método, capacitación, supervisión, documentación, comunicación, recursos, seguimiento, control)
7. Sugiere puntuación para cada causa
8. La causa con mayor puntuación será la causa principal
9. Determina si requiere actualizar matriz de riesgos y oportunidades
10. Determina si requiere cambio en SGC
11. Genera hast5 actividades correctivas con: actividad, responsable, indicador, fecha y evidencia
12. Responde en JSON válido

JSON de salida esperado:
{
  "registro": {
    "descripcion_no_conformidad_mejorada": "",
    "impacta_otros_procesos": "SI/NO",
    "otros_procesos_afectados": ""
  },
  "analisis": {
    "accion_contenedora": "",
    "actividad_inmediata": {
      "actividad": "",
      "responsable": "",
      "fecha_sugerida": ""
    },
    "herramienta_analisis": "Lluvia de ideas",
    "causas": [
      { "numero": 1, "causa": "", "puntuacion_sugerida": 0, "porcentaje_sugerido": 0, "es_causa_principal": false },
      { "numero": 2, "causa": "", "puntuacion_sugerida": 0, "porcentaje_sugerido": 0, "es_causa_principal": false },
      { "numero": 3, "causa": "", "puntuacion_sugerida": 0, "porcentaje_sugerido": 0, "es_causa_principal": false },
      { "numero": 4, "causa": "", "puntuacion_sugerida": 0, "porcentaje_sugerido": 0, "es_causa_principal": false }
    ],
    "requiere_actualizar_matriz_riesgos": "SI/NO",
    "descripcion_riesgo_oportunidad": ""
  },
  "actividades": {
    "causa_principal": "",
    "requiere_cambio_sgc": "SI/NO",
    "actividades_correctivas": [
      { "actividad": "", "responsable": "", "indicador_progreso": "", "fecha_termino_sugerida": "", "evidencia_esperada": "" }
    ]
  },
  "observaciones_ia": {
    "riesgos_detectados": "",
    "recomendaciones_para_sgc": "",
    "campos_que_requieren_revision_humana": []
  }
}`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 4000
        })
      });

      const data = await response.json();
      console.log('API Response:', data);
      
      if (data.error) {
        setError(`Error de IA: ${data.error.message || JSON.stringify(data.error)}`);
        setGenerandoIA(false);
        return;
      }
      
      if (data.choices && data.choices[0]?.message?.content) {
        const contenido = data.choices[0].message.content;
        const jsonMatch = contenido.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const ia = JSON.parse(jsonMatch[0]);
          
          setForm(f => ({
            ...f,
            descripcion_no_conformidad_ia: ia.registro?.descripcion_no_conformidad_mejorada || '',
            descripcion_no_conformidad_final: ia.registro?.descripcion_no_conformidad_mejorada || '',
            impacta_otros_procesos: ia.registro?.impacta_otros_procesos || 'NO',
            otros_procesos_afectados: ia.registro?.otros_procesos_afectados || '',
            accion_contenedora: ia.analisis?.accion_contenedora || '',
            actividad_inmediata: ia.analisis?.actividad_inmediata?.actividad || '',
            responsable_actividad_inmediata: ia.analisis?.actividad_inmediata?.responsable || '',
            fecha_actividad_inmediata: ia.analisis?.actividad_inmediata?.fecha_sugerida || '',
            herramienta_analisis: 'Lluvia de ideas',
            requiere_actualizar_matriz_riesgos: ia.analisis?.requiere_actualizar_matriz_riesgos || 'NO',
            descripcion_riesgo_oportunidad: ia.analisis?.descripcion_riesgo_oportunidad || '',
            requiere_cambio_sgc: ia.actividades?.requiere_cambio_sgc || 'NO',
            estado: 'GENERADO_IA',
            fecha_generacion_ia: new Date().toISOString()
          }));
          
          if (ia.analisis?.causas) {
            const nuevasCausas = causas.map((c, i) => {
              const causaIA = ia.analisis.causas[i];
              return {
                ...c,
                causa: causaIA?.causa || '',
                puntuacion_sugerida: causaIA?.puntuacion_sugerida || 0,
                porcentaje_sugerido: causaIA?.porcentaje_sugerido || 0,
                es_causa_principal: causaIA?.es_causa_principal || false
              };
            });
            setCausas(nuevasCausas);
          }
          
          if (ia.actividades?.actividades_correctivas) {
            const nuevasActividades = ia.actividades.actividades_correctivas.map((a, i) => ({
              id: i + 1,
              actividad: a.actividad || '',
              responsable: a.responsable || 'Responsable por definir',
              indicador_progreso: a.indicador_progreso || '',
              fecha_termino_sugerida: a.fecha_termino_sugerida || '',
              evidencia_esperada: a.evidencia_esperada || '',
              evidencia_cargada: '',
              resultado_verificado_auditor: '',
              estatus: 'PENDIENTE',
              primer_replanteo_fecha: '',
              primer_replanteo_justificacion: '',
              segundo_replanteo_fecha: '',
              segundo_replanteo_justificacion: ''
            }));
            setActividades(nuevasActividades);
          }
          
          setStep(3);
        } else {
          setError('No se pudo procesar la respuesta de IA');
        }
      }
    } catch (err) {
      console.error('Error IA:', err);
      setError('Error al conectar con IA. Verifica tu API key.');
    }
    
    setGenerandoIA(false);
  };

  const guardarBorrador = async () => {
    console.log('GuardarBorrador called, form:', form);
    setLoading(true);
    
    // Si la acción ya tenía folio (estaba aprobada/abierta), vuelve a BORRADOR para re-aprobación
    // Mantenemos la fecha de creación original
    let estadoFinal = form.estado;
    if (form.folio_codigo && form.folio_codigo !== 'Pendiente de aprobación') {
      estadoFinal = 'BORRADOR';
      console.log('Acción editada tras aprobación - requiere re-aprobación');
    }
    
    const nuevo = {
      ...form,
      id: form.id || Date.now(),
      estado: estadoFinal,
      equipo: equipo,
      causas: causas,
      actividades: actividades,
      // Preservar fecha de creación original, no modificar si ya existía
      fecha_creacion_borrador: form.fecha_creacion_borrador || new Date().toISOString()
    };
    
    // Guardar en Supabase (internet)
    try {
      const { error } = await supabase.from('acciones_correctivas').upsert({
        id: nuevo.id,
        codigo: nuevo.folio_codigo,
        estado: nuevo.estado,
        area: nuevo.area,
        proceso: nuevo.proceso,
        origen: nuevo.origen,
        numero_auditoria: nuevo.numero_auditoria,
        descripcion_no_conformidad_original: nuevo.descripcion_no_conformidad_original,
        descripcion_no_conformidad_ia: nuevo.descripcion_no_conformidad_ia,
        descripcion_no_conformidad_final: nuevo.descripcion_no_conformidad_final,
        impacta_otros_procesos: nuevo.impacta_otros_procesos,
        otros_procesos_afectados: nuevo.otros_procesos_afectados,
        accion_contenedora: nuevo.accion_contenedora,
        actividad_inmediata: nuevo.actividad_inmediata,
        responsable_actividad_inmediata: nuevo.responsable_actividad_inmediata,
        fecha_actividad_inmediata: nuevo.fecha_actividad_inmediata,
        herramienta_analisis: nuevo.herramienta_analisis,
        requiere_actualizar_matriz_riesgos: nuevo.requiere_actualizar_matriz_riesgos,
        descripcion_riesgo_oportunidad: nuevo.descripcion_riesgo_oportunidad,
        requiere_cambio_sgc: nuevo.requiere_cambio_sgc,
        fecha_creacion_borrador: nuevo.fecha_creacion_borrador,
        fecha_generacion_ia: nuevo.fecha_generacion_ia,
        fecha_envio_sgc: nuevo.fecha_envio_sgc,
        fecha_aprobacion_sgc: nuevo.fecha_aprobacion_sgc,
        fecha_apertura: nuevo.fecha_apertura,
        fecha_cierre: nuevo.fecha_cierre,
        usuario_solicitante: nuevo.usuario_solicitante,
        aprobado_por_sgc: nuevo.aprobado_por_sgc,
        auditor_cierre: nuevo.auditor_cierre,
        resultado_cierre: nuevo.resultado_cierre,
        evidencia_objetiva_revisada: nuevo.evidencia_objetiva_revisada,
        conclusion_eficacia: nuevo.conclusion_eficacia,
        clave_formato: nuevo.clave_formato,
        revision_formato: nuevo.revision_formato,
        // Guardar equipo como JSON
        equipo_json: JSON.stringify(equipo),
        // Guardar causas como JSON
        causas_json: JSON.stringify(causas),
        // Guardar actividades como JSON
        actividades_json: JSON.stringify(actividades),
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      
      if (error) {
        console.error('Error saving to Supabase:', error);
      } else {
        console.log('Saved to Supabase successfully');
      }
    } catch (e) {
      console.error('Supabase error:', e);
    }
    
    // También guardar en localStorage como backup
    if (form.id) {
      setAccionesCorrectivas(accionesCorrectivas.map(ac => ac.id === form.id ? nuevo : ac));
    } else {
      setAccionesCorrectivas([...accionesCorrectivas, nuevo]);
    }
    
    setLoading(false);
    setGuardado(true);
    setMensaje('💾 Guardado en servidor');
    setForm({...form, id: nuevo.id});
    setTimeout(() => setGuardado(false), 2000);
    setTimeout(() => setMensaje(''), 3000);
  };

  const eliminarAC = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta acción correctiva?')) return;
    
    setLoading(true);
    try {
      await supabase.from('acciones_correctivas').delete().eq('id', id);
    } catch (e) {
      console.error('Error deleting:', e);
    }
    
    setAccionesCorrectivas(accionesCorrectivas.filter(ac => ac.id !== id));
    setLoading(false);
    setMensaje('🗑️ Eliminado');
    setTimeout(() => setMensaje(''), 3000);
  };

  const enviarSGC = () => {
    console.log('EnviarSGC called');
    setForm(f => ({ 
      ...f, 
      estado: 'ENVIADO_SGC', 
      fecha_envio_sgc: new Date().toISOString() 
    }));
    guardarBorrador();
    // Regresar a la lista después de enviar
    setTimeout(() => {
      setVista('lista');
      setMensaje('📤 Enviado a SGC para revisión');
    }, 500);
  };

const aprobarSGC = () => {
    const folioNumero = accionesCorrectivas.length + 1;
    const anio = new Date().getFullYear().toString().slice(-2);
    const folioCodigo = `AC#${folioNumero}/${anio}`;
    
    setForm(f => ({
      ...f,
      estado: 'EN_SEGUIMIENTO',
      folio_numero: folioNumero,
      folio_codigo: folioCodigo,
      anio_folio: anio,
      fecha_aprobacion_sgc: new Date().toISOString(),
      fecha_apertura: new Date().toISOString()
    }));
    guardarBorrador();
    // Regresar a la lista después de aprobar
    setTimeout(() => {
      setVista('lista');
      setMensaje('✅ Folio asignado: ' + folioCodigo);
    }, 500);
  };

  const asignarAuditor = () => {
    const auditor = prompt('Ingrese el nombre del auditor que revisará las evidencias:');
    if (!auditor) return;
    
    setForm(f => ({
      ...f,
      estado: 'REVISION_AUDITOR',
      auditor_cierre: auditor
    }));
    guardarBorrador();
    setMensaje('📋 Auditor asignado para revisión');
    setTimeout(() => {
      setVista('lista');
    }, 500);
  };

  const cerrarAccion = (efectiva) => {
    const estadoCierre = efectiva ? 'CERRADO_EFECTIVO' : 'CERRADO_NO_EFECTIVO';
    setForm(f => ({
      ...f,
      estado: estadoCierre,
      fecha_cierre: new Date().toISOString(),
      resultado_cierre: efectiva ? 'EFECTIVA' : 'NO EFECTIVA'
    }));
    guardarBorrador();
    setMensaje(efectiva ? '✅ Acción cerrada efectiva' : '❌ Acción cerrada no efectiva');
    setTimeout(() => {
      setVista('lista');
    }, 500);
  };

  const getEstadoLabel = (id) => ESTADOS.find(e => e.id === id)?.label || id;
  const getEstadoColor = (estado) => {
    const colors = {
      'BORRADOR': 'bg-slate-100 text-slate-700',
      'GENERADO_IA': 'bg-purple-100 text-purple-700',
      'EN_REVISION_USUARIO': 'bg-blue-100 text-blue-700',
      'ENVIADO_SGC': 'bg-amber-100 text-amber-700',
      'APROBADO_SGC': 'bg-cyan-100 text-cyan-700',
      'FOLIO_ASIGNADO': 'bg-emerald-100 text-emerald-700',
      'EN_SEGUIMIENTO': 'bg-cyan-100 text-cyan-700',
      'CERRADO_EFECTIVO': 'bg-green-100 text-green-700',
      'CERRADO_NO_EFECTIVO': 'bg-red-100 text-red-700'
    };
    return colors[estado] || 'bg-slate-100 text-slate-700';
  };

  const resetForm = () => {
    setForm({
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
  };

  // ===== VISTA: LISTA =====
  if (vista === 'lista') {
    // Obtener años únicos de las acciones
    const aniosRaw = accionesCorrectivas.map(ac => ac.fecha_creacion_borrador ? new Date(ac.fecha_creacion_borrador).getFullYear() : null).filter(Boolean);
    const años = [...new Set(aniosRaw)].sort((a,b) => b - a);
    
    // Filtrar acciones
    const accionesFiltradas = accionesCorrectivas.filter(ac => {
      const anioAC = ac.fecha_creacion_borrador ? new Date(ac.fecha_creacion_borrador).getFullYear() : null;
      if (filtroAnio && anioAC !== parseInt(filtroAnio)) return false;
      if (filtroEstado) {
        if (filtroEstado === 'CERRADA') {
          if (ac.estado !== 'CERRADO_EFECTIVO' && ac.estado !== 'CERRADO_NO_EFECTIVO') return false;
        } else if (filtroEstado === 'ABIERTA') {
          if (ac.estado !== 'FOLIO_ASIGNADO' && ac.estado !== 'EN_SEGUIMIENTO') return false;
        } else if (ac.estado !== filtroEstado) return false;
      }
      if (filtroOrigen && ac.origen !== filtroOrigen) return false;
      return true;
    });
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#002855]">📋 Acciones Correctivas</h2>
          <button onClick={() => { resetForm(); setVista('nuevo'); }}
            className="px-4 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#001d40]">
            + Nueva Acción Correctiva
          </button>
        </div>
        
        {/* Filtros */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Año</label>
              <select value={filtroAnio} onChange={(e) => setFiltroAnio(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Todos</option>
                {años.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Estado</label>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Todos</option>
                <option value="BORRADOR">Borrador</option>
                <option value="GENERADO_IA">Pendiente</option>
                <option value="ENVIADO_SGC">En revisión SGC</option>
                <option value="ABIERTA">Abierta</option>
                <option value="REVISION_AUDITOR">En cierre</option>
                <option value="CERRADA">Cerrada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Origen</label>
              <select value={filtroOrigen} onChange={(e) => setFiltroOrigen(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Todos</option>
                {ORIGENES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={() => { setFiltroAnio(''); setFiltroEstado(''); setFiltroOrigen(''); }}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">
                Limpiar filtros
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Mostrando {accionesFiltradas.length} de {accionesCorrectivas.length} acciones</p>
        </div>
        
        {accionesFiltradas.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-4xl mb-4">📭</p>
            <p>No hay acciones correctivas con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 text-left">Folio</th>
                  <th className="p-3 text-left">Área</th>
                  <th className="p-3 text-left">Proceso</th>
                  <th className="p-3 text-left">Origen</th>
                  <th className="p-3 text-left">Estado</th>
                  <th className="p-3 text-left">Fecha</th>
                  <th className="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {accionesFiltradas.map((ac, idx) => (
                  <tr key={ac.id || idx} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs">{ac.folio_codigo || 'Pendiente'}</td>
                    <td className="p-3">{ac.area || '-'}</td>
                    <td className="p-3">{ac.proceso || '-'}</td>
                    <td className="p-3">{ac.origen || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${getEstadoColor(ac.estado)}`}>
                        {getEstadoLabel(ac.estado)}
                      </span>
                    </td>
                    <td className="p-3 text-xs">
                      {ac.fecha_creacion_borrador ? new Date(ac.fecha_creacion_borrador).toLocaleDateString('es-MX') : '-'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => { 
                          setForm(ac); 
                          // Cargar equipo desde JSON o usar estructura old
                          if (ac.equipo_json) {
                            try { setEquipo(JSON.parse(ac.equipo_json)); } catch(e) { 
                              // Si no hay JSON, cargar desde estructura old
                              if (ac.equipo && Array.isArray(ac.equipo)) {
                                setEquipo(ac.equipo);
                              }
                            }
                          } else if (ac.equipo && Array.isArray(ac.equipo)) {
                            setEquipo(ac.equipo);
                          } else {
                            setEquipo([{ id: 1, nombre: ac.responsable_actividad_inmediata || '', puesto: '', area: ac.area || '', rol: 'Responsable principal', es_responsable_principal: true, firma_digital: '' }]);
                          }
                          // Cargar causas desde JSON o usar estructura old
                          if (ac.causas_json) {
                            try { setCausas(JSON.parse(ac.causas_json)); } catch(e) { 
                              if (ac.causa) {
                                setCausas([{ id: 1, numero: 1, causa: ac.causa, puntuacion_sugerida: 0, porcentaje_sugerido: 0, es_causa_principal: true }]);
                              }
                            }
                          } else if (ac.causa) {
                            setCausas([{ id: 1, numero: 1, causa: ac.causa, puntuacion_sugerida: 0, porcentaje_sugerido: 0, es_causa_principal: true }]);
                          }
                          // Cargar actividades desde cualquier fuente disponible
                          let acts = [];
                          // 1. Desde JSON guardado por IA (array completo)
                          if (ac.actividades_json) {
                            try { 
                              const parsed = JSON.parse(ac.actividades_json);
                              // Es un array de actividades o tiene actividades_correctivas
                              if (Array.isArray(parsed)) acts = parsed;
                              else if (parsed.actividades_correctivas) acts = parsed.actividades_correctivas;
                              else if (parsed.actividad) acts = [parsed];
                            } catch(e) { console.log('Error parse:', e); }
                          }
                          // 2. Desde actividades array
                          if (acts.length === 0 && ac.actividades && Array.isArray(ac.actividades)) {
                            acts = ac.actividades;
                          }
                          // 3. Desde actividad_inmediata (una sola)
                          if (acts.length === 0 && ac.actividad_inmediata) {
                            acts = [{ id: 1, actividad: ac.actividad_inmediata, responsable: ac.responsable_actividad_inmediata || '', indicador_progreso: '', fecha_termino_sugerida: ac.fecha_actividad_inmediata || '', evidencia_esperada: '' }];
                          }
                          setActividades(acts.length > 0 ? acts : []);
                          setVista('ver'); 
                          setStep(1); 
                        }}
                          className="text-cyan-600 hover:bg-cyan-50 px-2 py-1 rounded">
                          👁️ Ver
                        </button>
                        {(usuarioLogueado?.rol === 'Admin' || usuarioLogueado?.rol === 'Super Admin') && (
                          <button onClick={() => eliminarAC(ac.id)}
                            className="text-red-600 hover:bg-red-50 px-2 py-1 rounded">
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ===== PANTALLA 1: NUEVO REGISTRO (step=1) =====
  if (vista === 'nuevo' && step === 1) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#002855]">Nueva Acción Correctiva</h2>
          <span className="text-sm text-slate-500">{form.clave_formato} {form.revision_formato}</span>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {mensaje && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {mensaje}
          </div>
        )}

        <div className="bg-slate-50 p-4 rounded-xl">
          <h3 className="font-bold text-[#002855] mb-4">📋 Datos Generales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Área *</label>
              <select name="area" value={form.area} onChange={handleChange} className="w-full p-2 border rounded-lg">
                <option value="">Seleccionar área</option>
                {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Proceso *</label>
              <select name="proceso" value={form.proceso} onChange={handleChange} className="w-full p-2 border rounded-lg">
                <option value="">Seleccionar proceso</option>
                {PROCESOS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Origen *</label>
              <select name="origen" value={form.origen} onChange={handleChange} className="w-full p-2 border rounded-lg">
                <option value="">Seleccionar origen</option>
                {ORIGENES.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Número de Auditoría</label>
              <input type="text" name="numero_auditoria" value={form.numero_auditoria} onChange={handleChange}
                placeholder={form.origen === 'Auditoría' ? 'Obligatorio' : 'Solo si origen es auditoría'}
                disabled={form.origen !== 'Auditoría'} 
                className="w-full p-2 border rounded-lg disabled:bg-slate-100" />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl">
          <h3 className="font-bold text-[#002855] mb-4">⚠️ Descripción de la No Conformidad</h3>
          <textarea name="descripcion_no_conformidad_original" value={form.descripcion_no_conformidad_original} onChange={handleChange}
            rows={4} className="w-full p-3 border rounded-lg" placeholder="Describe la no conformidad encontrada..." />
          
          <div className="flex gap-4 mt-3">
            <label className="flex items-center gap-2">
              <input type="radio" name="impacta_otros_procesos" value="SI" checked={form.impacta_otros_procesos === 'SI'} onChange={handleChange} />
              <span>¿Impacta otros procesos? - SI</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="impacta_otros_procesos" value="NO" checked={form.impacta_otros_procesos === 'NO'} onChange={handleChange} />
              <span>NO</span>
            </label>
          </div>
          {form.impacta_otros_procesos === 'SI' && (
            <textarea name="otros_procesos_afectados" value={form.otros_procesos_afectados} onChange={handleChange}
              rows={2} className="w-full p-2 border rounded-lg mt-2" placeholder="Otros procesos afectados..." />
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setVista('lista')} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
            ← Cancelar
          </button>
          <button onClick={guardarBorrador} disabled={loading} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
            {loading ? '💾 Guardando...' : '💾 Guardar Borrador'}
          </button>
          <button onClick={() => { const err = validarCapturaInicial(); if (err) setError(err); else setStep(2); }}
            className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600">
            Continuar a Equipo →
          </button>
        </div>
      </div>
    );
  }

  // ===== PANTALLA 2: EQUIPO DE TRABAJO (step=2) =====
  if (vista === 'nuevo' && step === 2) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#002855]">Equipo de Trabajo</h2>
          <span className="text-sm text-slate-500">Paso 2 de 4</span>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {mensaje && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {mensaje}
          </div>
        )}

        <div className="bg-slate-50 p-4 rounded-xl">
          <h3 className="font-bold text-[#002855] mb-4">👥 Integrantes del Equipo</h3>
          <p className="text-sm text-slate-600 mb-3">Minimo: 1 responsable + 1 del área + 1 externo (total 3)</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-left">Nombre</th>
                  <th className="p-2 text-left">Puesto</th>
                  <th className="p-2 text-left">Área</th>
                  <th className="p-2 text-left">Rol</th>
                  <th className="p-2 text-center">Responsable</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {equipo.map((integrante) => (
                  <tr key={integrante.id} className="border-b">
                    <td className="p-1">
                      <input type="text" value={integrante.nombre} 
                        onChange={(e) => actualizarIntegrante(integrante.id, 'nombre', e.target.value)}
                        className="w-full p-1 border rounded" placeholder="Nombre" />
                    </td>
                    <td className="p-1">
                      <input type="text" value={integrante.puesto} 
                        onChange={(e) => actualizarIntegrante(integrante.id, 'puesto', e.target.value)}
                        className="w-full p-1 border rounded" placeholder="Puesto" />
                    </td>
                    <td className="p-1">
                      <input type="text" value={integrante.area} 
                        onChange={(e) => actualizarIntegrante(integrante.id, 'area', e.target.value)}
                        className="w-full p-1 border rounded" placeholder="Área" />
                    </td>
                    <td className="p-1">
                      <select value={integrante.rol} 
                        onChange={(e) => actualizarIntegrante(integrante.id, 'rol', e.target.value)}
                        className="w-full p-1 border rounded">
                        {ROLES_EQUIPO.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="p-1 text-center">
                      <input type="checkbox" checked={integrante.es_responsable_principal} 
                        onChange={(e) => actualizarIntegrante(integrante.id, 'es_responsable_principal', e.target.checked)}
                        className="w-4 h-4" />
                    </td>
                    <td className="p-1 text-center">
                      <button onClick={() => eliminarIntegrante(integrante.id)} 
                        disabled={equipo.length === 1}
                        className="text-red-500 hover:bg-red-50 p-1 rounded disabled:opacity-30">
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={agregarIntegrante} disabled={equipo.length >= 10}
            className="mt-2 text-sm text-cyan-600 hover:bg-cyan-50 px-2 py-1 rounded disabled:opacity-50">
            + Agregar miembro
          </button>
        </div>

        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
          <h3 className="font-bold text-purple-800 mb-2">🤖 Generar con IA</h3>
          <p className="text-sm text-purple-700 mb-3">
            Genera: descripción mejorada, análisis de causas, plan de actividades.
          </p>
          <button onClick={generarConIA} disabled={generandoIA} 
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50">
            {generandoIA ? '🤖 Generando...' : '🤖 Generar Propuesta con IA'}
          </button>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep(1)} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  // ===== PANTALLA 3: PROPUESTA IA (step=3) =====
  if (vista === 'nuevo' && step === 3) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#002855]">Propuesta Generada por IA</h2>
          <span className="text-sm text-slate-500">Paso 3 de 4</span>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {mensaje && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {mensaje}
          </div>
        )}

        {/* Descripción mejorada */}
        <div className="bg-slate-50 p-4 rounded-xl">
          <h3 className="font-bold text-[#002855] mb-4">📝 Descripción Mejorada</h3>
          <textarea value={form.descripcion_no_conformidad_ia} 
            onChange={(e) => setForm({...form, descripcion_no_conformidad_ia: e.target.value, descripcion_no_conformidad_final: e.target.value})}
            rows={3} className="w-full p-3 border rounded-lg" />
        </div>

        {/* Análisis */}
        <div className="bg-slate-50 p-4 rounded-xl">
          <h3 className="font-bold text-[#002855] mb-4">��️ Acción Contenedora</h3>
          <textarea name="accion_contenedora" value={form.accion_contenedora} onChange={handleChange}
            rows={2} className="w-full p-3 border rounded-lg" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Actividad Inmediata</label>
              <input type="text" name="actividad_inmediata" value={form.actividad_inmediata} onChange={handleChange}
                className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
              <input type="text" name="responsable_actividad_inmediata" value={form.responsable_actividad_inmediata} onChange={handleChange}
                className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
              <input type="date" name="fecha_actividad_inmediata" value={form.fecha_actividad_inmediata} onChange={handleChange}
                className="w-full p-2 border rounded-lg" />
            </div>
          </div>
        </div>

        {/* Causas */}
        <div className="bg-slate-50 p-4 rounded-xl">
          <h3 className="font-bold text-[#002855] mb-4">💡 Análisis de Causas (Lluvia de Ideas)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-center">#</th>
                  <th className="p-2 text-left">Causa</th>
                  <th className="p-2 text-center">Puntuación</th>
                  <th className="p-2 text-center">Principal</th>
                </tr>
              </thead>
              <tbody>
                {causas.filter(c => c.causa).map((c, i) => (
                  <tr key={c.id} className={c.es_causa_principal ? 'bg-yellow-50' : 'border-b'}>
                    <td className="p-2 text-center">{i + 1}</td>
                    <td className="p-2">
                      <input type="text" value={c.causa} 
                        onChange={(e) => {
                          const nuevo = [...causas];
                          nuevo[i].causa = e.target.value;
                          setCausas(nuevo);
                        }}
                        className="w-full p-1 border rounded" />
                    </td>
                    <td className="p-2 text-center">
                      <input type="number" value={c.puntuacion_sugerida} 
                        onChange={(e) => {
                          const nuevo = [...causas];
                          nuevo[i].puntuacion_sugerida = parseInt(e.target.value) || 0;
                          setCausas(nuevo);
                        }}
                        className="w-16 p-1 border rounded text-center" />
                    </td>
                    <td className="p-2 text-center">
                      <input type="checkbox" checked={c.es_causa_principal} 
                        onChange={(e) => {
                          const nuevo = causas.map((causa, idx) => ({
                            ...causa,
                            es_causa_principal: idx === i ? e.target.checked : false
                          }));
                          setCausas(nuevo);
                        }}
                        className="w-4 h-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <label className="flex items-center gap-2">
              <span className="font-medium">¿Se requiere actualizar la matriz de riesgos y oportunidades?</span>
              <select name="requiere_actualizar_matriz_riesgos" value={form.requiere_actualizar_matriz_riesgos} onChange={handleChange}
                className="ml-2 p-1 border rounded">
                <option value="NO">NO</option>
                <option value="SI">SI</option>
              </select>
            </label>
            {form.requiere_actualizar_matriz_riesgos === 'SI' && (
              <textarea name="descripcion_riesgo_oportunidad" value={form.descripcion_riesgo_oportunidad} onChange={handleChange}
                rows={2} className="w-full p-2 border rounded-lg mt-2" placeholder="Descripción del riesgo u oportunidad..." />
            )}
          </div>
        </div>

        {/* Actividades */}
        <div className="bg-slate-50 p-4 rounded-xl">
          <h3 className="font-bold text-[#002855] mb-4">📋 Plan de Actividades Correctivas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-center w-12">#</th>
                  <th className="p-2 text-left">Actividad</th>
                  <th className="p-2 text-left w-32">Responsable</th>
                  <th className="p-2 text-left w-24">Indicador</th>
                  <th className="p-2 text-left w-24">Fecha</th>
                  <th className="p-2 text-left w-40">Evidencia Esperada</th>
                  {(form.folio_codigo && form.folio_codigo !== 'Pendiente de aprobación') && (
                    <th className="p-2 text-left bg-purple-50 w-40">Evidencia Real</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {actividades.map((act, i) => (
                  <tr key={act.id} className="border-b">
                    <td className="p-2 text-center">{i + 1}</td>
                    <td className="p-2">
                      <input type="text" value={act.actividad} 
                        disabled={form.folio_codigo && form.folio_codigo !== 'Pendiente de aprobación'}
                        onChange={(e) => {
                          const nuevo = [...actividades];
                          nuevo[i].actividad = e.target.value;
                          setActividades(nuevo);
                        }}
                        className="w-full p-1 border rounded" />
                    </td>
                    <td className="p-2">
                      <input type="text" value={act.responsable} 
                        disabled={form.folio_codigo && form.folio_codigo !== 'Pendiente de aprobación'}
                        onChange={(e) => {
                          const nuevo = [...actividades];
                          nuevo[i].responsable = e.target.value;
                          setActividades(nuevo);
                        }}
                        className="w-full p-1 border rounded" />
                    </td>
                    <td className="p-2">
                      <input type="text" value={act.indicador_progreso} 
                        disabled={form.folio_codigo && form.folio_codigo !== 'Pendiente de aprobación'}
                        onChange={(e) => {
                          const nuevo = [...actividades];
                          nuevo[i].indicador_progreso = e.target.value;
                          setActividades(nuevo);
                        }}
                        className="w-full p-1 border rounded" />
                    </td>
                    <td className="p-2">
                      <input type="date" value={act.fecha_termino_sugerida} 
                        disabled={form.folio_codigo && form.folio_codigo !== 'Pendiente de aprobación'}
                        onChange={(e) => {
                          const nuevo = [...actividades];
                          nuevo[i].fecha_termino_sugerida = e.target.value;
                          setActividades(nuevo);
                        }}
                        className="w-full p-1 border rounded" />
                    </td>
                    <td className="p-2">
                      <input type="text" value={act.evidencia_esperada} 
                        disabled={form.folio_codigo && form.folio_codigo !== 'Pendiente de aprobación'}
                        onChange={(e) => {
                          const nuevo = [...actividades];
                          nuevo[i].evidencia_esperada = e.target.value;
                          setActividades(nuevo);
                        }}
                        className="w-full p-1 border rounded" />
                    </td>
                    {(form.folio_codigo && form.folio_codigo !== 'Pendiente de aprobación') && (
                      <td className="p-2 bg-purple-50">
                        <input type="text" value={act.evidencia_real || ''} 
                          onChange={(e) => {
                            const nuevo = [...actividades];
                            nuevo[i].evidencia_real = e.target.value;
                            setActividades(nuevo);
                          }}
                          placeholder="Link o descripción"
                          className="w-full p-1 border border-purple-300 rounded" />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <label className="flex items-center gap-2">
              <span className="font-medium">¿Se requiere un cambio en el SGC?</span>
              <select name="requiere_cambio_sgc" value={form.requiere_cambio_sgc} onChange={handleChange}
                className="ml-2 p-1 border rounded">
                <option value="NO">NO</option>
                <option value="SI">SI</option>
              </select>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep(2)} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
            ← Volver
          </button>
          <button onClick={guardarBorrador} disabled={loading} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
            {loading ? '💾 Guardando...' : '💾 Guardar'}
          </button>
          {form.estado === 'ENVIADO_SGC' && (
            <button onClick={aprobarSGC} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              ✓ Aprobar Folio
            </button>
          )}
          {(form.estado === 'FOLIO_ASIGNADO' || form.estado === 'EN_SEGUIMIENTO') && (
            <button onClick={asignarAuditor} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
              👤 Asignar Auditor
            </button>
          )}
          {form.estado === 'REVISION_AUDITOR' && (
            <>
              <button onClick={() => cerrarAccion(true)} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                ✓ Cerrar Efectiva
              </button>
              <button onClick={() => cerrarAccion(false)} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                ✗ Cerrar No Efectiva
              </button>
            </>
          )}
          <button onClick={enviarSGC} className="px-6 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#001d40]">
            📤 Enviar a SGC
          </button>
        </div>
      </div>
    );
  }

  // ===== VISTA: VER (ver detalle) =====
  if (vista === 'ver') {
    const causaPrincipal = causas.find(c => c.es_causa_principal) || causas.filter(c => c.causa)[0];
    
    const generarInforme = () => {
      const contenido = `
ACCIÓN CORRECTIVA - ${form.folio_codigo || 'Pendiente de aprobación'}
=====================================
ÁREA: ${form.area}
PROCESO: ${form.proceso}
ORIGEN: ${form.origen}
${form.numero_auditoria ? 'NÚMERO DE AUDITORÍA: ' + form.numero_auditoria : ''}

DESCRIPCIÓN DE LA NO CONFORMIDAD:
${form.descripcion_no_conformidad_original}

IMPACTO EN OTROS PROCESOS: ${form.impacta_otros_procesos}
${form.otros_procesos_afectados ? 'Otros procesos: ' + form.otros_procesos_afectados : ''}

EQUIPO DE TRABAJO:
${equipo.map(e => `- ${e.nombre} (${e.puesto}) - ${e.rol}`).join('\n')}

${causaPrincipal ? 'CAUSA PRINCIPAL:\n' + causaPrincipal.causa : ''}

ACTIVIDADES:
${actividades.map((a, i) => `${i+1}. ${a.actividades}\n   Responsable: ${a.responsable}\n   Fecha: ${a.fecha_termino_sugerida}\n   Evidencia: ${a.evidencia_esperada}`).join('\n\n')}

ESTADO: ${getEstadoLabel(form.estado)}
      `;
      
      const blob = new Blob([contenido], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AC_${form.folio_codigo || 'borrador'}_${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    };
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#002855] to-[#004a80] text-white p-6 rounded-xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">Acción Correctiva</h2>
              <p className="text-lg mt-1 opacity-90">{form.area}</p>
              <p className="text-sm opacity-75 mt-2">Folio: {form.folio_codigo || 'Pendiente de aprobación'}</p>
            </div>
            <div className="text-right">
              <span className={`px-4 py-2 rounded-lg font-bold ${getEstadoColor(form.estado)}`}>
                {getEstadoLabel(form.estado)}
              </span>
            </div>
          </div>
        </div>

        {/* Datos Generales - Tarjetas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 uppercase">Proceso</p>
            <p className="font-semibold text-[#002855]">{form.proceso || '-'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 uppercase">Origen</p>
            <p className="font-semibold text-[#002855]">{form.origen || '-'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 uppercase">No. Auditoría</p>
            <p className="font-semibold text-[#002855]">{form.numero_auditoria || 'N/A'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 uppercase">Impacto</p>
            <p className={`font-semibold ${form.impacta_otros_procesos === 'SI' ? 'text-red-600' : 'text-green-600'}`}>
              {form.impacta_otros_procesos}
            </p>
          </div>
        </div>

        {/* Descripción */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-[#002855] mb-3 flex items-center gap-2">
            <span>⚠️</span> Descripción de la No Conformidad
          </h3>
          <p className="text-slate-700 whitespace-pre-wrap">{form.descripcion_no_conformidad_original}</p>
        </div>

        {/* Equipo - Tarjetas visuales */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-[#002855] mb-4 flex items-center gap-2">
            <span>👥</span> Equipo de Trabajo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {equipo.filter(e => e.nombre).map((e, i) => (
              <div key={i} className={`p-4 rounded-lg ${e.es_responsable_principal ? 'bg-amber-50 border-2 border-amber-300' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#002855] text-white flex items-center justify-center font-bold text-sm">
                    {e.nombre.charAt(0).toUpperCase()}
                  </div>
                  {e.es_responsable_principal && (
                    <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">Responsable</span>
                  )}
                </div>
                <p className="font-semibold text-[#002855]">{e.nombre}</p>
                <p className="text-sm text-slate-600">{e.puesto}</p>
                <p className="text-xs text-slate-500 mt-1">{e.rol}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Causa Principal - ARRIBA de todo */}
        {causaPrincipal && (
          <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-xl border-2 border-red-200">
            <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
              <span>🎯</span> Causa Principal de la No Conformidad
            </h3>
            <p className="text-lg text-red-900 font-medium">{causaPrincipal.causa}</p>
            {causaPrincipal.puntuacion_sugerida > 0 && (
              <p className="text-sm text-red-600 mt-2">Puntuación: {causaPrincipal.puntuacion_sugerida}</p>
            )}
          </div>
        )}

        {/* Plan de Actividades - Mostrar todas */}
        {(actividades.length > 0 || form.folio_codigo) && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-[#002855] mb-4 flex items-center gap-2">
              <span>📋</span> Plan de Actividades Correctivas
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 text-center w-10">#</th>
                    <th className="p-2 text-left">Actividad</th>
                    <th className="p-2 text-left w-28">Responsable</th>
                    <th className="p-2 text-left w-24">Fecha Límite</th>
                    <th className="p-2 text-left">Evidencia Esperada</th>
                    {(form.folio_codigo && form.folio_codigo !== 'Pendiente de aprobación') && (
                      <th className="p-2 text-left bg-purple-50 w-32">Evidencia Real</th>
                    )}
                  </tr>
                </thead>
<tbody>
                {actividades.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-400">
                      No hay actividades registradas
                    </td>
                  </tr>
                ) : (
                  actividades.map((a, i) => (
                    <tr key={a.id || i} className="border-b">
                      <td className="p-2 text-center font-medium">{i + 1}</td>
                      <td className="p-2">
                        <div className="max-w-xl" title={a.actividad || a.actividades}>{a.actividad || a.actividades || '-'}</div>
                      </td>
                      <td className="p-2">{a.responsable || '-'}</td>
                      <td className="p-2">{a.fecha_termino_sugerida || '-'}</td>
                      <td className="p-2">
                        <div className="max-w-xs" title={a.evidencia_esperada}>{a.evidencia_esperada || '-'}</div>
                      </td>
                      {(form.folio_codigo && form.folio_codigo !== 'Pendiente de aprobación') && (
                        <td className="p-2 bg-purple-50">
                          <div className="flex flex-col gap-1">
                            <label className="flex items-center gap-1 cursor-pointer">
                              <input type="checkbox" checked={a.evidencia_real_check || false}
                                onChange={(e) => {
                                  const nuevo = [...actividades];
                                  nuevo[i] = {...nuevo[i], evidencia_real_check: e.target.checked};
                                  setActividades(nuevo);
                                }}
                                className="w-4 h-4" />
                              <span className="text-xs">Revisada ✓</span>
                            </label>
                            <input type="text" value={a.evidencia_real || ''} 
                              onChange={(e) => {
                                const nuevo = [...actividades];
                                nuevo[i] = {...nuevo[i], evidencia_real: e.target.value};
                                setActividades(nuevo);
                              }}
                              placeholder="Link evidencia o descripción"
                              className="w-full p-1 border border-purple-300 rounded text-xs" />
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
              </table>
            </div>
            {actividades.length > 0 && form.folio_codigo && form.folio_codigo !== 'Pendiente de aprobación' && (
              <button onClick={guardarBorrador} className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm">
                💾 Guardar Evidencias
              </button>
            )}
          </div>
        )}

        {/* Auditor Asignado
        {(form.auditor_cierre || form.estado === 'REVISION_AUDITOR' || form.estado === 'CERRADO_EFECTIVO' || form.estado === 'CERRADO_NO_EFECTIVO') && (
          <div className="bg-purple-50 p-6 rounded-xl border-2 border-purple-200">
            <h3 className="font-bold text-purple-800 mb-4 flex items-center gap-2">
              <span>👤</span> Revisión del Auditor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-purple-600">Auditor asignado</p>
                <p className="font-semibold text-purple-900">{form.auditor_cierre || 'Por asignar'}</p>
              </div>
              {form.resultado_cierre && (
                <div>
                  <p className="text-sm text-purple-600">Resultado</p>
                  <p className={`font-semibold ${form.resultado_cierre === 'EFECTIVA' ? 'text-green-700' : 'text-red-700'}`}>
                    {form.resultado_cierre}
                  </p>
                </div>
              )}
            </div>
            {form.evidencia_objetiva_revisada && (
              <div className="mt-4">
                <p className="text-sm text-purple-600">Evidencia revisada</p>
                <p className="text-purple-900 mt-1">{form.evidencia_objetiva_revisada}</p>
              </div>
            )}
            {form.conclusion_eficacia && (
              <div className="mt-4">
                <p className="text-sm text-purple-600">Conclusión de eficacia</p>
                <p className="text-purple-900 mt-1">{form.conclusion_eficacia}</p>
              </div>
            )}
          </div>
)}
        
        {/* Botones */}
        <div className="flex gap-3 flex-wrap pt-4">
          <button onClick={() => setVista('lista')} className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50">
            ← Volver a Lista
          </button>
          <button onClick={generarInforme} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <span>📄</span> Generar Informe
          </button>
          {form.estado === 'ENVIADO_SGC' && (
            <button onClick={aprobarSGC} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <span>✓</span> Aprobar y Asignar Folio
            </button>
          )}
          {(form.estado === 'FOLIO_ASIGNADO' || form.estado === 'EN_SEGUIMIENTO') && (
            <button onClick={asignarAuditor} className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
              <span>👤</span> Asignar Auditor
            </button>
          )}
          {form.estado === 'REVISION_AUDITOR' && (
            <>
              <button onClick={() => cerrarAccion(true)} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                <span>✓</span> Cerrar Efectiva
              </button>
              <button onClick={() => cerrarAccion(false)} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                <span>✗</span> Cerrar No Efectiva
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
}