// Solicitud de cambio de una AC o PM ya aprobada: el área propone agregar, corregir o quitar una actividad
// y el SGC la aprueba o rechaza en la bandeja de Aprobaciones (el servidor no deja que el área la aplique sola).
import React, { useState } from 'react';
import { GitPullRequestArrow } from 'lucide-react';
import { useSGC } from '../../SGCContext';
import ModalBase from './ModalBase';
import ActividadesPlan from './ActividadesPlan';
import { CAMPO_LISTA, CAMPO_TEXTO, Leyenda, Seccion, opcion } from './estilosCampos';
import { leerActividades, normalizarEstado, formatearFecha } from '../../constants/workflow';
import { puedeCapturarArea } from '../../constants/riesgos';
import { TIPOS_CAMBIO, leerSolicitudes, nuevaSolicitud } from '../../constants/solicitudesCambio';

const VIGENTES = ['APROBADO', 'EN_SEGUIMIENTO', 'SOLICITUD_CIERRE', 'REVISION_AUDITOR'];
const ESTILO_ESTADO = {
  PENDIENTE: 'bg-amber-50 text-amber-900 border-amber-300',
  APROBADA: 'bg-emerald-50 text-emerald-900 border-emerald-300',
  RECHAZADA: 'bg-rose-50 text-rose-900 border-rose-300',
};
const vacia = () => ({ id: 'propuesta', actividad: '', responsable: '', fecha_termino_sugerida: '', evidencia_esperada: '', indicador: '' });

