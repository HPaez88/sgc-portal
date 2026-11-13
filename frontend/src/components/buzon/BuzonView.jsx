// Buzón SGC (administradores): respuestas de los usuarios a los correos del portal.
// La IA clasifica y propone; un administrador revisa, edita y envía, o descarta.
import React, { useEffect, useState } from 'react';
import { Inbox, RefreshCw, Send, Archive, Sparkles, AlertTriangle, CheckCircle2, UserX } from 'lucide-react';
import { api } from '../../services/apiClient';
import { useToast } from '../common/Toast';
import { formatearFecha } from '../../constants/workflow';
import AvisosAutomaticos from './AvisosAutomaticos';

const FILTROS = [['PENDIENTE', 'Pendientes'], ['RESPONDIDO', 'Respondidos'], ['DESCARTADO', 'Descartados'], ['', 'Todos']];
const CLASES = {
  PUEDE_AYUDAR: ['La IA propone respuesta', 'bg-emerald-50 text-emerald-800 border-emerald-200', Sparkles],
  REQUIERE_ADMIN: ['Requiere intervención', 'bg-rose-50 text-rose-800 border-rose-200', AlertTriangle],
  DESCONOCIDO: ['Remitente desconocido', 'bg-amber-50 text-amber-900 border-amber-200', UserX],
  AUTOMATICO: ['Respuesta automática', 'bg-slate-100 text-slate-700 border-slate-200', Archive],
};
const hora = (iso) => (iso ? `${formatearFecha(iso)} ${new Date(`${iso}Z`).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}` : '');

