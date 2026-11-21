// Avisos por correo (solo Super Admin y la cuenta autorizada): qué temas recibe cada administrador, a quién llegan
// los recordatorios y los plazos del calendario de avisos. Lo leen la tarea diaria y el buzón en el servidor:
//   sgc-config-avisos-admin      {correo: {tema: bool}}
//   sgc-config-avisos-parametros {registros, indicadores, feriados}  (ver backend/services/avisos_calendario.py)
import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useLocalStorage } from '../../hooks';
import CampoFecha from '../common/CampoFecha';
import { CAMPO_LISTA, CAMPO_TEXTO, Seccion, Sub } from '../common/estilosCampos';
import { formatearFecha } from '../../constants/workflow';

const TEMAS = [
  { id: 'resumen', titulo: 'Resumen diario de avisos', detalle: 'Lista de lo que se envió cada día hábil a las 8:00 a.m.' },
  { id: 'incumplimiento', titulo: 'Copia de avisos de incumplimiento', detalle: 'Cuando una AC, PM o entrega de indicadores ya venció.' },
  { id: 'renovacion', titulo: 'Copia de confirmación del proyecto anual', detalle: 'Octubre a diciembre: áreas que no han confirmado el proyecto del año siguiente.' },
  { id: 'buzon', titulo: 'Mensajes nuevos del Buzón SGC', detalle: 'Cada mensaje que llega al buzón y requiere atención.' },
];

// Mismos valores base que el servidor (avisos_calendario.BASE); se usan mientras no se guarde otro valor.
const BASE = {
  registros: { recordatorios_antes: [15, 10, 5], vence_hoy: true, dias_aviso_despues: 1, dias_oficio_despues_aviso: 5 },
  indicadores: { AVISO: 1, RECORDATORIO: 5, ULTIMO_RECORDATORIO: 10, AVISO_INCUMPLIMIENTO: 11, OFICIO_EXHORTO: 16, recordatorios_extra: [] },
  matrices: { anio: null, fecha_limite: '', recordatorios_antes: [15, 5] },
  feriados: [],
};
const DIAS_IND = [
  ['AVISO', 'Aviso de apertura', 'Ya pueden capturar los resultados del mes anterior.'],
  ['RECORDATORIO', 'Recordatorio', 'A quien no ha entregado.'],
  ['ULTIMO_RECORDATORIO', 'Fecha límite (último recordatorio)', 'Si cae en día inhábil, se adelanta al hábil anterior.'],
  ['AVISO_INCUMPLIMIENTO', 'Aviso de incumplimiento', 'Con copia a los administradores que lo tengan activado.'],
  ['OFICIO_EXHORTO', 'Oficio de exhorto', 'Queda registrado para imprimir; lo firma Dirección General.'],
];

const entero = (v, min, max) => { const n = Number.parseInt(v, 10); return Number.isInteger(n) && n >= min && n <= max ? n : null; };

function Numero({ etiqueta, ayuda, valor, min, max, onCambiar, sufijo }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-slate-800 mb-1">{etiqueta}</span>
      <span className="flex items-center gap-2">
        <input type="number" min={min} max={max} value={valor} onChange={(e) => { const n = entero(e.target.value, min, max); if (n) onCambiar(n); }}
          className={`${CAMPO_TEXTO} w-24 text-right tabular-nums`} />
        {sufijo && <span className="text-sm text-slate-700">{sufijo}</span>}
      </span>
      {ayuda && <span className="block text-xs text-slate-500 mt-1">{ayuda}</span>}
    </label>
  );
}

