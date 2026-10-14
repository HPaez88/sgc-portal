/**
 * services/fichaTecnicaExporter.js — Generador y Descargador de Documentos Oficiales
 * para Fichas Técnicas del PMD y Presentación de Proyectos (H. Ayuntamiento de Cajeme).
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { descargarBlob } from './apiClient';
import { evalSemaforoOOMRSC05 } from '../constants/indicadores';

export const MESES_CLAVE = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
export const MESES_CABECERA = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

/**
 * Mapea los resultados del SGC para un indicador y ejercicio fiscal,
 * calculando en tiempo real su porcentaje y color de semáforo oficial (Verde / Amarillo / Rojo).
 */
export function mapearResultadosMensualesIndicador(indicadorId, ejercicio = 2026, valoresMensuales = {}, meta = 100, esMenor = false) {
  const numMeta = parseFloat(String(meta).replace(/[^0-9.]/g, '')) || 100;

  return MESES_CLAVE.map((m, idx) => {
    const claveFull = `${indicadorId}-${m}-${ejercicio}`;
    const claveNum = `${Number(indicadorId)}-${m}-${ejercicio}`;

    let rawItem = valoresMensuales?.[claveFull] ?? valoresMensuales?.[claveNum];
    let valor = rawItem?.valor !== undefined ? rawItem.valor : null;

    if (valor === null || valor === undefined) {
      const vPlano = valoresMensuales?.[m] ?? valoresMensuales?.[m.toLowerCase()] ?? valoresMensuales?.[m.toUpperCase()];
      if (vPlano !== undefined && vPlano !== null && vPlano !== 'NA' && vPlano !== '') {
        valor = typeof vPlano === 'object' ? vPlano?.valor : vPlano;
      }
    }

    if (valor !== null && valor !== undefined && valor !== '' && valor !== 'NA' && !isNaN(Number(valor))) {
      const numVal = Number(valor);
      const sem = evalSemaforoOOMRSC05(numVal, numMeta, esMenor);
      const esCritico = sem.rango === 'CRITICO' || sem.cumple === 'NO';
      const esPreventivo = sem.rango === 'PREVENTIVO';
      return {
        mes: MESES_CABECERA[idx],
        clave: m,
        valor: numVal,
        texto: `${numVal}%`,
        porcentaje: sem.porcentaje ?? numVal,
        rango: sem.rango,
        colorHex: esCritico ? '#EF4444' : esPreventivo ? '#EAB308' : '#22C55E',
        colorRgb: esCritico ? [239, 68, 68] : esPreventivo ? [234, 179, 8] : [34, 197, 94],
        textColorRgb: [255, 255, 255],
        cumple: sem.cumple
      };
    }

    return {
      mes: MESES_CABECERA[idx],
      clave: m,
      valor: null,
      texto: '',
      porcentaje: null,
      rango: 'SIN_CAPTURA',
      colorHex: '#FFFFFF',
      colorRgb: [255, 255, 255],
      textColorRgb: [148, 163, 184],
      cumple: 'PENDIENTE'
    };
  });
}

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
  doc.setFillColor(42, 120, 176); // #2A78B0 Azul institucional H. Ayuntamiento de Cajeme
  doc.rect(14, 12, 187, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('H. AYUNTAMIENTO DE CAJEME · OOMAPAS DE CAJEME', 107.5, 19, { align: 'center' });

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`FICHA TÉCNICA DE INDICADOR #${indNum} · PRESUPUESTO DE EGRESOS 2026`, 107.5, 25, { align: 'center' });

  let startY = 34;

  // Estilo de tabla común con azul institucional
  const commonTableStyles = {
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [186, 215, 233],
      lineWidth: 0.15,
      valign: 'middle'
    },
    headStyles: {
      fillColor: [42, 120, 176], // #2A78B0 Azul institucional
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', fillColor: [242, 246, 250] },
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
  const metaVal = identificacion.meta_anual || identificacion.meta || 100;
  const mesesEvaluados = mapearResultadosMensualesIndicador(
    indNum, 
    2026, 
    valoresMensuales, 
    metaVal, 
    identificacion.sentido_indicador === 'Descendente'
  );

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
      ['Sentido del indicador', identificacion.sentido_indicador || 'Ascendente']
    ]
  });

  // TABLA OFICIAL MUNICIPAL DE CUMPLIMIENTO MENSUAL (12 MESES SEMAFORIZADOS)
  const headCumplimiento = [
    { content: 'Cumplimiento', styles: { fontStyle: 'bold', fillColor: [242, 246, 250], textColor: [30, 41, 59], halign: 'left', cellWidth: 31 } },
    ...mesesEvaluados.map(m => ({
      content: m.mes,
      styles: { halign: 'center', fillColor: [42, 120, 176], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 6.8 }
    }))
  ];

  const bodyCumplimiento = [
    [
      { content: 'Resultado Oficial', styles: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [51, 65, 85], halign: 'left' } },
      ...mesesEvaluados.map(m => ({
        content: m.texto || ' ',
        styles: {
          halign: 'center',
          fontStyle: 'bold',
          fontSize: 6.8,
          fillColor: m.colorRgb,
          textColor: m.valor !== null ? [255, 255, 255] : [148, 163, 184]
        }
      }))
    ]
  ];

  autoTable(doc, {
    theme: 'grid',
    startY: doc.lastAutoTable.finalY + 1.5,
    styles: {
      fontSize: 6.8,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
      lineColor: [186, 215, 233],
      lineWidth: 0.15,
      valign: 'middle'
    },
    head: [headCumplimiento],
    body: bodyCumplimiento
  });

  // Supuestos / Riesgos
  autoTable(doc, {
    ...commonTableStyles,
    startY: doc.lastAutoTable.finalY + 1.5,
    body: [
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
export async function descargarFichaTecnicaDocx(ficha, valoresMensuales = {}) {
  try {
    const indNum = ficha.indicador_numero ?? ficha.indicador_id ?? 0;
    const metaVal = ficha.identificacion?.meta_anual || ficha.identificacion?.meta || 100;
    const mesesEvaluados = mapearResultadosMensualesIndicador(
      indNum, 
      2026, 
      valoresMensuales, 
      metaVal, 
      ficha.identificacion?.sentido_indicador === 'Descendente'
    );

    const dictMensual = {};
    mesesEvaluados.forEach(m => {
      dictMensual[m.mes] = {
        valor: m.valor,
        texto: m.texto,
        porcentaje: m.porcentaje,
        colorHex: m.colorHex.replace('#', ''),
        rango: m.rango
      };
    });

    const fichaConMensuales = {
      ...ficha,
      cumplimiento_mensual: dictMensual
    };

    const res = await fetch('/api/v1/fichas/exportar-ficha-docx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ficha: fichaConMensuales })
    });

    if (!res.ok) {
      throw new Error('Error en el servidor al generar documento Word');
    }

    const blob = await res.blob();
    const indNombre = (ficha.identificacion?.nombre_indicador || 'Indicador').substring(0, 25).replace(/\s+/g, '_');
    const fileName = `Ficha_Tecnica_Ind_${indNum}_${indNombre}.docx`;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 500);
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
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 500);
    return true;
  } catch (error) {
    console.error('Error descargando Proyecto DOCX:', error);
    throw error;
  }
}

