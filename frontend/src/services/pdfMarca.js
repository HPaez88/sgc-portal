// Línea de diseño institucional OOMAPAS de Cajeme para todos los informes PDF del SGC.
// Colores tomados del logo oficial; el azul de títulos y tablas es el del logo un poco más oscuro (pedido de @human).
import { LOGO_OOMAPASC, LOGO_PROPORCION } from '../assets/logoOomapasc';

export const MARCA = {
  azul: [0, 131, 192],          // #0083C0 azul del logo
  azulOscuro: [0, 91, 134],     // #005B86 títulos, encabezados de tabla, bandas
  verde: [118, 190, 68],        // #76BE44 verde del logo (acentos)
  verdeClaro: [177, 214, 129],  // #B1D681
  verdeTenue: [236, 245, 225],  // fondo suave de filas alternas / cifras
  texto: [30, 41, 59],
  gris: [100, 116, 139],
};

export const ESTILO_TABLA = {
  styles: { fontSize: 7.5, cellPadding: 1.6, lineColor: [215, 225, 232], lineWidth: 0.1, textColor: MARCA.texto },
  headStyles: { fillColor: MARCA.azulOscuro, textColor: 255, fontStyle: 'bold' },
  alternateRowStyles: { fillColor: [245, 249, 252] },
};

// Encabezado: logo a la izquierda, título y subtítulo en azul, folio/fecha a la derecha, barra azul + verde.
// Devuelve la "y" donde puede empezar el contenido.
export function encabezadoPDF(doc, { titulo, subtitulo = '', derecha = [], y = 10, altoLogo = 14 }) {
  const W = doc.internal.pageSize.getWidth();
  const m = 14;
  doc.addImage(LOGO_OOMAPASC, 'PNG', m, y, altoLogo * LOGO_PROPORCION, altoLogo);
  const x = m + altoLogo * LOGO_PROPORCION + 6;
  const ancho = W - x - m - 40;
  doc.setTextColor(...MARCA.azulOscuro); doc.setFont('helvetica', 'bold');
  // Títulos largos: se reduce la letra para que quepan en un renglón y no pisen el subtítulo.
  let tam = 10.5;
  doc.setFontSize(tam);
  while (tam > 7.5 && doc.getTextWidth(titulo) > ancho) { tam -= 0.5; doc.setFontSize(tam); }
  doc.text(titulo, x, y + 5.5);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...MARCA.gris);
  if (subtitulo) doc.text(subtitulo, x, y + 11, { maxWidth: ancho });
  derecha.forEach((t, i) => {
    doc.setFont('helvetica', i === 0 ? 'bold' : 'normal'); doc.setFontSize(i === 0 ? 8 : 7);
    doc.setTextColor(...(i === 0 ? MARCA.azulOscuro : MARCA.gris));
    doc.text(String(t), W - m, y + 5 + i * 4.5, { align: 'right' });
  });
  doc.setFillColor(...MARCA.azulOscuro); doc.rect(m, y + altoLogo + 2, W - 2 * m, 1.2, 'F');
  doc.setFillColor(...MARCA.verde); doc.rect(m, y + altoLogo + 3.2, W - 2 * m, 0.6, 'F');
  return y + altoLogo + 9;
}

// Pie con leyenda institucional y número de página en todas las hojas.
export function piePDF(doc, leyenda) {
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(...MARCA.verdeClaro); doc.setLineWidth(0.3); doc.line(14, H - 12, W - 14, H - 12);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...MARCA.gris);
    doc.text(leyenda, 14, H - 8);
    doc.text(`Página ${p} de ${total}`, W - 14, H - 8, { align: 'right' });
  }
}
