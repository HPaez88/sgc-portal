// Reportes de Corrección (RC): una sola definición de clave, estados, folio y permisos para las tres pantallas
// que los usan (Cuadro de Control, Acciones → Reportes de corrección y el modal de alta manual).
// El servidor aplica las mismas reglas (backend/services/flujo_reglas.py).
import { puedeVerTodasAreas } from './workflow';
import { puedeCapturarArea } from './riesgos';

export const CLAVE_RC = 'sgc-reportes-correccion';

// Estados canónicos. Los históricos venían como ABIERTA/ABIERTO/CERRADA.
export const RC_ESTADOS = {
  EN_ATENCION: { label: 'En atención', cls: 'bg-amber-50 text-amber-800 border-amber-200' },
  CERRADO_EFECTIVO: { label: 'Cierre efectivo', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  CERRADO_NO_EFECTIVO: { label: 'No efectivo', cls: 'bg-rose-50 text-rose-800 border-rose-200' },
  ESCALADO_A_AC: { label: 'Escalado a AC', cls: 'bg-purple-50 text-purple-800 border-purple-200' },
};
const LEGADO = { ABIERTO: 'EN_ATENCION', ABIERTA: 'EN_ATENCION', '': 'EN_ATENCION', CERRADA: 'CERRADO_EFECTIVO' };
export const estadoRC = (rc) => LEGADO[String(rc?.estado ?? '')] || String(rc?.estado);
export const esRCAbierto = (rc) => estadoRC(rc) === 'EN_ATENCION';
export const etiquetaRC = (rc) => RC_ESTADOS[estadoRC(rc)] || { label: String(rc?.estado || ''), cls: 'bg-slate-100 text-slate-700 border-slate-200' };

/** Fecha de hoy en aaaa-mm-dd con la hora local (no UTC: después de las 5 p.m. en Sonora la UTC ya es mañana). */
export const hoyISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const enDiasISO = (dias, desde = new Date()) => { const d = new Date(desde); d.setDate(d.getDate() + dias); return hoyISO(d); };

/** Folio consecutivo del año para todo RC: RC#n/aaaa. Cuenta también los formatos viejos (RC n/aaaa, RC n-Mes/aaaa). */
export const folioRC = (reportes = [], anio = new Date().getFullYear()) => {
  const re = new RegExp(`^RC\\s*#?\\s*(\\d+)(?:\\s*-\\s*\\w+)?\\s*/\\s*${anio}$`, 'i');
  const nums = reportes.map((r) => re.exec(String(r?.folio || '').trim())?.[1]).filter(Boolean).map(Number);
  return `RC#${(nums.length ? Math.max(...nums) : 0) + 1}/${anio}`;
};

/** RC ya existente para el mismo indicador y periodo (abierto o no): no se emite dos veces. */
export const rcDelPeriodo = (reportes = [], indicadorId, mes, ejercicio) =>
  reportes.find((r) => String(r?.indicadorId) === String(indicadorId) && r?.mes === mes && String(r?.ejercicio) === String(ejercicio)) || null;

export const puedeDictaminarRC = (usuario) => ['Super Admin', 'Admin', 'Auditor'].includes(usuario?.rol);
export const puedeCrearRCManual = puedeDictaminarRC;
export const puedeVerRC = (usuario, rc, areasDetalle = []) => puedeVerTodasAreas(usuario) || puedeCapturarArea(usuario, rc?.area, areasDetalle);
