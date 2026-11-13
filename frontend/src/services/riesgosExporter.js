// PDF del informe de riesgos y oportunidades (OOMRSC-37) por área, dirección u organismo.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CLAVE_MATRIZ, ESCALAS, ESTADOS_RIESGO, clasificar, puntaje } from '../constants/riesgos';
import { formatearFecha } from '../constants/workflow';

const AZUL = [11, 25, 44];
const NIVEL_RGB = { Bajo: [167, 243, 208], Medio: [253, 230, 138], Alto: [253, 164, 175] };
const OPORT_RGB = { Bajo: [241, 245, 249], Medio: [186, 230, 253], Alto: [110, 231, 183] };
const pct = (v) => (v != null ? `${v}%` : '-');

function mapa(doc, x, y, tipo, items) {
  const celda = 13;
  const impactos = ESCALAS[tipo].impacto.map(([v]) => v);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 41, 59);
  doc.text(tipo === 'Riesgo' ? 'Mapa de riesgos' : 'Mapa de oportunidades', x, y - 2);
  [5, 4, 3, 2, 1].forEach((p, fila) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(100, 116, 139);
    doc.text(String(p), x + 4, y + fila * celda + celda / 2 + 1, { align: 'right' });
    impactos.forEach((i, col) => {
      const n = items.filter((r) => Number(r.probabilidad) === p && Number(r.impacto) === i).length;
      const rgb = (tipo === 'Riesgo' ? NIVEL_RGB : OPORT_RGB)[clasificar(p * i).nivel];
      const cx = x + 6 + col * celda;
      const cy = y + fila * celda;
      doc.setFillColor(...rgb); doc.setDrawColor(255, 255, 255); doc.rect(cx, cy, celda, celda, 'FD');
      if (n) { doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(15, 23, 42); doc.text(String(n), cx + celda / 2, cy + celda / 2 + 1.5, { align: 'center' }); }
    });
  });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(100, 116, 139);
  impactos.forEach((i, col) => doc.text(String(i), x + 6 + col * celda + celda / 2, y + 5 * celda + 4, { align: 'center' }));
  doc.text('Impacto', x + 6 + 2.5 * celda, y + 5 * celda + 8, { align: 'center' });
  doc.text('Prob.', x, y - 2 + 5 * celda + 10);
}

