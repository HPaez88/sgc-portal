// Recuperación autónoma de contraseña desde el inicio de sesión:
// 1) "solicitar": el usuario escribe su correo y recibe un enlace de un solo uso (30 min).
// 2) "confirmar": al abrir el enlace (?recuperar=...) define su contraseña nueva.
import React, { useState } from 'react';
import { Mail, Lock, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { api } from '../../services/apiClient';

const PASSWORD_MIN = 8;
const inputClase = 'w-full pl-10 pr-10 py-3 text-xs border border-slate-200 rounded-xl focus:border-marca-azul focus:ring-2 focus:ring-marca-azul/15 outline-none transition-all';
const botonClase = 'w-full py-3.5 px-4 bg-marca-azul-oscuro hover:opacity-90 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer';

function MensajeError({ texto }) {
  return texto ? <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5"><AlertCircle size={14} className="shrink-0" />{texto}</p> : null;
}

export default function RecuperarPassword({ token, onVolver }) {
  const [email, setEmail] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(null); // mensaje final

  const solicitar = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('Escribe tu correo institucional.');
    setCargando(true);
    const r = await api.post('/api/v1/auth/recuperar', { email: email.trim().toLowerCase() });
    setCargando(false);
    if (!r.ok) return setError(r.error?.message || r.error?.detail || 'No se pudo procesar la solicitud. Intenta más tarde.');
    setListo(r.data?.correo_activo === false
      ? 'El envío de correos aún no está activo. Pide al administrador del SGC que restablezca tu contraseña desde Configuración.'
      : `Si ${email.trim()} tiene cuenta en el portal, le llegará un correo con un enlace para poner una contraseña nueva. El enlace vale 30 minutos. Revisa también tu bandeja de correo no deseado.`);
  };

  const confirmar = async (e) => {
    e.preventDefault();
    setError('');
    if (nueva.length < PASSWORD_MIN) return setError(`La contraseña debe tener al menos ${PASSWORD_MIN} caracteres.`);
    if (nueva !== confirmacion) return setError('Las contraseñas no coinciden.');
    setCargando(true);
    const r = await api.post('/api/v1/auth/recuperar/confirmar', { token, password_nueva: nueva });
    setCargando(false);
    if (!r.ok) return setError(r.error?.message || r.error?.detail || 'No se pudo cambiar la contraseña.');
    setListo('Tu contraseña se cambió. Ya puedes entrar con tu correo y la contraseña nueva.');
  };

  if (listo) {
    return (
      <div className="p-7 space-y-4">
        <div className="flex gap-3 items-start p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
          <CheckCircle2 size={18} className="text-emerald-700 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-900 leading-relaxed">{listo}</p>
        </div>
        <button type="button" onClick={onVolver} className={botonClase}><ArrowLeft size={15} /> Volver a iniciar sesión</button>
      </div>
    );
  }

  return token ? (
    <form onSubmit={confirmar} className="p-7 space-y-4">
      <div>
        <h2 className="text-sm font-extrabold text-marca-azul-oscuro">Pon una contraseña nueva</h2>
        <p className="text-[11px] text-slate-600 mt-0.5">Mínimo {PASSWORD_MIN} caracteres. No la compartas con nadie.</p>
      </div>
      {[['Contraseña nueva', nueva, setNueva, true], ['Confirmar contraseña', confirmacion, setConfirmacion, false]].map(([etq, val, set, primero]) => (
        <label key={etq} className="block">
          <span className="block text-xs font-bold text-slate-700 mb-2">{etq}</span>
          <span className="relative block">
            <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input type={ver ? 'text' : 'password'} autoFocus={primero} value={val} onChange={(e) => { set(e.target.value); setError(''); }}
              className={inputClase} autoComplete="new-password" />
            {primero && (
              <button type="button" onClick={() => setVer((v) => !v)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600">
                {ver ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
          </span>
        </label>
      ))}
      <MensajeError texto={error} />
      <button type="submit" disabled={cargando} className={botonClase}>{cargando ? 'Guardando…' : <>Guardar contraseña <ArrowRight size={15} /></>}</button>
      <button type="button" onClick={onVolver} className="w-full text-[11px] font-semibold text-slate-600 hover:underline">Volver a iniciar sesión</button>
    </form>
  ) : (
    <form onSubmit={solicitar} className="p-7 space-y-4">
      <div>
        <h2 className="text-sm font-extrabold text-marca-azul-oscuro">Recuperar contraseña</h2>
        <p className="text-[11px] text-slate-600 mt-0.5">Te enviaremos un enlace a tu correo institucional para que pongas una contraseña nueva.</p>
      </div>
      <label className="block">
        <span className="block text-xs font-bold text-slate-700 mb-2">Correo institucional</span>
        <span className="relative block">
          <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input type="email" autoFocus value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
            placeholder="usuario@oomapasc.gob.mx" className={inputClase} autoComplete="username" />
        </span>
      </label>
      <MensajeError texto={error} />
      <button type="submit" disabled={cargando} className={botonClase}>{cargando ? 'Enviando…' : <>Enviarme el enlace <ArrowRight size={15} /></>}</button>
      <button type="button" onClick={onVolver} className="w-full text-[11px] font-semibold text-slate-600 hover:underline">Volver a iniciar sesión</button>
    </form>
  );
}