function Etiqueta({ clasificacion }) {
  const [texto, cls, Icono] = CLASES[clasificacion] || CLASES.REQUIERE_ADMIN;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border whitespace-nowrap ${cls}`}><Icono size={12} aria-hidden="true" />{texto}</span>;
}

export default function BuzonView() {
  const toast = useToast();
  const [filtro, setFiltro] = useState('PENDIENTE');
  const [datos, setDatos] = useState(null);
  const [abierto, setAbierto] = useState(null);
  const [borrador, setBorrador] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cargar = async () => {
    const r = await api.get(`/api/v1/buzon${filtro ? `?estado=${filtro}` : ''}`);
    if (!r.ok) return toast.error(r.error?.message || r.error?.detail || 'No se pudo cargar el buzón.');
    setDatos(r.data);
  };
  useEffect(() => { cargar(); }, [filtro]); // eslint-disable-line react-hooks/exhaustive-deps

  const abrir = (m) => { setAbierto(m); setBorrador(m.respuesta_propuesta || ''); };
  const accion = async (tipo) => {
    setEnviando(true);
    const r = tipo === 'responder'
      ? await api.post(`/api/v1/buzon/${abierto.id}/responder`, { texto: borrador.trim() })
      : await api.post(`/api/v1/buzon/${abierto.id}/descartar`);
    setEnviando(false);
    if (!r.ok) return toast.error(r.error?.message || r.error?.detail || 'No se pudo completar.');
    toast.success(tipo === 'responder' ? `Respuesta enviada a ${abierto.de}` : 'Mensaje archivado.');
    setAbierto(null);
    cargar();
  };

  const mensajes = datos?.mensajes || [];
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2"><Inbox size={22} className="text-marca-azul-oscuro" /> Buzón SGC</h2>
          <p className="text-sm text-slate-600">Respuestas de los usuarios a los correos del portal. La IA clasifica y propone; el SGC decide.</p>
        </div>
        <button type="button" onClick={cargar} className="px-3 py-2 text-xs font-bold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5"><RefreshCw size={14} /> Actualizar</button>
      </header>

      {datos && !datos.activo && (
        <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">El buzón aún no recibe correos: falta activar la recepción en Resend y la firma del aviso en el servidor.</p>
      )}
      {datos?.activo && (
        <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          Buzón: <strong>{datos.correo || 'sin correo'}</strong> · Modo: <strong>{datos.modo === 'automatico' ? 'automático (la IA responde lo simple)' : 'con aprobación (la IA solo propone)'}</strong>
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {FILTROS.map(([id, texto]) => (
          <button key={texto} type="button" aria-pressed={filtro === id} onClick={() => setFiltro(id)}
            className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${filtro === id ? 'bg-marca-azul-oscuro text-white border-marca-azul-oscuro' : 'bg-white text-slate-700 border-slate-200 hover:border-marca-azul'}`}>{texto}</button>
        ))}
      </div>

      {abierto && (
        <section className="bg-white rounded-xl border-2 border-marca-azul-oscuro/30 p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">{abierto.asunto || '(sin asunto)'}</h3>
              <p className="text-xs text-slate-600">{abierto.de_nombre ? `${abierto.de_nombre} · ` : ''}{abierto.de} · {hora(abierto.recibido)}</p>
            </div>
            <div className="flex items-center gap-2"><Etiqueta clasificacion={abierto.clasificacion} /><button type="button" onClick={() => setAbierto(null)} className="text-xs text-slate-600 hover:underline">Cerrar</button></div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 whitespace-pre-wrap">{abierto.texto || '(sin texto)'}</div>
          {(abierto.resumen || abierto.motivo_escalar) && (
            <p className="text-xs text-slate-700"><strong>IA:</strong> {abierto.resumen}{abierto.motivo_escalar ? ` — ${abierto.motivo_escalar}` : ''}</p>
          )}
          {abierto.estado === 'PENDIENTE' ? (
            <>
              <label className="block">
                <span className="block text-xs font-bold text-slate-800 mb-1">{abierto.respuesta_propuesta ? 'Respuesta propuesta por la IA (revísala y edítala)' : 'Tu respuesta'}</span>
                <textarea rows={6} value={borrador} onChange={(e) => setBorrador(e.target.value)} className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-marca-azul/25 focus:border-marca-azul outline-none" />
              </label>
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" disabled={enviando} onClick={() => accion('descartar')} className="px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 inline-flex items-center gap-1.5"><Archive size={14} /> Archivar sin responder</button>
                <button type="button" disabled={enviando || borrador.trim().length < 5} onClick={() => accion('responder')} className="px-4 py-2 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-1.5"><Send size={14} /> {enviando ? 'Enviando…' : 'Enviar respuesta'}</button>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-700 flex items-start gap-1.5"><CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
              {abierto.estado === 'RESPONDIDO' ? `Respondido por ${abierto.respondido_por} el ${hora(abierto.respondido_en)}:` : `Archivado por ${abierto.respondido_por || 'el sistema'}.`}
              {abierto.respuesta_enviada && <span className="block whitespace-pre-wrap text-slate-900 mt-1">{abierto.respuesta_enviada}</span>}
            </p>
          )}
        </section>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-xs">
          <caption className="sr-only">Mensajes del buzón</caption>
          <thead className="bg-slate-50 text-slate-700 text-left border-b border-slate-200">
            <tr><th scope="col" className="p-3">Recibido</th><th scope="col" className="p-3">De</th><th scope="col" className="p-3">Asunto y resumen</th><th scope="col" className="p-3">Clasificación</th><th scope="col" className="p-3 text-right">Acción</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {datos && mensajes.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No hay mensajes {filtro ? 'con este filtro' : ''}.</td></tr>}
            {mensajes.map((m) => (
              <tr key={m.id} className={abierto?.id === m.id ? 'bg-sky-50/60' : ''}>
                <td className="p-3 whitespace-nowrap text-slate-700">{hora(m.recibido)}</td>
                <td className="p-3"><span className="font-semibold text-slate-900">{m.de_nombre || '—'}</span><span className="block text-[11px] text-slate-500">{m.de}</span></td>
                <td className="p-3 max-w-md"><span className="font-semibold text-slate-900">{m.asunto || '(sin asunto)'}</span><span className="block text-slate-600">{m.resumen}</span></td>
                <td className="p-3"><Etiqueta clasificacion={m.clasificacion} /></td>
                <td className="p-3 text-right"><button type="button" onClick={() => abrir(m)} className="px-2.5 py-1 rounded-md font-bold text-marca-azul-oscuro bg-sky-50 hover:bg-sky-100">{m.estado === 'PENDIENTE' ? 'Atender' : 'Ver'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AvisosAutomaticos />
    </div>
  );
}
