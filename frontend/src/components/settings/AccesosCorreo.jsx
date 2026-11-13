// Accesos de usuarios por correo (diseño institucional desde el servidor):
// - ModalRestablecer: a un usuario, mostrar la contraseña temporal o además mandársela por correo.
// - ModalAccesosMasivos: a varios usuarios, nueva contraseña temporal por correo (solo cambia si el correo salió).
import React, { useState } from 'react';
import { KeyRound, Mail, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import ContenedorModal from '../common/ContenedorModal';
import { api } from '../../services/apiClient';
import { useToast } from '../common/Toast';

export function AvisoCorreoInactivo() {
  return (
    <p className="flex gap-2 items-start text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
      El envío de correos aún no está activo (falta verificar el dominio institucional). Por ahora la contraseña se muestra en pantalla para entregarla por un medio seguro.
    </p>
  );
}

export function ModalRestablecer({ usuario, correoActivo, onClose, onHecho }) {
  const toast = useToast();
  const [enviando, setEnviando] = useState(false);
  if (!usuario) return null;
  const restablecer = async (enviarCorreo) => {
    setEnviando(true);
    const r = await api.post(`/api/v1/auth/usuarios/${usuario.id}/restablecer-password`, { enviar_correo: enviarCorreo });
    setEnviando(false);
    if (!r.ok) return toast.error(r.error?.message || r.error?.detail || 'No se pudo restablecer la contraseña.');
    onHecho(r.data, enviarCorreo);
  };
  return (
    <ContenedorModal isOpen onClose={onClose} titulo="Restablecer contraseña" anchoMaximo="max-w-md">
      <div className="space-y-3">
        <p className="text-sm text-slate-700">Se generará una contraseña temporal para <strong>{usuario.nombre}</strong> ({usuario.email}). Al entrar deberá cambiarla.</p>
        {!correoActivo && <AvisoCorreoInactivo />}
        <div className="grid gap-2">
          <button type="button" disabled={enviando || !correoActivo} onClick={() => restablecer(true)}
            className="w-full text-left p-3 rounded-xl border-2 border-marca-azul-oscuro/30 hover:border-marca-azul-oscuro disabled:opacity-40 flex gap-3 items-start">
            <Mail size={18} className="text-marca-azul-oscuro shrink-0 mt-0.5" />
            <span><strong className="block text-sm text-slate-900">Enviarla por correo al usuario</strong><span className="text-xs text-slate-600">Le llega con el diseño institucional; también la verás aquí una vez.</span></span>
          </button>
          <button type="button" disabled={enviando} onClick={() => restablecer(false)}
            className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-slate-400 disabled:opacity-40 flex gap-3 items-start">
            <KeyRound size={18} className="text-slate-600 shrink-0 mt-0.5" />
            <span><strong className="block text-sm text-slate-900">Solo mostrármela</strong><span className="text-xs text-slate-600">Tú se la entregas por un medio seguro.</span></span>
          </button>
        </div>
      </div>
    </ContenedorModal>
  );
}

export function ModalAccesosMasivos({ usuarios, onClose, onHecho }) {
  const toast = useToast();
  const [estado, setEstado] = useState('confirmar'); // confirmar | enviando | listo
  const [resultado, setResultado] = useState(null);
  const enviar = async () => {
    setEstado('enviando');
    const r = await api.post('/api/v1/auth/usuarios/accesos-masivos', { ids: usuarios.map((u) => u.id) }, { timeoutMs: 240000 });
    if (!r.ok) {
      setEstado('confirmar');
      return toast.error(r.error?.message || r.error?.detail || 'No se pudieron enviar los accesos.');
    }
    setResultado(r.data);
    setEstado('listo');
    onHecho?.(r.data);
  };
  return (
    <ContenedorModal isOpen onClose={estado === 'enviando' ? () => {} : onClose} titulo="Enviar accesos por correo" anchoMaximo="max-w-lg">
      {estado !== 'listo' ? (
        <div className="space-y-3">
          <p className="text-sm text-slate-700">A cada uno se le generará una <strong>contraseña temporal nueva</strong> y se le enviará por correo con el acceso al portal. Su contraseña actual deja de servir solo si el correo salió.</p>
          <ul className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
            {usuarios.map((u) => <li key={u.id} className="px-3 py-1.5 flex justify-between gap-2"><span className="font-semibold text-slate-900">{u.nombre}</span><span className="text-slate-500 truncate">{u.email}</span></li>)}
          </ul>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} disabled={estado === 'enviando'} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
            <button type="button" onClick={enviar} disabled={estado === 'enviando'} className="px-4 py-2 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5">
              <Send size={14} /> {estado === 'enviando' ? `Enviando ${usuarios.length}…` : `Enviar a ${usuarios.length} usuario(s)`}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-900">{resultado.enviados} de {resultado.resultados.length} correo(s) enviados.</p>
          <ul className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 text-xs">
            {resultado.resultados.map((x) => (
              <li key={x.id} className="px-3 py-1.5 flex gap-2 items-start">
                {x.enviado ? <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" /> : <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />}
                <span><strong className="text-slate-900">{x.nombre || `Usuario ${x.id}`}</strong>{x.error && <span className="block text-slate-600">{x.error}</span>}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-end"><button type="button" onClick={onClose} className="px-4 py-2 text-xs font-bold text-white bg-marca-azul-oscuro rounded-lg">Listo</button></div>
        </div>
      )}
    </ContenedorModal>
  );
}
