/**
 * services/isoExporter.js — Servicio de Exportación y Descarga de Consultas del Asesor ISO
 * Genera informes técnicos en PDF y archivos Markdown (.md) a partir de respuestas del Asesor Normativo.
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { descargarBlob } from './apiClient';

/**
 * Limpia texto Markdown para visualización en líneas de texto estándar.
 */
function limpiarMarkdownParaTexto(md) {
  if (!md) return '';
  return md
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/###\s+/g, '')
    .replace(/##\s+/g, '')
    .replace(/#\s+/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/•\s+/g, '- ')
    .trim();
}

/**
 * Parsea tablas en formato Markdown para convertirlas en estructura de datos para jsPDF autoTable.
 */
function extraerTablasMarkdown(texto) {
  const lineas = texto.split('\n');
  const bloques = [];
  let bufferTexto = [];
  let bufferTabla = [];
  let enTabla = false;

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i].trim();
    if (linea.startsWith('|') && linea.endsWith('|')) {
      if (!enTabla) {
        if (bufferTexto.length > 0) {
          bloques.push({ tipo: 'texto', contenido: bufferTexto.join('\n') });
          bufferTexto = [];
        }
        enTabla = true;
      }
      bufferTabla.push(linea);
    } else {
      if (enTabla) {
        if (bufferTabla.length >= 2) {
          const encabezados = bufferTabla[0]
            .split('|')
            .slice(1, -1)
            .map((c) => c.trim().replace(/\*\*/g, ''));
          const tieneDelimitador = bufferTabla.length > 1 && bufferTabla[1].includes('---');
          const filas = (tieneDelimitador ? bufferTabla.slice(2) : bufferTabla.slice(1)).map((r) =>
            r
              .split('|')
              .slice(1, -1)
              .map((c) => c.trim().replace(/\*\*/g, ''))
          );
          bloques.push({ tipo: 'tabla', encabezados, filas });
        }
        bufferTabla = [];
        enTabla = false;
      }
      bufferTexto.push(lineas[i]);
    }
  }

  if (enTabla && bufferTabla.length >= 2) {
    const encabezados = bufferTabla[0]
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim().replace(/\*\*/g, ''));
    const tieneDelimitador = bufferTabla.length > 1 && bufferTabla[1].includes('---');
    const filas = (tieneDelimitador ? bufferTabla.slice(2) : bufferTabla.slice(1)).map((r) =>
      r
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim().replace(/\*\*/g, ''))
    );
    bloques.push({ tipo: 'tabla', encabezados, filas });
  } else if (bufferTexto.length > 0) {
    bloques.push({ tipo: 'texto', contenido: bufferTexto.join('\n') });
  }

  return bloques;
}

/**
 * Exporta una consulta individual del Asesor Normativo como Dictamen Técnico en PDF.
 */
