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
  titulo_mejora: '',
  gerencia_coordinacion: '',
  categoria_mejora: '',
  periodo_mejora: '',
  origen: '',
  direccion: '',
  descripcion_situacion_actual: '',
  situacion_deseada: '',
  beneficios: '',
  responsable: '',
  integrantes: '[]',
  actividades: '[]',
};

const PlanMejoraForm = ({ onSuccess }) => {
  const [paso, setPaso] = useState(1);
  const [descripcionSA, setDescripcionSA] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [catalogos, setCatalogos] = useState({
    areas: [], categorias_mejora: [], origenes_pm: [], periodos: [], direcciones: [],
  });
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [integrantes, setIntegrantes] = useState([{ nombre: '', rol: '' }]);
  const [actividades, setActividades] = useState([
    { descripcion: '', tipo: '', indicador: '', responsable: '', fecha_termino: '', evidencia: '', estado: 'Pendiente' }
  ]);

  useEffect(() => {
    fetch(getApiUrl('/api/v1/catalogos'))
      .then(r => r.json())
      .then(d => setCatalogos({
        areas: d.areas || [],
        categorias_mejora: d.categorias_mejora || [],
        periodos: d.periodos || [],
        origenes_pm: d.origenes_pm || [],
        direcciones: d.direcciones || [],
      }))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleGenerarConIA = async () => {
    if (!descripcionSA || descripcionSA.trim().length < 15) {
      setStatus({ type: 'error', msg: 'Describe la situación actual con al menos 15 caracteres.' });
      return;
    }
    setAiLoading(true);
    setStatus({ type: '', msg: '' });
    
    try {
      const resp = await fetch(getApiUrl('/api/v1/ai/generar-pm'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: descripcionSA }),
      });
      
      if (!resp.ok) {
        const e = await resp.json();
        setStatus({ type: 'error', msg: e.detail || 'Error en la IA' });
        return;
      }

      const data = await resp.json();
      
      setForm({
        titulo_mejora: data.titulo_mejora || '',
        gerencia_coordinacion: data.gerencia_coordinacion || '',
        categoria_mejora: data.categoria_mejora || '',
        periodo_mejora: data.periodo_mejora || '',
        origen: data.origen || '',
        direccion: data.direccion || '',
        descripcion_situacion_actual: data.descripcion_situacion_actual || descripcionSA,
        situacion_deseada: data.situacion_deseada || '',
        beneficios: data.beneficios || '',
        responsable: data.responsable || '',
        integrantes: typeof data.integrantes === 'string' ? data.integrantes : JSON.stringify(data.integrantes || []),
        actividades: typeof data.actividades === 'string' ? data.actividades : JSON.stringify(data.actividades || []),
      });

      if (data.integrantes) {
        const ints = typeof data.integrantes === 'string' ? JSON.parse(data.integrantes) : data.integrantes;
        setIntegrantes(ints.length > 0 ? ints : [{ nombre: '', rol: '' }]);
      }
      if (data.actividades) {
        const acts = typeof data.actividades === 'string' ? JSON.parse(data.actividades) : data.actividades;
        setActividades(acts.length > 0 ? acts : [{ descripcion: '', tipo: '', indicador: '', responsable: '', fecha_termino: '', evidencia: '', estado: 'Pendiente' }]);
      }

      setStatus({ type: 'success', msg: '✅ IA generó el Plan de Mejora completo. Revisa antes de guardar.' });
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
      integrantes: JSON.stringify(integrantes.filter(m => m.nombre)),
      actividades: JSON.stringify(actividades.filter(a => a.descripcion)),
    };

    try {
      const resp = await fetch(getApiUrl('/api/v1/planes-mejora'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      
      if (resp.ok) {
        setStatus({ type: 'success', msg: `✅ Plan de Mejora guardado (ID #${data.id})` });
        setPaso(1);
        setDescripcionSA('');
        setForm(emptyForm);
        setIntegrantes([{ nombre: '', rol: '' }]);
        setActividades([{ descripcion: '', tipo: '', indicador: '', responsable: '', fecha_termino: '', evidencia: '', estado: 'Pendiente' }]);
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
            <span style={{ fontSize: '1.5rem' }}>🎯</span>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Nuevo Plan de Mejora</h2>
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
              Describe la <strong>situación actual</strong> que deseas mejorar. La IA generará automáticamente: 
              título, categoría, beneficios, equipo y plan de actividades.
            </p>
          </div>

          {/* Campo descripción */}
          <div style={{ marginBottom: '1.5rem' }}>
            <InputLabel required>Situación Actual a Mejorar</InputLabel>
            <textarea
              value={descripcionSA}
              onChange={e => setDescripcionSA(e.target.value)}
              placeholder="Ej: Los tiempos de respuesta en atención de fallas técnicas son mayores a 48 horas debido a la falta de un sistema de tikets centralizado..."
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
              {descripcionSA.length} caracteres · Mínimo 15 recomendado
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

          <Boton onClick={handleGenerarConIA} loading={aiLoading} disabled={descripcionSA.trim().length < 15}>
            🤖 Generar Plan de Mejora con IA
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
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Revisar Plan de Mejora</h2>
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
          <div style={{ gridColumn: '1 / -1' }}>
            <InputLabel required>Título de la Mejora</InputLabel>
            <input
              name="titulo_mejora"
              value={form.titulo_mejora}
              onChange={handleChange}
              placeholder="Título corto y descriptivo"
              style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '6px' }}
            />
          </div>
          <div>
            <InputLabel required>Área / Gerencia</InputLabel>
            <select name="gerencia_coordinacion" value={form.gerencia_coordinacion} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '6px' }}>
              <option value="">Seleccionar...</option>
              {catalogos.areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <InputLabel required>Categoría</InputLabel>
            <select name="categoria_mejora" value={form.categoria_mejora} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '6px' }}>
              <option value="">Seleccionar...</option>
              {catalogos.categorias_mejora.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <InputLabel required>Período</InputLabel>
            <select name="periodo_mejora" value={form.periodo_mejora} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '6px' }}>
              <option value="">Seleccionar...</option>
              {catalogos.periodos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <InputLabel required>Origen</InputLabel>
            <select name="origen" value={form.origen} onChange={handleChange} style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '6px' }}>
              <option value="">Seleccionar...</option>
              {catalogos.origenes_pm.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <SectionTitle required>Descripción</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <InputLabel required>Situación Actual</InputLabel>
            <textarea
              name="descripcion_situacion_actual"
              value={form.descripcion_situacion_actual}
              onChange={handleChange}
              rows={4}
              style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '6px', resize: 'vertical' }}
            />
          </div>
          <div>
            <InputLabel required>Situación Deseada</InputLabel>
            <textarea
              name="situacion_deseada"
              value={form.situacion_deseada}
              onChange={handleChange}
              rows={4}
              style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '6px', resize: 'vertical' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <InputLabel required>Beneficios Esperados</InputLabel>
          <textarea
            name="beneficios"
            value={form.beneficios}
            onChange={handleChange}
            rows={2}
            style={{ width: '100%', padding: '0.6rem', fontSize: '0.85rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '6px', resize: 'vertical' }}
          />
        </div>

        <SectionTitle>Plan de Actividades</SectionTitle>
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
                placeholder="Indicador"
                value={act.indicador}
                onChange={e => updateRow(setActividades, i, 'indicador', e.target.value)}
                style={{ padding: '0.5rem', fontSize: '0.8rem', border: `1px solid ${COLORES.grisBorde}`, borderRadius: '4px' }}
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
          onClick={() => addRow(setActividades, { descripcion: '', tipo: '', indicador: '', responsable: '', fecha_termino: '', evidencia: '', estado: 'Pendiente' })}
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
          <Boton onClick={handleSubmit} loading={loading} variant="success">💾 Guardar Plan de Mejora</Boton>
        </div>
      </form>
    </div>
  );
};

export default PlanMejoraForm;