export default function SolicitudCambio({ registro, guardar, conIndicador = false }) {
  const { usuarioLogueado, areasDetalle = [], registrarMovimiento } = useSGC();
  const [abierto, setAbierto] = useState(false);
  const [tipo, setTipo] = useState('AGREGAR');
  const [indice, setIndice] = useState('');
  const [propuesta, setPropuesta] = useState([vacia()]);
  const [justificacion, setJustificacion] = useState('');
  const [error, setError] = useState('');

  if (!registro) return null;
  const esSGC = ['Super Admin', 'Admin'].includes(usuarioLogueado?.rol);
  const vigente = VIGENTES.includes(normalizarEstado(registro.estado));
  const area = registro.area || registro.gerencia_coordinacion || '';
  const puedePedir = vigente && !esSGC && puedeCapturarArea(usuarioLogueado, area, areasDetalle);
  const solicitudes = leerSolicitudes(registro);
  const actividades = leerActividades(registro);
  if (!puedePedir && solicitudes.length === 0) return null;

  const elegirTipo = (t) => { setTipo(t); setIndice(''); setPropuesta([vacia()]); setError(''); };
  const elegirActividad = (v) => {
    setIndice(v);
    setPropuesta([v === '' ? vacia() : { ...vacia(), ...actividades[Number(v)], id: 'propuesta' }]);
    setError('');
  };
  const cerrar = () => { setAbierto(false); elegirTipo('AGREGAR'); setJustificacion(''); };

  const enviar = async () => {
    const { id: _ignorado, ...datos } = propuesta[0];
    const { registro: nuevo, error: e } = nuevaSolicitud(registro, {
      tipo, indice: indice === '' ? null : Number(indice), propuesta: datos, justificacion,
    }, { nombre: usuarioLogueado?.nombre, email: usuarioLogueado?.email });
    if (e) { setError(e); return; }
    await guardar({ solicitudes_cambio: nuevo.solicitudes_cambio });
    registrarMovimiento?.({
      modulo: conIndicador ? 'PLANES_MEJORA' : 'ACCIONES_CORRECTIVAS', accion: 'SOLICITUD_CAMBIO',
      descripcion: `Solicitud de cambio (${TIPOS_CAMBIO[tipo]}) en ${registro.folio_codigo || registro.folio || 'registro'}`,
      detalles: `Justificación: ${justificacion.trim()}`, folio: registro.folio_codigo || '',
    });
    cerrar();
  };

  return (
    <section className="rounded-xl border-2 border-sky-200 bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2"><GitPullRequestArrow size={16} className="text-sky-700" /> Solicitudes de cambio</h3>
          <p className="text-xs text-slate-600">Para agregar, corregir o quitar una actividad de un registro aprobado. Lo aprueba el SGC en la bandeja de Aprobaciones.</p>
        </div>
        {puedePedir && (
          <button type="button" onClick={() => setAbierto(true)} className="px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold">
            Solicitar cambio
          </button>
        )}
      </div>

      {solicitudes.length > 0 && (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
          {[...solicitudes].reverse().map((s) => (
            <li key={s.id} className="p-3 text-sm space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${ESTILO_ESTADO[s.estado] || ''}`}>{s.estado}</span>
                <strong className="text-slate-900">{TIPOS_CAMBIO[s.tipo] || s.tipo}</strong>
                <span className="text-xs text-slate-600">· {s.solicitante} · {formatearFecha(s.fecha_solicitud)}</span>
              </div>
              {s.actividad_actual && <p className="text-slate-700">Actividad: {s.actividad_actual}</p>}
              {s.propuesta?.actividad && s.tipo !== 'QUITAR' && <p className="text-slate-700">Propuesta: {s.propuesta.actividad} · {s.propuesta.responsable} · {formatearFecha(s.propuesta.fecha_termino_sugerida)}</p>}
              <p className="text-slate-600">Justificación: {s.justificacion}</p>
              {s.estado === 'RECHAZADA' && s.motivo_rechazo && <p className="text-rose-800">Motivo del rechazo: {s.motivo_rechazo}</p>}
            </li>
          ))}
        </ul>
      )}

      {abierto && (
        <ModalBase isOpen onClose={cerrar} size="3xl" closeOnBackdrop={false} titulo="Solicitar cambio"
          subtitulo={registro.folio_codigo || ''} bodyClassName="p-4 sm:p-6 bg-slate-50 space-y-4"
          footer={(
            <div className="flex justify-end gap-2">
              <button type="button" onClick={cerrar} className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button type="button" onClick={enviar} className="px-5 py-2 text-sm font-bold bg-sky-700 hover:bg-sky-800 text-white rounded-lg">Enviar al SGC</button>
            </div>
          )}>
          <Leyenda />
          <Seccion n={1} titulo="Qué quieres cambiar">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de cambio">
              {Object.entries(TIPOS_CAMBIO).map(([k, t]) => (
                <button key={k} type="button" aria-pressed={tipo === k} onClick={() => elegirTipo(k)} className={opcion(tipo === k)}>{t}</button>
              ))}
            </div>
            {tipo !== 'AGREGAR' && (
              <label className="block">
                <span className="block text-xs font-bold text-slate-800 mb-1">Actividad</span>
                <select value={indice} onChange={(e) => elegirActividad(e.target.value)} className={CAMPO_LISTA}>
                  <option value="">Elige la actividad…</option>
                  {actividades.map((a, i) => (
                    <option key={a.id || i} value={i} disabled={tipo === 'QUITAR' && !!a.evidencia_real}>
                      {i + 1}. {a.actividad || 'Sin descripción'}{tipo === 'QUITAR' && a.evidencia_real ? ' (tiene evidencia)' : ''}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </Seccion>
          {tipo !== 'QUITAR' && (tipo === 'AGREGAR' || indice !== '') && (
            <Seccion n={2} titulo={tipo === 'AGREGAR' ? 'Actividad nueva' : 'Cómo debe quedar la actividad'} color="bg-sky-800">
              <ActividadesPlan actividades={propuesta} setActividades={setPropuesta} conIndicador={conIndicador} />
            </Seccion>
          )}
          <Seccion n={tipo === 'QUITAR' ? 2 : 3} titulo="Justificación" ayuda="Por qué se necesita el cambio; el SGC la revisa antes de aprobar." color="bg-amber-700">
            <textarea rows={3} value={justificacion} onChange={(e) => { setJustificacion(e.target.value); setError(''); }}
              aria-label="Justificación del cambio" placeholder="Ej. Se detectó que falta capacitar al personal antes de cerrar la acción…" className={CAMPO_TEXTO} />
          </Seccion>
          {error && <p role="alert" className="text-sm font-semibold text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
        </ModalBase>
      )}
    </section>
  );
}
