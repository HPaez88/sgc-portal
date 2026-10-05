/**
 * services/fichaTecnicaExporter.js — Generador y Descargador de Documentos Oficiales
 * para Fichas Técnicas del PMD y Presentación de Proyectos (H. Ayuntamiento de Cajeme).
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { descargarBlob } from './apiClient';

/**
 * Genera el documento PDF oficial de la Ficha Técnica de Indicador
 * con formato municipal, tablas armonizadas, secciones I-VI y firmas.
 */
export function exportarFichaTecnicaPDF(ficha, valoresMensuales = {}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const indNum = ficha.indicador_numero ?? ficha.indicador_id ?? 0;
  const alineacion = ficha.alineacion || {};
  const identificacion = ficha.identificacion || {};
  const cremaa = ficha.atributos_cremaa || {};
  const variables = ficha.caracteristicas_variables || {};
  const transversalidad = ficha.transversalidad || {};
  const infoAdic = ficha.informacion_adicional || {};

  // 1. Encabezado Oficial Municipal
  doc.setFillColor(11, 25, 44); // #0B192C
  doc.rect(14, 12, 187, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('H. AYUNTAMIENTO DE CAJEME · OOMAPAS DE CAJEME', 107.5, 19, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`FICHA TÉCNICA DE INDICADOR #${indNum} · PRESUPUESTO DE EGRESOS 2026`, 107.5, 25, { align: 'center' });

  let startY = 34;

  // Estilo de tabla común
  const commonTableStyles = {
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.15,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [11, 25, 44],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', fillColor: [241, 245, 249] },
      1: { cellWidth: 'auto' }
    }
  };

  // Sección I: Alineación
  autoTable(doc, {
    ...commonTableStyles,
    startY,
    head: [[{ content: 'I. Alineación (Plan Municipal de Desarrollo - PMD)', colSpan: 2 }]],
    body: [
      ['Eje rector PMD', alineacion.eje_rector_pmd || 'Cajeme Limpio y Ordenado'],
      ['Programa PMD', alineacion.programa_pmd || 'Desarrollo con Servicios Públicos de Calidad'],
      ['Objetivo PMD', alineacion.objetivo_pmd || 'Gestión Moderna y Eficiente del Cobro de Agua'],
      ['Estrategia PMD', alineacion.estrategia_pmd || 'Monitoreo de metas operativas y de calidad'],
      ['Objetivo institucional', alineacion.objetivo_institucional || ''],
      ['Tipo de objetivo', alineacion.tipo_objetivo || 'Cumplimiento']
    ]
  });

  // Sección II: Identificación
  const mesesClaves = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const valsMensuales = mesesClaves.map(m => {
    const v = valoresMensuales?.[m.toLowerCase()] ?? valoresMensuales?.[m] ?? 'NA';
    return `${m}: ${v}`;
  }).join(' | ');

  autoTable(doc, {
    ...commonTableStyles,
    startY: doc.lastAutoTable.finalY + 3,
    head: [[{ content: 'II. Identificación del Indicador', colSpan: 2 }]],
    body: [
      ['Nombre del indicador*', identificacion.nombre_indicador || ''],
      ['Definición del indicador*', identificacion.definicion_indicador || ''],
      ['Tipo de indicador*', identificacion.tipo_indicador || 'Gestión'],
      ['Dimensión*', identificacion.dimension || 'Eficacia'],
      ['Método de cálculo*', identificacion.metodo_calculo || ''],
      ['Variables para el cálculo', identificacion.variables_calculo || ''],
      ['Unidad de medida*', identificacion.unidad_medida || 'Porcentaje'],
      ['Frecuencia de medición*', identificacion.frecuencia_medicion || 'Mensual'],
      ['Meta Anual / Línea Base', `Meta: ${identificacion.meta_anual || '100%'}  |  Línea Base: ${identificacion.linea_base || '100%'}`],
      ['Sentido del indicador', identificacion.sentido_indicador || 'Ascendente'],
      ['Cumplimiento Mensual', valsMensuales],
      ['Supuestos (Riesgos)', identificacion.supuestos || 'No contar con recursos suficientes o contingencias operativas.']
    ]
  });

  // Sección III: Atributos del Indicador (CREMAA)
  autoTable(doc, {
    ...commonTableStyles,
    startY: doc.lastAutoTable.finalY + 3,
    head: [[{ content: 'III. Atributos del Indicador (Criterios CREMAA)', colSpan: 2 }]],
    body: [
      ['Claridad', cremaa.claridad || 'Permite evaluar el cumplimiento de metas'],
      ['Relevancia', cremaa.relevancia || 'Indispensable para la toma de decisiones'],
      ['Economía', cremaa.economia || 'Generación digital mediante el Portal SGC'],
      ['Monitoreable', cremaa.monitoreable || 'Trazabilidad auditable en el sistema OOMRSC-05'],
      ['Adecuado', cremaa.adecuado || 'Refleja la capacidad institucional del área'],
      ['Aportación marginal', cremaa.aportacion_marginal || 'Alineado al Plan Municipal de Desarrollo']
    ]
  });

  // Sección IV, V y VI en una sola tabla de cierre
  const genMujeres = transversalidad.genero_mujeres !== false ? 'Sí (X)' : 'No ( )';
  const genHombres = transversalidad.genero_hombres !== false ? 'Sí (X)' : 'No ( )';

  autoTable(doc, {
    ...commonTableStyles,
    startY: doc.lastAutoTable.finalY + 3,
    head: [[{ content: 'IV. Variables, V. Transversalidad y VI. Información Adicional', colSpan: 2 }]],
    body: [
      ['Medios de verificación', variables.medios_verificacion || 'Cuadro de Control OOMRSC-05 y reportes del sistema.'],
      ['Método de recopilación', variables.metodo_recopilacion || 'Sistema digital OOMAPASC y validación de área.'],
      ['Transversalidad (Género)', `Mujeres: ${genMujeres}   |   Hombres: ${genHombres}   |   Otro: ${transversalidad.otro || 'No aplica'}`],
      ['Titular Responsable', `${infoAdic.titular_unidad || 'Encargado'} - ${infoAdic.cargo_titular || 'Titular de Área'}`],
      ['Fecha de elaboración', infoAdic.fecha_elaboracion || '08 de Noviembre 2024'],
      ['Notas', infoAdic.notas || 'Formato oficial de Ficha Técnica PMD / Presupuesto de Egresos.']
    ]
  });

  // Firmas
  let finalY = doc.lastAutoTable.finalY + 12;
  if (finalY > 240) {
    doc.addPage();
    finalY = 25;
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(25, finalY, 90, finalY);
  doc.line(125, finalY, 190, finalY);

  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('ELABORÓ / TITULAR DE ÁREA', 57.5, finalY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(infoAdic.titular_unidad || 'Encargado del Área', 57.5, finalY + 8, { align: 'center' });
  doc.text(infoAdic.cargo_titular || 'Titular Responsable', 57.5, finalY + 12, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.text('VALIDACIÓN INSTITUCIONAL SGC', 157.5, finalY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Mtra. Mariana Pérez Chávez', 157.5, finalY + 8, { align: 'center' });
  doc.text('Coordinadora del Sistema de Gestión de Calidad', 157.5, finalY + 12, { align: 'center' });

  const fileName = `Ficha_Tecnica_Ind_${indNum}_${(identificacion.nombre_indicador || 'Indicador').substring(0, 25).replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
  return fileName;
}

/**
 * Genera el documento PDF oficial del Formato de Presentación de Proyectos (Presupuesto de Egresos).
 */
export function exportarProyectoPresupuestoPDF(proyecto) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  // Encabezado
  doc.setFillColor(11, 25, 44);
  doc.rect(14, 12, 187, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('H. AYUNTAMIENTO DE CAJEME · TESORERÍA MUNICIPAL', 107.5, 19, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`FORMATO DE PRESENTACIÓN DE PROYECTOS · ${proyecto.clave_programa || 'PRESUPUESTO 2026'}`, 107.5, 25, { align: 'center' });

  // Tabla 1: Datos Generales
  autoTable(doc, {
    theme: 'grid',
    startY: 34,
    styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59], lineColor: [203, 213, 225], lineWidth: 0.15 },
    headStyles: { fillColor: [11, 25, 44], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 55, fontStyle: 'bold', fillColor: [241, 245, 249] }, 1: { cellWidth: 'auto' } },
    head: [[{ content: 'Datos Generales del Proyecto Presupuestario', colSpan: 2 }]],
    body: [
      ['Dependencia / Paramunicipal', proyecto.dependencia || 'OOMAPAS DE CAJEME'],
      ['Unidad Responsable', proyecto.unidad_responsable || 'DIRECCIÓN GENERAL'],
      ['Eje Rector PMD', proyecto.eje_rector_pmd || 'CAJEME LIMPIO Y ORDENADO'],
      ['Programa PMD', proyecto.programa_pmd || 'DESARROLLO CON SERVICIOS PÚBLICOS DE CALIDAD'],
      ['Programa Presupuestario', proyecto.nombre_programa || 'PP10 GESTIÓN Y FORTALECIMIENTO DEL OOMAPASC'],
      ['Tipo de proyecto', `${proyecto.tipo_proyecto || 'Operación Básica del Área'} ( X )`],
      ['Nombre del proyecto', proyecto.nombre_proyecto || ''],
      ['Vigencia', `Del ${proyecto.fecha_inicio || '1 de enero 2026'} al ${proyecto.fecha_conclusion || '31 de diciembre 2026'}`]
    ]
  });

  // Resumen, Justificación y Objetivo
  autoTable(doc, {
    theme: 'grid',
    startY: doc.lastAutoTable.finalY + 3,
    styles: { fontSize: 7.5, cellPadding: 2.5, textColor: [30, 41, 59], lineColor: [203, 213, 225], lineWidth: 0.15 },
    headStyles: { fillColor: [30, 62, 98], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 45, fontStyle: 'bold', fillColor: [248, 250, 252] }, 1: { cellWidth: 'auto' } },
    body: [
      ['Resumen ejecutivo (Máx. 150 palabras)', proyecto.resumen_ejecutivo || ''],
      ['Justificación (Máx. 350 palabras)', proyecto.justificacion || ''],
      ['Objetivo (Máx. 50 palabras)', proyecto.objetivo || '']
    ]
  });

  // Matriz de Actividades e Indicadores
  const rowsAct = (proyecto.actividades_indicadores || []).map(item => {
    const t = item.trimestres || {};
    return [
      item.actividad || '',
      item.indicador || '',
      item.unidad_medida || 'Porcentaje',
      item.meta || '',
      t.t1 || '',
      t.t2 || '',
      t.t3 || '',
      t.t4 || ''
    ];
  });

  autoTable(doc, {
    theme: 'grid',
    startY: doc.lastAutoTable.finalY + 3,
    styles: { fontSize: 7, cellPadding: 1.8, textColor: [30, 41, 59], lineColor: [203, 213, 225], lineWidth: 0.15 },
    headStyles: { fillColor: [11, 25, 44], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    head: [
      [{ content: 'Matriz de Actividades, Indicadores y Calendario Trimestral', colSpan: 8 }],
      ['Actividad', 'Indicador', 'Unidad', 'Meta', 'I', 'II', 'III', 'IV']
    ],
    body: rowsAct,
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 50 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 17, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 12, halign: 'center' },
      7: { cellWidth: 12, halign: 'center' }
    }
  });

  // Cuantificación de Recursos por Capítulo
  const fmtMonto = (m) => typeof m === 'number' ? `$${m.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : (m || '$0');
  const presDict = proyecto.presupuesto_capitulos || {};
  const rowsPres = Object.keys(presDict).map(k => {
    const cap = presDict[k];
    return [
      cap.capitulo || '',
      fmtMonto(cap.anual),
      fmtMonto(cap.t1),
      fmtMonto(cap.t2),
      fmtMonto(cap.t3),
      fmtMonto(cap.t4)
    ];
  });

  autoTable(doc, {
    theme: 'grid',
    startY: doc.lastAutoTable.finalY + 3,
    styles: { fontSize: 7, cellPadding: 1.8, textColor: [30, 41, 59], lineColor: [203, 213, 225], lineWidth: 0.15 },
    headStyles: { fillColor: [30, 62, 98], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    head: [
      [{ content: 'Cuantificación de Recursos Presupuestarios (Armonización CONAC)', colSpan: 6 }],
      ['Capítulo de Gasto', 'Presupuesto Anual', '1er. Trim.', '2do. Trim.', '3er. Trim.', '4to. Trim.']
    ],
    body: rowsPres,
    columnStyles: {
      0: { cellWidth: 67, fontStyle: 'bold' },
      1: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 24, halign: 'right' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' }
    }
  });

  // Firmas
  let finalY = doc.lastAutoTable.finalY + 12;
  if (finalY > 240) {
    doc.addPage();
    finalY = 25;
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(25, finalY, 90, finalY);
  doc.line(125, finalY, 190, finalY);

  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('TITULAR DE LA UNIDAD RESPONSABLE', 57.5, finalY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(proyecto.titular || 'LIC. LUIS ALBERTO RUIZ CORONADO', 57.5, finalY + 8, { align: 'center' });
  doc.text(proyecto.cargo_titular || 'DIRECTOR GENERAL', 57.5, finalY + 12, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.text('VALIDACIÓN TESORERÍA MUNICIPAL', 157.5, finalY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('LIC. LUIS ALBERTO RUIZ CORONADO', 157.5, finalY + 8, { align: 'center' });
  doc.text('DIRECTOR GENERAL OOMAPASC', 157.5, finalY + 12, { align: 'center' });

  const fileName = `Presentacion_Proyecto_${proyecto.clave_programa || 'Presupuesto_2026'}.pdf`;
  doc.save(fileName);
  return fileName;
}

/**
 * Descarga el archivo oficial Word (.docx) de la Ficha Técnica conectándose con el backend.
 */
export async function descargarFichaTecnicaDocx(ficha) {
  try {
    const res = await fetch('/api/v1/fichas/exportar-ficha-docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ficha })
    });

    if (!res.ok) {
      throw new Error('Error en el servidor al generar documento Word');
    }

    const blob = await res.blob();
    const indNum = ficha.indicador_numero ?? ficha.indicador_id ?? 0;
    const indNombre = (ficha.identificacion?.nombre_indicador || 'Indicador').substring(0, 25).replace(/\s+/g, '_');
    const fileName = `Ficha_Tecnica_Ind_${indNum}_${indNombre}.docx`;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  } catch (error) {
    console.error('Error descargando Ficha DOCX:', error);
    throw error;
  }
}

/**
 * Descarga el archivo oficial Word (.docx) del Formato de Presentación de Proyectos.
 */
export async function descargarProyectoPresupuestoDocx(proyecto) {
  try {
    const res = await fetch('/api/v1/fichas/exportar-proyecto-docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proyecto })
    });

    if (!res.ok) {
      throw new Error('Error en el servidor al generar documento Word');
    }

    const blob = await res.blob();
    const progClave = proyecto.clave_programa || 'Proyecto';
    const fileName = `Presentacion_Proyecto_${progClave}_Presupuesto_2026.docx`;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  } catch (error) {
    console.error('Error descargando Proyecto DOCX:', error);
    throw error;
  }
}
