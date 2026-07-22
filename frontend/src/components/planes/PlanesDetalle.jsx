import React from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { uploadEvidencia } from '../../supabase';

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
  setError
}) {
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
    doc.text('PLAN DE MEJORA', pageWidth / 2, y, { align: 'center' });
    y += 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(form.folio_codigo || form.folio || 'Pendiente', pageWidth / 2, y, { align: 'center' });
    y += 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DATOS GENERALES', 14, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`Título: ${form.titulo_mejora || '-'}`, 14, y); y += 6;
    doc.text(`Área/Gerencia: ${form.gerencia_coordinacion || '-'}`, 14, y); y += 6;
    doc.text(`Categoría: ${form.categoria_mejora || '-'}`, 14, y); y += 6;
    doc.text(`Origen: ${form.origen || '-'}`, 14, y); y += 6;
    doc.text(`Estado: ${getEstadoLabel(form.estado)}`, 14, y); y += 12;
    
    doc.setFont('helvetica', 'bold');
    doc.text('SITUACIÓN ACTUAL', 14, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    const saLines = doc.splitTextToSize(form.descripcion_situacion_actual || '-', pageWidth - 28);
    doc.text(saLines, 14, y);
    y += saLines.length * 5 + 10;
    
    doc.setFont('helvetica', 'bold');
    doc.text('SITUACIÓN DESEADA', 14, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    const sdLines = doc.splitTextToSize(form.situacion_deseada || '-', pageWidth - 28);
    doc.text(sdLines, 14, y);
    y += sdLines.length * 5 + 10;

    if (equipo.filter(e => e.nombre).length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
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
    
    if (actividades.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold');
      doc.text('PLAN DE ACTIVIDADES', 14, y);
      y += 8;
      
      const tableData = actividades.map((a, i) => [
        i + 1,
        (a.actividad || '-').substring(0, 50),
        a.responsable || '-',
        a.fecha_termino_sugerida || '-',
        a.evidencia_esperada || '-'
      ]);
      
      doc.autoTable({
        startY: y,
        head: [['#', 'Actividad', 'Responsable', 'Fecha', 'Evidencia esperada']],
        body: tableData,
        theme: 'striped',
        fontSize: 8,
        headStyles: { fillColor: [0, 40, 85] }
      });
    }
    
    const fecha = new Date().toISOString().split('T')[0];
    doc.save(`PM_${form.folio_codigo || 'borrador'}_${fecha}.pdf`);
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002855] to-[#004a80] text-white p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 p-2 rounded-lg text-xl">🚀</span>
              Plan de Mejora
            </h2>
            <p className="text-lg mt-2 font-medium text-cyan-100">{form.titulo_mejora || 'Sin título'}</p>
            <p className="text-sm opacity-80 mt-1 flex items-center gap-2">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">Folio: {form.folio_codigo || form.folio || 'Pendiente'}</span>
            </p>
          </div>
          <div className="text-left md:text-right">
            <span className={`inline-block px-4 py-2 rounded-lg font-bold border-2 bg-white ${getEstadoColor(form.estado)}`}>
              {getEstadoLabel(form.estado)}
            </span>
            <p className="text-xs opacity-70 mt-2">
              Creado: {form.created_at ? new Date(form.created_at).toLocaleDateString('es-MX') : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Datos Generales - Tarjetas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-cyan-200 transition-colors">
          <p className="text-xs text-slate-500 font-bold mb-1">ÁREA / GERENCIA</p>
          <p className="font-semibold text-slate-800">{form.gerencia_coordinacion || '-'}</p>
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
                <th className="p-3 w-28">Fecha Límite</th>
                <th className="p-3">Evidencia Esperada</th>
                {form.estado !== 'BORRADOR' && form.estado !== 'EN_REVISION' && (
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
                    <td className="p-3 font-medium text-slate-700">{a.actividad || '-'}</td>
                    <td className="p-3 text-slate-700">{a.responsable || '-'}</td>
                    <td className="p-3 font-mono text-xs">{a.fecha_termino_sugerida ? new Date(a.fecha_termino_sugerida).toLocaleDateString() : '-'}</td>
                    <td className="p-3 text-slate-500 text-xs">{a.evidencia_esperada || '-'}</td>
                    {form.estado !== 'BORRADOR' && form.estado !== 'EN_REVISION' && (
                      <td className="p-3 bg-purple-50 border-l border-purple-100">
                        <div className="flex flex-col gap-2">
                          {a.evidencia_real && a.evidencia_real.startsWith('http') ? (
                            <div className="flex items-center gap-2">
                              <a href={a.evidencia_real} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-purple-700 hover:text-purple-900 text-xs font-bold bg-purple-100 hover:bg-purple-200 px-2 py-1.5 rounded transition-colors w-fit">
                                📎 Ver archivo adjunto
                              </a>
                              <button onClick={() => {
                                const nuevo = [...actividades];
                                nuevo[i] = {...nuevo[i], evidencia_real: ''};
                                setActividades(nuevo);
                              }} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded" title="Eliminar evidencia">
                                🗑️
                              </button>
                            </div>
                          ) : a.evidencia_real && a.evidencia_real.startsWith('[Archivo]') ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-bold bg-slate-100 px-2 py-1.5 rounded w-fit">
                                📎 {a.evidencia_real} (No subido)
                              </span>
                              <button onClick={() => {
                                const nuevo = [...actividades];
                                nuevo[i] = {...nuevo[i], evidencia_real: ''};
                                setActividades(nuevo);
                              }} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded" title="Eliminar evidencia">
                                🗑️
                              </button>
                            </div>
                          ) : (
                            <label className="flex items-center gap-1 cursor-pointer bg-white border border-purple-200 hover:border-purple-400 text-purple-700 px-2 py-1.5 rounded text-xs font-medium transition-colors w-fit shadow-sm">
                              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  if (file.size > 10 * 1024 * 1024) {
                                    if(setError) setError('Máx 10MB');
                                    return;
                                  }
                                  const { url, error } = await uploadEvidencia(file);
                                  if (error) {
                                    if(setError) setError('Error al subir: ' + error);
                                    return;
                                  }
                                  const nuevo = [...actividades];
                                  nuevo[i] = {...nuevo[i], evidencia_real: url};
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
          {form.comentarios_revision && (
            <div className="mt-4 bg-white p-4 rounded-lg border border-emerald-100">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Comentarios</p>
              <p className="text-emerald-950">{form.comentarios_revision}</p>
            </div>
          )}
        </div>
      )}
      
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
    </div>
  );
}
