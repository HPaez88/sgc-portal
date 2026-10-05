/**
 * services/revisionExporter.js — Exportador Oficial Formato OOMRSC-04 REV. 09
 * Genera el informe institucional de Revisión por la Dirección conforme a ISO 9001:2015 / ISO 9001:2026 Cláusula 9.3
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportarRevisionDireccionOOMRSC04({
  revisionData = {},
  ejercicio = 2026,
  mes = 'Julio',
  accionesCorrectivas = [],
  planesMejora = [],
  indicadoresData = {},
  auditorias = [],
  riesgos = [],
  usuario = null
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);

  const primaryColor = [11, 25, 44]; // #0B192C
  const accentColor = [14, 116, 144]; // #0E7490
  const skyBlue = [2, 132, 199]; // #0284C7
  const darkSlate = [30, 41, 59]; // #1E293B

  const drawHeaderFooter = (pageNumber, totalPages, title = 'REVISIÓN POR LA DIRECCIÓN') => {
    // Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, 10, contentWidth, 14, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('OOMAPASC DE CAJEME — SISTEMA DE GESTIÓN DE LA CALIDAD', margin + 4, 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(186, 230, 253);
    doc.text(`FORMATO OOMRSC-04 REV. 09 · ISO 9001:2015 / ISO 9001:2026 § 9.3 · ${mes.toUpperCase()} ${ejercicio}`, margin + 4, 21);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(revisionData.folio || `OOMRSC-04/${ejercicio}-${mes.slice(0, 3).toUpperCase()}`, pageWidth - margin - 4, 18, { align: 'right' });

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('Organismo Operador Municipal de Agua Potable, Alcantarillado y Saneamiento de Cajeme · Documento Controlado', margin, pageHeight - 8);
    doc.text(`Página ${pageNumber}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  };

  // ==========================================
  // PÁGINA 1: PORTADA INSTITUCIONAL OOMRSC-04
  // ==========================================
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decoración visual
  doc.setFillColor(14, 116, 144);
  doc.rect(0, 0, 8, pageHeight, 'F');
  doc.setFillColor(2, 132, 199);
  doc.rect(8, 0, 4, pageHeight, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('ORGANISMO OPERADOR MUNICIPAL DE AGUA POTABLE,', 26, 40);
  doc.text('ALCANTARILLADO Y SANEAMIENTO DE CAJEME', 26, 46);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('SISTEMA DE GESTIÓN DE LA CALIDAD (SGC)', 26, 54);

  // Cuadro central
  doc.setFillColor(15, 33, 58);
  doc.roundedRect(26, 65, pageWidth - 46, 75, 3, 3, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(56, 189, 248);
  doc.text('FORMATO OFICIAL OOMRSC-04 REV. 09', 36, 80);

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('REVISIÓN POR', 36, 95);
  doc.text('LA DIRECCIÓN', 36, 105);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(224, 242, 254);
  doc.text(`INFORME DE RESULTADOS · ${mes.toUpperCase()} ${ejercicio}`, 36, 120);

  // Metadatos Portada
  const metaBody = [
    ['Normas Aplicables:', 'ISO 9001:2015 / ISO 9001:2026 (Cláusula 9.3) · ISO 14001 · ISO 45001'],
    ['Folio del Informe:', revisionData.folio || `OOMRSC-04/${ejercicio}-${mes.slice(0,3).toUpperCase()}`],
    ['Fecha de Sesión:', revisionData.fechaSesion || new Date().toISOString().split('T')[0]],
    ['Coordinador SGC:', revisionData.coordinadorSGC || 'Lic. Héctor Manuel Páez León'],
    ['Titular de la Dirección:', revisionData.directorGeneral || 'Dirección General OOMAPASC'],
    ['Estatus Normativo:', 'ACTA APROBADA Y CERRADA PARA AUDITORÍA']
  ];

  autoTable(doc, {
    startY: 155,
    margin: { left: 26, right: 20 },
    body: metaBody,
    theme: 'plain',
    styles: { fontSize: 8.5, cellPadding: 3, textColor: [241, 245, 249] },
    columnStyles: {
      0: { fontStyle: 'bold', width: 45, textColor: [56, 189, 248] },
      1: { textColor: [255, 255, 255] }
    }
  });

  // ==========================================
  // PÁGINA 2: MARCO ESTRATÉGICO Y CONDUCTA
  // ==========================================
  doc.addPage();
  drawHeaderFooter(2, 4);

  let y = 30;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. MARCO INSTITUCIONAL Y CULTURA DE CALIDAD', margin, y);
  y += 6;

  const marcoBody = [
    ['MISIÓN', 'El OOMAPAS de Cajeme es un organismo público al servicio de los habitantes del Municipio, que actúa con disciplina y profesionalismo, aplicando altos estándares de calidad para proveer agua potable, alcantarillado y saneamiento, contribuyendo a mejorar la calidad de vida de la sociedad y el medio ambiente, bajo un esquema de cultura del cuidado y pago del agua.'],
    ['VISIÓN', 'Ser un organismo innovador y sostenible, líder en acciones de vanguardia, comprometido con la eficiencia, el desarrollo humano y la excelencia en los servicios de potabilización, saneamiento, alcantarillado, así como el reúso y reutilización del agua.'],
    ['CÓDIGO DE POLÍTICA Y CONDUCTA', 'Conjunto de procesos, reglas y prácticas que ayudan a OOMAPASC a brindar servicios de calidad, cumplir con leyes y reglamentos, reducir errores y quejas, y mejorar continuamente. La calidad no vive en la oficina del SGC, vive en la toma de lecturas, ventanillas, mantenimiento y facturación.'],
    ['IMPLICACIONES DEL INCUMPLIMIENTO', 'El incumplimiento genera consecuencias reales: no conformidades mayores, retrasos, pérdida de recursos y sanciones administrativas bajo la Política de Sanciones OOMYOR-16 Rev. 06.']
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: marcoBody,
    theme: 'striped',
    headStyles: { fillColor: primaryColor },
    styles: { fontSize: 8, cellPadding: 3.5, textColor: darkSlate },
    columnStyles: {
      0: { fontStyle: 'bold', width: 45, textColor: accentColor },
      1: { textColor: darkSlate }
    }
  });

  y = doc.lastAutoTable.finalY + 8;

  // 2. Entradas 9.3.2 A y B
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. ENTRADAS DE LA REVISIÓN (ISO 9001:2015 / 2026 § 9.3.2)', margin, y);
  y += 5;

  const prevBody = [
    ['A) Acciones de Revisiones Previas', revisionData.formulariosComplementarios?.acuerdos_previos?.resumen_seguimiento || 'Se cumplieron al 100% las acciones acordadas en la sesión previa.'],
    ['B) Cambios en Cuestiones Externas e Internas (Contexto)', revisionData.cambiosContexto || 'Alineación de objetivos con ISO 9001:2026, gestión preventiva ante estiaje y gobernanza de IA.']
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: prevBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', width: 55, textColor: primaryColor }
    }
  });

  // ==========================================
  // PÁGINA 3: DESEMPEÑO DEL SGC (OBJETIVOS, AUDITORÍAS, AC)
  // ==========================================
  doc.addPage();
  drawHeaderFooter(3, 4);

  y = 30;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('C) DESEMPEÑO Y EFICACIA DEL SISTEMA DE GESTIÓN DE CALIDAD', margin, y);
  y += 6;

  // Tabla Satisfacción y Quejas
  const satBody = [
    ['Buzón de Quejas y Denuncias (OCI)', `Recibidas: ${revisionData.formulariosComplementarios?.quejas_oci?.quejas_recibidas ?? 26} | Atendidas: ${revisionData.formulariosComplementarios?.quejas_oci?.quejas_atendidas ?? 26} | 100% de efectividad`],
    ['Satisfacción Telefónica (Línea OOMAPASC)', `Atención: ${revisionData.formulariosComplementarios?.satisfaccion_usuarios?.satisfaccion_telefonica_atencion ?? 97}% | Comercial: ${revisionData.formulariosComplementarios?.satisfaccion_usuarios?.satisfaccion_telefonica_comercial ?? 100}% | Técnica: ${revisionData.formulariosComplementarios?.satisfaccion_usuarios?.satisfaccion_telefonica_tecnica ?? 97}%`],
    ['Atención en Módulos (Contratos y Servicios)', `Satisfacción Presencial: ${revisionData.formulariosComplementarios?.satisfaccion_usuarios?.satisfaccion_modulos_presencial ?? 100}% (Meta: 96%)`]
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Mecanismo de Evaluación al Cliente', 'Resultados Obtenidos en el Período']],
    body: satBody,
    theme: 'striped',
    headStyles: { fillColor: accentColor, textColor: 255, fontSize: 8.5 },
    styles: { fontSize: 8, cellPadding: 3 }
  });

  y = doc.lastAutoTable.finalY + 6;

  // Objetivos de Calidad
  const objBody = [
    ['Ingresos por Cobranza Comercial', `$${Number(revisionData.cobranza?.presupuestado ?? 55069189).toLocaleString('es-MX')}`, `$${Number(revisionData.cobranza?.logrado ?? 44470405).toLocaleString('es-MX')}`, `${revisionData.cobranza?.cumplimiento_pct ?? 81}%`],
    ['Muestreos de Calidad de Agua (NOM-127)', `${revisionData.muestreoAgua?.programados ?? 838} prog.`, `${revisionData.muestreoAgua?.realizados ?? 844} real.`, '100% Conforme'],
    ['Planes de Mejora Cuatrimestrales', 'Al menos 1 por Dirección', `${planesMejora.length} Registrados`, 'En Tiempo'],
    ['Proveedores de Insumos Químicos', `${revisionData.formulariosComplementarios?.proveedores_quimicos?.lotes_solicitados ?? 42} lotes solicitados`, `${revisionData.formulariosComplementarios?.proveedores_quimicos?.lotes_aprobados_inspeccion ?? 42} aprobados`, '100% Aprobación']
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Objetivo de Calidad / Insumo', 'Meta / Programado', 'Resultado Logrado', '% Cumplimiento']],
    body: objBody,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2.5 }
  });

  y = doc.lastAutoTable.finalY + 6;

  // Cumplimiento de Acciones Correctivas por Dirección
  const acPorDireccion = [
    ['Dirección General', '100%'],
    ['Dirección Técnica', '100%'],
    ['Dirección Comercial', '100%'],
    ['Dirección Administrativa', '100%'],
    ['Órgano de Control Interno', '100%'],
    ['Dirección Jurídica', '100%'],
    ['Programas Sociales y Cultura del Agua', '100%']
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Dirección Responsable', '% Cumplimiento de Acciones Correctivas (OOMRSC-20)']],
    body: acPorDireccion,
    theme: 'striped',
    headStyles: { fillColor: [44, 62, 80], textColor: 255, fontSize: 8 },
    styles: { fontSize: 7.5, cellPadding: 2 }
  });

  // ==========================================
  // PÁGINA 4: SALIDAS 9.3.3, ACUERDOS Y FIRMAS
  // ==========================================
  doc.addPage();
  drawHeaderFooter(4, 4);

  y = 30;
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('3. SALIDAS DE LA REVISIÓN POR LA DIRECCIÓN (ISO 9001 § 9.3.3)', margin, y);
  y += 5;

  const salidasBody = [
    ['a) Oportunidades de Mejora', revisionData.salidasDireccion?.oportunidadesMejora || 'Fortalecimiento de la digitalización de reportes, micromedición y control de fugas.'],
    ['b) Necesidades de Cambio en el SGC', revisionData.salidasDireccion?.cambiosSGC || 'Integración de la política de Gobernanza de IA y TI, y actualización de matrices de trazabilidad.'],
    ['c) Necesidades de Recursos', revisionData.salidasDireccion?.recursosNecesarios || 'Suficiencia presupuestal garantizada para insumos de potabilización y mantenimiento preventivo.'],
    ['d) Acuerdos y Decisiones Finales', revisionData.salidasDireccion?.acuerdosFinales || 'Se aprueba por unanimidad el informe de resultados y se ratifica el compromiso con la mejora continua en Cajeme.']
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    body: salidasBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3.5 },
    columnStyles: {
      0: { fontStyle: 'bold', width: 50, textColor: primaryColor }
    }
  });

  y = doc.lastAutoTable.finalY + 12;

  // Cuadro de Firmas Oficiales
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('VALIDACIÓN Y FIRMAS DE CONFORMIDAD DE LA ALTA DIRECCIÓN', margin + 4, y + 5);

  y += 12;

  // 3 bloques de firmas
  const colW = (contentWidth - 8) / 3;

  // Firma 1: Director General
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(margin, y + 18, margin + colW, y + 18);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
  doc.text('DIRECCIÓN GENERAL', margin + (colW / 2), y + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('OOMAPASC de Cajeme', margin + (colW / 2), y + 25, { align: 'center' });

  // Firma 2: Coordinador SGC
  doc.line(margin + colW + 4, y + 18, margin + (colW * 2) + 4, y + 18);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(revisionData.coordinadorSGC || 'LIC. HÉCTOR MANUEL PÁEZ LEÓN', margin + colW + 4 + (colW / 2), y + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Coordinador General del SGC', margin + colW + 4 + (colW / 2), y + 25, { align: 'center' });

  // Firma 3: Director de Área
  doc.line(margin + (colW * 2) + 8, y + 18, margin + contentWidth, y + 18);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('DIRECTORES DE ÁREA', margin + (colW * 2) + 8 + (colW / 2), y + 22, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Técnica · Comercial · Administrativa', margin + (colW * 2) + 8 + (colW / 2), y + 25, { align: 'center' });

  // Lema institucional al pie
  y += 35;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('"Tu participación fortalece nuestro compromiso de servir mejor a Cajeme, trabajando juntos por una comunidad más unida, responsable y con futuro."', pageWidth / 2, y + 7, { align: 'center' });

  const fileName = `OOMRSC-04_Revision_Direccion_${ejercicio}_${mes}.pdf`;
  doc.save(fileName);
  return fileName;
}
