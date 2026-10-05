import React, { useState, useEffect } from 'react';
import { api, requestBlob, descargarBlob } from '../services/apiClient';
import { transicionesDesde, cargarWorkflow, normalizarEstado, metaEstado } from '../services/workflowService';

// Columnas del kanban: todos los estados del workflow real del backend,
// no solo los cuatro iniciales (antes los estados avanzados quedaban invisibles).
const COLUMNAS = [
  'BORRADOR',
  'EN_REVISION',
  'APROBADO',
  'EN_SEGUIMIENTO',
  'SOLICITUD_CIERRE',
  'REVISION_AUDITOR',
  'RECHAZADO',
  'CERRADO_EFECTIVO',
  'CERRADO_NO_EFECTIVO',
];

const GestorAprobaciones = () => {
  const [acList, setAcList] = useState([]);
  const [pmList, setPmList] = useState([]);
  const [filtro, setFiltro] = useState('todos'); // 'todos' | 'AC' | 'PM'
  const [selected, setSelected] = useState(null); // { item, tipo }
  const [comentarios, setComentarios] = useState('');
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [acResp, pmResp] = await Promise.all([
        api.get('/api/v1/acciones-correctivas'),
        api.get('/api/v1/planes-mejora'),
      ]);

      const errores = [];
      if (acResp.ok) setAcList(acResp.data || []);
      else errores.push(`Acciones Correctivas: ${acResp.error?.message || 'sin respuesta'}`);

      if (pmResp.ok) setPmList(pmResp.data || []);
      else errores.push(`Planes de Mejora: ${pmResp.error?.message || 'sin respuesta'}`);

      // Antes un fallo dejaba las listas vacías en silencio.
      if (errores.length > 0) setError(`No se pudieron cargar todos los registros. ${errores.join(' · ')}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // El backend define las transiciones válidas; se cargan una vez.
    cargarWorkflow();
  }, []);

  const fetchHistorial = async (item, tipo) => {
    const path = tipo === 'AC' ? 'acciones-correctivas' : 'planes-mejora';
    const { ok, data } = await api.get(`/api/v1/${path}/${item.id}/historial`);
    setHistorial(ok && Array.isArray(data) ? data : []);
  };

  const openModal = (item, tipo) => {
    setSelected({ item, tipo });
    setComentarios('');
    setHistorial([]);
    fetchHistorial(item, tipo);
  };

  const closeModal = () => {
    setSelected(null);
    setComentarios('');
    setHistorial([]);
  };

  const actualizarEstado = async (nuevoEstado) => {
    if (!selected) return;
    const { item, tipo } = selected;

    // Validación local antes de enviar
    if (nuevoEstado === 'RECHAZADO' && !comentarios.trim()) {
      setError('Los comentarios son obligatorios para rechazar.');
      return;
    }

    setActionLoading(true);
    setError('');
    const path = tipo === 'AC' ? 'acciones-correctivas' : 'planes-mejora';
    const { ok, error: apiError } = await api.put(`/api/v1/${path}/${item.id}/estado`, {
      estado: nuevoEstado,
      comentarios_revision: comentarios,
    });

    if (ok) {
      closeModal();
      await fetchAll();
    } else {
      setError(apiError?.message || 'No se pudo actualizar el estado.');
    }
    setActionLoading(false);
  };

  const exportarWord = async () => {
    if (!selected) return;
    const { item, tipo } = selected;
    setExportLoading(true);
    setError('');
    const path = tipo === 'AC' ? 'acciones-correctivas' : 'planes-mejora';
    const { ok, blob, error: apiError } = await requestBlob(`/api/v1/${path}/${item.id}/exportar-word`);
    if (ok) {
      // item.folio puede ser null en borradores: se usa un respaldo seguro.
      const folioSeguro = String(item.folio || item.folio_codigo || `BORRADOR-${item.id}`).replace(/[/#]/g, '-');
      descargarBlob(blob, `${tipo}_${folioSeguro}_${item.id}.docx`);
    } else {
      setError(apiError?.message || 'Error al generar el documento Word.');
    }
    setExportLoading(false);
  };

  // Combinar listas según filtro
  const allItems = [
    ...acList.map(i => ({ ...i, _tipo: 'AC', _folio: i.folio, _titulo: `[AC] ${i.proceso}`, _area: i.area })),
    ...pmList.map(i => ({ ...i, _tipo: 'PM', _folio: i.folio, _titulo: `[PM] ${i.titulo_mejora}`, _area: i.gerencia_coordinacion })),
  ];
  const filtered = filtro === 'todos' ? allItems : allItems.filter(i => i._tipo === filtro);

  const getColumn = (estado) => filtered.filter(i => normalizarEstado(i.estado) === estado);

  // Transiciones desde la fuente única de verdad (backend), con respaldo local.
  const transicionesDisponibles = (estado) => transicionesDesde(estado);

  const HISTORIAL_COLORS = {
    BORRADOR: 'var(--color-text-muted)',
    EN_REVISION: 'var(--color-warning)',
    APROBADO: 'var(--color-success)',
    RECHAZADO: 'var(--color-danger)',
  };

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Gestor de Aprobaciones</h2>
          <p className="text-muted text-sm mt-1">Flujo de revisión y aprobación de documentos SGC</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filtro */}
          <div style={{ display: 'flex', gap: '0.35rem', background: 'var(--color-surface-2)', padding: '0.3rem', borderRadius: 'var(--radius-sm)' }}>
            {['todos', 'AC', 'PM'].map(f => (
              <button key={f} onClick={() => setFiltro(f)}
                style={{ padding: '0.3rem 0.85rem', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', fontFamily: 'inherit', background: filtro === f ? 'var(--color-primary)' : 'transparent', color: filtro === f ? '#fff' : 'var(--color-text-muted)', transition: 'all 0.2s' }}>
                {f === 'todos' ? 'Todos' : f}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" onClick={fetchAll}>🔄 Actualizar</button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--color-text-muted)' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p>Cargando documentos...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {COLUMNAS.map(estado => {
            const items = getColumn(estado);
            return (
              <div key={estado} className="kanban-col">
                <div className="flex justify-between items-center mb-3">
                  <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>{metaEstado(estado).label}</p>
                  <span style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '999px', padding: '0.1rem 0.6rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    {items.length}
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="empty-state" style={{ padding: '1.5rem 0.5rem' }}>
                    <p className="text-xs text-faint">Sin documentos</p>
                  </div>
                ) : items.map(item => (
                  <div key={`${item._tipo}-${item.id}`}
                    className={`kanban-card ${selected?.item.id === item.id && selected?.tipo === item._tipo ? 'selected' : ''}`}
                    onClick={() => openModal(item, item._tipo)}>
                    <div className="flex justify-between items-start mb-1">
                      <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{item._folio}</span>
                      <span className={`badge badge-${item._tipo === 'AC' ? 'ac' : 'pm'}`}>{item._tipo}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', lineHeight: 1.4 }}
                      className="truncate" title={item._titulo}>
                      {item._tipo === 'AC' ? item.proceso : item.titulo_mejora}
                    </p>
                    <p className="text-xs text-muted truncate">{item._area}</p>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge badge-${selected.tipo === 'AC' ? 'ac' : 'pm'}`}>{selected.tipo}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{selected.item._folio}</span>
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, lineHeight: 1.3 }}>
                  {selected.tipo === 'AC' ? selected.item.proceso : selected.item.titulo_mejora}
                </h3>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-body space-y-4">
              {/* Info grid */}
              <div className="grid-2">
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                    {selected.tipo === 'AC' ? 'Área' : 'Gerencia'}
                  </p>
                  <p style={{ fontSize: '0.875rem' }}>{selected.item._area}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Estado actual</p>
                  <span className="badge">
                    {metaEstado(selected.item.estado).label}
                  </span>
                </div>
                {selected.tipo === 'AC' && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Descripción NC</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{selected.item.descripcion_no_conformidad}</p>
                  </div>
                )}
                {selected.tipo === 'PM' && (
                  <>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Situación actual</p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{selected.item.descripcion_situacion_actual}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Categoría</p>
                      <p style={{ fontSize: '0.875rem' }}>{selected.item.categoria_mejora}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Responsable</p>
                      <p style={{ fontSize: '0.875rem' }}>{selected.item.responsable}</p>
                    </div>
                  </>
                )}
                {selected.item.comentarios_revision && (
                  <div style={{ gridColumn: '1 / -1', background: 'var(--color-bg-2)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', border: '1px solid var(--color-border)' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>Último comentario</p>
                    <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--color-text-muted)' }}>"{selected.item.comentarios_revision}"</p>
                  </div>
                )}
              </div>

              {/* Historial */}
              {historial.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>
                    Historial de estados
                  </p>
                  {historial.map((h, i) => (
                    <div key={i} className="timeline-item">
                      <div className="timeline-dot" style={{ background: HISTORIAL_COLORS[h.estado_nuevo] || 'var(--color-primary)' }} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{h.estado_anterior}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-faint)' }}>→</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: HISTORIAL_COLORS[h.estado_nuevo] }}>{h.estado_nuevo}</span>
                        </div>
                        {h.comentario && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>{h.comentario}</p>}
                        <p style={{ fontSize: '0.65rem', color: 'var(--color-text-faint)', marginTop: '0.2rem' }}>
                          {new Date(h.fecha).toLocaleString('es-MX')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Comentarios para acción */}
              {transicionesDisponibles(selected.item.estado).length > 0 && (
                <div>
                  <label className="form-label">Comentarios de revisión
                    {transicionesDisponibles(selected.item.estado).includes('RECHAZADO') &&
                      <span style={{ color: 'var(--color-text-faint)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}> (obligatorio para rechazar)</span>}
                  </label>
                  <textarea className="form-textarea" value={comentarios}
                    onChange={e => setComentarios(e.target.value)} rows="3"
                    placeholder="Escribe tus observaciones para el autor del documento..." />
                </div>
              )}
            </div>

            <div className="modal-footer">
              {/* Exportar Word */}
              <button className="btn btn-ghost btn-sm" onClick={exportarWord} disabled={exportLoading}
                style={{ marginRight: 'auto' }}>
                {exportLoading
                  ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Generando...</>
                  : '📄 Exportar Word'}
              </button>

              {/* Transiciones disponibles */}
              {transicionesDisponibles(selected.item.estado).map(estado => (
                <button key={estado}
                  disabled={actionLoading || (estado === 'RECHAZADO' && !comentarios.trim())}
                  onClick={() => actualizarEstado(estado)}
                  className={`btn ${
                    estado === 'APROBADO' ? 'btn-success' :
                    estado === 'RECHAZADO' ? 'btn-danger' :
                    estado === 'EN_REVISION' ? 'btn-warning' :
                    'btn-ghost'
                  }`}>
                  {actionLoading ? <span className="spinner" /> : null}
                  {estado === 'APROBADO' ? '✅ Aprobar' :
                   estado === 'RECHAZADO' ? '❌ Rechazar' :
                   estado === 'EN_REVISION' ? '🔍 Pasar a Revisión' :
                   `→ ${estado}`}
                </button>
              ))}

              {transicionesDisponibles(selected.item.estado).length === 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  {selected.item.estado === 'APROBADO' ? '✅ Plan aprobado — Exporta el documento final' : 'Sin transiciones disponibles'}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestorAprobaciones;
