// ═══════════════════════════════════════════════════════════════════════════
// SERVICIO DE CONTEXTO OPERATIVO Y BRIEFING EJECUTIVO SGC OOMAPASC
// Consolida en tiempo real: ACs (OOMRSC-20), PMs (OOMRSC-21), Indicadores (OOMRSC-05),
// Control Documental >1 año (ISO § 7.5.3) y Formularios de Dirección (OOMRSC-04).
// ═══════════════════════════════════════════════════════════════════════════

import { INDICADORES_OOMAPASC_OFICIALES, evalSemaforoOOMRSC05 } from '../constants/indicadores';
import { FORMULARIOS_COMPLEMENTARIOS_CONFIG, esPeriodoCapturaActivo } from '../constants/revisionDireccion';

/**
 * Calcula los días transcurridos desde una fecha (YYYY-MM-DD o ISO)
 */
export function calcularDiasAntiguedad(fechaStr) {
  if (!fechaStr) return 400; // Si no tiene fecha, asumimos antiguo para obligar revisión
  const fecha = new Date(fechaStr);
  if (isNaN(fecha.getTime())) return 400;
  const diffMs = Date.now() - fecha.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Calcula los días restantes hasta una fecha límite
 */
export function calcularDiasRestantes(fechaLimiteStr) {
  if (!fechaLimiteStr) return null;
  const limite = new Date(fechaLimiteStr);
  if (isNaN(limite.getTime())) return null;
  const diffMs = limite.getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Construye el objeto completo de contexto operativo para el usuario activo
 */
export function generarContextoOperativo({
  usuario,
  accionesCorrectivas = [],
  planesMejora = [],
  indicadoresData = {},
  documentos = [],
  areaFiltro = null
}) {
  const nombre = usuario?.nombre || 'Colaborador SGC';
  const area = areaFiltro || usuario?.area || 'Control y Servicios';
  const direccion = usuario?.direccion || 'Dir. Comercial';
  const rol = usuario?.rol || 'Encargado';

  const normalizar = (s) => (s || '').toLowerCase().trim();
  const areaNorm = normalizar(area);

  // 1. Acciones Correctivas (OOMRSC-20)
  const acsArea = (accionesCorrectivas || []).filter(ac => {
    const acAreaNorm = normalizar(ac.area);
    const coincideArea = !areaNorm || acAreaNorm === areaNorm || acAreaNorm.includes(areaNorm) || areaNorm.includes(acAreaNorm);
    const estaAbierta = ac.estado !== 'CERRADA' && ac.estado !== 'CERRADO';
    return coincideArea && estaAbierta;
  }).map(ac => {
    const diasRest = calcularDiasRestantes(ac.fecha_limite || ac.fechaCompromiso);
    return {
      id: ac.id,
      folio: ac.folio || `AC#${ac.id}`,
      titulo: ac.titulo || ac.descripcion || 'Acción Correctiva',
      descripcion: ac.descripcion || ac.hallazgo || '',
      estado: ac.estado || 'EN_SEGUIMIENTO',
      origen: ac.origen || 'Auditoría / Control',
      fecha_limite: ac.fecha_limite || ac.fechaCompromiso || 'Sin fecha',
      dias_restantes: diasRest,
      es_urgente: diasRest !== null && diasRest <= 15,
      auditor_asignado: ac.auditor_asignado || ac.auditor || 'Coordinación SGC'
    };
  });

  // 2. Planes de Mejora Continua (OOMRSC-21)
  const pmsArea = (planesMejora || []).filter(pm => {
    const pmAreaNorm = normalizar(pm.area);
    const coincideArea = !areaNorm || pmAreaNorm === areaNorm || pmAreaNorm.includes(areaNorm) || areaNorm.includes(pmAreaNorm);
    const estaActivo = pm.estado !== 'CONCLUIDO' && pm.estado !== 'CANCELADO';
    return coincideArea && estaActivo;
  }).map(pm => {
    const diasRest = calcularDiasRestantes(pm.fechaCompromiso || pm.fecha_termino || pm.fechaFin);
    const esProximo = diasRest !== null && diasRest <= 30; // Próximo a vencer en 30 días o menos
    return {
      id: pm.id,
      folio: pm.folio || `PM#${pm.id}`,
      titulo: pm.titulo || pm.nombre || 'Plan de Mejora Continua',
      descripcion: pm.descripcion || '',
      estado: pm.estado || 'EN_EJECUCION',
      fecha_termino: pm.fechaCompromiso || pm.fecha_termino || pm.fechaFin || 'Sin fecha',
      dias_restantes: diasRest,
      es_proximo_vencer: esProximo,
      presupuestoEstimado: Number(pm.presupuestoEstimado || pm.presupuesto || 0),
      avance: Number(pm.avance || pm.porcentajeAvance || 0),
      responsable: pm.responsable || nombre
    };
  });

  // 3. Indicadores del Área (OOMRSC-05)
  const indicadoresDelArea = (INDICADORES_OOMAPASC_OFICIALES || []).filter(ind => {
    const indAreaNorm = normalizar(ind.area);
    return !areaNorm || indAreaNorm === areaNorm || indAreaNorm.includes(areaNorm) || areaNorm.includes(indAreaNorm);
  }).map(ind => {
    const dataInd = indicadoresData?.[ind.id] || {};
    const mesActual = new Date().getMonth(); // 0 a 11
    const nombresMeses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const claveMes = nombresMeses[mesActual];
    
    // Obtener valor capturado o default
    const valorCapturado = dataInd[claveMes] !== undefined ? dataInd[claveMes] : ind.valor_default;
    const sem = evalSemaforoOOMRSC05(valorCapturado, ind.meta, ind.es_menor);

    return {
      id: ind.id,
      numero: ind.numero !== undefined ? ind.numero : ind.id,
      nombre: ind.nombre,
      proceso: ind.proceso,
      unidad: ind.unidad,
      meta: ind.meta,
      meta_anual: ind.meta_anual || ind.meta,
      valor_real: valorCapturado,
      porcentaje: sem.porcentaje,
      semaforo: sem.color === 'rose' ? 'Crítico' : (sem.color === 'amber' ? 'Preventivo' : 'Aceptable'),
      color_semaforo: sem.color,
      cumple: sem.cumple,
      es_incumplido: sem.cumple === 'NO' || sem.color === 'rose'
    };
  });

  const indsIncumplidos = indicadoresDelArea.filter(i => i.es_incumplido);
  const indsPreventivos = indicadoresDelArea.filter(i => i.semaforo === 'Preventivo');
  const indsAceptables = indicadoresDelArea.filter(i => i.cumple === 'SI' && i.semaforo === 'Aceptable');

  // 4. Control Documental Activo (ISO 9001 § 7.5.3)
  const docsDelArea = (documentos || []).filter(d => {
    const docAreaNorm = normalizar(d.area);
    return !areaNorm || docAreaNorm === areaNorm || docAreaNorm.includes(areaNorm) || areaNorm.includes(docAreaNorm);
  });

  // 4a. Documentos con más de 1 año (365 días) sin revisar/actualizar
  const docsAntiguos = docsDelArea.filter(d => {
    const dias = calcularDiasAntiguedad(d.fecha);
    return dias > 365 && d.estado !== 'OBSOLETO';
  }).map(d => ({
    id: d.id,
    clave: d.clave,
    titulo: d.titulo,
    tipo: d.tipo,
    version: d.version,
    fecha: d.fecha || 'Sin fecha registrada',
    dias_sin_revision: calcularDiasAntiguedad(d.fecha),
    estado: d.estado,
    autor: d.autor
  })).sort((a, b) => b.dias_sin_revision - a.dias_sin_revision);

  // 4b. Documentos pendientes de aprobación SGC (Borrador o En Revisión)
  const docsPendientesAprobacion = docsDelArea.filter(d => {
    return d.estado === 'BORRADOR' || d.estado === 'EN_REVISION';
  }).map(d => ({
    id: d.id,
    clave: d.clave,
    titulo: d.titulo,
    tipo: d.tipo,
    version: d.version,
    estado: d.estado,
    autor: d.autor || nombre
  }));

  // 5. Formularios de Revisión por la Dirección (OOMRSC-04)
  const periodoCapturaActivo = esPeriodoCapturaActivo ? esPeriodoCapturaActivo() : (new Date().getDate() <= 10);
  const formulariosRevision = (FORMULARIOS_COMPLEMENTARIOS_CONFIG || []).filter(f => {
    const fAreaNorm = normalizar(f.areaResponsable);
    return !areaNorm || fAreaNorm === areaNorm || fAreaNorm.includes(areaNorm) || areaNorm.includes(fAreaNorm);
  }).map(f => ({
    id: f.id,
    codigo: f.codigo,
    nombre: f.nombre,
    areaResponsable: f.areaResponsable,
    periodoActivo: periodoCapturaActivo
  }));

  const pmsProximos = pmsArea.filter(p => p.es_proximo_vencer);

  return {
    nombre,
    area,
    direccion,
    rol,
    fecha_consulta: new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    acciones_pendientes: acsArea,
    planes_mejora_activos: pmsArea,
    planes_proximos_vencer: pmsProximos,
    indicadores_area: indicadoresDelArea,
    indicadores_incumplidos: indsIncumplidos,
    indicadores_preventivos: indsPreventivos,
    indicadores_aceptables: indsAceptables,
    documentos_antiguos_sin_revision: docsAntiguos,
    documentos_pendientes_aprobacion: docsPendientesAprobacion,
    formularios_revision_pendientes: formulariosRevision,
    resumen_conteos: {
      total_ac_pendientes: acsArea.length,
      total_pm_activos: pmsArea.length,
      total_pm_proximos_vencer: pmsProximos.length,
      total_indicadores: indicadoresDelArea.length,
      total_indicadores_cumplidos: indsAceptables.length,
      total_indicadores_preventivos: indsPreventivos.length,
      total_indicadores_incumplidos: indsIncumplidos.length,
      total_docs_antiguos_sin_revision: docsAntiguos.length,
      total_docs_pendientes_aprobacion: docsPendientesAprobacion.length,
      total_formularios_revision: formulariosRevision.length
    }
  };
}

/**
 * Genera el Briefing Ejecutivo estructurado en Markdown en caso de fallback local u offline
 */
export function generarBriefingMarkdownLocal(ctx, { soloCuadro = true } = {}) {
  const c = ctx.resumen_conteos;
  const tieneAlertas = c.total_indicadores_incumplidos > 0 || c.total_pm_proximos_vencer > 0 || c.total_docs_antiguos_sin_revision > 0 || c.total_ac_pendientes > 0;

  let md = `## 📋 Diagnóstico Ejecutivo de Pendientes y Estado Operativo\n\n`;
  md += `**Colaborador:** ${ctx.nombre} | **Área:** ${ctx.area} (${ctx.direccion}) | **Rol:** ${ctx.rol}\n\n`;
  md += `> **Fecha de Evaluación:** ${ctx.fecha_consulta}\n\n`;

  const alertaIndicadores = c.total_indicadores_incumplidos > 0
    ? `🔴 ${c.total_indicadores_incumplidos} Incumplido(s)<br>🟢 ${c.total_indicadores_cumplidos} Cumplido(s)`
    : `🟢 100% Cumplimiento (${c.total_indicadores_cumplidos} cumplidos)`;

  // Tabla resumen de estado (exactamente 3 columnas consistentes en todas las filas)
  md += `| Módulo SGC | Total Registros | Estado / Alerta Prioritaria |\n`;
  md += `| :--- | :---: | :--- |\n`;
  md += `| ⚠️ **Acciones Correctivas (OOMRSC-20)** | **${c.total_ac_pendientes}** | ${c.total_ac_pendientes > 0 ? `🟡 ${c.total_ac_pendientes} acción(es) abierta(s) en seguimiento` : '🟢 Sin acciones abiertas'} |\n`;
  md += `| 🚀 **Planes de Mejora (OOMRSC-21)** | **${c.total_pm_activos}** | ${c.total_pm_proximos_vencer > 0 ? `🔴 **${c.total_pm_proximos_vencer} plan(es) próximo(s) a vencer**` : '🟢 En cronograma normal'} |\n`;
  md += `| 🎯 **Indicadores SGC (OOMRSC-05)** | **${c.total_indicadores}** | ${alertaIndicadores} |\n`;
  md += `| 📑 **Docs. >1 Año sin Revisar (§ 7.5.3)** | **${c.total_docs_antiguos_sin_revision}** | ${c.total_docs_antiguos_sin_revision > 0 ? `⚠️ **${c.total_docs_antiguos_sin_revision} doc(s) requieren revisión activa**` : '🟢 Toda la base vigente (<1 año)'} |\n`;
  md += `| ⏳ **Docs. Pendientes Aprobación SGC** | **${c.total_docs_pendientes_aprobacion}** | ${c.total_docs_pendientes_aprobacion > 0 ? `🟡 ${c.total_docs_pendientes_aprobacion} en Borrador/Revisión` : '🟢 Sin borradores pendientes'} |\n`;
  if (c.total_formularios_revision > 0) {
    md += `| 📝 **Revisión por Dirección (OOMRSC-04)** | **${c.total_formularios_revision}** | 📅 Captura obligatoria durante los primeros 10 días |\n`;
  }
  md += `\n`;

  if (soloCuadro) {
    return md;
  }

  md += `---\n\n`;

  // 1. Acciones Correctivas
  md += `### 1. ⚠️ Acciones Correctivas Pendientes (Formato OOMRSC-20 Rev. 18 / ISO 9001 § 10.2)\n`;
  if (ctx.acciones_pendientes.length === 0) {
    md += `*Tu área no tiene Acciones Correctivas pendientes por atender. ¡Excelente desempeño en control de no conformidades!*\n\n`;
  } else {
    md += `Tienes **${ctx.acciones_pendientes.length} acción(es) correctiva(s)** asignada(s) que requieren atención:\n\n`;
    ctx.acciones_pendientes.forEach((ac, idx) => {
      const urgenteTxt = ac.es_urgente ? ` — ⚠️ **¡PLAZO PRÓXIMO!** (${ac.dias_restantes} días)` : (ac.dias_restantes !== null ? ` (${ac.dias_restantes} días restantes)` : '');
      md += `${idx + 1}. **[${ac.folio}] ${ac.titulo}**\n`;
      md += `   - **Estado:** \`${ac.estado}\` | **Auditor Asignado:** ${ac.auditor_asignado}\n`;
      md += `   - **Fecha Límite:** ${ac.fecha_limite}${urgenteTxt}\n`;
      md += `   - **Causa / Hallazgo:** ${ac.descripcion}\n\n`;
    });
  }

  // 2. Planes de Mejora
  md += `### 2. 🚀 Planes de Mejora Continua (Formato OOMRSC-21 Rev. 02 / ISO 9001 § 10.3)\n`;
  if (ctx.planes_mejora_activos.length === 0) {
    md += `*No hay planes de mejora activos registrados actualmente para tu área.*\n\n`;
  } else {
    md += `Tienes **${ctx.planes_mejora_activos.length} plan(es) de mejora** activo(s):\n\n`;
    ctx.planes_mejora_activos.forEach((pm, idx) => {
      const alertaVencer = pm.es_proximo_vencer
        ? `\n   - ⚠️ **¡ALERTA DE VENCIMIENTO!** Faltan **${pm.dias_restantes} días** para el término del compromiso (${pm.fecha_termino}). Requiere verificar avances y evidencias.`
        : `\n   - **Fecha Compromiso:** ${pm.fecha_termino} (${pm.dias_restantes !== null ? `${pm.dias_restantes} días restantes` : ''})`;
      md += `${idx + 1}. **[${pm.folio}] ${pm.titulo}**\n`;
      md += `   - **Estado:** \`${pm.estado}\` | **Avance:** ${pm.avance}% | **Presupuesto Estimado:** $${pm.presupuestoEstimado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}${alertaVencer}\n`;
      if (pm.descripcion) md += `   - **Objetivo:** ${pm.descripcion}\n`;
      md += `\n`;
    });
  }

  // 3. Indicadores del Área
  md += `### 3. 🎯 Cuadro de Control de Desempeño (Formato OOMRSC-05 Rev. 37 / ISO 9001 § 9.1.3)\n`;
  if (ctx.indicadores_area.length === 0) {
    md += `*No se tienen indicadores específicos asignados a tu área en el Cuadro de Control general.*\n\n`;
  } else {
    md += `Tu área tiene **${ctx.indicadores_area.length} indicadores oficiales**:\n\n`;
    ctx.indicadores_area.forEach(ind => {
      let icon = '🟢';
      let tag = 'ACEPTABLE';
      if (ind.es_incumplido) {
        icon = '🔴';
        tag = '**INCUMPLIDO / CRÍTICO (<= 79%)** ➔ *Apertura de Reporte de Corrección (RC) u OOMRSC-20 obligatoria*';
      } else if (ind.semaforo === 'Preventivo') {
        icon = '🟡';
        tag = 'PREVENTIVO (80% a 89%)';
      }
      md += `- ${icon} **#${ind.numero} - ${ind.nombre}**\n`;
      md += `  - **Meta:** ${ind.meta_anual} ${ind.unidad} | **Real:** ${ind.valor_real !== undefined ? `${ind.valor_real} ${ind.unidad}` : 'Sin captura'} | **Semáforo:** ${tag}\n`;
    });
    md += `\n`;
  }

  // 4. Control Documental Activo
  md += `### 4. 📑 Mantenimiento Documental Activo y Trazabilidad (ISO 9001 § 7.5.3)\n`;
  
  if (ctx.documentos_antiguos_sin_revision.length > 0) {
    const totalAntiguos = ctx.documentos_antiguos_sin_revision.length;
    const procs = ctx.documentos_antiguos_sin_revision.filter(d => (d.tipo || '').toLowerCase().includes('procedimiento')).length;
    const regs = ctx.documentos_antiguos_sin_revision.filter(d => (d.tipo || '').toLowerCase().includes('registro') || (d.tipo || '').toLowerCase().includes('formato')).length;
    const otros = totalAntiguos - procs - regs;

    const desglose = [];
    if (procs > 0) desglose.push(`**${procs} procedimiento(s)**`);
    if (regs > 0) desglose.push(`**${regs} registro(s)/formato(s)**`);
    if (otros > 0) desglose.push(`**${otros} otro(s)**`);

    md += `⚠️ **ALERTA DE REVISIÓN PERIÓDICA:** Se detectaron **${totalAntiguos} documento(s) con más de 1 año sin actualizar/revisar** en tu área (${desglose.join(', ')}).\n\n`;
    md += `⚡ **¿Qué puedes hacer?** Conforme a la norma ISO 9001 § 7.5.3, no es necesario reescribirlos si el método de trabajo sigue vigente; basta con **ratificar su vigencia** para avalar que continúan operando.\n`;
    md += `- Para ratificarlos de forma rápida y directa sin saturar la pantalla, utiliza el botón de acción rápida **[Ratificar Doc >1 año]** disponible aquí en el asistente.\n`;
    md += `- Si algún procedimiento o registro sufrió modificaciones operativas en campo, ingresa al módulo de **Documentos** para emitir formalmente una nueva versión.\n\n`;
  } else {
    md += `🟢 *Todos los procedimientos y registros de tu área se encuentran actualizados con vigencia menor a 1 año.*\n\n`;
  }

  if (ctx.documentos_pendientes_aprobacion.length > 0) {
    const totalPend = ctx.documentos_pendientes_aprobacion.length;
    md += `⏳ **Documentos pendientes de aprobación SGC:** Se tienen **${totalPend} documento(s)** en proceso de revisión técnica y dictamen por la Coordinación del SGC.\n\n`;
  }

  // 5. Revisión por la Dirección
  if (ctx.formularios_revision_pendientes.length > 0) {
    md += `### 5. 📝 Formularios de Revisión por la Dirección (OOMRSC-04 Rev. 09 / ISO 9001 § 9.3)\n`;
    md += `Tu área es responsable de los siguientes formatos complementarios:\n`;
    ctx.formularios_revision_pendientes.forEach(f => {
      md += `- 📅 **[${f.codigo}] ${f.nombre}**\n`;
      md += `  - **Regla institucional:** Capturar en el portal dentro de los **primeros 10 días de cada mes** para consolidación ejecutiva.\n`;
    });
    md += `\n`;
  }

  // 6. Recomendaciones
  md += `### 6. 💡 Plan de Acción Inmediato Sugerido\n`;
  if (c.total_indicadores_incumplidos > 0) {
    md += `1. 🔴 **Atender Indicador Incumplido:** Elaborar inmediatamente el Reporte de Corrección (RC) para los indicadores en semáforo rojo y determinar si amerita apertura de formato OOMRSC-20.\n`;
  }
  if (c.total_pm_proximos_vencer > 0) {
    md += `2. 🚀 **Revisar Plan de Mejora Próximo a Vencer:** Contactar al equipo responsable para verificar entrega de evidencias y validar presupuesto ejercido.\n`;
  }
  if (c.total_docs_antiguos_sin_revision > 0) {
    md += `3. 📑 **Actualización Documental Activa:** Ratificar la vigencia de los ${c.total_docs_antiguos_sin_revision} procedimientos/registros de tu área con el botón de acción rápida **[Ratificar Doc >1 año]** para asegurar cumplimiento normativo sin sobrecarga administrativa.\n`;
  }
  if (c.total_ac_pendientes > 0) {
    md += `4. ⚠️ **Seguimiento a Acciones Correctivas:** Verificar que las actividades del plan de acción se encuentren capturadas con evidencia fotográfica o documental en el portal.\n`;
  }
  if (!tieneAlertas) {
    md += `1. 🟢 **Mantener la disciplina operativa:** Tu área se encuentra al 100% en cumplimiento normativo y control documental.\n`;
  }

  return md;
}
