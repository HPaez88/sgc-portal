// ═══════════════════════════════════════════════════════════════
// AvisoActualizacion — avisa cuando el servidor tiene una versión nueva del portal.
// Compara el bundle que está corriendo (assets/index-<hash>.js) con el que sirve hoy el index.html.
// Revisa cada 5 min y al volver a la pestaña. No recarga solo: el usuario decide, y antes de
// recargar se espera a que se suban los cambios pendientes.
// ═══════════════════════════════════════════════════════════════
import React, { useEffect, useState } from 'react';
import { RefreshCw, Sparkles } from 'lucide-react';
import { getEstadoSync } from '../../services/estadoService';

const INTERVALO_MS = 5 * 60 * 1000;
const ESPERA_GUARDADO_MS = 10000;
const PATRON_BUNDLE = /\/assets\/index-[\w-]+\.js/;

const bundleActual = () => {
  const s = [...document.querySelectorAll('script[type="module"][src]')].find((el) => PATRON_BUNDLE.test(el.src));
  return s ? s.src.match(PATRON_BUNDLE)[0] : null;
};

async function bundleEnServidor() {
  const r = await fetch(`/?v=${Date.now()}`, { cache: 'no-store', headers: { Accept: 'text/html' } });
  if (!r.ok) return null;
  const m = (await r.text()).match(PATRON_BUNDLE);
  return m ? m[0] : null;
}

export default function AvisoActualizacion() {
  const [hayNueva, setHayNueva] = useState(false);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    const actual = bundleActual();
    if (!actual) return undefined; // modo desarrollo (Vite): no hay bundle con hash
    let vivo = true;
    const revisar = async () => {
      try {
        const servidor = await bundleEnServidor();
        if (vivo && servidor && servidor !== actual) setHayNueva(true);
      } catch { /* sin red: se reintenta en la siguiente revisión */ }
    };
    const alVolver = () => { if (document.visibilityState === 'visible') revisar(); };
    const id = setInterval(revisar, INTERVALO_MS);
    document.addEventListener('visibilitychange', alVolver);
    revisar();
    return () => { vivo = false; clearInterval(id); document.removeEventListener('visibilitychange', alVolver); };
  }, []);

  const actualizar = async () => {
    setActualizando(true);
    const limite = Date.now() + ESPERA_GUARDADO_MS;
    while (getEstadoSync().pendientes > 0 && Date.now() < limite) {
      await new Promise((ok) => setTimeout(ok, 300));
    }
    window.location.reload();
  };

  if (!hayNueva) return null;
  return (
    <div role="status" className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-lg animate-fade-in-up">
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#0B192C] text-white shadow-2xl border border-sky-400/40">
        <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center shrink-0"><Sparkles size={18} className="text-sky-300" /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Hay una nueva versión del portal</p>
          <p className="text-[11px] text-sky-100/80">Actualiza para ver las mejoras. Tus cambios guardados no se pierden.</p>
        </div>
        <button onClick={actualizar} disabled={actualizando}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-black shrink-0 cursor-pointer disabled:opacity-70">
          <RefreshCw size={14} className={actualizando ? 'animate-spin' : ''} />
          {actualizando ? 'Guardando…' : 'Actualizar portal'}
        </button>
      </div>
    </div>
  );
}