export function construirInformeRiesgosPDF({ nombreAlcance, anio, actual, comparativo, desglose, porNombre, hallazgos, altos, items, usuario }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const m = 14;
  const tabla = (titulo, head, body, opciones = {}) => {
    let y = (doc.lastAutoTable?.finalY ?? 52) + 9;
    if (y > H - 40) { doc.addPage(); y = 34; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...AZUL); doc.text(titulo, m, y);
    autoTable(doc, {
      startY: y + 2, head: [head], body, margin: { left: m, right: m, top: 30 },
      styles: { fontSize: 7.5, cellPadding: 1.6, lineColor: [226, 232, 240], lineWidth: 0.1 },
      headStyles: { fillColor: AZUL, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      ...opciones,
    });
  };

  // Encabezado del informe
  doc.setFillColor(...AZUL); doc.rect(m, 10, W - 2 * m, 16, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('OOMAPAS DE CAJEME — INFORME DE RIESGOS Y OPORTUNIDADES', m + 4, 17);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text(`ISO 9001:2015 § 6.1 · Matriz ${CLAVE_MATRIZ} · Ejercicio ${anio} · Emitido ${formatearFecha(new Date().toISOString())}${usuario ? ` por ${usuario}` : ''}`, m + 4, 22.5);
  doc.setTextColor(...AZUL); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text(nombreAlcance, m, 35);

  autoTable(doc, {
    startY: 39, margin: { left: m, right: m },
    head: [['Riesgos', 'Altos', 'Nivel promedio', 'Oportunidades', 'Con plan de mejora', 'Vencidos', 'Por dictaminar', 'Eficacia']],
    body: [[actual.riesgos, actual.altos, actual.nivelPromedio ?? '-', actual.oportunidades, actual.conPM, actual.vencidos, actual.porDictaminar, pct(actual.eficacia)]],
    styles: { fontSize: 9, halign: 'center', fontStyle: 'bold' }, headStyles: { fillColor: [241, 245, 249], textColor: [51, 65, 85], fontSize: 7 },
  });

  tabla('1. Hallazgos para la toma de decisiones', ['#', 'Hallazgo'], hallazgos.map((h, i) => [i + 1, h.texto]), {
    columnStyles: { 0: { cellWidth: 8, halign: 'center' } },
    didParseCell: (d) => { if (d.section === 'body' && hallazgos[d.row.index]?.tono === 'alerta') d.cell.styles.textColor = [159, 18, 57]; },
  });

  tabla('2. Comparativo con años anteriores', ['Año', 'Riesgos', 'Altos', 'Medios', 'Bajos', 'Nivel promedio', 'Oportunidades', 'Con plan', 'Eficacia'],
    comparativo.map((c) => [c.anio, c.riesgos, c.altos, c.medios, c.bajos, c.nivelPromedio ?? '-', c.oportunidades, c.conPM, pct(c.eficacia)]),
    { styles: { fontSize: 7.5, halign: 'center' } });

  // Mapas de calor
  let y = doc.lastAutoTable.finalY + 14;
  if (y > H - 95) { doc.addPage(); y = 34; }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...AZUL); doc.text('3. Mapas de calor (probabilidad × impacto)', m, y);
  mapa(doc, m, y + 8, 'Riesgo', items.filter((r) => r.tipo === 'Riesgo'));
  mapa(doc, W / 2 + 4, y + 8, 'Oportunidad', items.filter((r) => r.tipo === 'Oportunidad'));
  doc.lastAutoTable.finalY = y + 8 + 5 * 13 + 10;

  tabla(`4. Desglose por ${porNombre.toLowerCase()}`, [porNombre, 'Riesgos', 'Altos', 'Medios', 'Oport.', 'Con plan', 'Vencidos', 'Eficacia'],
    desglose.map((g) => [g.nombre, g.riesgos, g.altos, g.medios, g.oportunidades, g.conPM, g.vencidos, pct(g.eficacia)]),
    { columnStyles: { 0: { cellWidth: 62 } } });

  tabla('5. Riesgos altos y su tratamiento', ['Nivel', 'Riesgo', 'Área', 'Tratamiento', 'Plan de mejora', 'Estado'],
    altos.length ? altos.map(({ r, pm, estado, venc }) => [puntaje(r), r.descripcion, r.area, r.tratamiento || '-', pm ? `${pm.folio_codigo}${venc ? `\n${venc.label}` : ''}` : '-', ESTADOS_RIESGO[estado]?.label || estado])
      : [['-', `Sin riesgos altos en ${anio}.`, '', '', '', '']],
    { columnStyles: { 0: { cellWidth: 11, halign: 'center', fontStyle: 'bold' }, 1: { cellWidth: 70 } } });

  const paginas = doc.getNumberOfPages();
  for (let p = 1; p <= paginas; p += 1) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(100, 116, 139);
    doc.text(`Informe ${CLAVE_MATRIZ} ${anio} · ${nombreAlcance}`, m, H - 8);
    doc.text(`Página ${p} de ${paginas}`, W - m, H - 8, { align: 'right' });
  }
  return doc;
}

export function exportarInformeRiesgosPDF(datos) {
  const archivo = `Informe_Riesgos_${datos.anio}_${datos.nombreAlcance.replace(/[^\wÁÉÍÓÚáéíóúÑñ]+/g, '_').replace(/_+$/, '').slice(0, 50)}.pdf`;
  construirInformeRiesgosPDF(datos).save(archivo);
  return archivo;
}
