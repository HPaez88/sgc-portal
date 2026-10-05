// ═══════════════════════════
// DIÁLOGOS DEL SISTEMA SGC
// Sustituye confirm() y prompt() nativos, que bloquean el hilo, rompen el
// diseño visual y no se pueden estilar. Basados en ModalBase, por lo que
// heredan el portal (siempre visibles) y el bloqueo de scroll.
// ═══════════════════════════
import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle, MessageSquare } from 'lucide-react';
import ModalBase from './ModalBase';

/**
 * Hook que expone los dos diálogos como promesas.
 *
 * Uso:
 *   const { confirmar, solicitar } = useDialogos();
 *   const { ok } = await confirmar({ titulo: '...', mensaje: '...' });
 *   const { ok, valor } = await solicitar({ titulo: '...', etiqueta: '...' });
 *
 * Requiere renderizar <Dialogos {...dialogos.props} /> en el componente.
 */
export function useDialogos() {
  const [estado, setEstado] = useState(null);
  const resolverRef = useRef(null);

  const abrir = (config, valorInicial) => new Promise((resolve) => {
    resolverRef.current = resolve;
    setEstado({ ...config, valorInicial });
  });

  const cerrar = (resultado) => {
    resolverRef.current?.(resultado);
    resolverRef.current = null;
    setEstado(null);
  };

  const confirmar = (config) => abrir({ tipo: 'confirmacion', ...config });
  const solicitar = (config) => abrir({ tipo: 'solicitud', ...config });

  const props = {
    estado,
    onCancelar: () => cerrar({ ok: false, valor: '' }),
    onAceptar: (valor) => cerrar({ ok: true, valor: valor ?? '' }),
  };

  return { confirmar, solicitar, props };
}

/** Componente que renderiza el diálogo activo. */
export function Dialogos({ estado, onCancelar, onAceptar }) {
  const [valor, setValor] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (estado) {
      setValor(estado.valorInicial ?? '');
      setError('');
    }
  }, [estado]);

  useEffect(() => {
    if (estado?.tipo === 'solicitud') {
      // Enfoca el campo cuando el modal ya está montado.
      const id = setTimeout(() => inputRef.current?.focus(), 120);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [estado]);

  if (!estado) return null;

  const esSolicitud = estado.tipo === 'solicitud';
  const requerido = estado.requerido !== false;
  const Icono = esSolicitud ? MessageSquare : (estado.peligro ? AlertTriangle : HelpCircle);
  const colorIcono = estado.peligro ? 'text-rose-500' : 'text-sky-400';

  const manejarAceptar = () => {
    if (esSolicitud && requerido && !valor.trim()) {
      setError(estado.mensajeValidacion || 'Este campo es obligatorio.');
      return;
    }
    onAceptar(valor.trim());
  };

  return (
    <ModalBase
      isOpen
      onClose={onCancelar}
      titulo={estado.titulo || (esSolicitud ? 'Captura de información' : 'Confirmación')}
      subtitulo={estado.subtitulo}
      icono={<Icono size={18} className={colorIcono} />}
      size={estado.size || 'md'}
      closeOnBackdrop={estado.closeOnBackdrop !== false}
      footer={(
        <>
          <button
            type="button"
            onClick={onCancelar}
            className="px-4 py-2 border border-slate-200 bg-white font-bold text-slate-700 rounded-xl hover:bg-slate-100 text-xs transition-colors"
          >
            {estado.textoCancelar || 'Cancelar'}
          </button>
          <button
            type="button"
            onClick={manejarAceptar}
            className={`px-5 py-2 text-white font-bold rounded-xl text-xs transition-colors shadow-sm ${estado.peligro
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-[#0B192C] hover:bg-[#152e4d]'
              }`}
          >
            {estado.textoAceptar || (esSolicitud ? 'Enviar' : 'Confirmar')}
          </button>
        </>
      )}
    >
      <div className="space-y-4">
        {estado.mensaje && (
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{estado.mensaje}</p>
        )}

        {esSolicitud && (
          <div>
            {estado.etiqueta && (
              <label htmlFor="dialogo-campo" className="block text-xs font-bold text-slate-700 mb-1.5">
                {estado.etiqueta}
                {requerido && <span className="text-rose-500 ml-1">*</span>}
              </label>
            )}
            <textarea
              id="dialogo-campo"
              ref={inputRef}
              value={valor}
              onChange={(e) => { setValor(e.target.value); if (error) setError(''); }}
              onKeyDown={(e) => {
                // Ctrl+Enter envía sin salir del teclado.
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) manejarAceptar();
              }}
              rows={estado.filas || 4}
              placeholder={estado.placeholder || ''}
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-lg resize-y focus:bg-white focus:ring-2 focus:ring-cyan-500 outline-none"
            />
            {error && <p className="text-xs text-rose-600 mt-1.5 font-medium">{error}</p>}
          </div>
        )}
      </div>
    </ModalBase>
  );
}

export default Dialogos;