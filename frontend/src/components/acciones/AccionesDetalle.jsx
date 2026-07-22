import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AccionesDetalle({ 
  form, 
  setForm, 
  equipo, 
  causas, 
  actividades, 
  setActividades,
  setVista, 
  getBotonesWorkflow, 
  getEstadoColor, 
  getEstadoLabel,
  guardarBorrador,
  setError,
  mensaje,
  setMensaje
}) {
  const causaPrincipal = causas.find(c => c.es_causa_principal) || causas.filter(c => c.causa)[0];
  const causasConDatos = causas.filter(c => c.causa && c.causa.trim());
  const tieneDescripcionMejorada = form.descripcion_no_conformidad_ia && form.descripcion_no_conformidad_ia !== form.descripcion_no_conformidad_original;
  const tieneFolio = form.folio_codigo && form.folio_codigo !== 'Pendiente de aprobación';
  const enFaseAuditoria = ['REVISION_AUDITOR', 'CERRADO_EFECTIVO', 'CERRADO_NO_EFECTIVO'].includes(form.estado);
  const estaCerrada = form.estado === 'CERRADO_EFECTIVO' || form.estado === 'CERRADO_NO_EFECTIVO';
  
  const [guardandoEvidencia, setGuardandoEvidencia] = React.useState(false);
  const handleGuardarEvidencia = async () => {
    setGuardandoEvidencia(true);
    await guardarBorrador();
    setTimeout(() => setGuardandoEvidencia(false), 2000);
  };
  
  const generarInformePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ACCIÓN CORRECTIVA - OOMRSC-20', pageWidth / 2, y, { align: 'center' });
    y += 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(form.folio_codigo || 'Pendiente de aprobación', pageWidth / 2, y, { align: 'center' });
    y += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS GENERALES', 14, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`Área: ${form.area || '-'}`, 14, y); y += 6;
    doc.text(`Proceso: ${form.proceso || '-'}`, 14, y); y += 6;
    doc.text(`Origen: ${form.origen || '-'}`, 14, y); y += 6;
    if (form.numero_auditoria) { doc.text(`No. Auditoría: ${form.numero_auditoria}`, 14, y); y += 6; }
    doc.text(`Estado: ${getEstadoLabel(form.estado)}`, 14, y); y += 12;
    
    doc.setFont('helvetica', 'bold');
    doc.text('DESCRIPCIÓN DE LA NO CONFORMIDAD', 14, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    const descLines = doc.splitTextToSize(form.descripcion_no_conformidad_original || '-', pageWidth - 28);
    doc.text(descLines, 14, y);
    y += descLines.length * 5 + 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Impacto en otros procesos: ${form.impacta_otros_procesos || 'NO'}`, 14, y);
    y += 10;
    
    if (equipo.filter(e => e.nombre).length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('EQUIPO DE TRABAJO', 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      equipo.filter(e => e.nombre).forEach((e, i) => {
        doc.text(`${i + 1}. ${e.nombre} - ${e.puesto} (${e.rol})`, 14, y);
        y += 6;
      });
      y += 10;
    }
    
    if (causaPrincipal) {
      doc.setFont('helvetica', 'bold');
      doc.text('ANÁLISIS DE CAUSA', 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      const causaLines = doc.splitTextToSize(causaPrincipal.causa, pageWidth - 28);
      doc.text(causaLines, 14, y);
      y += causaLines.length * 5 + 10;
    }
    
    if (actividades.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('PLAN DE ACTIVIDADES', 14, y);
      y += 8;
      
      const tableData = actividades.map((a, i) => [
        i + 1,
        (a.actividad || a.actividades || '-').substring(0, 50),
        a.responsable || '-',
        a.fecha_termino_sugerida || '-',
        a.evidencia_esperada ? 'Sí' : 'No'
      ]);
      
      doc.autoTable({
        startY: y,
        head: [['#', 'Actividad', 'Responsable', 'Fecha', 'Evidencia']],
        body: tableData,
        theme: 'striped',
        fontSize: 8,
        headStyles: { fillColor: [0, 40, 85] }
      });
    }
    
    y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : y + 15;
    
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SEGUIMIENTO', 14, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de creación: ${form.fecha_creacion_borrador ? new Date(form.fecha_creacion_borrador).toLocaleDateString('es-MX') : '-'}`, 14, y); y += 6;
    if (form.fecha_apertura) { doc.text(`Fecha de apertura: ${new Date(form.fecha_apertura).toLocaleDateString('es-MX')}`, 14, y); y += 6; }
    if (form.fecha_cierre) { doc.text(`Fecha de cierre: ${new Date(form.fecha_cierre).toLocaleDateString('es-MX')}`, 14, y); y += 6; }
    doc.text(`Resultado: ${form.resultado_cierre || 'En proceso'}`, 14, y);
    
    const fecha = new Date().toISOString().split('T')[0];
    doc.save(`AC_${form.folio_codigo || 'borrador'}_${fecha}.pdf`);
  };

  const SeccionCard = ({ titulo, icono, children, accentColor = 'slate', className = '' }) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden ${className}`}>
      <div className={`absolute top-0 left-0 w-1 h-full bg-${accentColor}-500`}></div>
      <h3 className="font-bold text-[#002855] mb-4 flex items-center gap-2">
        <span className="text-xl">{icono}</span> {titulo}
      </h3>
      {children}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="bg-gradient-to-r from-[#002855] to-[#004a80] text-white p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 p-2 rounded-lg text-xl">📝</span>
              Acción Correctiva — {form.clave_formato || 'OOMRSC-20'} {form.revision_formato ? form.revision_formato : 'Rev. 18'}
            </h2>
            <p className="text-lg mt-2 font-medium text-cyan-100">{form.area}</p>
            <p className="text-sm opacity-80 mt-1 flex items-center gap-2">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">Folio: {form.folio_codigo || 'Pendiente de aprobación'}</span>
            </p>
          </div>
          <div className="text-left md:text-right">
            <span className={`inline-block px-4 py-2 rounded-lg font-bold border-2 bg-white ${getEstadoColor(form.estado)}`}>
              {getEstadoLabel(form.estado)}
            </span>
            <p className="text-xs opacity-70 mt-2">
              Creada: {form.fecha_creacion_borrador ? new Date(form.fecha_creacion_borrador).toLocaleDateString('es-MX') : '-'}
            </p>
            {form.fecha_apertura && (
              <p className="text-xs opacity-70 mt-1">
                Apertura: {new Date(form.fecha_apertura).toLocaleDateString('es-MX')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════ DATOS GENERALES ═══════════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-cyan-200 transition-colors">
          <p className="text-xs text-slate-500 font-bold mb-1">PROCESO</p>
          <p className="font-semibold text-slate-800">{form.proceso || '-'}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-cyan-200 transition-colors">
          <p className="text-xs text-slate-500 font-bold mb-1">ORIGEN</p>
          <p className="font-semibold text-slate-800">{form.origen || '-'}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-cyan-200 transition-colors">
          <p className="text-xs text-slate-500 font-bold mb-1">NO. AUDITORÍA</p>
          <p className="font-semibold text-slate-800">{form.numero_auditoria || 'N/A'}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-cyan-200 transition-colors">
          <p className="text-xs text-slate-500 font-bold mb-1">IMPACTO EN OTROS</p>
          <p className={`font-semibold ${form.impacta_otros_procesos === 'SI' ? 'text-red-600' : 'text-green-600'}`}>
            {form.impacta_otros_procesos}
          </p>
        </div>
      </div>

      {/* ═══════════════ DESCRIPCIÓN NO CONFORMIDAD ═══════════════ */}
      <SeccionCard titulo="No Conformidad" icono="⚠️" accentColor="amber">
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
            {tieneDescripcionMejorada ? form.descripcion_no_conformidad_ia : form.descripcion_no_conformidad_original}
          </p>
        </div>
        {form.impacta_otros_procesos === 'SI' && form.otros_procesos_afectados && (
          <div className="mt-4 bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Procesos Afectados</p>
            <p className="text-red-800 font-medium">{form.otros_procesos_afectados}</p>
          </div>
        )}
      </SeccionCard>

      {/* ═══════════════ EQUIPO DE TRABAJO ═══════════════ */}
      <SeccionCard titulo="Equipo de Trabajo" icono="👥" accentColor="cyan">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {equipo.filter(e => e.nombre).map((e, i) => (
            <div key={i} className={`p-4 rounded-xl border ${e.es_responsable_principal ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#002855] to-cyan-600 text-white flex items-center justify-center font-bold text-lg shadow-inner">
                  {e.nombre.charAt(0).toUpperCase()}
                </div>
                {e.es_responsable_principal && (
                  <span className="text-xs bg-amber-200 text-amber-800 px-2 py-1 rounded-full font-bold shadow-sm">Responsable</span>
                )}
              </div>
              <p className="font-bold text-[#002855] truncate" title={e.nombre}>{e.nombre}</p>
              <p className="text-sm text-slate-700 font-medium truncate" title={e.puesto}>{e.puesto}</p>
              <p className="text-xs text-slate-500 mt-1 bg-white px-2 py-1 rounded border inline-block">{e.rol}</p>
              {e.area && <p className="text-xs text-slate-500 mt-1">{e.area}</p>}
            </div>
          ))}
        </div>
      </SeccionCard>

      {/* ═══════════════ ACCIÓN CONTENEDORA INMEDIATA ═══════════════ */}
      {(form.accion_contenedora || form.actividad_inmediata) && (
        <SeccionCard titulo="Acción Contenedora Inmediata" icono="🛡️" accentColor="orange">
          {form.accion_contenedora && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 mb-4">
              <p className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Descripción de la Acción</p>
              <p className="text-orange-900 font-medium whitespace-pre-wrap">{form.accion_contenedora}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {form.actividad_inmediata && (
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-500 mb-1">ACTIVIDAD ESPECÍFICA</p>
                <p className="font-medium text-slate-800">{form.actividad_inmediata}</p>
              </div>
            )}
            {form.responsable_actividad_inmediata && (
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-500 mb-1">RESPONSABLE</p>
                <p className="font-medium text-slate-800">{form.responsable_actividad_inmediata}</p>
              </div>
            )}
            {form.fecha_actividad_inmediata && (
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <p className="text-xs font-bold text-slate-500 mb-1">FECHA DE TÉRMINO</p>
                <p className="font-medium text-white font-mono">{new Date(form.fecha_actividad_inmediata).toLocaleDateString('es-MX')}</p>
              </div>
            )}
          </div>
        </SeccionCard>
      )}

      {/* ═══════════════ ANÁLISIS DE CAUSAS (COMPLETO) ═══════════════ */}
      {causasConDatos.length > 0 && (
        <SeccionCard titulo="Análisis de Causas (Lluvia de Ideas)" icono="💡" accentColor="amber">
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-12">#</th>
                  <th className="p-3">Descripción de la Causa</th>
                  <th className="p-3 text-center w-28">Puntuación</th>
                  <th className="p-3 text-center w-28">¿Principal?</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {causasConDatos.map((c, i) => (
                  <tr key={c.id || i} className={`${c.es_causa_principal ? 'bg-amber-50 font-semibold' : 'hover:bg-slate-50'} transition-colors`}>
                    <td className="p-3 text-center font-medium text-slate-500">{i + 1}</td>
                    <td className="p-3 text-slate-700">
                      {c.es_causa_principal && <span className="inline-block mr-2 text-amber-600">🎯</span>}
                      {c.causa}
                    </td>
                    <td className="p-3 text-center">
                      {c.puntuacion_sugerida > 0 && (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${c.es_causa_principal ? 'bg-amber-200 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                          {c.puntuacion_sugerida}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {c.es_causa_principal ? (
                        <span className="text-amber-600 font-bold">✓ SÍ</span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SeccionCard>
      )}

      {/* ═══════════════ PLAN DE ACTIVIDADES ═══════════════ */}
      {(actividades.length > 0 || tieneFolio) && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-[#002855] mb-4 flex items-center gap-2">
            <span className="text-xl">📋</span> Plan de Actividades Correctivas
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-center w-10">#</th>
                  <th className="p-3">Actividad</th>
                  <th className="p-3 w-36">Responsable</th>
                  <th className="p-3 w-28">Fecha Límite</th>
                  <th className="p-3">Evidencia Esperada</th>
                  {tieneFolio && (
                    <th className="p-3 bg-purple-50 w-48 text-purple-900 border-l border-purple-100">Evidencia Real</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {actividades.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 bg-slate-50/50 font-medium">
                      No hay actividades registradas
                    </td>
                  </tr>
                ) : (
                  actividades.map((a, i) => (
                    <tr key={a.id || i} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center font-medium text-slate-500">{i + 1}</td>
                      <td className="p-3 font-medium text-slate-700">
                        {a.actividad || a.actividades || '-'}
                      </td>
                      <td className="p-3 text-slate-700">{a.responsable || '-'}</td>
                      <td className="p-3 font-mono text-xs">
                        {a.fecha_termino_sugerida ? new Date(a.fecha_termino_sugerida).toLocaleDateString('es-MX') : '-'}
                      </td>
                      <td className="p-3 text-slate-500 italic text-xs">
                        {a.evidencia_esperada || '-'}
                      </td>
                      {tieneFolio && (
                        <td className="p-3 bg-purple-50 border-l border-purple-100">
                          {enFaseAuditoria ? (
                            <div className="flex flex-col gap-2">
                              {a.evidencia_real ? (
                                <>
                                  {a.evidencia_real.startsWith('http') || a.evidencia_real.startsWith('[Archivo]') ? (
                                    <a href={a.evidencia_real.startsWith('http') ? a.evidencia_real : '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 text-xs font-bold bg-purple-100 hover:bg-purple-200 px-2 py-1.5 rounded transition-colors w-fit">
                                      📎 {a.evidencia_real.startsWith('[Archivo]') ? a.evidencia_real : 'Ver evidencia adjunta'}
                                    </a>
                                  ) : (
                                    <p className="text-xs text-slate-700 font-medium">{a.evidencia_real}</p>
                                  )}
                                  <label className="flex items-center gap-2 mt-1 cursor-pointer bg-white p-2 rounded border border-emerald-200 hover:bg-emerald-50 transition-colors">
                                    <input type="checkbox" checked={a.evidencia_aprobada || false} disabled={estaCerrada} onChange={(e) => {
                                      const nuevo = [...actividades];
                                      nuevo[i] = {...nuevo[i], evidencia_aprobada: e.target.checked};
                                      setActividades(nuevo);
                                    }} className="w-4 h-4 text-emerald-600 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" />
                                    <span className="text-xs font-bold text-emerald-700">Evidencia cumple</span>
                                  </label>
                                </>
                              ) : (
                                <span className="text-xs text-slate-500 italic">Sin evidencia</span>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {a.evidencia_real && (a.evidencia_real.startsWith('http') || a.evidencia_real.startsWith('[Archivo]')) ? (
                                <a href={a.evidencia_real.startsWith('http') ? a.evidencia_real : '#'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 text-xs font-bold bg-purple-100 hover:bg-purple-200 px-2 py-1.5 rounded transition-colors w-fit">
                                  📎 {a.evidencia_real.startsWith('[Archivo]') ? a.evidencia_real : 'Ver archivo adjunto'}
                                </a>
                              ) : (
                                <label className="flex items-center gap-1 cursor-pointer bg-white border border-purple-200 hover:border-purple-400 text-purple-700 px-2 py-1.5 rounded text-xs font-medium transition-colors w-fit shadow-sm">
                                  <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      if (file.size > 10 * 1024 * 1024) {
                                        setError('Máx 10MB');
                                        return;
                                      }
                                      // Por ahora, guardar nombre del archivo como referencia
                                      const nuevo = [...actividades];
                                      nuevo[i] = {...nuevo[i], evidencia_real: `[Archivo] ${file.name}`};
                                      setActividades(nuevo);
                                    }
                                  }} className="hidden" />
                                  <span>📎 Adjuntar evidencia</span>
                                </label>
                              )}
                              <input type="text" value={a.evidencia_real && !a.evidencia_real.startsWith('[Archivo]') ? a.evidencia_real : ''} 
                                onChange={(e) => {
                                  const nuevo = [...actividades];
                                  nuevo[i] = {...nuevo[i], evidencia_real: e.target.value};
                                  setActividades(nuevo);
                                }}
                                placeholder="O pega link/descripción"
                                className="w-full p-2 bg-white border border-purple-200 focus:border-purple-500 rounded text-xs outline-none transition-colors" />
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {actividades.length > 0 && tieneFolio && !estaCerrada && (
            <div className="mt-4 flex items-center justify-end gap-4">
              {mensaje && (
                <div className="text-emerald-400 font-bold text-sm animate-pulse flex items-center gap-1">
                  ✓ {mensaje}
                </div>
              )}
              <button onClick={handleGuardarEvidencia} disabled={guardandoEvidencia} className={`px-5 py-2.5 font-medium rounded-lg shadow-md transition-colors flex items-center gap-2 ${guardandoEvidencia ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}>
                {guardandoEvidencia ? '✓ ¡Evidencias Guardadas!' : '💾 Guardar Evidencias'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ MATRIZ DE RIESGOS ═══════════════ */}
      {(form.requiere_actualizar_matriz_riesgos === 'SI' || form.requiere_cambio_sgc === 'SI') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {form.requiere_actualizar_matriz_riesgos === 'SI' && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-5 rounded-xl border border-amber-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
              <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                <span className="text-lg">⚡</span> Actualización de Matriz de Riesgos
              </h3>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Requiere actualización</p>
              {form.descripcion_riesgo_oportunidad && (
                <div className="bg-white p-3 rounded-lg border border-amber-100 mt-2">
                  <p className="text-amber-900 font-medium">{form.descripcion_riesgo_oportunidad}</p>
                </div>
              )}
            </div>
          )}
          {form.requiere_cambio_sgc === 'SI' && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <span className="text-lg">📂</span> Cambio en el SGC
              </h3>
              <p className="text-sm text-blue-800 font-medium">Esta acción correctiva requiere un cambio en la documentación del Sistema de Gestión de Calidad.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ AUDITOR ASIGNADO ═══════════════ */}
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
          {form.evidencia_objetiva_revisada && (
            <div className="mt-4 bg-white p-4 rounded-lg border border-emerald-100">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Evidencia revisada</p>
              <p className="text-emerald-950">{form.evidencia_objetiva_revisada}</p>
            </div>
          )}
          {form.conclusion_eficacia && (
            <div className="mt-4 bg-white p-4 rounded-lg border border-emerald-100">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Conclusión de eficacia</p>
              <p className="text-emerald-950 font-medium italic">"{form.conclusion_eficacia}"</p>
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
      
      {/* ═══════════════ BOTONES DE ACCIÓN ═══════════════ */}
      <div className="flex gap-3 flex-wrap pt-6 border-t mt-8">
        <button onClick={() => setVista('lista')} className="px-6 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors mr-auto">
          ← Volver a Lista
        </button>
        <button onClick={generarInformePDF} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2">
          <span>📄</span> Exportar PDF
        </button>
        {getBotonesWorkflow()}
      </div>
    </div>
  );
}
