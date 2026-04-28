import { useState } from 'react';

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
  { id: 'GENERADO_IA', label: 'Generado por IA' },
  { id: 'EN_REVISION_USUARIO', label: 'En revisión del usuario' },
  { id: 'ENVIADO_SGC', label: 'Enviado a SGC' },
  { id: 'DEVUELTO_SGC', label: 'Devuelto por SGC' },
  { id: 'APROBADO_SGC', label: 'Aprobado por SGC' },
  { id: 'FOLIO_ASIGNADO', label: 'Folio asignado' },
  { id: 'EN_SEGUIMIENTO', label: 'En seguimiento' },
  { id: 'CON_REPLANTEO', label: 'Con replanteo' },
  { id: 'REVISION_AUDITOR', label: 'En revisión de auditor' },
  { id: 'CERRADO_EFECTIVO', label: 'Cerrado efectivo' },
  { id: 'CERRADO_NO_EFECTIVO', label: 'Cerrado no efectivo' },
  { id: 'CANCELADO', label: 'Cancelado' }
];

export default function AccionCorrectivaView({ accionesCorrectivas, setAccionesCorrectivas, usuarios }) {
  const [vista, setVista] = useState('lista'); // lista, nuevo, editar,Seguimiento, Auditor
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generandoIA, setGenerandoIA] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    id: null,
    folio_numero: null,
    folio_codigo: '',
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
    { id: 1, causa: '', puntuacion: 0, porcentaje: 0, es_causa_principal: false },
    { id: 2, causa: '', puntuacion: 0, porcentaje: 0, es_causa_principal: false },
    { id: 3, causa: '', puntuacion: 0, porcentaje: 0, es_causa_principal: false },
    { id: 4, causa: '', puntuacion: 0, porcentaje: 0, es_causa_principal: false }
  ]);
  
  const [analisis, setAnalisis] = useState({
    accion_contenedora: '',
    actividad_inmediata: '',
    responsable_actividad_inmediata: '',
    fecha_actividad_inmediata: '',
    herramienta_analisis: 'Lluvia de ideas'
  });
  
  const [actividades, setActividades] = useState([]);
  
  const [evidencias, setEvidencias] = useState([]);

  // ========== HANDLERS ==========
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({...form, [name]: value});
    setError('');
  };

  // ========== EQUIPO ==========
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

  // ========== VALIDACIONES ==========
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
    const tieneResponsable = equipoValido.some(e => e.es_responsable_principal);
    const tieneOtro = equipoValido.filter(e => !e.es_responsable_principal).length >= 1;
    if (!tieneResponsable) return 'Debes definir un responsable principal';
    if (!tieneOtro) return 'Debes agregar al menos un integrante adicional';
    return null;
  };

  const validarEnvioSGC = () => {
    const errCaptura = validarCapturaInicial();
    if (errCaptura) return errCaptura;
    const errEq = validarEquipo();
    if (errEq) return errEq;
    if (!analisis.accion_contenedora) return 'Falta acción contenedora';
    if (!causas.some(c => c.causa.trim())) return 'Falta al menos una causa';
    return null;
  };

  // ========== GENERAR CON IA ==========
  const generarConIA = async () => {
    const errorCaptura = validarCapturaInicial();
    if (errorCaptura) { setError(errorCaptura); return; }
    
    const errorEquipo = validarEquipo();
    if (errorEquipo) { setError(errorEquipo); return; }
    
    setGenerandoIA(true);
    setError('');
    
    try {
      const apiKey = localStorage.getItem('groq_api_key') || import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey) {
        setError('Configura tu API key de GroQ en Configuración');
        setGenerandoIA(false);
        return;
      }

      const prompt = `Actúa como asistente del Sistema de Gestión de Calidad ISO 9001 para OOMAPASC de Cajeme.

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
3. Usa únicamente el equipo proporcionado para responsables. Si no existe persona adecuada, usa "Responsable por definir"
4. Genera acción contenedora inmediata (temporal, ejecutable, clara)
5. Genera hast4 causas mediante lluvia de ideas (enfoca en método, capacitación, supervisión, documentación, comunicación, recursos, seguimiento, control)
6. Sugiere puntuación para cada causa. La causa con mayor puntuación será la causa principal
7. Determina si requiere actualizar matriz de riesgos y oportunidades (sistémico, recurrencia, incumplimiento normativo)
8. Determina si requiere cambio en SGC (modificación de documentación oficial)
9. Genera hast5 actividades correctivas con: actividad, responsable (del equipo), indicador, fecha y evidencia
10. Responde en JSON válido

JSON de salida esperado:
{
  "registro": {
    "descripcion_mejorada": "",
    "impacta_otros_procesos": "SI/NO",
    "otros_procesos_afectados": ""
  },
  "analisis": {
    "accion_contenedora": "",
    "actividad_inmediata": { "actividad": "", "responsable": "", "fecha": "" },
    "causas": [
      { "causa": "", "puntuacion": 0, "porcentaje": 0 },
      { "causa": "", "puntuacion": 0, "porcentaje": 0 },
      { "causa": "", "puntuacion": 0, "porcentaje": 0 },
      { "causa": "", "puntuacion": 0, "porcentaje": 0 }
    ],
    "causa_principal": "",
    "requiere_matriz_riesgos": "SI/NO",
    "descripcion_riesgo": ""
  },
  "actividades": {
    "causa_principal": "",
    "requiere_cambio_sgc": "SI/NO",
    "lista": [
      { "actividad": "", "responsable": "", "indicador": "", "fecha": "", "evidencia": "" }
    ]
  }
}`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 4000
        })
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]?.message?.content) {
        const contenido = data.choices[0].message.content;
        const jsonMatch = contenido.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const ia = JSON.parse(jsonMatch[0]);
          
          // Registro
          setForm(f => ({
            ...f,
            descripcion_no_conformidad_ia: ia.registro?.descripcion_mejorada || '',
            descripcion_no_conformidad_final: ia.registro?.descripcion_mejorada || '',
            impacta_otros_procesos: ia.registro?.impacta_otros_procesos || 'NO',
            otros_procesos_afectados: ia.registro?.otros_procesos_afectados || '',
            requiere_actualizar_matriz_riesgos: ia.analisis?.requiere_matriz_riesgos || 'NO',
            descripcion_riesgo_oportunidad: ia.analisis?.descripcion_riesgo || '',
            requiere_cambio_sgc: ia.actividades?.requiere_cambio_sgc || 'NO',
            estado: 'GENERADO_IA',
            fecha_generacion_ia: new Date().toISOString()
          }));
          
          // Análisis
          setAnalisis({
            accion_contenedora: ia.analisis?.accion_contenedora || '',
            actividad_inmediata: ia.analisis?.actividad_inmediata?.actividad || '',
            responsable_actividad_inmediata: ia.analisis?.actividad_inmediata?.responsable || '',
            fecha_actividad_inmediata: ia.analisis?.actividad_inmediata?.fecha || '',
            herramienta_analisis: 'Lluvia de ideas'
          });
          
          // Causas
          if (ia.analisis?.causas) {
            const nuevasCausas = causas.map((c, i) => {
              const causaIA = ia.analisis.causas[i];
              return {
                ...c,
                causa: causaIA?.causa || '',
                puntuacion: causaIA?.puntuacion || 0,
                porcentaje: causaIA?.porcentaje || 0,
                es_causa_principal: causaIA?.causa === ia.analisis?.causa_principal
              };
            });
            setCausas(nuevasCausas);
          }
          
          // Actividades
          if (ia.actividades?.lista) {
            const nuevasActividades = ia.actividades.lista.map((a, i) => ({
              id: i + 1,
              actividad: a.actividad || '',
              responsable: a.responsable || 'Responsable por definir',
              indicador: a.indicador || '',
              fecha_termino: a.fecha || '',
              evidencia_esperada: a.evidencia || '',
              evidencia_cargada: '',
              resultado_verificado: '',
              estatus: 'PENDIENTE',
              primer_replanteo_fecha: '',
              primer_replantio_justificacion: '',
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

  // ========== GUARDAR ==========
  const guardarBorrador = () => {
    setLoading(true);
    const nuevo = {
      ...form,
      id: form.id || Date.now(),
      equipo: equipo,
      causas: causas,
      analisis: analisis,
      actividades: actividades,
      fecha_creacion_borrador: form.fecha_creacion_borrador || new Date().toISOString()
    };
    
    if (form.id) {
      setAccionesCorrectivas(accionesCorrectivas.map(ac => ac.id === form.id ? nuevo : ac));
    } else {
      setAccionesCorrectivas([...accionesCorrectivas, nuevo]);
    }
    
    setLoading(false);
    setGuardado(true);
    setForm({...form, id: nuevo.id});
    setTimeout(() => setGuardado(false), 2000);
  };

  const enviarSGC = () => {
    const errorValidacion = validarEnvioSGC();
    if (errorValidacion) { setError(errorValidacion); return; }
    
    setForm(f => ({ 
      ...f, 
      estado: 'ENVIADO_SGC', 
      fecha_envio_sgc: new Date().toISOString() 
    }));
    guardarBorrador();
  };

  // ========== APROBACIÓN SGC ==========
  const aprobarSGC = () => {
    const folioNumero = accionesCorrectivas.length + 1;
    const anio = new Date().getFullYear().toString().slice(-2);
    const folioCodigo = `AC#${folioNumero}/${anio}`;
    
    setForm(f => ({
      ...f,
      estado: 'FOLIO_ASIGNADO',
      folio_numero: folioNumero,
      folio_codigo: folioCodigo,
      anio_folio: anio,
      fecha_aprobacion_sgc: new Date().toISOString(),
      fecha_apertura: new Date().toISOString()
    }));
    guardarBorrador();
  };

  const cerrarEfectivo = () => {
    setForm(f => ({
      ...f,
      estado: 'CERRADO_EFECTIVO',
      resultado_cierre: 'EFECTIVA',
      fecha_cierre: new Date().toISOString()
    }));
    guardarBorrador();
  };

  const cerrarNoEfectivo = () => {
    setForm(f => ({
      ...f,
      estado: 'CERRADO_NO_EFECTIVO',
      resultado_cierre: 'NO_EFECTIVA',
      fecha_cierre: new Date().toISOString()
    }));
    guardarBorrador();
  };

  // ========== REPLANTEO ==========
  const solicitarReplanteo = (actividadId, replanteoNum) => {
    const justificacion = prompt(`Justificación del ${replanteoNum === 1 ? '1er' : '2do'} replanteo:`);
    if (justificacion) {
      setActividades(actividades.map(a => {
        if (a.id === actividadId) {
          return replanteoNum === 1 
            ? { ...a, primer_replanteo_fecha: new Date().toISOString(), primer_replanteo_justificacion: justificacion }
            : { ...a, segundo_replanteo_fecha: new Date().toISOString(), segundo_replanteo_justificacion: justificacion };
        }
        return a;
      }));
      setForm(f => ({ ...f, estado: 'CON_REPLANTEO' }));
    }
  };

  // ========== EDITAR REGISTRO ==========
  const editarRegistro = (ac) => {
    setForm(ac);
    setEquipo(ac.equipo || []);
    setCausas(ac.causas || causas);
    setAnalisis(ac.analisis || analisis);
    setActividades(ac.actividades || []);
    setVista('editar');
    setStep(1);
  };

  // ========== RENDER ==========
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
      'CON_REPLANTEO': 'bg-orange-100 text-orange-700',
      'CERRADO_EFECTIVO': 'bg-green-100 text-green-700',
      'CERRADO_NO_EFECTIVO': 'bg-red-100 text-red-700',
      'CANCELADO': 'bg-gray-100 text-gray-700'
    };
    return colors[estado] || 'bg-slate-100 text-slate-700';
  };

  // ===== VISTA LISTA =====
  if (vista === 'lista') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#002855]">📋 Acciones Correctivas</h2>
          <button onClick={() => { setForm(getInitialForm()); setVista('nuevo'); setStep(1); }}
            className="px-4 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#001d40]">
            + Nueva Acción Correctiva
          </button>
        </div>
        
        {accionesCorrectivas.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="text-4xl mb-4">📭</p>
            <p>No hay acciones correctivas registradas</p>
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
                {accionesCorrectivas.map((ac, idx) => (
                  <tr key={ac.id || idx} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs">
                      {ac.folio_codigo || <span className="text-slate-400">Pendiente</span>}
                    </td>
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
                      <button onClick={() => { editarRegistro(ac); }}
                        className="text-cyan-600 hover:bg-cyan-50 px-2 py-1 rounded">
                        👁️ Ver
                      </button>
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

  const getInitialForm = () => ({
    id: null,
    folio_numero: null,
    folio_codigo: '',
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

  // ===== PANTALLA 1: NUEVO REGISTRO =====
  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#002855]">Nueva Acción Correctiva</h2>
          <div className="text-sm text-slate-500">
            Formato: {form.clave_formato} {form.revision_formato}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            ⚠️ {error}
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
                placeholder={form.origen === 'Auditoría' ? 'Obligatorio cuando origen es auditoría' : 'Solo si origen es auditoría'}
                disabled={form.origen !== 'Auditoría'} 
                className="w-full p-2 border rounded-lg disabled:bg-slate-100" />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl">
          <h3 className="font-bold text-[#002855] mb-4">⚠️ Descripción de la No Conformidad</h3>
          <textarea name="descripcion_no_conformidad_original" value={form.descripcion_no_conformidad_original} onChange={handleChange}
            rows={4} className="w-full p-3 border rounded-lg" placeholder="Describe la no conformidad encontrada..." />
        </div>

        <div className="bg-slate-50 p-4 rounded-xl">
          <h3 className="font-bold text-[#002855] mb-4">🔗 Impacto en Otros Procesos</h3>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input type="radio" name="impacta_otros_procesos" value="SI" checked={form.impacta_otros_procesos === 'SI'} onChange={handleChange} />
              <span className="font-medium">SI</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="impacta_otros_procesos" value="NO" checked={form.impacta_otros_procesos === 'NO'} onChange={handleChange} />
              <span className="font-medium">NO</span>
            </label>
          </div>
          {form.impacta_otros_procesos === 'SI' && (
            <textarea name="otros_procesos_afectados" value={form.otros_procesos_afectados} onChange={handleChange}
              rows={2} className="w-full p-2 border rounded-lg" placeholder="Enuncia qué otros procesos se ven afectados..." />
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

  // ===== PANTALLA 2: EQUIPO DE TRABAJO =====
  if (step === 2) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#002855]">Equipo de Trabajo</h2>
          <div className="text-sm text-slate-500">Step 2/4</div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        <div className="bg-slate-50 p-4 rounded-xl">
          <h3 className="font-bold text-[#002855] mb-4">👥 Integrantes del Equipo</h3>
          <p className="text-sm text-slate-600 mb-4">Debes agregar al menos: 1 responsable principal + 1 integrante adicional</p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-left">Nombre</th>
                  <th className="p-2 text-left">Puesto</th>
                  <th className="p-2 text-left">Área</th>
                  <th className="p-2 text-left">Rol</th>
                  <th className="p-2 text-center">Responsable Principal</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {equipo.map((integrante, i) => (
                  <tr key={integrante.id} className="border-b">
                    <td className="p-2">
                      <input type="text" value={integrante.nombre} 
                        onChange={(e) => actualizarIntegrante(integrante.id, 'nombre', e.target.value)}
                        className="w-full p-1 border rounded" placeholder="Nombre completo" />
                    </td>
                    <td className="p-2">
                      <input type="text" value={integrante.puesto} 
                        onChange={(e) => actualizarIntegrante(integrante.id, 'puesto', e.target.value)}
                        className="w-full p-1 border rounded" placeholder="Puesto" />
                    </td>
                    <td className="p-2">
                      <input type="text" value={integrante.area} 
                        onChange={(e) => actualizarIntegrante(integrante.id, 'area', e.target.value)}
                        className="w-full p-1 border rounded" placeholder="Área" />
                    </td>
                    <td className="p-2">
                      <select value={integrante.rol} 
                        onChange={(e) => actualizarIntegrante(integrante.id, 'rol', e.target.value)}
                        className="w-full p-1 border rounded">
                        {ROLES_EQUIPO.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="p-2 text-center">
                      <input type="checkbox" checked={integrante.es_responsable_principal} 
                        onChange={(e) => actualizarIntegrante(integrante.id, 'es_responsable_principal', e.target.checked)}
                        className="w-4 h-4" />
                    </td>
                    <td className="p-2 text-center">
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
          
          <button onClick={agregarIntegrante} 
            disabled={equipo.length >= 10}
            className="mt-3 text-sm text-cyan-600 hover:bg-cyan-50 px-3 py-1 rounded disabled:opacity-50">
            + Agregar integrante
          </button>
        </div>

        <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
          <h3 className="font-bold text-purple-800 mb-2">🤖 Generar Propuesta con IA</h3>
          <p className="text-sm text-purple-700 mb-3">
            La IA generará automáticamente: descripción mejorada, acción contenedora, análisis de causas, plan de actividades y más.
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

  // ===== PANTALLA 3: ANÁLISIS IA =====
  if (step === 3) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-[#002855]">Análisis Generado por IA</h2>
          <div className="text-sm text-slate-500">Step 3/4</div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        <div className="bg-slate-50 p-4 rounded-xl">
          <h3 className="font-bold text-[#002855] mb-4">📝 Descripción Mejorada (Editable)</h3>
          <textarea name="descripcion_no_conformidad_final" value={form.descripcion_no_conformidad_final} onChange={handleChange}
            rows={3} className="w-full p-3 border rounded-lg" />
        </div>

        <div className="bg-slate-50 p-4 rounded-xl">
          <h3 className="font-bold text-[#002855] mb-4">🛡️ Acción Contenedora</h3>
          <textarea name="accion_contenedora" value={analisis.accion_contenedora} 
            onChange={(e) => setAnalisis({...analisis, accion_contenedora: e.target.value})}
            rows={2} className="w-full p-3 border rounded-lg" placeholder="Acción inmediata para contener el problema..." />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Actividad Inmediata</label>
              <input type="text" value={analisis.actividad_inmediata} 
                onChange={(e) => setAnalisis({...analisis, actividad_inmediata: e.target.value})}
                className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
              <input type="text" value={analisis.responsable_actividad_inmediata} 
                onChange={(e) => setAnalisis({...analisis, responsable_actividad_inmediata: e.target.value})}
                className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
              <input type="date" value={analisis.fecha_actividad_inmediata} 
                onChange={(e) => setAnalisis({...analisis, fecha_actividad_inmediata: e.target.value})}
                className="w-full p-2 border rounded-lg" />
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl">
          <h3 className="font-bold text-[#002855] mb-4">💡 Análisis de Causas (Lluvia de Ideas)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-center">#</th>
                  <th className="p-2 text-left">Causa</th>
                  <th className="p-2 text-center">Puntuación</th>
                  <th className="p-2 text-center">%</th>
                  <th className="p-2 text-center">Principal</th>
                </tr>
              </thead>
              <tbody>
                {causas.map((c, i) => (
                  <tr key={c.id} className={c.es_causa_principal ? 'bg-cyan-50' : 'border-b'}>
                    <td className="p-2 text-center">{i + 1}</td>
                    <td className="p-2">
                      <input type="text" value={c.causa} 
                        onChange={(e) => {
                          const nuevo = [...causas];
                          nuevo[i].causa = e.target.value;
                          setCausas(nuevo);
                        }}
                        className="w-full p-1 border rounded" placeholder="Causa probable..." />
                    </td>
                    <td className="p-2 text-center">
                      <input type="number" value={c.puntuacion} 
                        onChange={(e) => {
                          const nuevo = [...causas];
                          nuevo[i].puntuacion = parseInt(e.target.value) || 0;
                          setCausas(nuevo);
                        }}
                        className="w-16 p-1 border rounded text-center" />
                    </td>
                    <td className="p-2 text-center">{c.porcentaje}%</td>
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

        <div className="bg-slate-50 p-4 rounded-xl">
          <h3 className="font-bold text-[#002855] mb-4">📋 Plan de Actividades Correctivas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-2 text-center">#</th>
                  <th className="p-2 text-left">Actividad</th>
                  <th className="p-2 text-left">Responsable</th>
                  <th className="p-2 text-left">Indicador</th>
                  <th className="p-2 text-left">Fecha Término</th>
                  <th className="p-2 text-left">Evidencia Esperada</th>
                </tr>
              </thead>
              <tbody>
                {actividades.map((act, i) => (
                  <tr key={act.id} className="border-b">
                    <td className="p-2 text-center">{i + 1}</td>
                    <td className="p-2">
                      <input type="text" value={act.actividad} 
                        onChange={(e) => {
                          const nuevo = [...actividades];
                          nuevo[i].actividad = e.target.value;
                          setActividades(nuevo);
                        }}
                        className="w-full p-1 border rounded" />
                    </td>
                    <td className="p-2">
                      <input type="text" value={act.responsable} 
                        onChange={(e) => {
                          const nuevo = [...actividades];
                          nuevo[i].responsable = e.target.value;
                          setActividades(nuevo);
                        }}
                        className="w-full p-1 border rounded" />
                    </td>
                    <td className="p-2">
                      <input type="text" value={act.indicador} 
                        onChange={(e) => {
                          const nuevo = [...actividades];
                          nuevo[i].indicador = e.target.value;
                          setActividades(nuevo);
                        }}
                        className="w-full p-1 border rounded" />
                    </td>
                    <td className="p-2">
                      <input type="date" value={act.fecha_termino} 
                        onChange={(e) => {
                          const nuevo = [...actividades];
                          nuevo[i].fecha_termino = e.target.value;
                          setActividades(nuevo);
                        }}
                        className="w-full p-1 border rounded" />
                    </td>
                    <td className="p-2">
                      <input type="text" value={act.evidencia_esperada} 
                        onChange={(e) => {
                          const nuevo = [...actividades];
                          nuevo[i].evidencia_esperada = e.target.value;
                          setActividades(nuevo);
                        }}
                        className="w-full p-1 border rounded" />
                    </td>
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
          <button onClick={enviarSGC} className="px-6 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#001d40]">
            📤 Enviar a SGC
          </button>
        </div>
      </div>
    );
  }

  // ===== PANTALLA 4: SEGUIMIENTO =====
  if (step === 4) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-[#002855]">📊 Seguimiento</h2>
            <p className="text-sm text-slate-500">Folio: {form.folio_codigo || 'Pendiente de aprobación'}</p>
          </div>
          <span className={`px-3 py-1 rounded ${getEstadoColor(form.estado)}`}>
            {getEstadoLabel(form.estado)}
          </span>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl">
          <h3 className="font-bold text-[#002855] mb-4">Actividades</h3>
          {actividades.length === 0 ? (
            <p className="text-slate-400">No hay actividades</p>
          ) : (
            <div className="space-y-3">
              {actividades.map((act, i) => (
                <div key={act.id} className="p-4 border rounded-lg bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-[#002855]">Actividad {i + 1}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      act.estatus === 'COMPLETADA' ? 'bg-green-100 text-green-700' :
                      act.estatus === 'EN_PROCESO' ? 'bg-cyan-100 text-cyan-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {act.estatus || 'PENDIENTE'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{act.actividades}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div><span className="text-slate-500">Responsable:</span> {act.responsable}</div>
                    <div><span className="text-slate-500">Fecha:</span> {act.fecha_termino || 'Sin fecha'}</div>
                    <div><span className="text-slate-500">Indicador:</span> {act.indicador || 'N/A'}</div>
                    <div><span className="text-slate-500">Evidencia:</span> {act.evidencia_esperada || 'N/A'}</div>
                  </div>
                  {act.primer_repleteo_justificacion && (
                    <div className="mt-2 p-2 bg-orange-50 rounded text-sm">
                      📌 1er Replanteo: {act.primer_repleteo_justificacion}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setVista('lista')} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
            ← Volver a Lista
          </button>
        </div>
      </div>
    );
  }

  return null;
}