// Correo libre para administradores: cualquier aviso que no tenga plantilla.
// Si el servidor tiene correo (Resend) sale desde ahí; si no, abre el correo del usuario (mailto).
import React, { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import ModalBase from './ModalBase';
import { api } from '../../services/apiClient';
import { useToast } from './Toast';
import { useSGC } from '../../SGCContext';

export const ROLES_CORREO = ['Super Admin', 'Admin'];
export const puedeMandarCorreo = (usuario) => ROLES_CORREO.includes(usuario?.rol);

const campo = 'w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none';

export default function ModalCorreo({ abierto, onClose, inicial = {}, folio = '' }) {
  const { registrarMovimiento, usuarioLogueado } = useSGC();
  const toast = useToast();
  const [para, setPara] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [servidor, setServidor] = useState(null);

  useEffect(() => {
    if (!abierto) return;
    setPara(inicial.para || '');
    setAsunto(inicial.asunto || '');
    setMensaje(inicial.mensaje || '');
    api.get('/api/v1/notificaciones/estado').then((r) => setServidor(r.ok && r.data?.activo ? r.data.remitente : null));
  }, [abierto]); // eslint-disable-line react-hooks/exhaustive-deps

  const destinatarios = para.split(/[,;\s]+/).map((c) => c.trim()).filter(Boolean);
  const valido = destinatarios.length > 0 && asunto.trim().length >= 3 && mensaje.trim().length >= 3;

  const registrar = (via) => registrarMovimiento?.({
    modulo: 'NOTIFICACIONES', accion: 'CORREO_ADMIN',
    descripcion: `Correo "${asunto.trim()}" (${via})`,
    detalles: `Para: ${destinatarios.join(', ')}`, folio,
  });

  const enviar = async () => {
    if (!valido) return;
    if (servidor) {
      setEnviando(true);
      const res = await api.post('/api/v1/notificaciones/libre', { asunto: asunto.trim(), mensaje: mensaje.trim(), destinatarios });
      setEnviando(false);
      if (res.ok) { registrar('enviado por el portal'); toast.success(`Correo enviado a ${destinatarios.join(', ')}`); onClose(); return; }
      toast.error(res.error?.message || res.error?.detail || 'No se pudo enviar; se abrirá tu correo.');
    }
    const firma = `\n\n--\n${usuarioLogueado?.nombre || ''}\nSistema de Gestión de Calidad`;
    window.location.href = `mailto:${encodeURIComponent(destinatarios.join(','))}?subject=${encodeURIComponent(asunto.trim())}&body=${encodeURIComponent(mensaje.trim() + firma)}`;
    registrar('correo del usuario');
    onClose();
  };

  return (
    <ModalBase
      isOpen={abierto}
      onClose={onClose}
      size="sm"
      titulo="Mandar correo"
      subtitulo={servidor ? `Sale desde ${servidor}` : 'Se abrirá tu correo con el mensaje listo'}
      icono={<Mail size={20} />}
      footer={(
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
          <button type="button" onClick={enviar} disabled={!valido || enviando}
            className="px-4 py-2 text-sm font-bold text-white bg-sky-700 hover:bg-sky-800 disabled:opacity-50 rounded-lg">
            {enviando ? 'Enviando…' : 'Enviar'}
          </button>
        </div>
      )}
    >
      <div className="space-y-4">
        <label className="block text-xs font-bold text-slate-700">Para (separa varios con coma)
          <input type="text" value={para} onChange={(e) => setPara(e.target.value)} className={`${campo} mt-1.5`} placeholder="correo@oomapasc.gob.mx" />
        </label>
        <label className="block text-xs font-bold text-slate-700">Asunto
          <input type="text" value={asunto} onChange={(e) => setAsunto(e.target.value)} maxLength={200} className={`${campo} mt-1.5`} />
        </label>
        <label className="block text-xs font-bold text-slate-700">Mensaje
          <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} maxLength={4000} rows={8} className={`${campo} mt-1.5`} />
        </label>
      </div>
    </ModalBase>
  );
}
