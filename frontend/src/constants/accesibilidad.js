// Preferencias de accesibilidad por usuario (en este navegador): tamaño de letra y tablas marcadas.
// El tamaño escala solo el texto (variable CSS --escala-texto), no los márgenes: así la pantalla se
// adapta sin perder información, a diferencia del zoom del navegador.
export const TAMANOS = [
  { id: 'normal', escala: 1, etiqueta: 'Normal' },
  { id: 'grande', escala: 1.15, etiqueta: 'Grande' },
  { id: 'muy-grande', escala: 1.3, etiqueta: 'Muy grande' },
];
export const PREFERENCIAS_INICIALES = { tamano: 'normal', tablasMarcadas: false };

const clave = (email) => `sgc-accesibilidad:${String(email || 'anonimo').toLowerCase()}`;

export function leerPreferencias(email) {
  try {
    const p = JSON.parse(localStorage.getItem(clave(email)) || 'null');
    return { ...PREFERENCIAS_INICIALES, ...(p && typeof p === 'object' ? p : {}) };
  } catch {
    return { ...PREFERENCIAS_INICIALES };
  }
}

export function guardarPreferencias(email, p) {
  try { localStorage.setItem(clave(email), JSON.stringify(p)); } catch { /* sin almacenamiento: solo esta sesión */ }
}

export const escalaDe = (p) => (TAMANOS.find((t) => t.id === p?.tamano) || TAMANOS[0]).escala;

export function aplicarPreferencias(p, raiz = document.documentElement) {
  raiz.style.setProperty('--escala-texto', String(escalaDe(p)));
  raiz.classList.toggle('tablas-marcadas', Boolean(p?.tablasMarcadas));
}
