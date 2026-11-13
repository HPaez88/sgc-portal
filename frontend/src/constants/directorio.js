// Directorio de contactos del portal para llenar destinatarios sin teclear correos a mano:
// usuarios, titulares de área y de dirección, y encargados del SGC. Lógica pura (probada).
import { nombreParaOrdenar } from './titulos';

export const esCorreoValido = (c) => /^[^@\s,;]+@[^@\s,;]+\.[^@\s,;]+$/.test(String(c || '').trim());
const sinAcentos = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function construirDirectorio({ usuarios = [], areasDetalle = [], direccionesDetalle = [] }) {
  const mapa = new Map();
  const agregar = (email, nombre, detalle) => {
    const e = String(email || '').trim().toLowerCase();
    if (!esCorreoValido(e)) return;
    const previo = mapa.get(e);
    if (previo) {
      if (!previo.nombre && nombre) previo.nombre = nombre;
      if (detalle && !previo.detalles.includes(detalle)) previo.detalles.push(detalle);
    } else {
      mapa.set(e, { email: e, nombre: nombre || '', detalles: detalle ? [detalle] : [] });
    }
  };
  usuarios.filter((u) => u.activo !== false).forEach((u) => agregar(u.email, u.nombre, [u.area, u.rol].filter(Boolean).join(' · ')));
  areasDetalle.forEach((a) => {
    agregar(a.correo, a.encargado, `Titular de ${a.nombre}`);
    (a.encargados_sgc || []).forEach((c) => agregar(c, '', `Encargado SGC de ${a.nombre}`));
  });
  direccionesDetalle.forEach((d) => agregar(d.correo, d.director, `Titular de ${d.nombre}`));
  return [...mapa.values()].sort((a, b) => nombreParaOrdenar(a.nombre || a.email).localeCompare(nombreParaOrdenar(b.nombre || b.email), 'es'));
}

// Cada palabra escrita debe aparecer en el nombre, correo o detalle ("plantas jefe" encuentra al titular).
export function buscarContactos(directorio, texto, excluir = [], max = 8) {
  const palabras = sinAcentos(texto).split(/\s+/).filter(Boolean);
  if (!palabras.length) return [];
  const fuera = new Set(excluir.map((c) => String(c).toLowerCase()));
  return directorio
    .filter((c) => !fuera.has(c.email))
    .filter((c) => {
      const t = sinAcentos(`${c.nombre} ${c.email} ${c.detalles.join(' ')}`);
      return palabras.every((p) => t.includes(p));
    })
    .slice(0, max);
}
