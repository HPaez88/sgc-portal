import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

const emptyForm = {
  titulo_mejora: '', gerencia_coordinacion: '', categoria_mejora: '',
  periodo_mejora: '', origen: '', descripcion_situacion_actual: '',
  situacion_deseada: '', beneficios: '', responsable: '', integrantes: '',
};

const PlanMejoraForm = ({ onSuccess }) => {
  const [paso, setPaso] = useState(1);
  const [descripcionSA, setDescripcionSA] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [catalogos, setCatalogos] = useState({
    areas: [], categorias_mejora: [], periodos: [], origenes_pm: [],
  });
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [actividades, setActividades] = useState([
    { actividad: '', responsable: '', indicador: '', fecha_termino: '', evidencia: '' }
  ]);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/catalogos`)
      .then(r => r.json())
      .then(d => {
        setCatalogos({
          areas: d.areas || [],
          categorias_mejora: d.categorias_mejora || [],
          periodos: d.periodos || [],
          origenes_pm: d.origenes_pm || [],
        });
      })
      .catch(() => {});
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerarConIA = async () => {
    if (!descripcionSA || descripcionSA.trim().length < 15) {
      setStatus({ type: 'error', msg: 'Describe la situación con al menos 15 caracteres.' });
      return;
    }
    setAiLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      const resp = await fetch(`${API_BASE}/api/v1/ai/generar-pm`, {
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
        descripcion_situacion_actual: descripcionSA,
        situacion_deseada: data.situacion_deseada || '',
        beneficios: data.beneficios || '',
        responsable: data.responsable || '',
        integrantes: data.integrantes || '',
      });

      const acts = typeof data.actividades === 'string'
        ? JSON.parse(data.actividades) : (data.actividades || []);
      setActividades(acts.length > 0 ? acts : [{ actividad: '', responsable: '', indicador: '', fecha_termino: '', evidencia: '' }]);

      setStatus({ type: 'success', msg: '✨ IA generó el Plan. Revisa y edita antes de guardar.' });
      setPaso(2);
    } catch {
      setStatus({ type: 'error', msg: 'Error al conectar con la IA.' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    const payload = {
      ...form,
      actividades: JSON.stringify(actividades.filter(a => a.actividad)),
    };

    try {
      const resp = await fetch(`${API_BASE}/api/v1/planes-mejora`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (resp.ok) {
        setStatus({ type: 'success', msg: `✅ Plan guardado (ID #${data.id}) — Folio al aprobar.` });
        setPaso(1);
        setDescripcionSA('');
        setForm(emptyForm);
        setActividades([{ actividad: '', responsable: '', indicador: '', fecha_termino: '', evidencia: '' }]);
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

  const addActividad = () => setActividades(prev => [...prev, { actividad: '', responsable: '', indicador: '', fecha_termino: '', evidencia: '' }]);
  const updateActividad = (i, field, val) => setActividades(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: val } : a));
  const removeActividad = i => setActividades(prev => prev.filter((_, idx) => idx !== i));

  if (paso === 1) {
    return (
      <div className="card fade-in">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '1.5rem' }}>🎯</span>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Nuevo Plan de Mejora</h3>
              <p className="text-muted text-sm">ISO 9001 · IA generará el plan completo</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.06))',
            border: '1px solid rgba(16,185,129,0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
          }}>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-success)', marginBottom: '0.4rem' }}>
              🤖 ¿Cómo funciona?
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Describe la <strong>situación actual</strong> que deseas mejorar. La IA generará: título, categoría, 
              situación deseada, beneficios y actividades. Solo revisa y approves.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Descripción de la Situación Actual o Meta <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <textarea
              className="form-textarea"
              rows="6"
              value={descripcionSA}
              onChange={e => setDescripcionSA(e.target.value)}
              placeholder="Ej: El proceso de lectura de medidores es manual, generando errores en facturación..."
              style={{ fontSize: '0.9rem', lineHeight: 1.6 }}
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-faint)', marginTop: '0.4rem' }}>
              {descripcionSA.length} caracteres · Mínimo 15 recomendado
            </p>
          </div>

          {status.msg && (
            <div className={`alert alert-${status.type === 'success' ? 'success' : 'error'} mb-4`}>
              <span>{status.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{status.msg}</span>
            </div>
          )}

          <button
            className="btn btn-primary"
            onClick={handleGenerarConIA}
            disabled={aiLoading || descripcionSA.trim().length < 15}
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
          >
            {aiLoading
              ? <><span className="spinner" /> Generando (15-30 seg)...</>
              : '🤖 Generar Plan con IA'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card fade-in">
      <div className="card-header" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(59,130,246,0.04))' }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '1.25rem' }}>🎯</span>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Revisión — Plan de Mejora</h3>
            <p className="text-muted text-sm">Documento generado por IA · ISO 9001</p>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { setPaso(1); setStatus({ type: '', msg: '' }); }}>
          ← Volver
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
        {status.msg && (
          <div className={`alert alert-${status.type === 'success' ? 'success' : 'error'} mb-4`}>
            <span>{status.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{status.msg}</span>
          </div>
        )}

        <SectionTitle color="var(--color-purple)" label="Datos Generales" />
        <div className="grid-2 mb-4">
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Título de la mejora <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input className="form-input" name="titulo_mejora" value={form.titulo_mejora} onChange={handleChange}
              required placeholder="Título descriptivo" />
          </div>
          <div>
            <label className="form-label">Gerencia / Coordinación <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select className="form-select" name="gerencia_coordinacion" value={form.gerencia_coordinacion}
              onChange={handleChange} required>
              <option value="">Selecciona área</option>
              {catalogos.areas?.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Categoría de Mejora <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select className="form-select" name="categoria_mejora" value={form.categoria_mejora}
              onChange={handleChange} required>
              <option value="">Selecciona categoría</option>
              {catalogos.categorias_mejora?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Período <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select className="form-select" name="periodo_mejora" value={form.periodo_mejora}
              onChange={handleChange} required>
              <option value="">Selecciona período</option>
              {catalogos.periodos?.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Origen <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select className="form-select" name="origen" value={form.origen}
              onChange={handleChange} required>
              <option value="">Selecciona origen</option>
              {catalogos.origenes_pm?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        <hr className="divider" />

        <SectionTitle color="var(--color-success)" label="Equipo de Mejora" />
        <div className="grid-2 mb-4">
          <div>
            <label className="form-label">Responsable <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <input className="form-input" name="responsable" value={form.responsable} onChange={handleChange}
              required placeholder="Nombre del responsable" />
          </div>
          <div>
            <label className="form-label">Integrantes del equipo</label>
            <input className="form-input" name="integrantes" value={form.integrantes} onChange={handleChange}
              placeholder="Nombre 1, Nombre 2,..." />
          </div>
        </div>

        <hr className="divider" />

        <SectionTitle color="var(--color-primary)" label="Situación Actual" />
        <div className="mb-4">
          <textarea className="form-textarea" name="descripcion_situacion_actual" rows="4"
            value={form.descripcion_situacion_actual} onChange={handleChange} required
            placeholder="Describe la situación actual..." />
        </div>

        <hr className="divider" />

        <SectionTitle color="var(--color-accent)" label="Situación Deseada" />
        <div className="mb-4">
          <textarea className="form-textarea" name="situacion_deseada" rows="4"
            value={form.situacion_deseada} onChange={handleChange} required
            placeholder="¿Cuál es el estado ideal?" />
        </div>

        <hr className="divider" />

        <SectionTitle color="var(--color-warning)" label="Beneficios Esperados" />
        <div className="mb-4">
          <textarea className="form-textarea" name="beneficios" rows="3"
            value={form.beneficios} onChange={handleChange} required
            placeholder="Beneficios cuantificables..." />
        </div>

        <hr className="divider" />

        <SectionTitle color="var(--color-success)" label="Actividades del Plan" />
        <div className="mb-4">
          {actividades.map((a, i) => (
            <div key={i} style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '0.6rem' }}>
              <div className="flex justify-between items-center mb-2">
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>ACTIVIDAD {i + 1}</span>
                <button type="button" className="btn btn-danger btn-sm"
                  onClick={() => removeActividad(i)} disabled={actividades.length === 1}>✕</button>
              </div>
              <div className="grid-2">
                <div>
                  <label className="form-label">Actividad</label>
                  <input className="form-input" value={a.actividad}
                    onChange={e => updateActividad(i, 'actividad', e.target.value)}
                    placeholder="Descripción" />
                </div>
                <div>
                  <label className="form-label">Responsable</label>
                  <input className="form-input" value={a.responsable}
                    onChange={e => updateActividad(i, 'responsable', e.target.value)}
                    placeholder="Nombre" />
                </div>
                <div>
                  <label className="form-label">Indicador</label>
                  <input className="form-input" value={a.indicador}
                    onChange={e => updateActividad(i, 'indicador', e.target.value)}
                    placeholder="80% completado" />
                </div>
                <div>
                  <label className="form-label">Fecha término</label>
                  <input className="form-input" type="date" value={a.fecha_termino}
                    onChange={e => updateActividad(i, 'fecha_termino', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Evidencia</label>
                  <input className="form-input" value={a.evidencia}
                    onChange={e => updateActividad(i, 'evidencia', e.target.value)}
                    placeholder="Tipo de evidencia" />
                </div>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm" onClick={addActividad}>+ Agregar actividad</button>
        </div>

        <hr className="divider" />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="button" className="btn btn-ghost" onClick={() => { setPaso(1); setStatus({ type: '', msg: '' }); }}>
            ← Volver
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <><span className="spinner" /> Guardando...</> : '💾 Guardar Borrador'}
          </button>
        </div>
      </form>
    </div>
  );
};

const SectionTitle = ({ color, label }) => (
  <div style={{ borderLeft: `3px solid ${color}`, paddingLeft: '0.75rem', marginBottom: '1.25rem' }}>
    <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color }}>
      {label}
    </p>
  </div>
);

export default PlanMejoraForm;