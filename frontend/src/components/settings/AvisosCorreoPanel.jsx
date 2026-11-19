// Avisos por correo: qué temas recibe cada administrador y a quién le llegan los recordatorios de las áreas.
// Se guarda en "sgc-config-avisos-admin" ({correo: {tema: bool}}); lo leen la tarea diaria y el buzón en el servidor.
import React from 'react';
import { useLocalStorage } from '../../hooks';
import { Seccion } from '../common/estilosCampos';

const TEMAS = [
  { id: 'resumen', titulo: 'Resumen diario de avisos', detalle: 'Lista de lo que se envió (o se habría enviado) cada día hábil a las 8:00 a.m.' },
  { id: 'incumplimiento', titulo: 'Copia de avisos de incumplimiento', detalle: 'Cuando una AC, PM o entrega de indicadores ya venció.' },
  { id: 'renovacion', titulo: 'Copia de confirmación del proyecto anual', detalle: 'Octubre a diciembre: áreas que no han confirmado el proyecto del año siguiente.' },
  { id: 'buzon', titulo: 'Mensajes nuevos del Buzón SGC', detalle: 'Cada mensaje que llega al buzón y requiere atención.' },
];

export default function AvisosCorreoPanel({ usuarios = [] }) {
  const [prefs, setPrefs] = useLocalStorage('sgc-config-avisos-admin', {});
  const admins = usuarios.filter((u) => u.activo !== false && ['Super Admin', 'Admin'].includes(u.rol) && u.email);
  const recibe = (correo, tema) => (prefs?.[correo.toLowerCase()] || {})[tema] !== false;
  const cambiar = (correo, tema, valor) => {
    const clave = correo.toLowerCase();
    setPrefs((prev) => ({ ...(prev || {}), [clave]: { ...((prev || {})[clave] || {}), [tema]: valor } }));
  };

  return (
    <div className="space-y-5">
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
                        onChange={(e) => cambiar(u.email, t.id, e.target.checked)} aria-label={`${t.titulo} para ${u.nombre}`} />
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

      <Seccion n={2} titulo="A quién le llegan los recordatorios de las áreas" ayuda="Recordatorios de AC y PM (15, 10 y 5 días, día de vencimiento e incumplimiento) e indicadores." color="bg-sky-800">
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
    </div>
  );
}
