import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Droplet, ArrowRight, ShieldCheck, AlertCircle, Clock } from 'lucide-react';
import { useSGC } from '../../SGCContext';
import { getRolColor } from '../../constants';

export default function LoginView() {
  const { usuarios, usuarioLogueado, iniciarSesion, motivoCierreSesion } = useSGC();

  const [usuarioIdSeleccionado, setUsuarioIdSeleccionado] = useState(usuarioLogueado?.id || usuarios[0]?.id || 1);
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const usuarioSeleccionado = usuarios.find(u => String(u.id) === String(usuarioIdSeleccionado)) || usuarios[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Por favor ingrese su contraseña.');
      return;
    }

    setCargando(true);
    setTimeout(() => {
      const res = iniciarSesion(usuarioIdSeleccionado, password);
      if (!res.success) {
        setError(res.error || 'Credenciales inválidas.');
        setCargando(false);
      } else {
        setCargando(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-[#070E1A] via-[#0A1424] to-[#11243D] relative overflow-hidden font-sans">
      {/* Luces de fondo decorativas */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 animate-scale-up">
        {/* Encabezado Institucional */}
        <div className="bg-[#0A1424] text-white p-7 text-center relative border-b border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-700 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20 mb-3.5">
            <Droplet className="text-white fill-white/20" size={30} />
          </div>

          <div className="space-y-1">
            <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-sky-500/20 text-sky-300 border border-sky-500/30 font-mono">
              ISO 9001:2015 • SGC OOMAPASC
            </span>
            <h1 className="text-xl font-black tracking-tight text-white">
              Portal de Calidad
            </h1>
            <p className="text-[11px] text-slate-300">
              Sistema de Gestión de Calidad y Mejora Continua
            </p>
          </div>
        </div>

        {/* Mensaje de Inactividad de 1 Hora si aplica */}
        {motivoCierreSesion && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 flex items-start gap-3">
            <div className="p-1.5 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
              <Clock size={16} />
            </div>
            <div className="text-xs">
              <p className="font-bold text-amber-900">Sesión desconectada por inactividad</p>
              <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                Por seguridad del SGC, la sesión fue cerrada tras superar <strong>1 hora sin actividad</strong>. Ingrese su contraseña para continuar trabajando.
              </p>
            </div>
          </div>
        )}

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="p-7 space-y-5">
          {/* Selector de Usuario */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Usuario de la plataforma
            </label>
            <div className="space-y-2">
              <select
                value={usuarioIdSeleccionado}
                onChange={(e) => {
                  setUsuarioIdSeleccionado(e.target.value);
                  setError('');
                }}
                className="w-full text-xs font-bold p-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all cursor-pointer text-slate-800"
              >
                {usuarios.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nombre} — {u.rol}
                  </option>
                ))}
              </select>

              {/* Ficha rápida del usuario seleccionado */}
              {usuarioSeleccionado && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {usuarioSeleccionado.nombre?.charAt(0) || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{usuarioSeleccionado.nombre}</p>
                      <p className="text-[10px] text-slate-500 truncate">{usuarioSeleccionado.email || 'Sin correo'}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase shrink-0 ${getRolColor(usuarioSeleccionado.rol)}`}>
                    {usuarioSeleccionado.rol}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Campo de Contraseña */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Contraseña de acceso
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Por defecto: sgc2026
              </span>
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type={mostrarPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Ingrese su contraseña"
                className="w-full pl-10 pr-10 py-3 text-xs border border-slate-200 rounded-xl focus:border-sky-500 focus:ring-2 focus:ring-sky-500/15 outline-none transition-all text-slate-800"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {mostrarPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <p className="mt-2 text-[11px] font-semibold text-rose-600 flex items-center gap-1.5 animate-shake">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </p>
            )}
          </div>

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
          >
            {cargando ? (
              <span>Validando credenciales...</span>
            ) : (
              <>
                <span>Ingresar a la Plataforma</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Pie con información institucional */}
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