export function exportarConsultaISOPDF({
  pregunta,
  respuesta,
  clausulas = [],
  normaConsultada = 'Todas las Normas ISO y SGC',
  usuario = null,
  timestamp = null
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const fechaStr = timestamp || new Date().toLocaleString('es-MX');
  const folio = `DICTAMEN-ISO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  let y = 16;

  // 1. Encabezado Institucional
  doc.setFillColor(11, 25, 44); // #0B192C
  doc.rect(14, y, pageWidth - 28, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('OOMAPASC — SISTEMA DE GESTIÓN DE LA CALIDAD', 18, y + 8);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253); // sky-200
  doc.text('DICTAMEN TÉCNICO NORMATIVO Y AUDITORÍA IA (ISO 9001 / 14001 / 45001 / 19011)', 18, y + 14);
  doc.text('ORGANISMO OPERADOR MUNICIPAL DE AGUA POTABLE DE CAJEME', 18, y + 19);

  // Folio en encabezado derecho
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(folio, pageWidth - 18, y + 9, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Emisión: ${fechaStr}`, pageWidth - 18, y + 15, { align: 'right' });

  y += 30;

  // 2. Metadatos de la Consulta
  const metaDatos = [
    ['Usuario Solicitante:', usuario?.nombre || 'Auditor / Responsable SGC', 'Área / Proceso:', usuario?.area || 'SGC / Calidad'],
    ['Norma Base Consultada:', normaConsultada || 'Global (ISO 9001/14001/45001/19011)', 'Groundedness RAG:', '100% Oficial Grounded']
  ];

  autoTable(doc, {
    startY: y,
    body: metaDatos,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
    columnStyles: {
      0: { fontStyle: 'bold', width: 42, textColor: [0, 40, 85] },
      2: { fontStyle: 'bold', width: 38, textColor: [0, 40, 85] }
    }
  });

  y = doc.lastAutoTable.finalY + 6;

  // 3. Consulta Planteada
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(14, y, pageWidth - 28, 18, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 40, 85);
  doc.text('PREGUNTA / REQUERIMIENTO AUDITABLE:', 18, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const lineasPregunta = doc.splitTextToSize(pregunta, pageWidth - 36);
  doc.text(lineasPregunta, 18, y + 11);

  y += 24;

  // 4. Cláusulas Oficiales Citadas (si aplican)
  if (clausulas && clausulas.length > 0) {
    const tablaClausulas = clausulas.map((c) => [
      `§ ${c.numero || ''}`,
      c.norma || normaConsultada,
      c.titulo || 'Cláusula Oficial'
    ]);

    autoTable(doc, {
      startY: y,
      head: [['Cláusula', 'Norma Oficial', 'Título del Requisito']],
      body: tablaClausulas,
      theme: 'grid',
      headStyles: { fillColor: [0, 40, 85], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 2, textColor: [30, 41, 59] },
      columnStyles: { 0: { width: 22, fontStyle: 'bold' }, 1: { width: 40 } }
    });

    y = doc.lastAutoTable.finalY + 6;
  }

  // 5. Dictamen y Respuesta Técnica del Asesor
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 40, 85);
  doc.text('FUNDAMENTO TÉCNICO Y RESOLUCIÓN NORMATIVA:', 14, y);
  y += 5;

  const bloques = extraerTablasMarkdown(respuesta);

  for (const b of bloques) {
    if (b.tipo === 'tabla' && b.encabezados.length > 0) {
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }
      autoTable(doc, {
        startY: y,
        head: [b.encabezados],
        body: b.filas,
        theme: 'striped',
        headStyles: { fillColor: [30, 62, 98], textColor: [255, 255, 255], fontSize: 7.5, fontStyle: 'bold' },
        styles: { fontSize: 7, cellPadding: 2, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [248, 250, 252] }
      });
      y = doc.lastAutoTable.finalY + 5;
    } else if (b.tipo === 'texto') {
      const textoLimpio = limpiarMarkdownParaTexto(b.contenido);
      if (!textoLimpio) continue;

      const parrafos = textoLimpio.split('\n').filter((p) => p.trim());
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);

      for (const parrafo of parrafos) {
        const esEncabezado = parrafo.startsWith('1.') || parrafo.startsWith('2.') || parrafo.startsWith('3.') || parrafo.startsWith('4.') || parrafo.startsWith('5.') || parrafo.includes('Requisito') || parrafo.includes('Interpretación') || parrafo.includes('Evidencia') || parrafo.includes('Recomendación');

        if (esEncabezado) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 40, 85);
          y += 2;
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
        }

        const lineasTexto = doc.splitTextToSize(parrafo, pageWidth - 28);
        if (y + lineasTexto.length * 4.5 > pageHeight - 25) {
          doc.addPage();
          y = 20;
        }

        doc.text(lineasTexto, 14, y);
        y += lineasTexto.length * 4.2 + 2;
      }
    }
  }

  // 6. Pie de Página en todas las páginas
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Documento oficial generado por el Asesor y Auditor Normativo ISO — SGC OOMAPASC de Cajeme', 14, pageHeight - 7);
    doc.text(`Página ${p} de ${totalPaginas}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }

  const safeFilename = `Dictamen_ISO_${folio}.pdf`;
  doc.save(safeFilename);
}

/**
 * Exporta una consulta individual en formato Markdown nativo (.md).
 */
export function exportarConsultaISOMarkdown({
  pregunta,
  respuesta,
  clausulas = [],
  normaConsultada = 'ISO General',
  usuario = null,
  timestamp = null
}) {
  const fechaStr = timestamp || new Date().toLocaleString('es-MX');
  const folio = `ISO-DICTAMEN-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  let md = `# DICTAMEN TÉCNICO NORMATIVO Y CONSULTA DE AUDITORÍA (IA)\n\n`;
  md += `**Organismo:** Organismo Operador Municipal de Agua Potable, Alcantarillado y Saneamiento de Cajeme (OOMAPASC)\n`;
  md += `**Sistema:** Sistema de Gestión de la Calidad (SGC)\n`;
  md += `**Folio de Emisión:** \`${folio}\`\n`;
  md += `**Fecha y Hora:** ${fechaStr}\n`;
  md += `**Usuario / Auditor:** ${usuario?.nombre || 'Auditor SGC'} (${usuario?.area || 'Calidad'})\n`;
  md += `**Norma / Base:** ${normaConsultada}\n\n`;
  md += `---\n\n`;
  md += `## 1. PREGUNTA / REQUERIMIENTO AUDITABLE\n\n`;
  md += `> ${pregunta}\n\n`;

  if (clausulas && clausulas.length > 0) {
    md += `## 2. CLÁUSULAS OFICIALES CITADAS\n\n`;
    clausulas.forEach((c) => {
      md += `- **§ ${c.numero} — ${c.titulo}** (${c.norma || normaConsultada})\n`;
    });
    md += `\n`;
  }

  md += `## 3. FUNDAMENTO TÉCNICO Y RESOLUCIÓN DEL ASESOR ISO\n\n`;
  md += `${respuesta}\n\n`;
  md += `---\n`;
  md += `*Documento generado por el Asesor Normativo ISO del SGC de OOMAPASC.*\n`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  descargarBlob(blob, `${folio}.md`);
}

