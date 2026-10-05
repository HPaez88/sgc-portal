/**
 * services/dashboardExporter.js — Exportación Formal del Informe de Revisión por la Dirección (ISO 9001 § 9.3)
 * Genera el informe institucional consolidado en PDF para la Alta Dirección y Consejo Directivo.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportarInformeDireccionPDF({
  ejercicio = new Date().getFullYear(),
  periodoNombre = 'Acumulado Anual',
  direccionNombre = 'Todas las Direcciones',
  kpis = {},
  indicadoresStats = {},
  indicadoresCriticos = [],
  riesgosStats = {},
  presupuestoStats = {},
  auditoriasStats = {},
  sintesisIA = null,
  usuario = null
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const fechaStr = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });
  const folio = `REV-DIR-${ejercicio}-${Date.now().toString().slice(-4)}`;

  let y = 16;

  // 1. Encabezado Institucional OOMAPASC
  doc.setFillColor(11, 25, 44); // #0B192C
  doc.rect(14, y, pageWidth - 28, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('OOMAPASC — SISTEMA DE GESTIÓN DE LA CALIDAD', 18, y + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253);
  doc.text('INFORME EJECUTIVO DE DESEMPEÑO Y REVISIÓN POR LA DIRECCIÓN (ISO 9001:2015 / 2026 § 9.3)', 18, y + 14);
  doc.text('ORGANISMO OPERADOR MUNICIPAL DE AGUA POTABLE DE CAJEME', 18, y + 19);

  // Folio y Fecha
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(folio, pageWidth - 18, y + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Corte: ${periodoNombre} · ${ejercicio}`, pageWidth - 18, y + 15, { align: 'right' });

  y += 30;

  // 2. Metadatos de la Revisión
  const meta = [
    ['Ejercicio Evaluado:', String(ejercicio), 'Período:', periodoNombre],
    ['Ámbito / Dirección:', direccionNombre, 'Fecha de Emisión:', fechaStr],
    ['Revisado por:', usuario?.nombre || 'Alta Dirección / Titular SGC', 'Estatus Normativo:', 'Oficial Grounded']
  ];

  autoTable(doc, {
    startY: y,
    body: meta,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', width: 38, textColor: [0, 40, 85] },
      2: { fontStyle: 'bold', width: 38, textColor: [0, 40, 85] }
    }
  });

  y = doc.lastAutoTable.finalY + 6;

  // 3. Resumen de KPIs Clave
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 40, 85);
  doc.text('1. RESUMEN DE INDICADORES CLAVE DE RENDIMIENTO (KPIs)', 14, y);
  y += 4;

  const tablaKpis = [
    [
      'Cumplimiento de Indicadores (86)',
      `${indicadoresStats.pctCumplimiento || 0}%`,
      `${indicadoresStats.verdes || 0} en Meta | ${indicadoresStats.rojos || 0} Críticos`
    ],
    [
      'Acciones Correctivas (OOMRSC-20)',
      `${kpis.acAbiertas || 0} Abiertas`,
      `${kpis.acCerradas || 0} Resueltas | ${kpis.tasaEficacia || 0}% Tasa Eficacia`
    ],
    [
      'Planes de Mejora (OOMRSC-21)',
      `${kpis.pmActivos || 0} Activos`,
      `Presupuesto Ejercido: $${(presupuestoStats.ejercido || 0).toLocaleString()} MXN`
    ],
    [
      'Vigilancia de Riesgos (ISO § 6.1)',
      `${riesgosStats.total || 0} Riesgos`,
      `${riesgosStats.criticos || 0} Extremos | ${riesgosStats.altos || 0} Altos`
    ],
    [
      'Programa Anual de Auditorías',
      `${auditoriasStats.completadas || 0} / ${auditoriasStats.total || 0}`,
      `${auditoriasStats.pctAvance || 0}% Avance del Programa`
    ]
  ];

  autoTable(doc, {
    startY: y,
    head: [['Dimensión Estratégica', 'Resultado / Estatus', 'Detalle Operativo']],
    body: tablaKpis,
    theme: 'grid',
    headStyles: { fillColor: [0, 40, 85], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', width: 60 },
      1: { fontStyle: 'bold', width: 45, textColor: [0, 40, 85] }
    }
  });

  y = doc.lastAutoTable.finalY + 8;

  // 4. Indicadores Críticos que Requieren Intervención
  if (indicadoresCriticos && indicadoresCriticos.length > 0) {
    if (y > pageHeight - 50) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(190, 18, 60); // rose-700
    doc.text('2. INDICADORES EN SEMÁFORO ROJO (ATENCIÓN INMEDIATA)', 14, y);
    y += 4;

    const filasCriticos = indicadoresCriticos.slice(0, 6).map((ind) => [
      `#${ind.id}`,
      ind.nombre,
      ind.area || 'N/A',
      `${ind.meta} ${ind.unidad || ''}`,
      `${ind.valorActual ?? 'Sin Captura'}`,
      'AC Requerida'
    ]);

    autoTable(doc, {
      startY: y,
      head: [['ID', 'Indicador', 'Área Responsable', 'Meta', 'Valor Actual', 'Acción']],
      body: filasCriticos,
      theme: 'striped',
      headStyles: { fillColor: [159, 18, 57], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
      styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
      columnStyles: {
        0: { width: 12, fontStyle: 'bold' },
        1: { width: 70 },
        2: { width: 40 },
        4: { fontStyle: 'bold', textColor: [190, 18, 60] }
      }
    });

    y = doc.lastAutoTable.finalY + 8;
  }

  // 5. Síntesis Ejecutiva con IA (si está disponible)
  if (sintesisIA) {
    if (y > pageHeight - 60) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 40, 85);
    doc.text('3. DIAGNÓSTICO ESTRATÉGICO Y RECOMENDACIONES DE LA DIRECCIÓN', 14, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);

    const lineasSintesis = doc.splitTextToSize(sintesisIA.replace(/\*\*/g, ''), pageWidth - 28);
    doc.text(lineasSintesis, 14, y);
    y += lineasSintesis.length * 4.2 + 8;
  }

  // 6. Sección de Firmas de Autorización
  if (y > pageHeight - 45) {
    doc.addPage();
    y = 20;
  }

  y += 6;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 40, 85);
  doc.text('4. REVISIÓN Y VALIDACIÓN INSTITUCIONAL', 14, y);
  y += 18;

  const colWidth = (pageWidth - 28) / 3;
  doc.setDrawColor(148, 163, 184);

  // Firma 1
  doc.line(18, y, 18 + colWidth - 8, y);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Lic. Héctor Manuel Páez León', 18 + (colWidth - 8) / 2, y + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Coordinador General del SGC', 18 + (colWidth - 8) / 2, y + 8, { align: 'center' });

  // Firma 2
  doc.line(18 + colWidth, y, 18 + colWidth * 2 - 8, y);
  doc.setFont('helvetica', 'bold');
  doc.text('Titular de Dirección Técnica / Área', 18 + colWidth + (colWidth - 8) / 2, y + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Responsable Operativo', 18 + colWidth + (colWidth - 8) / 2, y + 8, { align: 'center' });

  // Firma 3
  doc.line(18 + colWidth * 2, y, 18 + colWidth * 3 - 8, y);
  doc.setFont('helvetica', 'bold');
  doc.text('Dirección General OOMAPASC', 18 + colWidth * 2 + (colWidth - 8) / 2, y + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Alta Dirección', 18 + colWidth * 2 + (colWidth - 8) / 2, y + 8, { align: 'center' });

  // Pie de página en todas las hojas
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Acta y Dictamen Ejecutivo de Revisión por la Dirección — SGC OOMAPASC de Cajeme', 14, pageHeight - 7);
    doc.text(`Página ${p} de ${totalPaginas}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }

  doc.save(`Informe_Revision_Direccion_${folio}.pdf`);
}
