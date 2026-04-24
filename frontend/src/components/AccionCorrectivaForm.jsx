import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config';

const COLORES = {
  azul: '#2A78B0',
  azulClaro: '#3d8cc2',
  azulOscuro: '#1e5a84',
  amarillo: '#dddd26',
  verde: '#28a745',
  rojo: '#dc3545',
  blanco: '#ffffff',
  grisClaro: '#f8f9fa',
  grisBorde: '#dee2e6',
  grisTexto: '#495057',
  negro: '#212529',
};

const SectionTitle = ({ children, required }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    marginBottom: '1rem', marginTop: '1.5rem',
    paddingBottom: '0.5rem',
    borderBottom: `2px solid ${COLORES.azul}`,
  }}>
    <span style={{ fontSize: '1.1rem', color: COLORES.azul }}>📋</span>
    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: COLORES.negro, margin: 0 }}>
      {children}
      {required && <span style={{ color: COLORES.rojo, marginLeft: 4 }}> *</span>}
    </h3>
  </div>
);

const InputLabel = ({ children, required, hint }) => (
  <div style={{ marginBottom: '0.5rem' }}>
    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: COLORES.grisTexto }}>
      {children}
      {required && <span style={{ color: COLORES.rojo }}> *</span>}
    </label>
    {hint && <p style={{ fontSize: '0.7rem', color: '#6c757d', margin: '0.2rem 0 0' }}>{hint}</p>}
  </div>
);

const Input = ({ name, value, onChange, options = [], type = 'text', placeholder, rows, ...props }) => {
  const style = {
    width: '100%',
    padding: '0.6rem 0.85rem',
    fontSize: '0.85rem',
    border: `1px solid ${COLORES.grisBorde}`,
    borderRadius: '6px',
    fontFamily: 'inherit',
    background: COLORES.blanco,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    ...props.style,
  };
  
  if (type === 'textarea') {
    return (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows || 3}
        style={{ ...style, resize: 'vertical', minHeight: 80 }}
        {...props}
      />
    );
  }
  
  if (type === 'select') {
    return (
      <select name={name} value={value} onChange={onChange} style={style} {...props}>
        <option value="">Seleccionar...</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }
  
  return (
    <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} style={style} {...props} />
  );
};

const Boton = ({ children, onClick, loading, variant = 'primario', disabled, type = 'button', style = {} }) => {
  const colors = {
    primario: { bg: COLORES.azul, color: COLORES.blanco },
    secundario: { bg: COLORES.grisBorde, color: COLORES.grisTexto },
    peligro: { bg: COLORES.rojo, color: COLORES.blanco },
   success: { bg: COLORES.verde, color: COLORES.blanco },
  };
  const c = colors[variant] || colors.primario;
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%',
        padding: '0.75rem 1.25rem',
        fontSize: '0.9rem',
        fontWeight: 600,
        border: 'none',
        borderRadius: '6px',
        background: disabled ? '#adb5bd' : c.bg,
        color: c.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        ...style,
      }}
    >
      {loading && <span>⏳</span>}
      {children}
    </button>
  );
};

const emptyForm = {
  proceso: '', area: '', origen: '', num_auditoria: '',
  direccion: '',
  descripcion_no_conformidad: '', impacta_otros_procesos: false,
  procesos_afectados: '', 
  equipo_trabajo: '[]',
  accion_contenedora: '',
  actividades_contenedoras: '[]',
  causas: '[]',
  causa_raiz_seleccionada: '', 
  actualiza_matriz_riesgos: false,
  descripcion_riesgo: '', requiere_cambio_sgc: 'NO',
  actividades: '[]',
};