/**
 * Genera el documento PDF oficial de Cuantificación de Recursos Presupuestarios
 * por Capítulos de Gasto (Armonización CONAC) para una ficha/proyecto individual.
 */
export function exportarCuantificacionRecursosCONAC_PDF(proyecto) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const fmtMonto = (m) => typeof m === 'number' ? `$${m.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (m || '$0.00');

  // Encabezado institucional
  doc.setFillColor(11, 25, 44);
  doc.rect(14, 12, 187, 21, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('H. AYUNTAMIENTO DE CAJEME · TESORERÍA MUNICIPAL', 107.5, 18, { align: 'center' });

  doc.setFontSize(9);
  doc.text('OOMAPAS DE CAJEME · PRESUPUESTO DE EGRESOS 2026', 107.5, 24, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('CUANTIFICACIÓN DE RECURSOS PRESUPUESTARIOS POR CAPÍTULOS DE GASTO (ARMONIZACIÓN CONAC)', 107.5, 29.5, { align: 'center' });

  // Datos de la ficha / proyecto
  autoTable(doc, {
    theme: 'grid',
    startY: 37,
    styles: { fontSize: 7.8, cellPadding: 2, textColor: [30, 41, 59], lineColor: [203, 213, 225], lineWidth: 0.15 },
    headStyles: { fillColor: [30, 62, 98], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold', fillColor: [241, 245, 249] }, 1: { cellWidth: 'auto' } },
    head: [[{ content: 'Ficha Técnica del Proyecto Presupuestario', colSpan: 2 }]],
    body: [
      ['Programa Presupuestario', `${proyecto.clave_programa || ''} - ${proyecto.nombre_programa || ''}`],
      ['Unidad Responsable', proyecto.unidad_responsable || 'DIRECCIÓN GENERAL'],
      ['Eje Rector PMD', proyecto.eje_rector_pmd || 'CAJEME LIMPIO Y ORDENADO'],
      ['Programa PMD', proyecto.programa_pmd || 'DESARROLLO CON SERVICIOS PÚBLICOS DE CALIDAD'],
      ['Tipo de Proyecto', proyecto.tipo_proyecto || 'Operación Básica del Área'],
      ['Titular Responsable', `${proyecto.titular || ''} (${proyecto.cargo_titular || ''})`],
      ['Vigencia Fiscal', `Del ${proyecto.fecha_inicio || '01-enero-2026'} al ${proyecto.fecha_conclusion || '31-diciembre-2026'}`]
    ]
  });

  // Tabla CONAC
  const presDict = proyecto.presupuesto_capitulos || {};
  const totalAnual = presDict.total?.anual || 1;
  const rowsPres = Object.keys(presDict).map(k => {
    const cap = presDict[k];
    const isTotal = k === 'total';
    const pct = totalAnual > 0 && cap.anual ? ((cap.anual / totalAnual) * 100).toFixed(1) + '%' : '-';
    return [
      cap.capitulo || '',
      fmtMonto(cap.anual),
      fmtMonto(cap.t1),
      fmtMonto(cap.t2),
      fmtMonto(cap.t3),
      fmtMonto(cap.t4),
      isTotal ? '100.0%' : pct
    ];
  });

  autoTable(doc, {
    theme: 'grid',
    startY: doc.lastAutoTable.finalY + 4,
    styles: { fontSize: 7.2, cellPadding: 2.2, textColor: [30, 41, 59], lineColor: [203, 213, 225], lineWidth: 0.15 },
    headStyles: { fillColor: [11, 25, 44], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    head: [
      [{ content: 'Desglose Oficial por Capítulos de Gasto y Calendario de Egresos', colSpan: 7 }],
      ['Capítulo de Gasto (Clasificador CONAC)', 'Presupuesto Anual', '1er. Trim.', '2do. Trim.', '3er. Trim.', '4to. Trim.', '% Pct.']
    ],
    body: rowsPres,
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 22, halign: 'right' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
    }
  });

  // Nota legal / normativa
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'italic');
  doc.text(
    '* Cuantificación presupuestal elaborada en estricto apego a los Clasificadores por Objeto del Gasto emitidos por el Consejo Nacional de Armonización Contable (CONAC) y los Lineamientos de la Tesorería Municipal del H. Ayuntamiento de Cajeme.',
    14,
    doc.lastAutoTable.finalY + 6,
    { maxWidth: 187 }
  );

  // Firmas
  let finalY = doc.lastAutoTable.finalY + 20;
  if (finalY > 235) {
    doc.addPage();
    finalY = 30;
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

  const fileName = `Cuantificacion_CONAC_${proyecto.clave_programa || 'Proyecto'}_2026.pdf`;
  doc.save(fileName);
  return fileName;
}

/**
 * Genera el documento PDF oficial consolidado de Cuantificación de Recursos Presupuestarios
 * con TODAS las Fichas de Proyectos y sus Capítulos de Gasto CONAC por separado.
 */
export function exportarConsolidadoCONAC_PDF(listaProyectos) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const fmtMonto = (m) => typeof m === 'number' ? `$${m.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : (m || '$0.00');

  // Encabezado principal
  doc.setFillColor(11, 25, 44);
  doc.rect(14, 12, 187, 22, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('H. AYUNTAMIENTO DE CAJEME · TESORERÍA MUNICIPAL', 107.5, 18, { align: 'center' });

  doc.setFontSize(9);
  doc.text('OOMAPAS DE CAJEME · PRESUPUESTO DE EGRESOS 2026', 107.5, 24, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('REPORTE CONSOLIDADO INSTITUCIONAL DE CAPÍTULOS DE GASTO (ARMONIZACIÓN CONAC)', 107.5, 29.5, { align: 'center' });

  // 1. Calcular Gran Total Sumatoria Institucional
  const capKeys = ['c1000', 'c2000', 'c3000', 'c4000', 'c5000', 'c6000', 'c7000'];
  const capNombres = {
    c1000: '1000 Servicios Personales',
    c2000: '2000 Materiales y Suministros',
    c3000: '3000 Servicios Generales',
    c4000: '4000 Transferencias, Asignaciones, Subsidios y Otras Ayudas',
    c5000: '5000 Bienes Muebles, Inmuebles e Intangibles',
    c6000: '6000 Inversión Pública',
    c7000: '7000 Inversiones Financieras y Otras Provisiones'
  };

  const granTotalCapitulos = {};
  capKeys.forEach(k => {
    granTotalCapitulos[k] = { capitulo: capNombres[k], anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 };
  });
  let granTotalGeneral = { capitulo: 'MONTO SOLICITADO TOTAL INSTITUCIONAL', anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 };

  listaProyectos.forEach(proy => {
    const pc = proy.presupuesto_capitulos || {};
    capKeys.forEach(k => {
      if (pc[k]) {
        granTotalCapitulos[k].anual += Number(pc[k].anual || 0);
        granTotalCapitulos[k].t1 += Number(pc[k].t1 || 0);
        granTotalCapitulos[k].t2 += Number(pc[k].t2 || 0);
        granTotalCapitulos[k].t3 += Number(pc[k].t3 || 0);
        granTotalCapitulos[k].t4 += Number(pc[k].t4 || 0);
      }
    });
    if (pc.total) {
      granTotalGeneral.anual += Number(pc.total.anual || 0);
      granTotalGeneral.t1 += Number(pc.total.t1 || 0);
      granTotalGeneral.t2 += Number(pc.total.t2 || 0);
      granTotalGeneral.t3 += Number(pc.total.t3 || 0);
      granTotalGeneral.t4 += Number(pc.total.t4 || 0);
    }
  });

  // Gran Tabla Institucional Concentrada
  const rowsGranTotal = capKeys.map(k => {
    const c = granTotalCapitulos[k];
    const pct = granTotalGeneral.anual > 0 && c.anual > 0 ? ((c.anual / granTotalGeneral.anual) * 100).toFixed(1) + '%' : '0.0%';
    return [
      c.capitulo,
      fmtMonto(c.anual),
      fmtMonto(c.t1),
      fmtMonto(c.t2),
      fmtMonto(c.t3),
      fmtMonto(c.t4),
      pct
    ];
  });

  rowsGranTotal.push([
    granTotalGeneral.capitulo,
    fmtMonto(granTotalGeneral.anual),
    fmtMonto(granTotalGeneral.t1),
    fmtMonto(granTotalGeneral.t2),
    fmtMonto(granTotalGeneral.t3),
    fmtMonto(granTotalGeneral.t4),
    '100.0%'
  ]);

  autoTable(doc, {
    theme: 'grid',
    startY: 38,
    styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59], lineColor: [203, 213, 225], lineWidth: 0.15 },
    headStyles: { fillColor: [11, 25, 44], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    head: [
      [{ content: `Gran Concentrado Institucional de Egresos (${listaProyectos.length} Fichas de Proyectos)`, colSpan: 7 }],
      ['Capítulo de Gasto CONAC', 'Total Anual', '1er. Trimestre', '2do. Trimestre', '3er. Trimestre', '4to. Trimestre', '% Pct.']
    ],
    body: rowsGranTotal,
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
      2: { cellWidth: 22, halign: 'right' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
    }
  });

  // 2. Desglose Individual de cada Ficha de Proyecto por separado
  listaProyectos.forEach((proy, pIdx) => {
    if (doc.lastAutoTable.finalY > 215) {
      doc.addPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(11, 25, 44);
      doc.text(`DESGLOSE POR FICHA PRESUPUESTARIA`, 14, 16);
    }

    const startDesgloseY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 6 : 22;

    const pc = proy.presupuesto_capitulos || {};
    const proyTotalAnual = pc.total?.anual || 1;
    const rowsProy = Object.keys(pc).map(k => {
      const cap = pc[k];
      const isTotal = k === 'total';
      const pct = proyTotalAnual > 0 && cap.anual ? ((cap.anual / proyTotalAnual) * 100).toFixed(1) + '%' : '-';
      return [
        cap.capitulo || '',
        fmtMonto(cap.anual),
        fmtMonto(cap.t1),
        fmtMonto(cap.t2),
        fmtMonto(cap.t3),
        fmtMonto(cap.t4),
        isTotal ? '100.0%' : pct
      ];
    });

    autoTable(doc, {
      theme: 'grid',
      startY: startDesgloseY,
      styles: { fontSize: 6.8, cellPadding: 1.8, textColor: [30, 41, 59], lineColor: [203, 213, 225], lineWidth: 0.15 },
      headStyles: { fillColor: [30, 62, 98], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      head: [
        [{ content: `Ficha ${pIdx + 1}: ${proy.clave_programa} · ${proy.nombre_programa} | UR: ${proy.unidad_responsable}`, colSpan: 7 }],
        ['Capítulo de Gasto CONAC', 'Presupuesto Anual', '1er. Trim.', '2do. Trim.', '3er. Trim.', '4to. Trim.', '% Pct.']
      ],
      body: rowsProy,
      columnStyles: {
        0: { cellWidth: 55, fontStyle: 'bold' },
        1: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
        2: { cellWidth: 22, halign: 'right' },
        3: { cellWidth: 22, halign: 'right' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 22, halign: 'right' },
        6: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
      }
    });
  });

  // Firmas Finales
  let finalY = doc.lastAutoTable.finalY + 16;
  if (finalY > 235) {
    doc.addPage();
    finalY = 30;
  }

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(25, finalY, 90, finalY);
  doc.line(125, finalY, 190, finalY);

  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('ORGANISMO OPERADOR OOMAPASC', 57.5, finalY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('LIC. LUIS ALBERTO RUIZ CORONADO', 57.5, finalY + 8, { align: 'center' });
  doc.text('DIRECTOR GENERAL', 57.5, finalY + 12, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.text('TESORERÍA MUNICIPAL DE CAJEME', 157.5, finalY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('VALIDACIÓN Y AUTORIZACIÓN', 157.5, finalY + 8, { align: 'center' });
  doc.text('PRESUPUESTO DE EGRESOS 2026', 157.5, finalY + 12, { align: 'center' });

  const fileName = `Consolidado_CONAC_Todas_las_Fichas_2026.pdf`;
  doc.save(fileName);
  return fileName;
}

/**
 * Genera el archivo CSV oficial de Cuantificación por Capítulos CONAC,
 * ya sea para una ficha en particular o para todas las fichas consolidadas.
 */
export function exportarCuantificacionCONAC_CSV(listaProyectos, proyectoActivo = null) {
  const lineas = [];

  lineas.push(['H. AYUNTAMIENTO DE CAJEME - TESORERÍA MUNICIPAL']);
  lineas.push(['OOMAPAS DE CAJEME - PRESUPUESTO DE EGRESOS 2026']);
  lineas.push(['CUANTIFICACIÓN DE RECURSOS PRESUPUESTARIOS POR CAPÍTULOS DE GASTO (ARMONIZACIÓN CONAC)']);
  lineas.push([]);

  if (proyectoActivo) {
    // Exportación de una sola ficha
    lineas.push([`FICHA: ${proyectoActivo.clave_programa} - ${proyectoActivo.nombre_programa}`]);
    lineas.push([`UNIDAD RESPONSABLE: ${proyectoActivo.unidad_responsable}`]);
    lineas.push([`EJE PMD: ${proyectoActivo.eje_rector_pmd}`]);
    lineas.push([`TITULAR: ${proyectoActivo.titular} (${proyectoActivo.cargo_titular})`]);
    lineas.push([]);
    lineas.push(['Capítulo de Gasto CONAC', 'Presupuesto Anual', '1er. Trimestre', '2do. Trimestre', '3er. Trimestre', '4to. Trimestre', '% Pct']);

    const pc = proyectoActivo.presupuesto_capitulos || {};
    const totalAnual = pc.total?.anual || 1;
    Object.keys(pc).forEach(k => {
      const cap = pc[k];
      const isTotal = k === 'total';
      const pct = totalAnual > 0 && cap.anual ? ((cap.anual / totalAnual) * 100).toFixed(2) + '%' : '0.00%';
      lineas.push([
        `"${cap.capitulo}"`,
        cap.anual || 0,
        cap.t1 || 0,
        cap.t2 || 0,
        cap.t3 || 0,
        cap.t4 || 0,
        isTotal ? '100.00%' : pct
      ]);
    });
  } else {
    // Exportación de todas las fichas consolidadas
    lineas.push(['=== CONSOLIDADO GENERAL INSTITUCIONAL OOMAPASC ===']);
    lineas.push(['Capítulo de Gasto CONAC', 'Presupuesto Anual', '1er. Trimestre', '2do. Trimestre', '3er. Trimestre', '4to. Trimestre']);

    const capKeys = ['c1000', 'c2000', 'c3000', 'c4000', 'c5000', 'c6000', 'c7000'];
    const capNombres = {
      c1000: '1000 Servicios Personales',
      c2000: '2000 Materiales y Suministros',
      c3000: '3000 Servicios Generales',
      c4000: '4000 Transferencias, Asignaciones, Subsidios y Otras Ayudas',
      c5000: '5000 Bienes Muebles, Inmuebles e Intangibles',
      c6000: '6000 Inversión Pública',
      c7000: '7000 Inversiones Financieras y Otras Provisiones'
    };

    const granTotalCapitulos = {};
    capKeys.forEach(k => {
      granTotalCapitulos[k] = { capitulo: capNombres[k], anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 };
    });
    let granTotalGeneral = { capitulo: 'MONTO SOLICITADO TOTAL INSTITUCIONAL', anual: 0, t1: 0, t2: 0, t3: 0, t4: 0 };

    listaProyectos.forEach(proy => {
      const pc = proy.presupuesto_capitulos || {};
      capKeys.forEach(k => {
        if (pc[k]) {
          granTotalCapitulos[k].anual += Number(pc[k].anual || 0);
          granTotalCapitulos[k].t1 += Number(pc[k].t1 || 0);
          granTotalCapitulos[k].t2 += Number(pc[k].t2 || 0);
          granTotalCapitulos[k].t3 += Number(pc[k].t3 || 0);
          granTotalCapitulos[k].t4 += Number(pc[k].t4 || 0);
        }
      });
      if (pc.total) {
        granTotalGeneral.anual += Number(pc.total.anual || 0);
        granTotalGeneral.t1 += Number(pc.total.t1 || 0);
        granTotalGeneral.t2 += Number(pc.total.t2 || 0);
        granTotalGeneral.t3 += Number(pc.total.t3 || 0);
        granTotalGeneral.t4 += Number(pc.total.t4 || 0);
      }
    });

    capKeys.forEach(k => {
      const c = granTotalCapitulos[k];
      lineas.push([`"${c.capitulo}"`, c.anual, c.t1, c.t2, c.t3, c.t4]);
    });
    lineas.push([`"${granTotalGeneral.capitulo}"`, granTotalGeneral.anual, granTotalGeneral.t1, granTotalGeneral.t2, granTotalGeneral.t3, granTotalGeneral.t4]);

    lineas.push([]);
    lineas.push(['=== DESGLOSE INDIVIDUAL POR CADA FICHA DE PROYECTO ===']);

    listaProyectos.forEach(proy => {
      lineas.push([]);
      lineas.push([`FICHA: ${proy.clave_programa} - ${proy.nombre_programa}`]);
      lineas.push([`UNIDAD RESPONSABLE: ${proy.unidad_responsable} | TITULAR: ${proy.titular}`]);
      lineas.push(['Capítulo de Gasto CONAC', 'Presupuesto Anual', '1er. Trimestre', '2do. Trimestre', '3er. Trimestre', '4to. Trimestre']);
      const pc = proy.presupuesto_capitulos || {};
      Object.keys(pc).forEach(k => {
        const cap = pc[k];
        lineas.push([`"${cap.capitulo}"`, cap.anual || 0, cap.t1 || 0, cap.t2 || 0, cap.t3 || 0, cap.t4 || 0]);
      });
    });
  }

  const csvContent = '\uFEFF' + lineas.map(e => e.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileName = proyectoActivo 
    ? `Cuantificacion_CONAC_${proyectoActivo.clave_programa || 'Ficha'}_2026.csv`
    : `Consolidado_CONAC_Todas_las_Fichas_2026.csv`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return fileName;
}