// Lista de números que se pueden agregar o quitar (días antes de vencer, días extra del mes).
function ListaDias({ valores, min, max, texto, onCambiar, etiquetaAgregar }) {
  const [nuevo, setNuevo] = useState('');
  const agregar = () => {
    const n = entero(nuevo, min, max);
    if (!n || valores.includes(n)) return;
    onCambiar([...valores, n]);
    setNuevo('');
  };
  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-2">
        {valores.length === 0 && <li className="text-sm text-slate-500">Ninguno.</li>}
        {valores.map((n) => (
          <li key={n} className="inline-flex items-center gap-1 rounded-full border-2 border-sky-300 bg-sky-50 pl-3 pr-1 py-1 text-sm font-bold text-sky-950">
            {texto(n)}
            <button type="button" onClick={() => onCambiar(valores.filter((x) => x !== n))} aria-label={`Quitar ${texto(n)}`}
              className="p-1 rounded-full hover:bg-sky-200"><X size={14} /></button>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <input type="number" min={min} max={max} value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder={`${min}–${max}`}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } }} aria-label={etiquetaAgregar}
          className={`${CAMPO_TEXTO} w-24 text-right tabular-nums`} />
        <button type="button" onClick={agregar} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white text-sm font-bold">
          <Plus size={14} /> {etiquetaAgregar}
        </button>
      </div>
    </div>
  );
}