const AccionCorrectivaForm = ({ onSuccess }) => {
  const [paso, setPaso] = useState(1);
  const [descripcionNC, setDescripcionNC] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [catalogos, setCatalogos] = useState({ areas: [], procesos: [], origenes_ac: [], direcciones: [] });
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [equipo, setEquipo] = useState([{ nombre: '', rol: '' }]);
  const [causas, setCausas] = useState([{ causa: '', categoria: '', puntuacion: '' }]);
  const [actividades, setActividades] = useState([
    { descripcion: '', tipo: '', responsable: '', fecha_termino: '', evidencia: '', estado: 'Pendiente' }
  ]);

  useEffect(() => {
    fetch(getApiUrl('/api/v1/catalogos'))
      .then(r => r.json())
      .then(d => setCatalogos({
        areas: d.areas || [],
        procesos: d.procesos || [],
        origenes_ac: d.origenes_ac || [],
        direcciones: d.direcciones || [],
      }))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleGenerarConIA = async () => {
    if (!descripcionNC || descripcionNC.trim().length < 15) {
      setStatus({ type: 'error', msg: 'Describe la No Conformidad con al menos 15 caracteres.' });
      return;
    }
    setAiLoading(true);
    setStatus({ type: '', msg: '' });
    
    try {
      const resp = await fetch(getApiUrl('/api/v1/ai/generar-ac'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: descripcionNC }),
      });
      
      if (!resp.ok) {
        const e = await resp.json();
        setStatus({ type: 'error', msg: e.detail || 'Error en la IA' });
        return;
      }

      const data = await resp.json();
      
      setForm({
        proceso: data.proceso || '',
        area: data.area || '',
        origen: data.origen || '',
        direccion: data.direccion || '',
        num_auditoria: data.num_auditoria || '',
        descripcion_no_conformidad: data.descripcion_no_conformidad || descripcionNC,
        impacta_otros_procesos: data.impacta_otros_procesos || false,
        procesos_afectados: data.procesos_afectados || '',
        accion_contenedora: data.accion_contenedora || '',
        causa_raiz_seleccionada: data.causa_raiz_seleccionada || '',
        actualiza_matriz_riesgos: data.actualiza_matriz_riesgos || false,
        descripcion_riesgo: data.descripcion_riesgo || '',
        requiere_cambio_sgc: data.requiere_cambio_sgc || 'NO',
        equipo_trabajo: typeof data.equipo_trabajo === 'string' ? data.equipo_trabajo : JSON.stringify(data.equipo_trabajo || []),
        causas: typeof data.causas === 'string' ? data.causas : JSON.stringify(data.causas || []),
        actividades_contenedoras: typeof data.actividades_contenedoras === 'string' ? data.actividades_contenedoras : JSON.stringify(data.actividades_contenedoras || []),
        actividades: typeof data.actividades === 'string' ? data.actividades : JSON.stringify(data.actividades || []),
      });

      // Parse arrays
      if (data.equipo_trabajo) {
        const eq = typeof data.equipo_trabajo === 'string' ? JSON.parse(data.equipo_trabajo) : data.equipo_trabajo;
        setEquipo(eq.length > 0 ? eq : [{ nombre: '', rol: '' }]);
      }
      if (data.causas) {
        const cs = typeof data.causas === 'string' ? JSON.parse(data.causas) : data.causas;
        setCausas(cs.length > 0 ? cs : [{ causa: '', categoria: '', puntuacion: '' }]);
      }
      if (data.actividades) {
        const acts = typeof data.actividades === 'string' ? JSON.parse(data.actividades) : data.actividades;
        setActividades(acts.length > 0 ? acts : [{ descripcion: '', tipo: '', responsable: '', fecha_termino: '', evidencia: '', estado: 'Pendiente' }]);
      }

      setStatus({ type: 'success', msg: '✅ IA generó el documento completo..Revisa y corrige antes de guardar.' });
      setPaso(2);
    } catch {
      setStatus({ type: 'error', msg: 'Error al conectar con la IA.' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    const payload = {
      ...form,
      equipo_trabajo: JSON.stringify(equipo.filter(m => m.nombre)),
      causas: JSON.stringify(causas.filter(c => c.causa)),
      actividades: JSON.stringify(actividades.filter(a => a.descripcion)),
    };

    try {
      const resp = await fetch(getApiUrl('/api/v1/acciones-correctivas'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      
      if (resp.ok) {
        setStatus({ type: 'success', msg: `✅ Acción Correctiva guardada (ID #${data.id})` });
        setPaso(1);
        setDescripcionNC('');
        setForm(emptyForm);
        setEquipo([{ nombre: '', rol: '' }]);
        setCausas([{ causa: '', categoria: '', puntuacion: '' }]);
        setActividades([{ descripcion: '', tipo: '', responsable: '', fecha_termino: '', evidencia: '', estado: 'Pendiente' }]);
        onSuccess?.();
      } else {
        setStatus({ type: 'error', msg: data.detail || 'Error al guardar' });
      }
    } catch {
      setStatus({ type: 'error', msg: 'Error de conexión.' });
    } finally {
      setLoading(false);
    }
  };

  const addRow = (setter, blank) => setter(prev => [...prev, blank]);
  const removeRow = (setter, i) => setter(prev => prev.filter((_, idx) => idx !== i));
  const updateRow = (setter, i, field, val) => setter(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));

  // ====================== Paso 1: Descripción ======================
  if (paso === 1) {
    return (
      <div style={{
        background: COLORES.blanco,
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORES.azul}, ${COLORES.azulOscuro})`,
          padding: '1.5rem',
          color: COLORES.blanco,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Nueva Acción Correctiva</h2>
              <p style={{ fontSize: '0.8rem', opacity: 0.85, margin: '0.25rem 0 0' }}>
                Sistema de Gestión de Calidad ISO 9001
              </p>
            </div>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* Info box */}
          <div style={{
            background: `${COLORES.azul}10`,
            border: `1px solid ${COLORES.azul}30`,
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
          }}>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: COLORES.azul, margin: '0 0 0.5rem' }}>
              🤖 Asistente de IA
            </p>
            <p style={{ fontSize: '0.8rem', color: COLORES.grisTexto, lineHeight: 1.5, margin: 0 }}>
              Describe la <strong>No Conformidad</strong> con detalle. La IA analizará y generará automáticamente: 
              proceso, área, causa raíz, equipo de trabajo y plan de actividades.
            </p>
          </div>

          {/* Campo descripción */}
          <div style={{ marginBottom: '1.5rem' }}>
            <InputLabel required>Descripción de la No Conformidad</InputLabel>
            <textarea
              value={descripcionNC}
              onChange={e => setDescripcionNC(e.target.value)}
              placeholder="Ej: Durante la auditoría interna se detectó que los registros de control de calidad no se llevan con la frecuencia establecida en el procedimiento SGC-PR-015, especificamente en el área de potabilizadora Norte..."
              rows={6}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.9rem',
                border: `1px solid ${COLORES.grisBorde}`,
                borderRadius: '6px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            <p style={{ fontSize: '0.7rem', color: '#6c757d', marginTop: '0.25rem' }}>
              {descripcionNC.length} caracteres · Mínimo 15 recomendado
            </p>
          </div>

          {status.msg && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              background: status.type === 'success' ? `${COLORES.verde}15` : `${COLORES.rojo}15`,
              border: `1px solid ${status.type === 'success' ? COLORES.verde : COLORES.rojo}`,
              color: status.type === 'success' ? COLORES.verde : COLORES.rojo,
              fontSize: '0.85rem',
            }}>
              {status.type === 'success' ? '✅' : '⚠️'} {status.msg}
            </div>
          )}

          <Boton onClick={handleGenerarConIA} loading={aiLoading} disabled={descripcionNC.trim().length < 15}>
            🤖 Generar Acción Correctiva con IA
          </Boton>
        </div>
      </div>
    );
  }

  // ====================== Paso 2: Revisión ======================
  return (
    <div style={{
      background: COLORES.blanco,
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORES.azul}, ${COLORES.azulOscuro})`,
        padding: '1.5rem',
        color: COLORES.blanco,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.5rem' }}>📝</span>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Revisar Acción Correctiva</h2>
            <p style={{ fontSize: '0.8rem', opacity: 0.85, margin: '0.25rem 0 0' }}>
              Documento generado por IA · Revisa y guarda
            </p>
          </div>
        </div>
        <button
          onClick={() => { setPaso(1); setStatus({ type: '', msg: '' }); }}
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            borderRadius: '6px',
            color: COLORES.blanco,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          ← Volver
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
        {status.msg && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '6px',
            marginBottom: '1rem',
            background: status.type === 'success' ? `${COLORES.verde}15` : `${COLORES.rojo}15`,
            border: `1px solid ${status.type === 'success' ? COLORES.verde : COLORES.rojo}`,
            color: status.type === 'success' ? COLORES.verde : COLORES.rojo,
            fontSize: '0.85rem',
          }}>
            {status.type === 'success' ? '✅' : '⚠️'} {status.msg}
          </div>
        )}

        <SectionTitle required>Datos Generales</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <InputLabel required>Proceso</InputLabel>
            <select name="proceso" value={form.proceso} onChange={handleChange} style={ { width: '100%', padding: '0.6rem', fontSize: '0.85rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '6px' }}>
              <option value="">Seleccionar...</option>
              {catalogos.procesos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <InputLabel required>Área</InputLabel>
            <select name="area" value={form.area} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '6px' }}>
              <option value="">Seleccionar...</option>
              {catalogos.areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <InputLabel required>Origen</InputLabel>
            <select name="origen" value={form.origen} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '6px' }}>
              <option value="">Seleccionar...</option>
              {catalogos.origenes_ac.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <InputLabel>Dirección</InputLabel>
            <select name="direccion" value={form.direccion} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '6px' }}>
              <option value="">Seleccionar...</option>
              {catalogos.direcciones.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <SectionTitle required>Descripción de la No Conformidad</SectionTitle>
        <div style={{ marginBottom: '1rem' }}>
          <InputLabel required>Descripción clara del problema</InputLabel>
          <textarea
            name="descripcion_no_conformidad"
            value={form.descripcion_no_conformidad}
            onChange={handleChange}
            rows={4}
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '6px', resize: 'vertical' }}
          />
        </div>

        <SectionTitle>Análisis de Causa Raíz</SectionTitle>
        <div style={{ marginBottom: '1rem' }}>
          <InputLabel>Causa raíz seleccionada</InputLabel>
          <textarea
            name="causa_raiz_seleccionada"
            value={form.causa_raiz_seleccionada}
            onChange={handleChange}
            rows={3}
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '6px', resize: 'vertical' }}
          />
        </div>

        <SectionTitle>Plan de Acciones</SectionTitle>
        {actividades.map((act, i) => (
          <div key={i} style={{
            background: COLORES.grisClaro,
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '0.75rem',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Actividad {i + 1}</span>
              {actividades.length > 1 && (
                <button type="button" onClick={() => removeRow(setActividades, i)} style={{ background: 'none', border: 'none', color: COLORES.rojo, cursor: 'pointer', fontSize: '0.85rem' }}>✕ Eliminar</button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <input
                placeholder="Descripción de la actividad"
                value={act.descripcion}
                onChange={e => updateRow(setActividades, i, 'descripcion', e.target.value)}
                style={{ gridColumn: '1 / -1', padding: '0.5rem', fontSize: '0.8rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '4px' }}
              />
              <input
                placeholder="Responsable"
                value={act.responsable}
                onChange={e => updateRow(setActividades, i, 'responsable', e.target.value)}
                style={{ padding: '0.5rem', fontSize: '0.8rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '4px' }}
              />
              <input
                type="date"
                value={act.fecha_termino}
                onChange={e => updateRow(setActividades, i, 'fecha_termino', e.target.value)}
                style={{ padding: '0.5rem', fontSize: '0.8rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '4px' }}
              />
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addRow(setActividades, { descripcion: '', tipo: '', responsable: '', fecha_termino: '', evidencia: '', estado: 'Pendiente' })}
          style={{
            padding: '0.5rem 1rem',
            background: 'none',
            border: `1px dashed ${COLORES.grisBorde}`,
            borderRadius: '6px',
            color: COLORES.azul,
            cursor: 'pointer',
            fontSize: '0.85rem',
            width: '100%',
          }}
        >
          + Agregar Actividad
        </button>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
          <Boton variant="secundario" onClick={() => setPaso(1)}>← Cancelar</Boton>
          <Boton onClick={handleSubmit} loading={loading} variant="success">💾 Guardar Acción Correctiva</Boton>
        </div>
      </form>
    </div>
  );
};

export default AccionCorrectivaForm;