import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Clock, RefreshCw, LogOut } from 'lucide-react';
import { useSGC } from '../../SGCContext';

// Configuración de inactividad: 1 HORA (3600 segundos)
const TIEMPO_INACTIVIDAD_SEGUNDOS = 60 * 60; // 1 hora
const TIEMPO_ADVERTENCIA_SEGUNDOS = 120; // Advertencia preventiva 2 minutos antes

export default function ModalInactividad() {
  const { usuarioLogueado, sesionActiva, cerrarSesion, pingActividad } = useSGC();
  
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);
  const [cuentaRegresiva, setCuentaRegresiva] = useState(TIEMPO_ADVERTENCIA_SEGUNDOS);

  const ultimoMovimientoRef = useRef(Date.now());
  const timerRef = useRef(null);

  // Reiniciar contador de inactividad
  const reiniciarActividad = useCallback(() => {
    ultimoMovimientoRef.current = Date.now();
    setMostrarAdvertencia(false);
    setCuentaRegresiva(TIEMPO_ADVERTENCIA_SEGUNDOS);
    pingActividad?.();
  }, [pingActividad]);

  // Escuchar eventos globales del usuario
  useEffect(() => {
    if (!sesionActiva) return;

    const eventos = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    
    let timeoutThrottle = null;
    const handleEvento = () => {
      if (!timeoutThrottle) {
        timeoutThrottle = setTimeout(() => {
          reiniciarActividad();
          timeoutThrottle = null;
        }, 3000); // Throttle cada 3 segundos
      }
    };

    eventos.forEach(ev => window.addEventListener(ev, handleEvento, { passive: true }));

    return () => {
      if (timeoutThrottle) clearTimeout(timeoutThrottle);
      eventos.forEach(ev => window.removeEventListener(ev, handleEvento));
    };
  }, [sesionActiva, reiniciarActividad]);

  // Monitoreo cada segundo
  useEffect(() => {
    if (!sesionActiva) return;

    timerRef.current = setInterval(() => {
      const tiempoTranscurridoMs = Date.now() - ultimoMovimientoRef.current;
      const segundos = Math.floor(tiempoTranscurridoMs / 1000);
      const segundosParaCierre = TIEMPO_INACTIVIDAD_SEGUNDOS - segundos;

      if (segundosParaCierre <= TIEMPO_ADVERTENCIA_SEGUNDOS && segundosParaCierre > 0) {
        setMostrarAdvertencia(true);
        setCuentaRegresiva(segundosParaCierre);
      } else if (segundosParaCierre <= 0) {
        // Expiró la hora completa de inactividad: desconectar de la plataforma
        setMostrarAdvertencia(false);
        cerrarSesion('Desconexión automática por superar 1 hora de inactividad');
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sesionActiva, cerrarSesion]);

  // Si la sesión no está activa o no hay advertencia, no mostrar nada
  if (!sesionActiva || !mostrarAdvertencia) return null;

  const minutosRestantes = Math.floor(cuentaRegresiva / 60);
  const segundosRestantes = cuentaRegresiva % 60;

  const modalEl = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-amber-200 overflow-hidden p-6 space-y-4 animate-bounce-subtle">
        <div className="flex items-center gap-3 text-amber-700">
          <div className="p-2.5 bg-amber-100 rounded-xl text-amber-600">
            <Clock size={24} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Inactividad Detectada</h3>
            <p className="text-[11px] text-amber-700 font-medium">Límite de sesión: 1 hora</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Tu sesión en el Portal SGC se desconectará automáticamente en:
        </p>

        {/* Contador */}
        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-center">
          <span className="text-2xl font-black font-mono text-amber-800">
            {minutosRestantes > 0 ? `${minutosRestantes}m ` : ''}{segundosRestantes < 10 ? `0${segundosRestantes}` : segundosRestantes}s
          </span>
          <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider mt-0.5">
            Tiempo restante para desconexión
          </p>
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            onClick={() => {
              setMostrarAdvertencia(false);
              cerrarSesion('Desconexión voluntaria ante advertencia de inactividad');
            }}
            className="flex-1 py-2 px-3 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut size={13} />
            Salir ahora
          </button>
          <button
            onClick={reiniciarActividad}
            className="flex-1 py-2 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} />
            Seguir Conectado
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalEl, document.body) : modalEl;
}
