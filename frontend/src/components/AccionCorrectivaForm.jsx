import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

const emptyForm = {
  proceso: '', area: '', origen: '', num_auditoria: '',
  descripcion_no_conformidad: '', impacta_otros_procesos: false,
  procesos_afectados: '', accion_contenedora: '',
  causa_raiz_seleccionada: '', actualiza_matriz_riesgos: false,
  descripcion_riesgo: '', requiere_cambio_sgc: '',
};

const AccionCorrectivaForm = ({ onSuccess }) => {
  const [paso, setPaso] = useState(1);
  const [descripcionNC, setDescripcionNC] = useState('');
  const [form, setForm] = useState(emptyForm);
const [catalogos, setCatalogos] = useState({
      areas: [], procesos: [], origenes_ac: [], direcciones: [],
    });
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [equipo, setEquipo] = useState([{ nombre: '', puesto: '' }]);
  const [causas, setCausas] = useState([{ causa: '', total: '' }]);
  const [actividades, setActividades] = useState([
    { actividad: '', responsable: '', indicador: '', fecha_termino: '', evidencia: '' }
  ]);

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/catalogos`)
      .then(r => r.json())
      .then(d => {
        setCatalogos({
          areas: d.areas || [],
          procesos: d.procesos || [],
          origenes_ac: d.origenes_ac || [],
          direcciones: d.direcciones || [],
        });
      })
      .catch(() => {});
  }, []);

  const handleGenerarConIA = async () => {
    if (!descripcionNC || descripcionNC.trim().length < 15) {
      setStatus({ type: 'error', msg: 'Describe la NC con al menos 15 caracteres.' });
      return;
    }
    setAiLoading(true);
    setStatus({ type: '', msg: '' });
    try {
      const resp = await fetch(`${API_BASE}/api/v1/ai/generar-ac`, {
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
        num_auditoria: data.num_auditoria || '',
        descripcion_no_conformidad: descripcionNC,
        impacta_otros_procesos: data.impacta_otros_procesos || false,
        procesos_afectados: data.procesos_afectados || '',
        accion_contenedora: data.accion_contenedora || '',
        causa_raiz_seleccionada: data.causa_raiz_seleccionada || '',
        actualiza_matriz_riesgos: data.actualiza_matriz_riesgos || false,
        descripcion_riesgo: data.descripcion_riesgo || '',
        requiere_cambio_sgc: data.requiere_cambio_sgc || 'NO',
      });

      const eq = typeof data.equipo_trabajo === 'string'
        ? JSON.parse(data.equipo_trabajo) : (data.equipo_trabajo || []);
      setEquipo(eq.length > 0 ? eq : [{ nombre: '', puesto: '' }]);

      const cs = typeof data.causas === 'string'
        ? JSON.parse(data.causas) : (data.causas || []);
      setCausas(cs.length > 0 ? cs : [{ causa: '', total: '' }]);

      const acts = typeof data.actividades === 'string'
        ? JSON.parse(data.actividades) : (data.actividades || []);
      setActividades(acts.length > 0 ? acts : [{ actividad: '', responsable: '', indicador: '', fecha_termino: '', evidencia: '' }]);

      setStatus({ type: 'success', msg: '✨ IA generó el documento. Revisa y edita antes de guardar.' });
      setPaso(2);
    } catch {
      setStatus({ type: 'error', msg: 'Error al conectar con la IA.' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', msg: '' });

    const payload = {
      ...form,
      equipo_trabajo: JSON.stringify(equipo.filter(m => m.nombre)),
      causas: JSON.stringify(causas.filter(c => c.causa)),
      actividades: JSON.stringify(actividades.filter(a => a.actividad)),
    };

    try {
      const resp = await fetch(`${API_BASE}/api/v1/acciones-correctivas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (resp.ok) {
        setStatus({ type: 'success', msg: `✅ AC guardada (ID #${data.id}) — Folio al aprobar.` });
        setPaso(1);
        setDescripcionNC('');
        setForm(emptyForm);
        setEquipo([{ nombre: '', puesto: '' }]);
        setCausas([{ causa: '', total: '' }]);
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

  const addRow = (setter, blank) => setter(prev => [...prev, blank]);
  const updateRow = (setter, i, field, val) => setter(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r));
  const removeRow = (setter, i) => setter(prev => prev.filter((_, idx) => idx !== i));

  if (paso === 1) {
    return (
      <div className="card fade-in">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Nueva Acción Correctiva</h3>
              <p className="text-muted text-sm">ISO 9001 · IA generará el documento completo</p>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(59,130,246,0.08))',
            border: '1px solid rgba(139,92,246,0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem 1.5rem',
            marginBottom: '2rem',
          }}>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-purple)', marginBottom: '0.4rem' }}>
              🤖 ¿Cómo funciona?
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Describe la <strong>No Conformidad</strong> con detalle. La IA analizará y generará: proceso, área, causa raíz, 
              equipo de trabajo y actividades. Solo revisa y aprueba.
            </p>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">Descripción de la No Conformidad <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <textarea
              className="form-textarea"
              rows="6"
              value={descripcionNC}
              onChange={e => setDescripcionNC(e.target.value)}
              placeholder="Ej: Durante la auditoría se detectó que los registros de cloro residual no se llevan con la frecuencia establecida en el procedimiento SGC-PR-015..."
              style={{ fontSize: '0.9rem', lineHeight: 1.6 }}
            />
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-faint)', marginTop: '0.4rem' }}>
              {descripcionNC.length} caracteres · Mínimo 15 recomendado
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
            disabled={aiLoading || descripcionNC.trim().length < 15}
            style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
          >
            {aiLoading
              ? <><span className="spinner" /> Generando (15-30 seg)...</>
              : '🤖 Generar Documento con IA'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card fade-in">
      <div className="card-header" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(59,130,246,0.05))' }}>
        <div className="flex items-center gap-2">
          <span style={{ fontSize: '1.25rem' }}>⚡</span>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Revisión — Acción Correctiva</h3>
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

        <SectionTitle color="var(--color-primary)" label="Datos Generales" />
        <div className="grid-2 mb-4">
          <div>
            <label className="form-label">Proceso <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select className="form-select" name="proceso" value={form.proceso} onChange={handleChange} required>
              <option value="">Selecciona proceso</option>
              {catalogos.procesos?.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Área <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select className="form-select" name="area" value={form.area} onChange={handleChange} required>
              <option value="">Selecciona área</option>
              {catalogos.areas?.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Origen <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select className="form-select" name="origen" value={form.origen} onChange={handleChange} required>
              <option value="">Selecciona origen</option>
              {catalogos.origenes_ac?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Núm. Auditoría</label>
            <input className="form-input" name="num_auditoria" value={form.num_auditoria} onChange={handleChange}
              placeholder="AUD-2026-001" />
          </div>
        </div>

        <hr className="divider" />

        <SectionTitle color="var(--color-accent)" label="Descripción de la No Conformidad" />
        <div className="mb-4">
          <textarea className="form-textarea" name="descripcion_no_conformidad" rows="4"
            value={form.descripcion_no_conformidad} onChange={handleChange} required
            placeholder="Descripción detallada..." />
        </div>
        <div className="mb-4">
          <label className="form-checkbox">
            <input type="checkbox" name="impacta_otros_procesos" checked={form.impacta_otros_procesos} onChange={handleChange} />
            ¿Impacta otros procesos?
          </label>
        </div>
        {form.impacta_otros_procesos && (
          <div className="mb-4">
            <label className="form-label">Procesos afectados</label>
            <input className="form-input" name="procesos_afectados" value={form.procesos_afectados} onChange={handleChange}
              placeholder="Distribución, Facturación..." />
          </div>
        )}

        <hr className="divider" />

        <SectionTitle color="var(--color-success)" label="Equipo de Trabajo" />
        <div className="mb-4">
          {equipo.map((m, i) => (
            <div key={i} className="team-row mb-2">
              <div>
                <label className="form-label">Nombre</label>
                <input className="form-input" value={m.nombre}
                  onChange={e => updateRow(setEquipo, i, 'nombre', e.target.value)}
                  placeholder="Nombre completo" />
              </div>
              <div>
                <label className="form-label">Puesto</label>
                <input className="form-input" value={m.puesto}
                  onChange={e => updateRow(setEquipo, i, 'puesto', e.target.value)}
                  placeholder="Puesto/cargo" />
              </div>
              <button type="button" className="btn btn-danger btn-sm"
                onClick={() => removeRow(setEquipo, i)}
                style={{ marginTop: '1.4rem' }} disabled={equipo.length === 1}>✕</button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm"
            onClick={() => addRow(setEquipo, { nombre: '', puesto: '' })}>+ Agregar miembro</button>
        </div>

        <hr className="divider" />

        <SectionTitle color="var(--color-purple)" label="Análisis de Causa Raíz" />
        <div className="mb-4">
          <label className="form-label">Acción Contenedora</label>
          <input className="form-input" name="accion_contenedora" value={form.accion_contenedora}
            onChange={handleChange} placeholder="Acción inmediata para contener..." />
        </div>
        <div className="mb-4">
          <label className="form-label">Causas (lluvia de ideas)</label>
          {causas.map((c, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'end' }}>
              <input className="form-input" value={c.causa}
                onChange={e => updateRow(setCausas, i, 'causa', e.target.value)}
                placeholder={`Causa ${i + 1}...`} />
              <input className="form-input" type="number" value={c.total}
                onChange={e => updateRow(setCausas, i, 'total', e.target.value)}
                placeholder="Pts" min="0" />
              <button type="button" className="btn btn-danger btn-sm"
                onClick={() => removeRow(setCausas, i)} disabled={causas.length === 1}>✕</button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm"
            onClick={() => addRow(setCausas, { causa: '', total: '' })}>+ Agregar causa</button>
        </div>
        <div className="mb-4">
          <label className="form-label">Causa raíz seleccionada <span style={{ color: 'var(--color-danger)' }}>*</span></label>
          <textarea className="form-textarea" name="causa_raiz_seleccionada" rows="3"
            value={form.causa_raiz_seleccionada} onChange={handleChange} required
            placeholder="Causa raíz determinada..." />
        </div>
        <div className="mb-4">
          <label className="form-checkbox">
            <input type="checkbox" name="actualiza_matriz_riesgos" checked={form.actualiza_matriz_riesgos} onChange={handleChange} />
            ¿Actualiza matriz de riesgos?
          </label>
        </div>
        {form.actualiza_matriz_riesgos && (
          <div className="mb-4">
            <label className="form-label">Descripción del riesgo</label>
            <textarea className="form-textarea" name="descripcion_riesgo" rows="2"
              value={form.descripcion_riesgo} onChange={handleChange}
              placeholder="Describe el riesgo u oportunidad..." />
          </div>
        )}
        <div className="mb-4">
          <label className="form-label">¿Requiere cambio en el SGC?</label>
          <select className="form-select" name="requiere_cambio_sgc" value={form.requiere_cambio_sgc} onChange={handleChange}>
            <option value="NO">NO</option>
            <option value="SI">SI</option>
          </select>
        </div>

        <hr className="divider" />

        <SectionTitle color="var(--color-warning)" label="Plan de Actividades" />
        <div className="mb-4">
          {actividades.map((a, i) => (
            <div key={i} style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.85rem', marginBottom: '0.6rem' }}>
              <div className="flex justify-between items-center mb-2">
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>ACTIVIDAD {i + 1}</span>
                <button type="button" className="btn btn-danger btn-sm"
                  onClick={() => removeRow(setActividades, i)} disabled={actividades.length === 1}>✕</button>
              </div>
              <div className="grid-2">
                <div>
                  <label className="form-label">Actividad</label>
                  <input className="form-input" value={a.actividad}
                    onChange={e => updateRow(setActividades, i, 'actividad', e.target.value)}
                    placeholder="Descripción" />
                </div>
                <div>
                  <label className="form-label">Responsable</label>
                  <input className="form-input" value={a.responsable}
                    onChange={e => updateRow(setActividades, i, 'responsable', e.target.value)}
                    placeholder="Nombre" />
                </div>
                <div>
                  <label className="form-label">Indicador</label>
                  <input className="form-input" value={a.indicador}
                    onChange={e => updateRow(setActividades, i, 'indicador', e.target.value)}
                    placeholder="80% completado" />
                </div>
                <div>
                  <label className="form-label">Fecha término</label>
                  <input className="form-input" type="date" value={a.fecha_termino}
                    onChange={e => updateRow(setActividades, i, 'fecha_termino', e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Evidencia</label>
                  <input className="form-input" value={a.evidencia}
                    onChange={e => updateRow(setActividades, i, 'evidencia', e.target.value)}
                    placeholder="Tipo de evidencia" />
                </div>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-sm"
            onClick={() => addRow(setActividades, { actividad: '', responsable: '', indicador: '', fecha_termino: '', evidencia: '' })}>
            + Agregar actividad
          </button>
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

export default AccionCorrectivaForm;