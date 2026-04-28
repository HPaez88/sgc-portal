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
  const [pantalla, setPantalla] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generandoIA, setGenerandoIA] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({
    folio_numero: null,
    folio_codigo: '',
    estado: 'BORRADOR',
    area: '',
    proceso: '',
    origen: '',
    numero_auditoria: '',
    descripcion_no_conformidad_original: '',
    impacta_otros_procesos: 'NO',
    otros_procesos_afectados: '',
    requiere_actualizar_matriz: 'NO',
    descripcion_riesgo_oportunidad: '',
    requiere_cambio_sgc: 'NO',
    fecha_creacion_borrador: new Date().toISOString(),
    fecha_envio_sgc: null,
    fecha_aprobacion_sgc: null,
    fecha_apertura: null,
    fecha_cierre: null,
    descripcion_no_conformidad_ia: '',
    descripcion_no_conformidad_final: '',
    accion_contenedora: '',
    actividad_inmediata: '',
    responsable_actividad_inmediata: '',
    fecha_actividad_inmediata: '',
    requiere_actualizar_matriz_riesgos: 'NO',
    causa_principal: '',
    actividades: [],
    usuario_solicitante: '',
    aprobado_por_sgc: '',
    auditor_cierre: '',
    resultado_cierre: '',
    clave_formato: 'OOMRSC-20',
    revision_formato: 'Rev. 18'
  });
  
  const [equipo, setEquipo] = useState([
    { nombre: '', puesto: '', area: '', rol: 'Responsable principal', es_responsable_principal: true }
  ]);
  
  const [causas, setCausas] = useState([
    { numero: 1, causa: '', puntuacion: 0, porcentaje: 0, es_causa_principal: false },
    { numero: 2, causa: '', puntuacion: 0, porcentaje: 0, es_causa_principal: false },
    { numero: 3, causa: '', puntuacion: 0, porcentaje: 0, es_causa_principal: false },
    { numero: 4, causa: '', puntuacion: 0, porcentaje: 0, es_causa_principal: false }
  ]);
  
  const [evidencias, setEvidencias] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({...form, [name]: value});
    setError('');
  };

  const agregarIntegrante = () => {
    if (equipo.length < 10) {
      setEquipo([...equipo, { nombre: '', puesto: '', area: '', rol: 'Integrante área involucrada', es_responsable_principal: false }]);
    }
  };

  const eliminarIntegrante = (index) => {
    if (equipo.length > 1) {
      setEquipo(equipo.filter((_, i) => i !== index));
    }
  };

  const actualizarIntegrante = (index, campo, valor) => {
    const nuevo = [...equipo];
    nuevo[index][campo] = valor;
    if (campo === 'es_responsable_principal' && valor) {
      nuevo.forEach((_, i) => { if (i !== index) nuevo[i].es_responsable_principal = false; });
    }
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
    const tieneResponsable = equipo.some(e => e.es_responsable_principal && e.nombre.trim());
    const tieneOtro = equipo.filter(e => !e.es_responsable_principal && e.nombre.trim()).length >= 1;
    if (!tieneResponsable) return 'Debes agregar un responsable principal';
    if (!tieneOtro) return 'Debes agregar al menos un integrante adicional al equipo';
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
      const apiKey = localStorage.getItem('openai_api_key');
      if (!apiKey) {
        setError('Configura tu API key de OpenAI en Configuración');
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
- Equipo de trabajo: ${JSON.stringify(equipo.filter(e => e.nombre))}

Instrucciones:
1. No asignes folio ni fecha de apertura.
2. No apruebes ni cierres la acción.
3. Usa únicamente el equipo proporcionado para responsables.
4. Si no existe persona adecuada, usa "Responsable por definir".
5. Genera acción contenedora inmediata.
6. Genera hasta 4 causas mediante lluvia de ideas (enfoca en método, capacitación, supervisión, documentación, comunicación, recursos, seguimiento, control).
7. Sugiere puntuación para causas.
8. Identifica causa principal.
9. Determina si requiere actualizar matriz de riesgos.
10. Determina si requiere cambio en SGC.
11. Genera hasta 5 actividades correctivas con responsable, indicador, fecha y evidencia.
12. Responde en JSON válido.

JSON de salida esperado:
{
  "registro": { "descripcion_mejorada": "", "impacta_otros_procesos": "SI/NO", "otros_procesos_afectados": "" },
  "analisis": {
    "accion_contenedora": "",
    "actividad_inmediata": { "actividad": "", "responsable": "", "fecha": "" },
    "causas": [{ "causa": "", "puntuacion": 0 }],
    "causa_principal": "",
    "requiere_matriz_riesgos": "SI/NO",
    "descripcion_riesgo": ""
  },
  "actividades": {
    "causa_principal": "",
    "requiere_cambio_sgc": "SI/NO",
    "lista": [{ "actividad": "", "responsable": "", "indicador": "", "fecha": "", "evidencia": "" }]
  }
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4',
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
          
          setForm(f => ({
            ...f,
            descripcion_no_conformidad_ia: ia.registro?.descripcion_mejorada || '',
            accion_contenedora: ia.analisis?.accion_contenedora || '',
            actividad_inmediata: ia.analisis?.actividad_inmediata?.actividad || '',
            responsable_actividad_inmediata: ia.analisis?.actividad_inmediata?.responsable || '',
            fecha_actividad_inmediata: ia.analisis?.actividad_inmediata?.fecha || '',
            requiere_actualizar_matriz_riesgos: ia.analisis?.requiere_matriz_riesgos || 'NO',
            descripcion_riesgo_oportunidad: ia.analisis?.descripcion_riesgo || '',
            causa_principal: ia.analisis?.causa_principal || '',
            requiere_cambio_sgc: ia.actividades?.requiere_cambio_sgc || 'NO',
            estado: 'GENERADO_IA'
          }));
          
          if (ia.analisis?.causas) {
            const nuevasCausas = causas.map((c, i) => ({
              ...c,
              causa: ia.analisis.causas[i]?.causa || '',
              puntuacion: ia.analisis.causas[i]?.puntuacion || 0,
              es_causa_principal: ia.analisis.causas[i]?.causa === ia.analisis?.causa_principal
            }));
            setCausas(nuevasCausas);
          }
          
          if (ia.actividades?.lista) {
            const nuevasActividades = ia.actividades.lista.map(a => ({
              actividad: a.actividad || '',
              responsable: a.responsable || 'Responsable por definir',
              indicador: a.indicador || '',
              fecha_termino: a.fecha || '',
              evidencia_esperada: a.evidencia || '',
              evidencia_cargada: '',
              resultado_verificado: '',
              estatus: 'PENDIENTE'
            }));
            setForm(f => ({ ...f, actividades: nuevasActividades }));
          }
          
          setPantalla(3);
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

  const guardarBorrador = () => {
    setLoading(true);
    const nuevaAC = {
      ...form,
      id: Date.now(),
      equipo: equipo,
      causas: causas,
      fecha_creacion_borrador: new Date().toISOString()
    };
    setAccionesCorrectivas([...accionesCorrectivas, nuevaAC]);
    setLoading(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  const enviarSGC = () => {
    setForm(f => ({ ...f, estado: 'ENVIADO_SGC', fecha_envio_sgc: new Date().toISOString() }));
    guardarBorrador();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002855]">Acción Correctiva - OOMRSC-20</h1>
          <p className="text-sm text-slate-500">Rev. 18 | Sistema de Gestión de Calidad</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            form.estado === 'BORRADOR' ? 'bg-slate-100 text-slate-700' :
            form.estado === 'GENERADO_IA' ? 'bg-purple-100 text-purple-700' :
            form.estado === 'ENVIADO_SGC' ? 'bg-amber-100 text-amber-700' :
            form.estado === 'APROBADO_SGC' ? 'bg-cyan-100 text-cyan-700' :
            form.estado === 'CERRADO_EFECTIVO' ? 'bg-emerald-100 text-emerald-700' :
            'bg-slate-100 text-slate-700'
          }`}>
            {ESTADOS.find(e => e.id === form.estado)?.label || form.estado}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          ⚠️ {error}
        </div>
      )}

      {guardado && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
          ✓ Guardado exitosamente
        </div>
      )}

      {/* Navegación de pantallas */}
      <div className="flex gap-2 mb-6 border-b border-slate-200 pb-4">
        {['1. Registro', '2. Equipo', '3. Análisis IA', '4. Seguimiento'].map((label, i) => (
          <button key={i} onClick={() => setPantalla(i + 1)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              pantalla === i + 1 ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* PANTALLA 1: REGISTRO */}
      {pantalla === 1 && (
        <div className="space-y-6">
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
                  disabled={form.origen !== 'Auditoría'} className="w-full p-2 border rounded-lg disabled:bg-slate-100" />
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
            <button onClick={guardarBorrador} disabled={loading} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
              💾 Guardar Borrador
            </button>
            <button onClick={() => setPantalla(2)} className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600">
              Continuar a Equipo →
            </button>
          </div>
        </div>
      )}

      {/* PANTALLA 2: EQUIPO DE TRABAJO */}
      {pantalla === 2 && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl">
            <h3 className="font-bold text-[#002855] mb-4">👥 Equipo de Trabajo</h3>
            <p className="text-sm text-slate-600 mb-4">Agrega al menos 1 responsable principal y 1 integrante adicional</p>
            
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
                    <tr key={i} className="border-b">
                      <td className="p-2">
                        <input type="text" value={integrante.nombre} onChange={(e) => actualizarIntegrante(i, 'nombre', e.target.value)}
                          className="w-full p-1 border rounded" placeholder="Nombre completo" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={integrante.puesto} onChange={(e) => actualizarIntegrante(i, 'puesto', e.target.value)}
                          className="w-full p-1 border rounded" placeholder="Puesto" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={integrante.area} onChange={(e) => actualizarIntegrante(i, 'area', e.target.value)}
                          className="w-full p-1 border rounded" placeholder="Área" />
                      </td>
                      <td className="p-2">
                        <select value={integrante.rol} onChange={(e) => actualizarIntegrante(i, 'rol', e.target.value)}
                          className="w-full p-1 border rounded">
                          {ROLES_EQUIPO.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </td>
                      <td className="p-2 text-center">
                        <input type="checkbox" checked={integrante.es_responsable_principal} onChange={(e) => actualizarIntegrante(i, 'es_responsable_principal', e.target.checked)}
                          className="w-4 h-4" />
                      </td>
                      <td className="p-2 text-center">
                        <button onClick={() => eliminarIntegrante(i)} className="text-red-500 hover:bg-red-50 p-1 rounded">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button onClick={agregarIntegrante} className="mt-3 text-sm text-cyan-600 hover:bg-cyan-50 px-3 py-1 rounded">
              + Agregar integrante
            </button>
          </div>

          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
            <h3 className="font-bold text-purple-800 mb-2">🤖 Generar con IA</h3>
            <p className="text-sm text-purple-700 mb-3">
              La IA generará automáticamente: descripción mejorada, análisis de causas, plan de actividades y más.
            </p>
            <button onClick={generarConIA} disabled={generandoIA} 
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50">
              {generandoIA ? '🤖 Generando...' : '🤖 Generar Propuesta con IA'}
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPantalla(1)} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
              ← Volver
            </button>
          </div>
        </div>
      )}

      {/* PANTALLA 3: ANÁLISIS IA */}
      {pantalla === 3 && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl">
            <h3 className="font-bold text-[#002855] mb-4">📝 Descripción Mejorada (IA)</h3>
            <textarea name="descripcion_no_conformidad_final" value={form.descripcion_no_conformidad_final || form.descripcion_no_conformidad_ia} onChange={handleChange}
              rows={3} className="w-full p-3 border rounded-lg" />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl">
            <h3 className="font-bold text-[#002855] mb-4">🛡️ Acción Contenedora</h3>
            <textarea name="accion_contenedora" value={form.accion_contenedora} onChange={handleChange}
              rows={2} className="w-full p-2 border rounded-lg" placeholder="Acción inmediata para contener el problema..." />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Actividad Inmediata</label>
                <input type="text" name="actividad_inmediata" value={form.actividad_inmediata} onChange={handleChange} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
                <input type="text" name="responsable_actividad_inmediata" value={form.responsable_actividad_inmediata} onChange={handleChange} className="w-full p-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                <input type="date" name="fecha_actividad_inmediata" value={form.fecha_actividad_inmediata} onChange={handleChange} className="w-full p-2 border rounded-lg" />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl">
            <h3 className="font-bold text-[#002855] mb-4">🔍 Análisis de Causas (Lluvia de Ideas)</h3>
            <div className="space-y-3">
              {causas.map((causa, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="w-8 text-sm font-medium text-slate-500">#{causa.numero}</span>
                  <input type="text" value={causa.causa} onChange={(e) => {
                    const nuevo = [...causas];
                    nuevo[i].causa = e.target.value;
                    setCausas(nuevo);
                  }} className="flex-1 p-2 border rounded-lg" placeholder="Causa probable..." />
                  <input type="number" value={causa.puntuacion} onChange={(e) => {
                    const nuevo = [...causas];
                    nuevo[i].puntuacion = parseInt(e.target.value) || 0;
                    const total = nuevo.reduce((a, b) => a + b.puntuacion, 0);
                    nuevo.forEach((c, j) => c.porcentaje = total > 0 ? Math.round(c.puntuacion / total * 100) : 0);
                    setCausas(nuevo);
                  }} className="w-20 p-2 border rounded-lg text-center" placeholder="Pts" />
                  <span className="w-16 text-sm text-slate-500 text-center">{causa.porcentaje}%</span>
                  <input type="checkbox" checked={causa.es_causa_principal} onChange={(e) => {
                    const nuevo = causas.map((c, j) => ({...c, es_causa_principal: j === i}));
                    setCausas(nuevo);
                  }} className="w-4 h-4" title="Causa principal" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl">
            <h3 className="font-bold text-[#002855] mb-4">⚠️ Matriz de Riesgos</h3>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="requiere_actualizar_matriz_riesgos" value="SI" checked={form.requiere_actualizar_matriz_riesgos === 'SI'} onChange={handleChange} />
                <span className="font-medium">SI - Requiere actualizar</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="requiere_actualizar_matriz_riesgos" value="NO" checked={form.requiere_actualizar_matriz_riesgos === 'NO'} onChange={handleChange} />
                <span className="font-medium">NO</span>
              </label>
            </div>
            {form.requiere_actualizar_matriz_riesgos === 'SI' && (
              <textarea name="descripcion_riesgo_oportunidad" value={form.descripcion_riesgo_oportunidad} onChange={handleChange}
                rows={2} className="w-full p-2 border rounded-lg" placeholder="Descripción del riesgo u oportunidad modificado..." />
            )}
          </div>

          <div className="bg-slate-50 p-4 rounded-xl">
            <h3 className="font-bold text-[#002855] mb-4">📋 Plan de Actividades Correctivas</h3>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="requiere_cambio_sgc" value="SI" checked={form.requiere_cambio_sgc === 'SI'} onChange={handleChange} />
                <span className="font-medium">SI - Requiere cambio en SGC</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="requiere_cambio_sgc" value="NO" checked={form.requiere_cambio_sgc === 'NO'} onChange={handleChange} />
                <span className="font-medium">NO</span>
              </label>
            </div>
            
            {form.actividades.length > 0 && (
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="p-2 text-left">Actividad</th>
                    <th className="p-2 text-left">Responsable</th>
                    <th className="p-2 text-left">Indicador</th>
                    <th className="p-2 text-left">Fecha</th>
                    <th className="p-2 text-left">Evidencia</th>
                  </tr>
                </thead>
                <tbody>
                  {form.actividades.map((act, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">
                        <input type="text" value={act.actividad} onChange={(e) => {
                          const nuevo = [...form.actividades];
                          nuevo[i].actividad = e.target.value;
                          setForm(f => ({...f, actividades: nuevo}));
                        }} className="w-full p-1 border rounded" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={act.responsable} onChange={(e) => {
                          const nuevo = [...form.actividades];
                          nuevo[i].responsable = e.target.value;
                          setForm(f => ({...f, actividades: nuevo}));
                        }} className="w-full p-1 border rounded" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={act.indicador} onChange={(e) => {
                          const nuevo = [...form.actividades];
                          nuevo[i].indicador = e.target.value;
                          setForm(f => ({...f, actividades: nuevo}));
                        }} className="w-full p-1 border rounded" />
                      </td>
                      <td className="p-2">
                        <input type="date" value={act.fecha_termino} onChange={(e) => {
                          const nuevo = [...form.actividades];
                          nuevo[i].fecha_termino = e.target.value;
                          setForm(f => ({...f, actividades: nuevo}));
                        }} className="w-full p-1 border rounded" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={act.evidencia_esperada} onChange={(e) => {
                          const nuevo = [...form.actividades];
                          nuevo[i].evidencia_esperada = e.target.value;
                          setForm(f => ({...f, actividades: nuevo}));
                        }} className="w-full p-1 border rounded" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPantalla(2)} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
              ← Volver
            </button>
            <button onClick={guardarBorrador} disabled={loading} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
              💾 Guardar
            </button>
            <button onClick={enviarSGC} className="px-6 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#00142a]">
              📤 Enviar a SGC
            </button>
          </div>
        </div>
      )}

      {/* PANTALLA 4: SEGUIMIENTO */}
      {pantalla === 4 && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-xl">
            <h3 className="font-bold text-[#002855] mb-4">📊 Seguimiento de Actividades</h3>
            
            {form.actividades.length === 0 ? (
              <p className="text-slate-400">No hay actividades registradas</p>
            ) : (
              <div className="space-y-3">
                {form.actividades.map((act, i) => (
                  <div key={i} className="p-4 border rounded-lg bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-[#002855]">Actividad {i + 1}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        act.estatus === 'COMPLETADA' ? 'bg-emerald-100 text-emerald-700' :
                        act.estatus === 'EN_PROCESO' ? 'bg-cyan-100 text-cyan-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {act.estatus || 'PENDIENTE'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{act.actividad}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div><span className="text-slate-500">Responsable:</span> {act.responsable}</div>
                      <div><span className="text-slate-500">Fecha:</span> {act.fecha_termino || 'Sin fecha'}</div>
                      <div><span className="text-slate-500">Indicador:</span> {act.indicador || 'N/A'}</div>
                      <div><span className="text-slate-500">Evidencia:</span> {act.evidencia_esperada || 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPantalla(3)} className="px-6 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50">
              ← Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}