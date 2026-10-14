import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Droplet, ArrowRight, ShieldCheck, AlertCircle, Clock, KeyRound } from 'lucide-react';
import { useSGC } from '../../SGCContext';

const PASSWORD_MIN = 8;

export default function LoginView() {
  const { iniciarSesion, cambiarPassword, usuarioLogueado, motivoCierreSesion } = useSGC();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  // Paso 2: contraseña temporal → el usuario debe definir la suya antes de entrar.
  const debeCambiar = Boolean(usuarioLogueado?.debe_cambiar_password);
  const [nueva, setNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Ingresa tu correo institucional y tu contraseña.');
      return;
    }
    setCargando(true);
    const res = await iniciarSesion(email.trim().toLowerCase(), password);
    setCargando(false);
    if (!res.success) setError(res.error || 'Credenciales inválidas.');
  };

  const handleCambio = async (e) => {
    e.preventDefault();
    setError('');
    if (nueva.length < PASSWORD_MIN) return setError(`La contraseña nueva debe tener al menos ${PASSWORD_MIN} caracteres.`);
    if (nueva !== confirmacion) return setError('Las contraseñas no coinciden.');
    setCargando(true);
    const res = await cambiarPassword(password, nueva);
    setCargando(false);
    if (!res.success) setError(res.error || 'No se pudo cambiar la contraseña.');
  };

  const inputClase = 'w-full pl-10 pr-10 py-3 text-xs border border-slate-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all';

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[#070E1A] via-[#0A1424] to-[#11243D] relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 animate-scale-up">
        <div className="bg-[#0A1424] text-white p-7 text-center relative border-b border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-700 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20 mb-3">
            <Droplet className="text-white fill-white/20" size={30} />
          </div>
          <div className="space-y-1">
            <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-sky-500/20 text-sky-300 border border-sky-500/30">
              ISO 9001:2015 • SGC OOMAPASC
            </span>
            <h1 className="text-xl font-black tracking-tight text-white">Portal de Calidad</h1>
            <p className="text-[11px] text-slate-300">Sistema de Gestión de Calidad y Mejora Continua</p>
          </div>
        </div>

        {motivoCierreSesion && !debeCambiar && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-start gap-3">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5"><Clock size={16} /></div>
            <div className="text-xs">
              <p className="font-bold text-amber-900">Sesión cerrada</p>
              <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">{motivoCierreSesion}</p>
            </div>
          </div>
        )}

        {debeCambiar ? (
          <form onSubmit={handleCambio} className="p-7 space-y-4">
            <div className="flex items-start gap-3 p-3 bg-sky-50 border border-sky-200 rounded-xl">
              <KeyRound size={16} className="text-sky-700 shrink-0 mt-0.5" />
              <p className="text-[11px] text-sky-900 leading-relaxed">
                Hola, <strong>{usuarioLogueado?.nombre}</strong>. Entraste con una contraseña temporal.
                Define tu contraseña personal para continuar.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Contraseña nueva</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input type={mostrarPassword ? 'text' : 'password'} autoFocus value={nueva} onChange={e => { setNueva(e.target.value); setError(''); }}
                  placeholder={`Mínimo ${PASSWORD_MIN} caracteres`} className={inputClase} autoComplete="new-password" />
                <button type="button" onClick={() => setMostrarPassword(v => !v)} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                  {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Confirmar contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input type={mostrarPassword ? 'text' : 'password'} value={confirmacion} onChange={e => { setConfirmacion(e.target.value); setError(''); }}
                  placeholder="Repite la contraseña" className={inputClase} autoComplete="new-password" />
              </div>
            </div>
            {error && <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5 animate-shake"><AlertCircle size={14} className="shrink-0" />{error}</p>}
            <button type="submit" disabled={cargando}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer">
              {cargando ? <span>Guardando...</span> : <><span>Guardar y entrar</span><ArrowRight size={15} /></>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="p-7 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Correo institucional</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input type="email" autoFocus value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="usuario@oomapasc.gob.mx" className={inputClase} autoComplete="username" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Contraseña de acceso</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input type={mostrarPassword ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Ingresa tu contraseña" className={inputClase} autoComplete="current-password" />
                <button type="button" onClick={() => setMostrarPassword(v => !v)} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                  {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {error && <p className="mt-2 text-[11px] font-semibold text-rose-600 flex items-center gap-1.5 animate-shake"><AlertCircle size={14} className="shrink-0" />{error}</p>}
            </div>
            <button type="submit" disabled={cargando}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-xs font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer">
              {cargando ? <span>Validando credenciales...</span> : <><span>Ingresar a la Plataforma</span><ArrowRight size={15} /></>}
            </button>
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              ¿Sin contraseña o la olvidaste? Pide al administrador del SGC que te la restablezca desde Configuración.
            </p>
          </form>
        )}

        <div className="px-7 py-4 bg-slate-50 border-t border-slate-100 text-center">
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Control de Seguridad y Trazabilidad ISO 9001:2015</span>
          </div>
        </div>
      </div>
    </div>
  );
}
