// Enlaces que vienen de datos guardados (evidencias de AC/PM): solo esquemas seguros. Un "javascript:" guardado en un
// registro ejecutaría código en la sesión de quien da clic (auditoría de seguridad 2026-11-18).
const PERMITIDOS = /^(https?:|blob:|data:image\/|data:application\/pdf)/i;

export const urlSegura = (url) => {
  if (typeof url !== 'string') return undefined;
  const u = url.trim();
  if (u.startsWith('/') && !u.startsWith('//')) return u; // ruta del propio portal (/api/v1/archivos/...)
  return PERMITIDOS.test(u) ? u : undefined;
};