export default function AvisosCorreoPanel({ usuarios = [] }) {
  const [prefs, setPrefs] = useLocalStorage('sgc-config-avisos-admin', {});
  const [guardados, setGuardados] = useLocalStorage('sgc-config-avisos-parametros', {});
  const [feriado, setFeriado] = useState('');

  const admins = usuarios.filter((u) => u.activo !== false && ['Super Admin', 'Admin'].includes(u.rol) && u.email);
  const recibe = (correo, tema) => (prefs?.[correo.toLowerCase()] || {})[tema] !== false;
  const cambiarTema = (correo, tema, valor) => {
    const clave = correo.toLowerCase();
    setPrefs((prev) => ({ ...(prev || {}), [clave]: { ...((prev || {})[clave] || {}), [tema]: valor } }));
  };

  const g = guardados && typeof guardados === 'object' ? guardados : {};
  const reg = { ...BASE.registros, ...(g.registros || {}) };
  const ind = { ...BASE.indicadores, ...(g.indicadores || {}) };
  const feriados = [...new Set(g.feriados || [])].sort();
  const cambiar = (seccion, campo, valor) => setGuardados((prev) => {
    const p = prev && typeof prev === 'object' ? prev : {};
    return { ...p, [seccion]: { ...(p[seccion] || {}), [campo]: valor } };
  });
  const cambiarFeriados = (lista) => setGuardados((prev) => ({ ...(prev || {}), feriados: [...new Set(lista)].sort() }));
  const antes = [...(reg.recordatorios_antes || [])].sort((a, b) => b - a);
  const extra = [...(ind.recordatorios_extra || [])].sort((a, b) => a - b);
  const mat = { ...BASE.matrices, ...(g.matrices || {}) };
  const anioMatriz = mat.anio || new Date().getFullYear() + 1;
  const antesMatriz = [...(mat.recordatorios_antes || [])].sort((a, b) => b - a);

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-4 py-3">
        Esta configuración solo la ven y la cambian el Super Admin y la cuenta autorizada. Los cambios se guardan al momento y se aplican desde el siguiente envío (días hábiles a las 8:00 a.m.).
      </p>

      <Seccion n={1} titulo="Qué le llega a cada administrador" ayuda="Marca solo los temas que cada quien necesita. Lo que no se marque deja de llegarle por correo (sigue visible en el portal).">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Temas de correo por administrador</caption>
            <thead>
              <tr>
                <th scope="col" className="p-2 text-left">Administrador</th>
                {TEMAS.map((t) => <th key={t.id} scope="col" className="p-2 text-center" title={t.detalle}>{t.titulo}</th>)}
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 && <tr><td colSpan={TEMAS.length + 1} className="p-4 text-center text-slate-500">No hay administradores activos.</td></tr>}
              {admins.map((u) => (
                <tr key={u.email}>
                  <td className="p-2"><span className="font-bold text-slate-900">{u.nombre}</span><span className="block text-xs text-slate-600">{u.email} · {u.rol}</span></td>
                  {TEMAS.map((t) => (
                    <td key={t.id} className="p-2 text-center">
                      <input type="checkbox" className="w-5 h-5 accent-sky-700 cursor-pointer" checked={recibe(u.email, t.id)}
                        onChange={(e) => cambiarTema(u.email, t.id, e.target.checked)} aria-label={`${t.titulo} para ${u.nombre}`} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="grid gap-1 sm:grid-cols-2 text-xs text-slate-600">
          {TEMAS.map((t) => <li key={t.id}><strong className="text-slate-800">{t.titulo}:</strong> {t.detalle}</li>)}
        </ul>
      </Seccion>

      <Seccion n={2} titulo="A quién le llegan los recordatorios de las áreas" ayuda="Aplica a acciones correctivas, planes de mejora e indicadores." color="bg-sky-800">
        <ul className="space-y-2 text-sm text-slate-800 list-disc pl-5">
          <li><strong>Responsable del área:</strong> el “Correo para avisos SGC” del área, en la pestaña <em>Catálogo de Áreas</em>.</li>
          <li><strong>Quien le ayuda:</strong> los “Encargados del SGC” de esa misma área, en <em>Catálogo de Áreas</em>.</li>
          <li><strong>Equipo de trabajo:</strong> los integrantes registrados en la AC o el PM, si están dados de alta en <em>Usuarios del Sistema</em> (se buscan por nombre).</li>
          <li><strong>Auditor de cierre:</strong> recibe un aviso cuando se le asigna la verificación de eficacia.</li>
        </ul>
        <p className="text-sm text-amber-950 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2">
          Por seguridad solo se envía a correos de personas dadas de alta en Usuarios del Sistema o registradas en el catálogo de áreas.
          Si un correo está mal escrito en un registro, no se usa; corrige el correo en el catálogo o en Usuarios.
        </p>
      </Seccion>

      <Seccion n={3} titulo="Plazos de acciones correctivas y planes de mejora" ayuda="Se cuentan desde la fecha final de seguimiento de cada AC o PM en seguimiento (sin auditor asignado)." color="bg-amber-700">
        <Sub titulo="Recordatorios antes de vencer" ayuda="Si el día cae en fin de semana o feriado, el recordatorio se adelanta al día hábil anterior." />
        <ListaDias valores={antes} min={1} max={90} texto={(n) => `${n} días antes`} etiquetaAgregar="Agregar recordatorio"
          onCambiar={(l) => cambiar('registros', 'recordatorios_antes', l)} />
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <input type="checkbox" className="w-5 h-5 accent-sky-700" checked={reg.vence_hoy !== false} onChange={(e) => cambiar('registros', 'vence_hoy', e.target.checked)} />
          Avisar también el mismo día que vence
        </label>
        <Sub titulo="Después de vencer" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Numero etiqueta="Aviso de incumplimiento" valor={reg.dias_aviso_despues} min={1} max={30} sufijo="día(s) después de vencer"
            ayuda="Advierte que Dirección General emitirá oficio de exhorto." onCambiar={(n) => cambiar('registros', 'dias_aviso_despues', n)} />
          <Numero etiqueta="Oficio de exhorto" valor={reg.dias_oficio_despues_aviso} min={1} max={60} sufijo="día(s) después del aviso"
            ayuda="Queda registrado para imprimir; lo firma Dirección General." onCambiar={(n) => cambiar('registros', 'dias_oficio_despues_aviso', n)} />
        </div>
      </Seccion>

      <Seccion n={4} titulo="Plazos de entrega de indicadores" ayuda="Día del mes en que sale cada aviso; en el mes se pide el resultado del mes anterior. Día inhábil: pasa al siguiente hábil." color="bg-emerald-700">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DIAS_IND.map(([k, t, a]) => (
            <Numero key={k} etiqueta={t} ayuda={a} valor={ind[k]} min={1} max={28} sufijo="del mes" onCambiar={(n) => cambiar('indicadores', k, n)} />
          ))}
        </div>
        <Sub titulo="Recordatorios adicionales" ayuda="Otros días del mes para recordar a quien no ha entregado." />
        <ListaDias valores={extra} min={1} max={28} texto={(n) => `Día ${n}`} etiquetaAgregar="Agregar día"
          onCambiar={(l) => cambiar('indicadores', 'recordatorios_extra', l)} />
      </Seccion>

      <Seccion n={5} titulo="Entrega de la matriz de riesgos y oportunidades" ayuda="Avisa a las unidades que aún no envían su matriz OOMRSC-37 del año siguiente. Sin fecha límite no se envía nada." color="bg-rose-800">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="block text-xs font-bold text-slate-800 mb-1">Matriz del año</span>
            <select value={anioMatriz} onChange={(e) => cambiar('matrices', 'anio', Number(e.target.value))} className={CAMPO_LISTA}>
              {[0, 1, 2].map((n) => new Date().getFullYear() + n).map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-bold text-slate-800 mb-1">Fecha límite de entrega</span>
            <CampoFecha value={mat.fecha_limite || ''} onChange={(e) => setGuardados((prev) => {
              const p = prev && typeof prev === 'object' ? prev : {};
              return { ...p, matrices: { ...BASE.matrices, ...(p.matrices || {}), anio: anioMatriz, fecha_limite: e.target.value } };
            })} className={CAMPO_TEXTO} />
            <span className="block text-xs text-slate-500 mt-1">{mat.fecha_limite ? `Se avisa ${antesMatriz.map((n) => `${n}`).join(', ')} días antes, el día límite y al día siguiente si no la enviaron.` : 'Sin fecha: no hay avisos de matriz.'}</span>
          </label>
        </div>
        <Sub titulo="Recordatorios antes de la fecha límite" />
        <ListaDias valores={antesMatriz} min={1} max={60} texto={(n) => `${n} días antes`} etiquetaAgregar="Agregar recordatorio"
          onCambiar={(l) => cambiar('matrices', 'recordatorios_antes', l)} />
        {mat.fecha_limite && (
          <button type="button" onClick={() => cambiar('matrices', 'fecha_limite', '')}
            className="text-sm font-semibold text-rose-800 underline">Quitar la fecha límite (detener estos avisos)</button>
        )}
      </Seccion>

      <Seccion n={6} titulo="Días feriados" ayuda="En estos días no sale ningún correo y los plazos se recorren al día hábil." color="bg-indigo-700">
        <ul className="flex flex-wrap gap-2">
          {feriados.length === 0 && <li className="text-sm text-slate-500">No hay feriados capturados.</li>}
          {feriados.map((f) => (
            <li key={f} className="inline-flex items-center gap-1 rounded-full border-2 border-indigo-300 bg-indigo-50 pl-3 pr-1 py-1 text-sm font-bold text-indigo-950">
              {formatearFecha(f)}
              <button type="button" onClick={() => cambiarFeriados(feriados.filter((x) => x !== f))} aria-label={`Quitar feriado ${formatearFecha(f)}`}
                className="p-1 rounded-full hover:bg-indigo-200"><X size={14} /></button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end gap-2">
          <label className="block">
            <span className="block text-xs font-bold text-slate-800 mb-1">Fecha</span>
            <CampoFecha value={feriado} onChange={(e) => setFeriado(e.target.value)} className={CAMPO_TEXTO} />
          </label>
          <button type="button" disabled={!feriado} onClick={() => { cambiarFeriados([...feriados, feriado]); setFeriado(''); }}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white text-sm font-bold">
            <Plus size={14} /> Agregar feriado
          </button>
        </div>
      </Seccion>
    </div>
  );
}
