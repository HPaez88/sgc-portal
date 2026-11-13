// Título profesional que va antes del nombre (Lic., Ing., Mtro., …). Se guarda dentro del nombre
// ("Lic. Héctor Manuel Páez León") y para ordenar listas se ignora: se ordena por el nombre.
export const TITULOS = [
  'C.', 'Lic.', 'Ing.', 'Arq.', 'C.P.', 'L.A.E.', 'Q.F.B.', 'Biól.', 'Tec.', 'T.S.U.',
  'Mtro.', 'Mtra.', 'Dr.', 'Dra.', 'Prof.', 'Profa.',
];

const sinAcentos = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// Los más largos primero para que "C.P." no se confunda con "C."
const ORDENADOS = [...TITULOS].sort((a, b) => b.length - a.length);

export function separarTitulo(nombreCompleto) {
  const texto = String(nombreCompleto || '').trim();
  const t = ORDENADOS.find((x) => sinAcentos(texto).startsWith(`${sinAcentos(x)} `));
  return t ? { titulo: t, nombre: texto.slice(t.length).trim() } : { titulo: '', nombre: texto };
}

export const unirTitulo = (titulo, nombre) => [titulo, String(nombre || '').trim()].filter(Boolean).join(' ');

export const nombreParaOrdenar = (nombreCompleto) => separarTitulo(nombreCompleto).nombre;

export const compararPorNombre = (a, b) =>
  nombreParaOrdenar(a?.nombre ?? a).localeCompare(nombreParaOrdenar(b?.nombre ?? b), 'es', { sensitivity: 'base' });
