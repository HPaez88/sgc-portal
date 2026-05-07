import { useState } from 'react';
import { supabase } from '../supabase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  { id: 'EN_REVISION', label: 'En Revisión' },
  { id: 'APROBADO', label: 'Aprobado' },
  { id: 'RECHAZADO', label: 'Rechazado' },
  { id: 'EN_SEGUIMIENTO', label: 'En Seguimiento' },
  { id: 'CERRADO', label: 'Cerrado' }
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
  
  const [evidenciaFile, setEvidenciaFile] = useState(null);
  
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
  
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo no puede exceder 10MB');
        return;
      }
      setEvidenciaFile(file);
    }
  };
  
  const uploadEvidencia = async (actividadIndex) => {
    if (!evidenciaFile || !form.id) {
      setError('Primero guarda la acción correctiva');
      return;
    }
    
    setLoading(true);
    try {
      const fileName = `${form.id}_evidencia_${actividadIndex}_${Date.now()}_${evidenciaFile.name}`;
      const { data, error } = await supabase.storage
        .from('evidencias')
        .upload(fileName, evidenciaFile);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('evidencias')
        .getPublicUrl(fileName);
      
      const nuevo = [...actividades];
      nuevo[actividadIndex] = {...nuevo[actividadIndex], evidencia_real: publicUrl, evidencia_real_check: true};
      setActividades(nuevo);
      guardarBorrador();
      setEvidenciaFile(null);
      setMensaje('📎 Evidencia cargada');
    } catch (e) {
      console.error('Upload error:', e);
      setError('Error al subir archivo');
    }
    setLoading(false);
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
            estado: 'BORRADOR',
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
    console.log('[AC] guardarBorrador called');
setLoading(true);
    setError('');
    
    // Validar campos requeridos
    if (!form.area) {
      setError('Selecciona el área');
      setLoading(false);
      return;
    }
    
    if (!form.descripcion_no_conformidad_original) {
      setError('Describe la no conformidad');
      setLoading(false);
      return;
    }
    
    // El estado ya debe estar actualizado en form.estado
    const estadoActual = form.estado;
    const nuevoId = form.id || Date.now();
    console.log('[AC] Guardando con ID:', nuevoId, 'Estado:', estadoActual);
    
    // Usar directamente form para obtener valores actuales
    const nuevo = {
      ...form,
      id: nuevoId,
      estado: estadoActual,
      fecha_creacion_borrador: form.fecha_creacion_borrador || new Date().toISOString()
    };
    
    // Obtener causa principal
    const causaPrincipal = causas.find(c => c.es_causa_principal) || causas.filter(c => c.causa)[0];
    
    // GUARDAR EN SUPABASE
    try {
      console.log('[AC] Guardando en Supabase... Estado:', estadoActual);
      
      const datosSupabase = {
        id: nuevo.id,
        codigo: nuevo.folio_codigo || `AC-${Date.now()}`,
        fecha_deteccion: nuevo.fecha_creacion_borrador?.split('T')[0] || new Date().toISOString().split('T')[0],
        proceso: nuevo.proceso,
        area: nuevo.area,
        origen: nuevo.origen,
        num_auditoria: nuevo.numero_auditoria || null,
        descripcion_nc: nuevo.descripcion_no_conformidad_original,
        posibles_causas: causas.filter(c => c.causa).map(c => c.causa).join('; '),
        causa_raiz: causaPrincipal?.causa || '',
        actividades: JSON.stringify(actividades),
        estado: estadoActual,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase.from('acciones_correctivas').upsert(datosSupabase, { onConflict: 'id' });
      
      if (error) {
        console.error('[AC] Error Supabase:', error);
        setError('Error: ' + error.message);
        setLoading(false);
        return;
      }
      
      console.log('[AC] Guardado OK');
      setMensaje('💾 Guardado');
      
      // Actualizar lista local
      let listasActualizadas;
      if (form.id) {
        listasActualizadas = accionesCorrectivas.map(ac => ac.id === form.id ? nuevo : ac);
      } else {
        listasActualizadas = [...accionesCorrectivas, nuevo];
      }
      setAccionesCorrectivas(listasActualizadas);
      
    } catch (e) {
      console.error('[AC] Error:', e);
      setError('Error de conexión');
      setLoading(false);
      return;
    }
    
    setForm({...form, id: nuevo.id});
    setLoading(false);
    
    const generarInformePDF = () => {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let y = 20;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ACCIÓN CORRECTIVA - OOMRSC-20', pageWidth / 2, y, { align: 'center' });
      y += 10;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(form.folio_codigo || 'Pendiente de aprobación', pageWidth / 2, y, { align: 'center' });
      y += 15;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('DATOS GENERALES', 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.text(`Área: ${form.area || '-'}`, 14, y); y += 6;
      doc.text(`Proceso: ${form.proceso || '-'}`, 14, y); y += 6;
      doc.text(`Origen: ${form.origen || '-'}`, 14, y); y += 6;
      if (form.numero_auditoria) { doc.text(`No. Auditoría: ${form.numero_auditoria}`, 14, y); y += 6; }
      doc.text(`Estado: ${getEstadoLabel(form.estado)}`, 14, y); y += 12;
      
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIPCIÓN DE LA NO CONFORMIDAD', 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(form.descripcion_no_conformidad_original || '-', pageWidth - 28);
      doc.text(descLines, 14, y);
      y += descLines.length * 5 + 10;
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Impacto en otros procesos: ${form.impacta_otros_procesos || 'NO'}`, 14, y);
      y += 10;
      
      if (equipo.filter(e => e.nombre).length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('EQUIPO DE TRABAJO', 14, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        equipo.filter(e => e.nombre).forEach((e, i) => {
          doc.text(`${i + 1}. ${e.nombre} - ${e.puesto} (${e.rol})`, 14, y);
          y += 6;
        });
        y += 10;
      }
      
      if (causaPrincipal) {
        doc.setFont('helvetica', 'bold');
        doc.text('ANÁLISIS DE CAUSA', 14, y);
        y += 8;
        doc.setFont('helvetica', 'normal');
        const causaLines = doc.splitTextToSize(causaPrincipal.causa, pageWidth - 28);
        doc.text(causaLines, 14, y);
        y += causaLines.length * 5 + 10;
      }
      
      if (actividades.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text('PLAN DE ACTIVIDADES', 14, y);
        y += 8;
        
        const tableData = actividades.map((a, i) => [
          i + 1,
          (a.actividad || a.actividades || '-').substring(0, 50),
          a.responsable || '-',
          a.fecha_termino_sugerida || '-',
          a.evidencia_esperada ? 'Sí' : 'No'
        ]);
        
        doc.autoTable({
          startY: y,
          head: [['#', 'Actividad', 'Responsable', 'Fecha', 'Evidencia']],
          body: tableData,
          theme: 'striped',
          fontSize: 8,
          headStyles: { fillColor: [0, 40, 85] }
        });
      }
      
      y = doc.lastAutoTable.finalY + 15;
      
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('SEGUIMIENTO', 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha de creación: ${form.fecha_creacion_borrador ? new Date(form.fecha_creacion_borrador).toLocaleDateString('es-MX') : '-'}`, 14, y); y += 6;
      if (form.fecha_apertura) { doc.text(`Fecha de apertura: ${new Date(form.fecha_apertura).toLocaleDateString('es-MX')}`, 14, y); y += 6; }
      if (form.fecha_cierre) { doc.text(`Fecha de cierre: ${new Date(form.fecha_cierre).toLocaleDateString('es-MX')}`, 14, y); y += 6; }
      doc.text(`Resultado: ${form.resultado_cierre || 'En proceso'}`, 14, y);
      
      const fecha = new Date().toISOString().split('T')[0];
      doc.save(`AC_${form.folio_codigo || 'borrador'}_${fecha}.pdf`);
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
                      <td className="p-2 text-center font-medium w-8">{i + 1}</td>
                      <td className="p-2 min-w-[250px]">
                        <div className="whitespace-normal break-words">{a.actividad || a.actividades || '-'}</div>
                      </td>
                      <td className="p-2 w-32">{a.responsable || '-'}</td>
                      <td className="p-2 w-28">{a.fecha_termino_sugerida || '-'}</td>
                      <td className="p-2 min-w-[200px]">
                        <div className="whitespace-normal break-words text-sm">{a.evidencia_esperada || '-'}</div>
                      </td>
                      {(form.folio_codigo && form.folio_codigo !== 'Pendiente de aprobación') && (
                        <td className="p-2 bg-purple-50 min-w-[180px]">
                          <div className="flex flex-col gap-1">
                            {a.evidencia_real && a.evidencia_real.startsWith('http') ? (
                              <a href={a.evidencia_real} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs underline">
                                📎 Ver archivo
                              </a>
                            ) : (
                              <label className="flex items-center gap-1 cursor-pointer bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded text-xs w-fit">
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => {
                                  const file = e.target.files[0];
                                  if (file) {
                                    if (file.size > 10 * 1024 * 1024) {
                                      setError('Máx 10MB');
                                      return;
                                    }
                                    setForm(f => ({...f, evidenciaFile: file, evidenciaFileName: file.name}));
                                  }
                                }} className="hidden" />
                                <span>📎 Subir archivo</span>
                              </label>
                            )}
                            <textarea value={a.evidencia_real || ''} 
                              onChange={(e) => {
                                const nuevo = [...activividades];
                                nuevo[i] = {...nuevo[i], evidencia_real: e.target.value};
                                setActividades(nuevo);
                              }}
                              rows={2}
                              placeholder="Link o descripción"
                              className="w-full p-2 border border-purple-300 rounded text-sm" 
                            />
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
        
        {/*
        <div className="flex gap-3 flex-wrap pt-4">
          <button onClick={() => setVista('lista')} className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50">
            ← Volver a Lista
          </button>
          <button onClick={generarInformePDF} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <span>📄</span> Exportar PDF
          </button>
        </div>
        */}
        
        {form.estado === 'BORRADOR' && (
          <div className="flex gap-3 flex-wrap pt-4">
            <button onClick={() => setVista('lista')} className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50">
              ← Volver a Lista
            </button>
            <button onClick={guardarBorrador} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              💾 Guardar
            </button>
            <button onClick={async () => {
              setForm({...form, estado: 'ENVIADO_SGC'});
              await guardarBorrador();
            }} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
              📤 Enviar a SGC
            </button>
            <button onClick={generarInformePDF} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              📄 Exportar PDF
            </button>
          </div>
        )}
        
        {form.estado !== 'BORRADOR' && (
          <div className="flex gap-3 flex-wrap pt-4">
            <button onClick={() => setVista('lista')} className="px-6 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50">
              ← Volver a Lista
            </button>
            <button onClick={guardarBorrador} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              💾 Guardar
            </button>
            <button onClick={generarInformePDF} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              📄 Exportar PDF
            </button>
          </div>
        )}
      </div>
    );
  }

  return null;
}