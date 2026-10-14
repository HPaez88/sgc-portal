import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  Download, 
  CheckCircle2, 
  Cpu, 
  Database, 
  Lock, 
  Eye, 
  Layers, 
  BookOpen, 
  Scale, 
  UserCheck, 
  Server,
  ArrowRight,
  ExternalLink,
  Award
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '../common/Toast';

export default function GobernanzaIAView({ usuarioLogueado }) {
  const toast = useToast();

  const handleDescargarPoliticaPDF = () => {
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pageWidth - (margin * 2);

      const primaryColor = [11, 25, 44]; // #0B192C
      const accentColor = [14, 116, 144]; // #0E7490
      const darkSlate = [30, 41, 59];

      // Header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(margin, 10, contentWidth, 16, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('OOMAPASC DE CAJEME — SISTEMA DE GESTIÓN DE LA CALIDAD', margin + 4, 17);

      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(186, 230, 253);
      doc.text('POLÍTICA INSTITUCIONAL DE GOBERNANZA DE IA Y TI (POL-TI-01 REV. 01) · ISO/IEC 42001 & ISO 9001:2026', margin + 4, 22);

      // Metadatos
      let y = 32;
      const meta = [
        ['Clave Documental:', 'POL-TI-01', 'Revisión / Fecha:', 'REV. 01 · Enero 2026'],
        ['Área Emisora:', 'Informática & Coordinación SGC', 'Normas de Referencia:', 'ISO 9001:2026, ISO/IEC 42001:2023, ISO/IEC 27001'],
        ['Aprobado por:', 'Dirección General & Coordinador SGC', 'Estatus Normativo:', 'VIGENTE Y AUDITABLE']
      ];

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        body: meta,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 2, textColor: darkSlate },
        columnStyles: {
          0: { fontStyle: 'bold', width: 35, textColor: accentColor },
          2: { fontStyle: 'bold', width: 35, textColor: accentColor }
        }
      });

      y = doc.lastAutoTable.finalY + 6;

      const secciones = [
        {
          titulo: '1. PROPÓSITO Y ALCANCE INSTITUCIONAL',
          contenido: 'Establecer las directrices de operación, gobernanza y aseguramiento técnico para la integración de Inteligencia Artificial (IA) y Tecnologías de Información en el Sistema de Gestión de Calidad (SGC) de OOMAPASC de Cajeme. Aplica a todos los módulos: Acciones Correctivas (OOMRSC-20), Planes de Mejora (OOMRSC-21), Revisión por la Dirección (OOMRSC-04), Indicadores y Asesor Normativo.'
        },
        {
          titulo: '2. ARQUITECTURA RAG (GENERACIÓN AUMENTADA POR RECUPERACIÓN) Y FUENTES NORMATIVAS',
          contenido: 'El Asesor Normativo SGC opera mediante una arquitectura RAG estricta y determinista. La base de conocimiento se fundamenta exclusivamente en normas internacionales oficiales indexadas:\n• ISO 9001:2015 / ISO 9001:2026 — Sistemas de Gestión de la Calidad (Requisitos).\n• ISO 14001:2015 — Sistemas de Gestión Ambiental (Requisitos con orientación para su uso).\n• ISO 45001:2018 — Sistemas de Gestión de la Seguridad y Salud en el Trabajo (Requisitos).\n• ISO 19011:2018 — Directrices para la Auditoría de los Sistemas de Gestión.\n• ISO/IEC 42001:2023 — Sistemas de Gestión de Inteligencia Artificial (SGIA / AIMS).\n• ISO/IEC 27001:2022 — Sistemas de Gestión de Seguridad de la Información (SGSI).\n• ISO/IEC 20000-1:2018 — Gestión de Servicios de Tecnologías de la Información (GSTI).\n• Manual de Calidad, Procedimientos y Formatos Internos de OOMAPASC (OOMRSC-20, OOMRSC-21, OOMRSC-04).\nSe prohíben respuestas especulativas o no fundamentadas en cláusulas oficiales.'
        },
        {
          titulo: '3. PRINCIPIO FUNDAMENTAL: SUPERVISIÓN HUMANA (HUMAN-IN-THE-LOOP)',
          contenido: 'La IA actúa exclusivamente como asistente de análisis técnico y redacción preliminar. Ningún dictamen, aprobación de folio, cierre de acción correctiva ni autorización presupuestal se ejecuta de forma autónoma. Todas las sugerencias emitidas por el agente requieren la revisión, validación y firma electrónica del personal facultado.'
        },
        {
          titulo: '4. SEGURIDAD DE LA INFORMACIÓN, CONFIDENCIALIDAD Y NO ENTRENAMIENTO EXTERNO',
          contenido: 'Conforme a ISO/IEC 27001 y leyes de protección de datos personales, la información institucional de OOMAPASC (recaudación, padrón de usuarios, contratos) no se utiliza para entrenar modelos públicos de terceros ni queda retenida en repositorios no autorizados.'
        },
        {
          titulo: '5. TRAZABILIDAD Y REGISTRO EN BITÁCORA DE AUDITORÍA',
          contenido: 'Toda interacción, análisis de causa raíz o generación de plan de mejora asistido por IA queda registrado de forma inmutable en la Bitácora de Auditoría del SGC, identificando el usuario responsable, timestamp, folio y prompt utilizado para fines de auditoría interna y externa.'
        }
      ];

      secciones.forEach(sec => {
        if (y > pageHeight - 35) {
          doc.addPage();
          y = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(sec.titulo, margin, y);
        y += 4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(darkSlate[0], darkSlate[1], darkSlate[2]);
        const splitText = doc.splitTextToSize(sec.contenido, contentWidth);
        doc.text(splitText, margin, y);
        y += (splitText.length * 3.5) + 5;
      });

      // Firmas al pie
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      y += 5;
      doc.setDrawColor(203, 213, 225);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('VALIDACIÓN DE GOBERNANZA DE IA Y TI', pageWidth / 2, y, { align: 'center' });

      y += 15;
      doc.line(margin + 20, y, margin + 70, y);
      doc.line(pageWidth - margin - 70, y, pageWidth - margin - 20, y);

      doc.setFontSize(7);
      doc.text('COORDINACIÓN GENERAL SGC', margin + 45, y + 4, { align: 'center' });
      doc.text('DIRECCIÓN GENERAL / INFORMÁTICA', pageWidth - margin - 45, y + 4, { align: 'center' });

      const fileName = 'POL-TI-01_Gobernanza_IA_TI_OOMAPASC.pdf';
      doc.save(fileName);
      toast.exito(`Documento oficial "${fileName}" descargado exitosamente.`);
    } catch (err) {
      console.error(err);
      toast.error('Error al generar la política en PDF.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Encabezado Documental */}
      <div className="bg-gradient-to-r from-[#0B192C] via-[#0F294D] to-[#1E3E62] text-white p-6 rounded-2xl shadow-xl border border-slate-700/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 font-mono text-xs font-bold px-2.5 py-1 rounded-md tracking-wider">
                POL-TI-01 REV. 01
              </span>
              <span className="bg-sky-500/20 text-sky-300 border border-sky-400/30 text-xs font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <ShieldCheck size={14} />
                ISO/IEC 42001:2023 · ISO 9001:2026 · ISO/IEC 27001
              </span>
              <span className="text-slate-300 text-xs">
                Estatus: <strong className="text-emerald-300 font-bold">VIGENTE Y AUDITABLE</strong>
              </span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight">
              Política de Gobernanza de Inteligencia Artificial & TI en el SGC
            </h2>
            <p className="text-xs text-sky-100/80 leading-relaxed">
              Marco normativo institucional que regula la arquitectura RAG, el uso de normas ISO oficiales, los criterios evaluativos multi-norma, la supervisión humana y la confidencialidad de la información en OOMAPASC de Cajeme.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={handleDescargarPoliticaPDF}
              className="px-4 py-2.5 text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white rounded-xl shadow-lg hover:shadow-purple-500/25 transition-all flex items-center justify-center gap-2"
            >
              <Download size={16} />
              <span>Descargar Política Oficial PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Principios de Gobernanza */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
            <Database size={18} />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">
            1. RAG Normativo Estricto
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Las respuestas y recomendaciones del Asesor IA se fundamentan 100% en normas oficiales indexadas en el backend (ISO 9001, 14001, 45001, 19011) y procedimientos de OOMAPASC, garantizando cero alucinaciones.
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600 font-bold">
            <UserCheck size={18} />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">
            2. Supervisión Humana
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Principio <em>Human-in-the-Loop</em>: Ningún folio, acción correctiva, plan de mejora ni decisión de auditoría se aprueba de forma automática. Siempre se requiere validación por personal facultado.
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
            <Lock size={18} />
          </div>
          <h4 className="font-bold text-slate-900 text-sm">
            3. Seguridad y Privacidad
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Alineado con ISO/IEC 27001. Los datos de recaudación, padrón de agua y contratos no se utilizan para entrenar modelos públicos externos ni se comparten con terceros.
          </p>
        </div>
      </div>

      {/* DOCUMENTO NORMATIVO COMPLETO VISIBLE Y AUDITABLE */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
        {/* Encabezado del Documento */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded border border-purple-200">
              DOCUMENTO CONTROLADO SGC · OOMAPASC
            </span>
            <h3 className="text-xl font-bold text-slate-900 mt-2">
              POL-TI-01: Política Institucional de Uso y Gobernanza de Inteligencia Artificial y TI
            </h3>
            <p className="text-xs text-slate-500">
              Emisión: Enero 2026 · Organismo Operador Municipal de Agua Potable, Alcantarillado y Saneamiento de Cajeme
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
              <CheckCircle2 size={14} />
              Conformidad Auditada
            </span>
          </div>
        </div>

        {/* Sección 1: Propósito */}
        <div className="space-y-3">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
            <BookOpen size={16} className="text-purple-600" />
            1. Propósito y Campo de Aplicación
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed text-justify">
            La presente política tiene por objeto normar, regular y auditar el uso de tecnologías de Inteligencia Artificial (IA) generativa, modelos de lenguaje y sistemas de recuperación aumentada por recuperación (RAG) en el Sistema de Gestión de Calidad (SGC) de OOMAPASC de Cajeme. Garantiza que toda asistencia tecnológica opere bajo estrictos principios de ética, veracidad, trazabilidad, ciberseguridad y apego a la normativa internacional vigente <strong>ISO 9001:2015 / ISO 9001:2026</strong> y el estándar específico <strong>ISO/IEC 42001:2023</strong> para Sistemas de Gestión de IA.
          </p>
        </div>

        {/* Sección 2: Base de Conocimiento y Normas Oficiales */}
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
              <Layers size={16} className="text-sky-600" />
              2. Repositorio de Conocimiento Normativo Oficial (ISO & Ecosistema Multi-Gestión)
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed text-justify mt-1">
              Para garantizar que el Asesor Normativo y los generadores de borradores de Acciones Correctivas (OOMRSC-20) y Planes de Mejora (OOMRSC-21) no presenten inconsistencias normativas, el sistema consulta un repositorio estructurado de conocimiento indexado en el backend con las siguientes normas internacionales oficiales:
            </p>
          </div>

          {/* Sub-bloque A: Normas Core del SGC */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-[#002855] uppercase tracking-wider block">
              A) Normas Oficiales de Gestión y Auditoría (SGC Base):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <strong className="text-slate-900 font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 size={14} className="text-sky-600 shrink-0" />
                  ISO 9001:2015 / ISO 9001:2026
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Sistemas de Gestión de la Calidad — Requisitos.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <strong className="text-slate-900 font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                  ISO 14001:2015
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Sistemas de Gestión Ambiental — Requisitos con orientación para su uso.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <strong className="text-slate-900 font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 size={14} className="text-amber-600 shrink-0" />
                  ISO 45001:2018
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Sistemas de Gestión de la Seguridad y Salud en el Trabajo — Requisitos con orientación para su uso.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <strong className="text-slate-900 font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 size={14} className="text-purple-600 shrink-0" />
                  ISO 19011:2018
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Directrices para la Auditoría de los Sistemas de Gestión.
                </p>
              </div>
            </div>
          </div>

          {/* Sub-bloque B: Normas de Tecnologías de la Información (TI) y Gobernanza de Inteligencia Artificial (IA) */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-extrabold text-purple-900 uppercase tracking-wider block flex items-center gap-1.5">
              <Cpu size={14} className="text-purple-700" />
              B) Normas de Tecnologías de Información (TI) y Gobernanza de Inteligencia Artificial:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200 text-xs space-y-1">
                <strong className="text-purple-950 font-bold flex items-center gap-1.5 text-xs">
                  <Award size={13} className="text-purple-700 shrink-0" />
                  ISO/IEC 42001:2023
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Sistemas de Gestión de Inteligencia Artificial (SGIA / AIMS) — Requisitos para gobernanza ética, trazabilidad y gestión de riesgos en modelos de IA.
                </p>
              </div>

              <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200 text-xs space-y-1">
                <strong className="text-purple-950 font-bold flex items-center gap-1.5 text-xs">
                  <Lock size={13} className="text-purple-700 shrink-0" />
                  ISO/IEC 27001:2022
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Sistemas de Gestión de Seguridad de la Información (SGSI) — Confidencialidad, integridad, no repudio y ciberseguridad en bases de datos.
                </p>
              </div>

              <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200 text-xs space-y-1">
                <strong className="text-purple-950 font-bold flex items-center gap-1.5 text-xs">
                  <Server size={13} className="text-purple-700 shrink-0" />
                  ISO/IEC 20000-1:2018
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Gestión de Servicios de Tecnologías de la Información (GSTI) — Entrega, operación, mesa de ayuda y continuidad del servicio digital.
                </p>
              </div>

              <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200 text-xs space-y-1">
                <strong className="text-purple-950 font-bold flex items-center gap-1.5 text-xs">
                  <Scale size={13} className="text-purple-700 shrink-0" />
                  ISO/IEC 38500:2024
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Gobernanza de las Tecnologías de la Información para las Organizaciones — Principios rectores para la supervisión y dirección estratégica de TI.
                </p>
              </div>

              <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200 text-xs space-y-1 md:col-span-2">
                <strong className="text-purple-950 font-bold flex items-center gap-1.5 text-xs">
                  <BookOpen size={13} className="text-purple-700 shrink-0" />
                  ISO/IEC 22989:2022
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Tecnologías de la Información — Inteligencia Artificial — Conceptos Fundamentales, Ciclo de Vida y Terminología Normalizada.
                </p>
              </div>
            </div>
          </div>

          {/* Sub-bloque C: Normas Recomendadas para Integración Multi-Sistema de Gestión (Multi-SGC / Anexo SL) */}
          <div className="space-y-2 pt-1">
            <span className="text-xs font-extrabold text-teal-900 uppercase tracking-wider block flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-teal-700" />
              C) Normas Recomendadas para Ampliación a un Multi-Sistema de Gestión Integrado (HLS / Anexo SL):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-teal-50/40 rounded-xl border border-teal-200 text-xs space-y-1">
                <strong className="text-teal-950 font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 size={13} className="text-teal-700 shrink-0" />
                  ISO 37001:2016 — Sistemas de Gestión Antisoborno (SGAS)
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Prevención, detección y tratamiento de actos de soborno y corrupción en licitaciones, compras y gestión pública del agua.
                </p>
              </div>

              <div className="p-3.5 bg-teal-50/40 rounded-xl border border-teal-200 text-xs space-y-1">
                <strong className="text-teal-950 font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 size={13} className="text-teal-700 shrink-0" />
                  ISO 37301:2021 — Sistemas de Gestión de Cumplimiento (Compliance)
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Aseguramiento del cumplimiento legal, normativo, ambiental (CONAGUA/SEMARNAT) y sanitario (NOM-127-SSA1-2021).
                </p>
              </div>

              <div className="p-3.5 bg-teal-50/40 rounded-xl border border-teal-200 text-xs space-y-1">
                <strong className="text-teal-950 font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 size={13} className="text-teal-700 shrink-0" />
                  ISO 50001:2018 — Sistemas de Gestión de la Energía (SGEn)
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Eficiencia y reducción de consumo energético en estaciones de rebombeo, pozos profundos y plantas potabilizadoras.
                </p>
              </div>

              <div className="p-3.5 bg-teal-50/40 rounded-xl border border-teal-200 text-xs space-y-1">
                <strong className="text-teal-950 font-bold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 size={13} className="text-teal-700 shrink-0" />
                  ISO 22301:2019 — Sistemas de Gestión de la Continuidad del Negocio (SGCN)
                </strong>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  Resiliencia operativa para garantizar el suministro ininterrumpido de agua potable ante contingencias climáticas o fallas de infraestructura.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección 3: Criterios Evaluativos Multi-Norma */}
        <div className="space-y-3">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
            <Scale size={16} className="text-indigo-600" />
            3. Criterios Evaluativos Multi-Norma Aplicados por la IA
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed text-justify">
            Cuando un colaborador consulta al Asesor Normativo o solicita análisis para una Acción Correctiva o Plan de Mejora, el modelo aplica una matriz cruzada de evaluación:
          </p>
          <ul className="list-disc list-inside text-xs text-slate-700 space-y-1.5 pl-2">
            <li><strong>Criterio de Causa Raíz (Ishikawa / 5 Porqués):</strong> Distingue causas raíz atribuibles a métodos, maquinaria, mano de obra, medio ambiente y medición sin saltar a conclusiones precipitadas.</li>
            <li><strong>Criterio de Resiliencia y Riesgo:</strong> Evalúa la severidad, probabilidad y controles existentes conforme a la Matriz de Riesgos SGC.</li>
            <li><strong>Criterio de Factibilidad y ROI en Mejoras:</strong> Cuantifica el beneficio económico, ahorro hídrico y tiempo de retorno de inversión para el formato OOMRSC-21.</li>
            <li><strong>Criterio de Conformidad Legal y Sanitaria:</strong> Valida el cumplimiento con NOM-127-SSA1-2021 (Calidad del Agua) y NOM-001-SEMARNAT (Descargas).</li>
          </ul>
        </div>

        {/* Sección 4: Supervisión y Bitácora */}
        <div className="space-y-3">
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider font-mono flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-600" />
            4. Control de Auditoría y Responsabilidad Institucional
          </h4>
          <p className="text-xs text-slate-700 leading-relaxed text-justify">
            Todas las consultas realizadas al agente de IA y las propuestas generadas son registradas automáticamente en la <strong>Bitácora de Auditoría del SGC</strong>, asegurando que ante auditorías internas o externas (ej. entes fiscalizadores o casas certificadoras ISO), se pueda demostrar con total transparencia qué insumo aportó la IA y quién fue el servidor público facultado que revisó, editó y autorizó el documento final.
          </p>
        </div>
      </div>
    </div>
  );
}
