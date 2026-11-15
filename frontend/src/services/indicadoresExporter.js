// Informes PDF del módulo de Indicadores con la línea de diseño institucional (pdfMarca).
// Cada pestaña arma sus filas y llama a informeIndicadoresPDF; aquí solo vive el formato.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MARCA, ESTILO_TABLA, encabezadoPDF, piePDF } from './pdfMarca';

const SEMAFORO_RGB = { ACEPTABLE: [209, 250, 229], PREVENTIVO: [254, 243, 199], CRITICO: [255, 228, 230] };

// secciones: [{ titulo, head: [...], body: [[...]], columnStyles?, semaforoCol?, semaforos?: ['ACEPTABLE', ...] }]
// resumen: [['Etiqueta', valor], ...] → franja de cifras bajo el encabezado.
export function construirInformeIndicadoresPDF({ titulo, subtitulo = '', derecha = [], resumen = [], secciones = [], leyenda, horizontal = true }) {
  const doc = new jsPDF({ orientation: horizontal ? 'landscape' : 'portrait', unit: 'mm', format: 'letter' });
  const H = doc.internal.pageSize.getHeight();
  const m = 14;
  let y = encabezadoPDF(doc, { titulo, subtitulo, derecha: [...derecha, `Emitido ${new Date().toLocaleDateString('es-MX')}`] });

  if (resumen.length) {
    autoTable(doc, {
      startY: y, margin: { left: m, right: m },
      head: [resumen.map(([k]) => k)], body: [resumen.map(([, v]) => v ?? '—')],
      styles: { fontSize: 10, halign: 'center', fontStyle: 'bold', lineColor: [215, 225, 232], lineWidth: 0.1 },
      headStyles: { fillColor: MARCA.verdeTenue, textColor: MARCA.azulOscuro, fontSize: 7.5 },
      bodyStyles: { textColor: MARCA.azulOscuro },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  secciones.forEach((s, i) => {
    if (i > 0) y = doc.lastAutoTable.finalY + 9;
    if (y > H - 35) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...MARCA.azulOscuro);
    doc.text(s.titulo, m, y);
    autoTable(doc, {
      startY: y + 2, margin: { left: m, right: m, top: 20, bottom: 16 },
      head: [s.head], body: s.body.length ? s.body : [[{ content: 'Sin registros.', colSpan: s.head.length, styles: { halign: 'center', textColor: MARCA.gris } }]],
      ...ESTILO_TABLA,
      columnStyles: s.columnStyles || {},
      didParseCell: (d) => {
        if (d.section !== 'body' || s.semaforoCol === undefined || d.column.index !== s.semaforoCol) return;
        const rgb = SEMAFORO_RGB[s.semaforos?.[d.row.index]];
        if (rgb) { d.cell.styles.fillColor = rgb; d.cell.styles.fontStyle = 'bold'; }
      },
    });
  });

  piePDF(doc, leyenda || `OOMAPAS de Cajeme · ${titulo}`);
  return doc;
}

export function exportarInformeIndicadoresPDF(datos, archivo) {
  const limpio = archivo.replace(/[^\wÁÉÍÓÚáéíóúÑñ.-]+/g, '_').replace(/_+/g, '_');
  construirInformeIndicadoresPDF(datos).save(limpio.endsWith('.pdf') ? limpio : `${limpio}.pdf`);
}

// Etiqueta corta del semáforo para las tablas.
export const etiquetaSemaforo = (rango, porcentaje) => ({
  ACEPTABLE: `Aceptable${porcentaje != null ? ` (${porcentaje}%)` : ''}`,
  PREVENTIVO: `Preventivo${porcentaje != null ? ` (${porcentaje}%)` : ''}`,
  CRITICO: `Crítico${porcentaje != null ? ` (${porcentaje}%)` : ''}`,
}[rango] || 'Sin captura');