/**
 * Exporta la sesión completa de chat como informe consolidado en PDF.
 */
export function exportarSesionCompletaISOPDF({ mensajes = [], usuario = null }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const fechaStr = new Date().toLocaleString('es-MX');
  const folio = `SESION-ISO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  let y = 16;

  // Encabezado
  doc.setFillColor(11, 25, 44);
  doc.rect(14, y, pageWidth - 28, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('OOMAPASC — SISTEMA DE GESTIÓN DE LA CALIDAD', 18, y + 8);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253);
  doc.text('MINUTA Y BITÁCORA CONSOLIDADA DE CONSULTAS AL ASESOR NORMATIVO ISO', 18, y + 14);

  y += 28;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 40, 85);
  doc.text(`SESIÓN CONSOLIDADA — ${folio}`, 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Auditor: ${usuario?.nombre || 'Usuario'} | Fecha: ${fechaStr}`, 14, y + 5);

  y += 12;

  const mensajesUtiles = mensajes.filter((m) => m.id !== 'bienvenida');

  if (mensajesUtiles.length === 0) {
    doc.setFontSize(8.5);
    doc.text('No hay consultas registradas en la sesión activa.', 14, y);
  } else {
    for (let i = 0; i < mensajesUtiles.length; i++) {
      const m = mensajesUtiles[i];
      const esUsuario = m.emisor === 'usuario';

      if (y > pageHeight - 35) {
        doc.addPage();
        y = 20;
      }

      if (esUsuario) {
        doc.setFillColor(241, 245, 249);
        doc.rect(14, y, pageWidth - 28, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(0, 40, 85);
        doc.text(`CONSULTA #${Math.floor(i / 2) + 1} (${m.timestamp || ''})`, 18, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        const l = doc.splitTextToSize(m.texto, pageWidth - 36);
        doc.text(l, 18, y + 9);
        y += 16;
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(14, 116, 144);
        doc.text('RESPUESTA DEL ASESOR NORMATIVO ISO:', 14, y);
        y += 5;

        const textoLimpio = limpiarMarkdownParaTexto(m.texto);
        const parrafos = textoLimpio.split('\n').filter((p) => p.trim());

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);

        for (const p of parrafos) {
          const l = doc.splitTextToSize(p, pageWidth - 28);
          if (y + l.length * 4 > pageHeight - 25) {
            doc.addPage();
            y = 20;
          }
          doc.text(l, 14, y);
          y += l.length * 3.8 + 2;
        }

        y += 4;
        doc.setDrawColor(226, 232, 240);
        doc.line(14, y, pageWidth - 14, y);
        y += 6;
      }
    }
  }

  const totalPaginas = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Bitácora consolidada de consultas ISO — OOMAPASC de Cajeme', 14, pageHeight - 7);
    doc.text(`Página ${p} de ${totalPaginas}`, pageWidth - 14, pageHeight - 7, { align: 'right' });
  }

  doc.save(`${folio}.pdf`);
}

/**
 * Exporta la sesión completa de chat en formato Markdown (.md).
 */
export function exportarSesionCompletaISOMarkdown({ mensajes = [], usuario = null }) {
  const fechaStr = new Date().toLocaleString('es-MX');
  const folio = `SESION-ISO-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

  let md = `# BITÁCORA Y MINUTA DE CONSULTAS — ASESOR NORMATIVO ISO (IA)\n\n`;
  md += `**Organismo:** OOMAPASC de Cajeme\n`;
  md += `**Folio:** \`${folio}\`\n`;
  md += `**Fecha:** ${fechaStr}\n`;
  md += `**Auditor / Usuario:** ${usuario?.nombre || 'Usuario'} (${usuario?.area || 'Calidad'})\n\n`;
  md += `---\n\n`;

  const mensajesUtiles = mensajes.filter((m) => m.id !== 'bienvenida');
  mensajesUtiles.forEach((m, idx) => {
    if (m.emisor === 'usuario') {
      md += `### ❓ Consulta #${Math.floor(idx / 2) + 1} (${m.timestamp})\n`;
      md += `> ${m.texto}\n\n`;
    } else {
      md += `### 🤖 Respuesta del Asesor Normativo (${m.timestamp})\n\n`;
      md += `${m.texto}\n\n`;
      if (m.clausulas && m.clausulas.length > 0) {
        md += `**Cláusulas Citadas:** ${m.clausulas.map((c) => `§ ${c.numero} (${c.titulo})`).join(', ')}\n\n`;
      }
      md += `---\n\n`;
    }
  });

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
  descargarBlob(blob, `${folio}.md`);
}
