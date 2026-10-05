import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { uploadEvidencia } from '../../supabase';
import { processEvidenceFile } from '../../utils/fileSecurity';
import { useToast } from '../common/Toast';
import { useDialogos, Dialogos } from '../common/Dialogos';
import ContenedorModal from '../common/ContenedorModal';

export default function PlanesDetalle({
  form,
  setForm,
  equipo,
  actividades,
  setActividades,
  setVista,
  getBotonesWorkflow,
  getEstadoColor,
  getEstadoLabel,
  guardarBorrador,
  setError,
  setMensaje,
  usuarioLogueado,
  usuarios,
  solicitarReplanteoActividad,
  aprobarReplanteoActividad,
  rechazarReplanteoActividad
}) {
  const toast = useToast();
  const { confirmar, solicitar, props: propsDialogos } = useDialogos();
  const [guardandoEvidencia, setGuardandoEvidencia] = React.useState(false);
  const [subiendoIndex, setSubiendoIndex] = React.useState(null);
  const [previewImage, setPreviewImage] = React.useState(null);
  const esAdmin = usuarioLogueado?.rol === 'Super Admin' || usuarioLogueado?.rol === 'Admin';
  const estaCerrada = form.estado === 'CERRADO_EFECTIVO' || form.estado === 'CERRADO_NO_EFECTIVO';

  const [modalReplanteo, setModalReplanteo] = React.useState({
    show: false,
    actividadIndex: null,
    actividadNombre: '',
    fechaActual: '',
    nuevaFecha: '',
    justificacion: '',
    intentoNumero: 1
  });

  const abrirModalReplanteo = (index) => {
    const act = actividades[index];
    const replanteosCount = act.replantamientos_count || 0;
    setModalReplanteo({
      show: true,
      actividadIndex: index,
      actividadNombre: act.actividad || `Actividad #${index + 1}`,
      fechaActual: act.fecha_termino_sugerida || '',
      nuevaFecha: '',
      justificacion: '',
      intentoNumero: replanteosCount + 1
    });
  };

  const enviarSolicitudReplanteo = () => {
    if (!modalReplanteo.nuevaFecha) {
      toast.warning('Debe especificar la nueva fecha compromiso propuesta.');
      return;
    }
    if (!modalReplanteo.justificacion || modalReplanteo.justificacion.trim().length < 10) {
      toast.warning('Debe ingresar una justificación técnica detallada de al menos 10 caracteres.');
      return;
    }
    if (solicitarReplanteoActividad) {
      solicitarReplanteoActividad(modalReplanteo.actividadIndex, {
        nuevaFecha: modalReplanteo.nuevaFecha,
        justificacion: modalReplanteo.justificacion
      });
    }
    setModalReplanteo({ show: false, actividadIndex: null, actividadNombre: '', fechaActual: '', nuevaFecha: '', justificacion: '', intentoNumero: 1 });
  };

  const handleUploadEvidencia = async (index, file) => {
    if (!file) return;
    setSubiendoIndex(index);
    try {
      const res = await processEvidenceFile(file, usuarioLogueado?.nombre || 'Usuario');
      if (!res.success) {
        toast.error(res.error);
        if (setError) setError(res.error);
        return;
      }
      const nuevo = [...actividades];
      nuevo[index] = {
        ...nuevo[index],
        evidencia_real: res.evidencia.url,
        evidencia_obj: res.evidencia
      };
      setActividades(nuevo);
      if (setMensaje) setMensaje(`✓ Evidencia procesada, comprimida y validada (${res.evidencia.tamano_kb} KB)`);
    } catch (err) {
      console.error(err);
      toast.error('Error al procesar el archivo: ' + err.message);
    } finally {
      setSubiendoIndex(null);
    }
  };

  const handleEliminarEvidencia = async (index) => {
    const { ok } = await confirmar({
      titulo: 'Retirar evidencia',
      mensaje: '¿Desea retirar esta evidencia para adjuntar otra?',
      textoAceptar: 'Retirar',
      peligro: true,
    });
    if (!ok) return;
    const nuevo = [...actividades];
    nuevo[index] = {
      ...nuevo[index],
      evidencia_real: '',
      evidencia_obj: null
    };
    setActividades(nuevo);
  };

  const handleGuardarEvidencia = async () => {
    setGuardandoEvidencia(true);
    await guardarBorrador();
    setTimeout(() => setGuardandoEvidencia(false), 2000);
  };
  const generarInformePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 18;

    // Encabezado institucional OOMAPASC
    doc.setFillColor(0, 40, 85);
    doc.rect(14, y, pageWidth - 28, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('OOMAPASC — SISTEMA DE GESTIÓN DE LA CALIDAD', 18, y + 8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('PLAN DE MEJORA CONTINUA (ISO 9001:2015 — REQ. 10.3)', 18, y + 14);

    // Metadatos de formato en la esquina derecha del encabezado
    doc.setFont('helvetica', 'bold');
    doc.text(`${form.clave_formato || 'OOMRSC-21'}`, pageWidth - 20, y + 8, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`${form.revision_formato || 'Rev. 02'}`, pageWidth - 20, y + 14, { align: 'right' });

    y += 28;
    doc.setTextColor(0, 40, 85);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EXPEDIENTE DE PLAN DE MEJORA', pageWidth / 2, y, { align: 'center' });
    y += 7;

    // Folio oficial
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);
    const folioVal = form.folio_codigo || form.folio;
    const folioTexto = folioVal && folioVal !== 'Pendiente de aprobación' && folioVal !== 'Pendiente'
      ? `FOLIO OFICIAL: ${folioVal}`
      : 'FOLIO: PENDIENTE DE APROBACIÓN POR SGC';
    doc.text(folioTexto, pageWidth / 2, y, { align: 'center' });
    y += 12;

    // Datos Generales
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 40, 85);
    doc.text('1. DATOS GENERALES', 14, y);
    y += 5;

    const datosGenerales = [
      ['Título Mejora:', (form.titulo_mejora || '-').substring(0, 40), 'Área / Gerencia:', form.area || form.gerencia_coordinacion || '-'],
      ['Categoría:', form.categoria_mejora || '-', 'Período:', form.periodo_mejora || '-'],
      ['Origen:', form.origen || '-', 'Estado actual:', getEstadoLabel(form.estado)]
    ];
    autoTable(doc, {
      startY: y,
      body: datosGenerales,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
      columnStyles: { 0: { fontStyle: 'bold', width: 35 }, 2: { fontStyle: 'bold', width: 35 } }
    });
    y = doc.lastAutoTable.finalY + 8;

    // Situación Actual
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 40, 85);
    doc.text('2. SITUACIÓN ACTUAL (DIAGNÓSTICO)', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const saLines = doc.splitTextToSize(form.descripcion_situacion_actual || '-', pageWidth - 28);
    doc.text(saLines, 14, y);
    y += saLines.length * 4.5 + 8;

    // Situación Deseada
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 40, 85);
    doc.text('3. SITUACIÓN DESEADA (OBJETIVO CUANTITATIVO)', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    const sdLines = doc.splitTextToSize(form.situacion_deseada || '-', pageWidth - 28);
    doc.text(sdLines, 14, y);
    y += sdLines.length * 4.5 + 8;

    // Beneficios Esperados
    if (form.beneficios) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 40, 85);
      doc.text('4. BENEFICIOS ESPERADOS', 14, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);
      const benLines = doc.splitTextToSize(form.beneficios, pageWidth - 28);
      doc.text(benLines, 14, y);
      y += benLines.length * 4.5 + 8;
    }

    // Equipo de Trabajo
    if (equipo.filter(e => e.nombre).length > 0) {
      if (y > 230) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 40, 85);
      doc.text('5. EQUIPO DE TRABAJO', 14, y);
      y += 5;
      const equipoData = equipo.filter(e => e.nombre).map((e, i) => [i + 1, e.nombre, e.puesto || '-', e.rol || 'Participante']);
      autoTable(doc, {
        startY: y,
        head: [['#', 'Nombre', 'Puesto', 'Rol']],
        body: equipoData,
        theme: 'striped',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 40, 85], textColor: 255 }
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // Plan de Actividades
    if (actividades.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 40, 85);
      doc.text('6. PLAN DE ACTIVIDADES Y EVIDENCIAS', 14, y);
      y += 5;

      const tableData = actividades.map((a, i) => [
        i + 1,
        (a.actividad || '-').substring(0, 45),
        a.responsable || '-',
        a.fecha_termino_sugerida || '-',
        a.evidencia_esperada || '-',
        a.evidencia_real ? 'Cargada' : 'Pendiente'
      ]);

      autoTable(doc, {
        startY: y,
        head: [['#', 'Actividad', 'Responsable', 'Fecha Límite', 'Evidencia Esperada', 'Estado']],
        body: tableData,
        theme: 'striped',
        styles: { fontSize: 7.5, cellPadding: 2 },
        headStyles: { fillColor: [0, 40, 85], textColor: 255 }
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    // Seguimiento y Auditoría de Cierre
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 40, 85);
    doc.text('7. SEGUIMIENTO, APERTURA Y AUDITORÍA DE CIERRE', 14, y);
    y += 5;

    const seguimientoData = [
      ['Fecha Creación:', form.fecha_creacion_borrador || form.created_at ? new Date(form.fecha_creacion_borrador || form.created_at).toLocaleDateString('es-MX') : '-', 'Apertura SGC:', form.fecha_apertura ? new Date(form.fecha_apertura).toLocaleDateString('es-MX') : '-'],
      ['Aprobado por SGC:', form.aprobado_por_sgc || '-', 'Auditor Asignado:', form.auditor_cierre || 'Por asignar'],
      ['Fecha Cierre:', form.fecha_cierre ? new Date(form.fecha_cierre).toLocaleDateString('es-MX') : 'En seguimiento', 'Resultado Cierre:', form.resultado_cierre || 'En proceso']
    ];
    autoTable(doc, {
      startY: y,
      body: seguimientoData,
      theme: 'plain',
      styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
      columnStyles: { 0: { fontStyle: 'bold', width: 35 }, 2: { fontStyle: 'bold', width: 35 } }
    });
    y = doc.lastAutoTable.finalY + 6;

    if (form.conclusion_eficacia) {
      doc.setFont('helvetica', 'bold');
      doc.text('Conclusión de Eficacia del Auditor:', 14, y);
      y += 5;
      doc.setFont('helvetica', 'italic');
      const concLines = doc.splitTextToSize(`"${form.conclusion_eficacia}"`, pageWidth - 28);
      doc.text(concLines, 14, y);
    }

    const fecha = new Date().toISOString().split('T')[0];
    doc.save(`PM_${form.folio_codigo || form.folio || 'borrador'}_${fecha}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="bg-gradient-to-r from-[#002855] to-[#004a80] text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="bg-blue-100 text-blue-700 p-2.5 rounded-xl text-xl shadow-xs">🚀</span>
              <div>
                <h2 className="text-2xl font-black text-white tracking-tight">Plan de Mejora</h2>
                <p className="text-sm font-medium text-cyan-200 mt-0.5 line-clamp-1">{form.titulo_mejora || 'Sin título'}</p>
              </div>
            </div>

            {/* Folio Oficial SGC o Pendiente */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200/90">Folio:</span>
              {(form.folio_codigo || form.folio) && (form.folio_codigo || form.folio) !== 'Pendiente de aprobación' && (form.folio_codigo || form.folio) !== 'Pendiente' ? (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold bg-white text-[#002855] px-3 py-1 rounded-md shadow-xs border border-cyan-300">
                  <span className="text-cyan-600 font-black">#</span>
                  <span>{form.folio_codigo || form.folio}</span>
                  <span className="ml-1 text-[9px] font-sans font-extrabold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    Oficial SGC
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-400/40 px-3 py-1 rounded-md">
                  <span>⏳</span> Pendiente de aprobación por SGC
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2.5">
            {/* Registro SGC Minimalista en esquina superior derecha */}
            <div className="inline-flex items-center gap-2 bg-slate-900/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/15 text-xs text-white shadow-xs" title="Control Documental ISO 9001:2015">
              <span className="opacity-60 text-[10px] tracking-wider uppercase font-bold">Registro SGC</span>
              <span className="font-mono font-bold text-cyan-200">{form.clave_formato || 'OOMRSC-21'}</span>
              <span className="text-white/30">•</span>
              <span className="font-mono text-emerald-300 font-semibold">{form.revision_formato || 'Rev. 02'}</span>
            </div>

            {/* Estado */}
            <span className={`inline-block px-3.5 py-1.5 rounded-lg font-bold text-xs border-2 bg-white ${getEstadoColor(form.estado)} shadow-xs`}>
              {getEstadoLabel(form.estado)}
            </span>

            {/* Fechas de Seguimiento */}
            <div className="text-xs text-blue-100/80 space-y-0.5 text-left md:text-right font-medium">
              <p>Creado: {form.fecha_creacion_borrador || form.created_at ? new Date(form.fecha_creacion_borrador || form.created_at).toLocaleDateString('es-MX') : '-'}</p>
              {form.fecha_apertura && (
                <p>Apertura: {new Date(form.fecha_apertura).toLocaleDateString('es-MX')}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BANNER: Solicitud de Cierre */}
      {form.estado === 'SOLICITUD_CIERRE' && (
        <div className="bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent p-5 rounded-xl border-l-4 border-purple-600 bg-white shadow-sm flex items-start gap-4">
          <span className="text-3xl p-1 bg-purple-100 rounded-lg">🚀</span>
          <div className="flex-1">
            <h4 className="font-bold text-purple-950 text-base">Solicitud de Cierre en Proceso</h4>
            <p className="text-sm text-purple-800 mt-1">
              El área responsable concluyó las actividades del Plan de Mejora. Este expediente está en espera de que la coordinación del SGC asigne un Auditor registrado para la auditoría de eficacia (ISO 9001:2015).
            </p>
            {form.solicitante_cierre && (
              <p className="text-xs text-purple-600 mt-2 font-medium">
                Solicitado por: <strong>{form.solicitante_cierre}</strong> • Fecha: {form.fecha_solicitud_cierre ? new Date(form.fecha_solicitud_cierre).toLocaleDateString('es-MX') : 'Reciente'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* BANNER: Devuelta por Auditoría (No Efectiva) */}
      {form.resultado_cierre === 'NO_EFECTIVA' && (form.estado === 'APROBADO' || form.estado === 'EN_SEGUIMIENTO') && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5 rounded-xl border-l-4 border-amber-600 bg-white shadow-sm flex items-start gap-4">
          <span className="text-3xl p-1 bg-amber-100 rounded-lg">⚠️</span>
          <div className="flex-1">
            <h4 className="font-bold text-amber-950 text-base">Dictamen de Auditoría: No Efectivo — Requiere Trabajo Adicional</h4>
            <p className="text-sm text-amber-900 mt-1">
              El auditor evaluó el expediente y determinó que las acciones o indicadores de mejora aún no alcanzan los objetivos. El plan se mantiene abierto para que el área continúe trabajando y complementando evidencias.
            </p>
            {form.conclusion_eficacia && (
              <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-950 font-medium">
                <strong>Observaciones del Auditor:</strong> "{form.conclusion_eficacia}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Datos Generales - Tarjetas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-cyan-200 transition-colors">
          <p className="text-xs text-slate-500 font-bold mb-1">ÁREA / GERENCIA</p>
          <p className="font-semibold text-slate-800">{form.area || form.gerencia_coordinacion || '-'}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-cyan-200 transition-colors">
          <p className="text-xs text-slate-500 font-bold mb-1">CATEGORÍA</p>
          <p className="font-semibold text-slate-800">{form.categoria_mejora || '-'}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-cyan-200 transition-colors">
          <p className="text-xs text-slate-500 font-bold mb-1">ORIGEN</p>
          <p className="font-semibold text-slate-800">{form.origen || '-'}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-cyan-200 transition-colors">
          <p className="text-xs text-slate-500 font-bold mb-1">PERÍODO</p>
          <p className="font-semibold text-slate-800">{form.periodo_mejora || '-'}</p>
        </div>
      </div>

      {/* Descripciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
          <h3 className="font-bold text-[#002855] mb-3 flex items-center gap-2">
            <span className="text-xl">⚠️</span> Situación Actual
          </h3>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-full">
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{form.descripcion_situacion_actual || '-'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-400"></div>
          <h3 className="font-bold text-[#002855] mb-3 flex items-center gap-2">
            <span className="text-xl">🎯</span> Situación Deseada
          </h3>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 h-full">
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{form.situacion_deseada || '-'}</p>
          </div>
        </div>
      </div>

      {form.beneficios && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200 shadow-sm relative overflow-hidden">
          <h3 className="font-bold text-emerald-900 mb-2 flex items-center gap-2">
            <span className="text-xl">✨</span> Beneficios Esperados
          </h3>
          <p className="text-emerald-950">{form.beneficios}</p>
        </div>
      )}

      {/* Equipo - Tarjetas visuales */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-[#002855] mb-4 flex items-center gap-2">
          <span className="text-xl">👥</span> Equipo de Trabajo
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {equipo.filter(e => e.nombre).map((e, i) => (
            <div key={i} className={`p-4 rounded-xl border bg-slate-50 border-slate-200`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
                  {e.nombre.charAt(0).toUpperCase()}
                </div>
              </div>
              <p className="font-bold text-[#002855] truncate" title={e.nombre}>{e.nombre}</p>
              <p className="text-sm text-slate-700 font-medium truncate" title={e.puesto}>{e.puesto}</p>
              <p className="text-xs text-slate-500 mt-1 bg-white px-2 py-1 rounded border inline-block">{e.rol}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Plan de Actividades */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-[#002855] mb-4 flex items-center gap-2">
          <span className="text-xl">📋</span> Plan de Actividades
        </h3>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 text-center w-10">#</th>
                <th className="p-3">Actividad</th>
                <th className="p-3 w-36">Responsable</th>
                <th className="p-3 w-48">Fecha Límite y Prórrogas</th>
                <th className="p-3">Evidencia Esperada</th>
                {form.estado !== 'BORRADOR' && form.estado !== 'EN_REVISION' && (
                  <th className="p-3 bg-purple-50 w-64 text-purple-950 border-l border-purple-100">Evidencia Real (Foto o PDF)</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {actividades.length === 0 ? (
                <tr>
                  <td colSpan={form.estado !== 'BORRADOR' && form.estado !== 'EN_REVISION' ? 6 : 5} className="p-8 text-center text-slate-500 bg-slate-50/50 font-medium">
                    No hay actividades registradas
                  </td>
                </tr>
              ) : (
                actividades.map((a, i) => (
                  <tr key={a.id || i} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 text-center font-medium text-slate-500">{i + 1}</td>
                    <td className="p-3 font-medium text-slate-700">{a.actividad || '-'}</td>
                    <td className="p-3 text-slate-700">{a.responsable || '-'}</td>

                    {/* ═══ COLUMNA: FECHA LÍMITE Y PRÓRROGAS ═══ */}
                    <td className="p-3 text-xs align-top">
                      {/* Fecha anterior en chiquito si fue replanteada y aprobada */}
                      {a.historial_replanteos && a.historial_replanteos.length > 0 && (
                        <div className="text-[10px] text-slate-400 line-through">
                          Ant: {new Date(a.historial_replanteos[a.historial_replanteos.length - 1].fecha_anterior).toLocaleDateString('es-MX')}
                        </div>
                      )}

                      {/* Fecha actual normal */}
                      <div className="font-mono font-bold text-slate-800 text-sm">
                        {a.fecha_termino_sugerida ? new Date(a.fecha_termino_sugerida).toLocaleDateString('es-MX') : '-'}
                      </div>

                      {/* Semáforo: En tiempo o Vencida */}
                      {a.fecha_termino_sugerida && (() => {
                        const hoy = new Date(); hoy.setHours(0,0,0,0);
                        const f = new Date(a.fecha_termino_sugerida);
                        const vencida = f < hoy && !estaCerrada;
                        return vencida ? (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                            ⚠️ Vencida
                          </span>
                        ) : (
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ En tiempo
                          </span>
                        );
                      })()}

                      {/* Botón Replantear Fecha: se activa cuando vence la fecha límite */}
                      {form.estado !== 'BORRADOR' && form.estado !== 'EN_REVISION' && !estaCerrada && (() => {
                        const hoy = new Date(); hoy.setHours(0,0,0,0);
                        const f = a.fecha_termino_sugerida ? new Date(a.fecha_termino_sugerida) : null;
                        const vencida = f && f < hoy;
                        const replanteosCount = a.replantamientos_count || 0;
                        const tieneSolicitud = a.solicitud_replanteo && a.solicitud_replanteo.estado === 'PENDIENTE';

                        // Caso 1: Solicitud pendiente de aprobación SGC
                        if (tieneSolicitud) {
                          return (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded text-left shadow-2xs">
                              <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 mb-0.5">
                                <span>⏳ Prórroga solicitada</span>
                                <span className="bg-amber-200 text-amber-900 px-1 rounded">
                                  {a.solicitud_replanteo.intento_numero || replanteosCount + 1}/2
                                </span>
                              </div>
                              <p className="text-[11px] font-semibold text-slate-800">
                                Propuesta: <strong className="text-amber-950">{new Date(a.solicitud_replanteo.nueva_fecha).toLocaleDateString('es-MX')}</strong>
                              </p>
                              <p className="text-[10px] text-slate-600 italic line-clamp-2 mt-0.5" title={a.solicitud_replanteo.justificacion}>
                                "{a.solicitud_replanteo.justificacion}"
                              </p>
                              {esAdmin ? (
                                <div className="flex gap-1 mt-1.5 pt-1 border-t border-amber-200">
                                  <button
                                    type="button"
                                    onClick={() => aprobarReplanteoActividad && aprobarReplanteoActividad(i)}
                                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold py-0.5 rounded shadow-2xs"
                                  >
                                    ✓ Aprobar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => rechazarReplanteoActividad && rechazarReplanteoActividad(i)}
                                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[10px] font-bold py-0.5 rounded"
                                  >
                                    ✕ Rechazar
                                  </button>
                                </div>
                              ) : (
                                <span className="block mt-1 text-[9px] text-amber-800 font-bold bg-amber-100/80 px-1 py-0.5 rounded text-center">
                                  Esperando SGC
                                </span>
                              )}
                            </div>
                          );
                        }

                        // Caso 2: Vencida -> Activar botón para solicitar próxima fecha (máximo 2 prórrogas)
                        if (vencida) {
                          if (replanteosCount < 2) {
                            return (
                              <button
                                type="button"
                                onClick={() => abrirModalReplanteo(i)}
                                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-1 rounded transition-colors shadow-2xs"
                                title={`Fecha límite vencida. Solicite una prórroga para una próxima fecha (Máx 2, restantes: ${2 - replanteosCount})`}
                              >
                                <span>🕒</span> Replantear Fecha ({2 - replanteosCount} disp.)
                              </button>
                            );
                          } else {
                            return (
                              <span className="mt-2 inline-block text-[10px] text-red-600 font-bold bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                                🚫 Límite 2/2 prórrogas
                              </span>
                            );
                          }
                        }

                        // Caso 3: En tiempo pero con prórrogas previas
                        if (replanteosCount > 0) {
                          return (
                            <div className="mt-1 text-[10px] text-purple-700 font-medium">
                              📜 {replanteosCount}/2 prórroga(s) aprobada(s)
                            </div>
                          );
                        }

                        return null;
                      })()}
                    </td>

                    <td className="p-3 text-slate-500 text-xs align-top">{a.evidencia_esperada || '-'}</td>

                    {/* ═══ COLUMNA: EVIDENCIA REAL (FOTO O PDF) ═══ */}
                    {form.estado !== 'BORRADOR' && form.estado !== 'EN_REVISION' && (
                      <td className="p-3 border-l border-purple-100 bg-purple-50/20 align-top">
                        {(() => {
                          const isSubiendo = subiendoIndex === i;
                          const evObj = a.evidencia_obj || (a.evidencia_real ? {
                            url: a.evidencia_real,
                            nombre: 'Evidencia adjunta',
                            tipo: a.evidencia_real.endsWith('.pdf') || a.evidencia_real.includes('application/pdf') ? 'pdf' : 'image'
                          } : null);

                          if (isSubiendo) {
                            return (
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-700 p-2 bg-purple-50 border border-purple-200 rounded animate-pulse">
                                <span className="animate-spin">⚙️</span>
                                <span>Verificando y comprimiendo...</span>
                              </div>
                            );
                          }

                          if (evObj && evObj.url) {
                            const esPdf = evObj.tipo === 'pdf' || (typeof evObj.url === 'string' && (evObj.url.endsWith('.pdf') || evObj.url.startsWith('data:application/pdf')));
                            return (
                              <div className="flex flex-col gap-1 p-2 bg-white rounded-lg border border-purple-200 shadow-2xs">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${esPdf ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                    {esPdf ? '📄 PDF' : '📸 Foto'}
                                  </span>
                                  {!estaCerrada && (
                                    <button
                                      type="button"
                                      onClick={() => handleEliminarEvidencia(i)}
                                      className="text-slate-400 hover:text-red-600 text-xs px-1 font-bold"
                                      title="Eliminar evidencia"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 mt-0.5">
                                  {!esPdf ? (
                                    <img
                                      src={evObj.preview || evObj.url}
                                      alt="Evidencia"
                                      onClick={() => setPreviewImage(evObj.url || evObj.preview)}
                                      className="w-10 h-10 rounded object-cover border border-slate-200 cursor-pointer hover:opacity-80 flex-shrink-0"
                                      title="Clic para ampliar vista"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded bg-red-50 border border-red-200 flex items-center justify-center text-red-600 text-xs font-bold flex-shrink-0">
                                      PDF
                                    </div>
                                  )}

                                  <div className="overflow-hidden flex-1 text-left">
                                    <a
                                      href={evObj.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-bold text-purple-800 hover:text-purple-950 underline truncate block"
                                      title={evObj.nombre || 'Ver archivo completo'}
                                    >
                                      {evObj.nombre || (esPdf ? 'Documento PDF' : 'Imagen Adjunta')}
                                    </a>
                                    <span className="text-[10px] text-slate-500 block">
                                      {evObj.tamano_kb ? `${evObj.tamano_kb} KB` : 'Archivo válido'}
                                      {evObj.tamano_original_kb && evObj.tamano_original_kb > evObj.tamano_kb && (
                                        <span className="text-emerald-600 font-semibold ml-1">
                                          (-{Math.round((1 - evObj.tamano_kb / evObj.tamano_original_kb) * 100)}%)
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (!estaCerrada) {
                            return (
                              <label className="inline-flex items-center gap-1.5 cursor-pointer bg-white hover:bg-purple-50 text-purple-700 border border-purple-300 hover:border-purple-400 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-all">
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                                  onClick={(e) => { e.target.value = null; }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadEvidencia(i, file);
                                  }}
                                  className="hidden"
                                />
                                <span>📎</span>
                                <span>Subir Foto o PDF</span>
                              </label>
                            );
                          }

                          return <span className="text-xs text-slate-400 italic">Sin evidencia</span>;
                        })()}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {actividades.length > 0 && form.estado !== 'BORRADOR' && form.estado !== 'EN_REVISION' && (
          <div className="mt-4 flex justify-end">
            <button onClick={handleGuardarEvidencia} disabled={guardandoEvidencia} className={`px-5 py-2.5 font-medium rounded-lg shadow-md transition-colors flex items-center gap-2 ${guardandoEvidencia ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
              {guardandoEvidencia ? '✓ ¡Evidencias Guardadas!' : '💾 Guardar Evidencias'}
            </button>
          </div>
        )}
      </div>

      {/* Auditor Asignado */}
      {(form.auditor_cierre || form.estado === 'REVISION_AUDITOR' || form.estado === 'CERRADO_EFECTIVO' || form.estado === 'CERRADO_NO_EFECTIVO') && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
          <h3 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
            <span className="text-xl">👤</span> Revisión del Auditor
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-lg border border-emerald-100 mb-4">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Auditor asignado</p>
              <p className="font-semibold text-emerald-950 text-lg">{form.auditor_cierre || 'Por asignar'}</p>
              {form.auditor_email && (
                <p className="text-xs text-emerald-700 mt-1 flex items-center gap-1 font-medium">
                  <span>📧</span> {form.auditor_email} <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Notificado por correo</span>
                </p>
              )}
            </div>
            {form.resultado_cierre && (
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Resultado del cierre</p>
                <p className={`font-bold inline-block px-3 py-1 rounded-md text-sm ${form.resultado_cierre === 'EFECTIVA' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {form.resultado_cierre}
                </p>
              </div>
            )}
          </div>
          {form.conclusion_eficacia && (
            <div className="mt-4 bg-white p-4 rounded-lg border border-emerald-100">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Conclusión de Eficacia del Auditor</p>
              <p className="text-emerald-950 font-medium italic">"{form.conclusion_eficacia}"</p>
            </div>
          )}
          {form.comentarios_revision && !form.conclusion_eficacia && (
            <div className="mt-4 bg-white p-4 rounded-lg border border-emerald-100">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Comentarios</p>
              <p className="text-emerald-950">{form.comentarios_revision}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ SEGUIMIENTO / FECHAS ═══════════════ */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-[#002855] mb-4 flex items-center gap-2">
          <span className="text-xl">📅</span> Seguimiento y Fechas
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-bold text-slate-500 mb-1">CREACIÓN</p>
            <p className="font-mono text-sm font-medium text-slate-800">
              {form.fecha_creacion_borrador ? new Date(form.fecha_creacion_borrador).toLocaleDateString('es-MX') : '-'}
            </p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-bold text-slate-500 mb-1">ENVÍO A SGC</p>
            <p className="font-mono text-sm font-medium text-slate-800">
              {form.fecha_envio_sgc ? new Date(form.fecha_envio_sgc).toLocaleDateString('es-MX') : '-'}
            </p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-bold text-slate-500 mb-1">APERTURA</p>
            <p className="font-mono text-sm font-medium text-slate-800">
              {form.fecha_apertura ? new Date(form.fecha_apertura).toLocaleDateString('es-MX') : '-'}
            </p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs font-bold text-slate-500 mb-1">CIERRE</p>
            <p className="font-mono text-sm font-medium text-slate-800">
              {form.fecha_cierre ? new Date(form.fecha_cierre).toLocaleDateString('es-MX') : '-'}
            </p>
          </div>
        </div>
        {form.aprobado_por_sgc && (
          <p className="text-xs text-slate-500 mt-3">Aprobado por: <strong>{form.aprobado_por_sgc}</strong></p>
        )}
      </div>

      {/* Botones de acción general */}
      <div className="flex gap-3 flex-wrap pt-6 border-t mt-8">
        <button onClick={() => setVista('lista')} className="px-6 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors mr-auto">
          ← Volver a Lista
        </button>
        <button onClick={generarInformePDF} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2">
          <span>📄</span> Exportar PDF
        </button>
        {getBotonesWorkflow()}
      </div>

      {/* ═══════════════ MODAL REPLANTEAMIENTO DE FECHA (MÁX 2) ═══════════════ */}
      {modalReplanteo.show && (
        <ContenedorModal isOpen onClose={() => setModalReplanteo({ ...modalReplanteo, show: false })} size="lg" backdropClassName="bg-black/60 backdrop-blur-sm">
          <div className="max-h-full overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 w-full border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🕒</span>
                <div>
                  <h3 className="text-lg font-bold text-[#002855]">Solicitud de Replanteamiento de Fecha</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Prórroga con aprobación requerida del SGC (Intento {modalReplanteo.intentoNumero} de 2 permitidos)
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setModalReplanteo({ show: false, actividadIndex: null, actividadNombre: '', fechaActual: '', nuevaFecha: '', justificacion: '', intentoNumero: 1 })}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Actividad</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{modalReplanteo.actividadNombre}</p>
                <p className="text-xs text-slate-600 mt-2">
                  Fecha límite actual: <strong className="font-mono">{modalReplanteo.fechaActual ? new Date(modalReplanteo.fechaActual).toLocaleDateString('es-MX') : 'No establecida'}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nueva Fecha Compromiso Propuesta <span className="text-red-500">*</span>
                </label>
                <input 
                  type="date"
                  value={modalReplanteo.nuevaFecha}
                  onChange={(e) => setModalReplanteo(m => ({ ...m, nuevaFecha: e.target.value }))}
                  className="w-full p-2.5 border-2 border-slate-200 rounded-lg text-sm font-medium focus:border-[#002855] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Justificación Técnica de la Prórroga <span className="text-red-500">* (Obligatorio, mín. 10 caracteres)</span>
                </label>
                <textarea
                  rows={3}
                  value={modalReplanteo.justificacion}
                  onChange={(e) => setModalReplanteo(m => ({ ...m, justificacion: e.target.value }))}
                  placeholder="Detalle los motivos operativos, técnicos o de recursos que ameritan extender la fecha límite..."
                  className="w-full p-3 border-2 border-slate-200 rounded-lg text-sm focus:border-[#002855] outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {modalReplanteo.justificacion.trim().length} / 10 caracteres mínimos
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalReplanteo({ show: false, actividadIndex: null, actividadNombre: '', fechaActual: '', nuevaFecha: '', justificacion: '', intentoNumero: 1 })}
                className="px-5 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={enviarSolicitudReplanteo}
                disabled={!modalReplanteo.nuevaFecha || modalReplanteo.justificacion.trim().length < 10}
                className="px-5 py-2.5 bg-[#002855] hover:bg-[#001f42] text-white font-medium rounded-lg transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ✓ Enviar Solicitud al SGC
              </button>
            </div>
          </div>
        </ContenedorModal>
      )}

      {/* Modal para visualizar imagen en tamaño ampliado */}
      {previewImage && (
        <ContenedorModal
          isOpen
          onClose={() => setPreviewImage(null)}
          size="3xl"
          backdropClassName="bg-black/75 backdrop-blur-xs"
        >
          <div className="max-h-full overflow-hidden bg-white rounded-xl shadow-2xl flex flex-col">
            <div className="p-3 bg-slate-900 text-white flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">Vista de Evidencia</span>
              <button onClick={() => setPreviewImage(null)} className="text-slate-400 hover:text-white text-base font-bold px-2">✕</button>
            </div>
            <div className="p-2 overflow-auto max-h-[75vh] flex items-center justify-center bg-slate-100">
              <img src={previewImage} alt="Evidencia ampliada" className="max-w-full max-h-[70vh] object-contain rounded" />
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <a href={previewImage} target="_blank" rel="noopener noreferrer" download="evidencia.jpg" className="px-4 py-2 bg-[#002855] text-white rounded-lg text-xs font-bold hover:bg-[#001f42]">
                Abrir en pestaña nueva / Descargar
              </a>
            </div>
          </div>
        </ContenedorModal>
      )}
      <Dialogos {...propsDialogos} />
    </div>
  );
}
