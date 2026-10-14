// ====================================================================
// CONTROL PRESUPUESTAL POR ÁREA Y CAPÍTULOS DE GASTO (CONAC) - OOMAPASC
// Estructura oficial para el desglose financiero operativo de las áreas
// ====================================================================

import { AREAS_DETALLE_INICIALES } from './areas';

export const CAPITULOS_CONAC = [
  {
    codigo: '1000',
    nombre: 'Servicios Personales',
    descripcion: 'Remuneraciones al personal, sueldos base, tiempo extraordinario, cuotas de seguridad social y prestaciones laborales contractuales.'
  },
  {
    codigo: '2000',
    nombre: 'Materiales y Suministros',
    descripcion: 'Materiales de administración y oficina, sustancias químicas y reactivos para potabilización, combustibles, lubricantes, herramientas menores y refacciones para redes y bombas.'
  },
  {
    codigo: '3000',
    nombre: 'Servicios Generales',
    descripcion: 'Energía eléctrica (CFE) para pozos, cárcamos y rebombeos, agua potable, arrendamientos, servicios de mantenimiento correctivo y preventivo, servicios profesionales, seguros y fletes.'
  },
  {
    codigo: '4000',
    nombre: 'Transferencias, Asignaciones, Subsidios y Otras Ayudas',
    descripcion: 'Subsidios institucionales, apoyos a programas sociales, convenios de colaboración y transferencias corrientes.'
  },
  {
    codigo: '5000',
    nombre: 'Bienes Muebles, Inmuebles e Intangibles',
    descripcion: 'Mobiliario, equipo de cómputo, vehículos operativos de cuadrilla, equipo de laboratorio, bombas de extracción y licencias de software.'
  },
  {
    codigo: '6000',
    nombre: 'Inversión Pública',
    descripcion: 'Obra pública en bienes de dominio público, reposición de colectores de drenaje sanitario, sectorización hidrométrica y nuevas perforaciones de pozos.'
  }
];

// Presupuesto operativo base por área (ejercicio 2026 en pesos MXN)
export const PRESUPUESTOS_AREAS_INICIALES = AREAS_DETALLE_INICIALES.map((item, idx) => {
  // Ponderaciones realistas según el perfil operativo del área
  let factor1000 = 2500000;
  let factor2000 = 450000;
  let factor3000 = 850000;
  let factor4000 = 0;
  let factor5000 = 120000;
  let factor6000 = 0;

  if (item.direccion === 'Dir. Técnica') {
    factor1000 = 8500000;
    factor2000 = 4200000; // reactivos, cloro, tuberías
    factor3000 = 14500000; // CFE energía pozos
    factor5000 = 1800000;
    if (item.nombre.includes('Obras') || item.nombre.includes('Infraestructura') || item.nombre.includes('Sectorización')) {
      factor6000 = 9500000;
    }
  } else if (item.direccion === 'Dir. Comercial') {
    factor1000 = 6200000;
    factor2000 = 980000;
    factor3000 = 3100000;
    factor5000 = 450000;
  } else if (item.direccion === 'Dir. Administrativa') {
    factor1000 = 4800000;
    factor2000 = 1200000;
    factor3000 = 4800000;
    factor5000 = 890000;
    if (item.nombre === 'Contabilidad') factor4000 = 1500000;
  } else if (item.direccion === 'Dir. Programas Sociales y Cultura del Agua') {
    factor1000 = 1800000;
    factor2000 = 650000;
    factor3000 = 750000;
    factor4000 = 850000;
    factor5000 = 95000;
  }

  // Porcentaje ejercido promedio al corte actual (Octubre: aprox 75% - 82%)
  const pctEjercido = 0.76 + ((idx % 7) * 0.015);

  const capitulos = {
    '1000': {
      asignado: factor1000,
      ejercido: Math.round(factor1000 * pctEjercido),
      comprometido: Math.round(factor1000 * 0.12),
    },
    '2000': {
      asignado: factor2000,
      ejercido: Math.round(factor2000 * pctEjercido),
      comprometido: Math.round(factor2000 * 0.10),
    },
    '3000': {
      asignado: factor3000,
      ejercido: Math.round(factor3000 * pctEjercido),
      comprometido: Math.round(factor3000 * 0.14),
    },
    '4000': {
      asignado: factor4000,
      ejercido: Math.round(factor4000 * pctEjercido),
      comprometido: Math.round(factor4000 * 0.05),
    },
    '5000': {
      asignado: factor5000,
      ejercido: Math.round(factor5000 * pctEjercido),
      comprometido: Math.round(factor5000 * 0.08),
    },
    '6000': {
      asignado: factor6000,
      ejercido: Math.round(factor6000 * (pctEjercido * 0.85)),
      comprometido: Math.round(factor6000 * 0.20),
    }
  };

  // Agregar disponible a cada capítulo
  Object.keys(capitulos).forEach(k => {
    const c = capitulos[k];
    c.disponible = Math.max(0, c.asignado - c.ejercido - c.comprometido);
    c.pctEjercido = c.asignado > 0 ? Math.round((c.ejercido / c.asignado) * 100) : 0;
  });

  const totalAsignado = Object.values(capitulos).reduce((s, c) => s + c.asignado, 0);
  const totalEjercido = Object.values(capitulos).reduce((s, c) => s + c.ejercido, 0);
  const totalComprometido = Object.values(capitulos).reduce((s, c) => s + c.comprometido, 0);
  const totalDisponible = Math.max(0, totalAsignado - totalEjercido - totalComprometido);
  const totalPctEjercido = totalAsignado > 0 ? Math.round((totalEjercido / totalAsignado) * 100) : 0;

  return {
    areaId: item.id,
    areaNombre: item.nombre,
    direccion: item.direccion,
    encargado: item.encargado,
    correo: item.correo,
    telefono: item.telefono,
    ejercicio: 2026,
    capitulos,
    totales: {
      asignado: totalAsignado,
      ejercido: totalEjercido,
      comprometido: totalComprometido,
      disponible: totalDisponible,
      pctEjercido: totalPctEjercido
    },
    distribucionTrimestral: {
      T1: { programado: Math.round(totalAsignado * 0.24), ejercido: Math.round(totalAsignado * 0.235) },
      T2: { programado: Math.round(totalAsignado * 0.26), ejercido: Math.round(totalAsignado * 0.258) },
      T3: { programado: Math.round(totalAsignado * 0.25), ejercido: Math.round(totalAsignado * 0.247) },
      T4: { programado: Math.round(totalAsignado * 0.25), ejercido: Math.round(totalAsignado * 0.02) }
    },
    ultimaActualizacion: new Date().toISOString()
  };
});

// Función de consolidación general de todas las áreas
export function calcularConsolidadoCapitulos(presupuestos = PRESUPUESTOS_AREAS_INICIALES) {
  const resumen = {
    capitulos: {},
    totales: {
      asignado: 0,
      ejercido: 0,
      comprometido: 0,
      disponible: 0,
      pctEjercido: 0
    }
  };

  CAPITULOS_CONAC.forEach(cap => {
    resumen.capitulos[cap.codigo] = {
      codigo: cap.codigo,
      nombre: cap.nombre,
      asignado: 0,
      ejercido: 0,
      comprometido: 0,
      disponible: 0,
      pctEjercido: 0
    };
  });

  presupuestos.forEach(areaData => {
    CAPITULOS_CONAC.forEach(cap => {
      const c = areaData.capitulos?.[cap.codigo] || { asignado: 0, ejercido: 0, comprometido: 0, disponible: 0 };
      resumen.capitulos[cap.codigo].asignado += c.asignado || 0;
      resumen.capitulos[cap.codigo].ejercido += c.ejercido || 0;
      resumen.capitulos[cap.codigo].comprometido += c.comprometido || 0;
      resumen.capitulos[cap.codigo].disponible += c.disponible || 0;
    });

    resumen.totales.asignado += areaData.totales?.asignado || 0;
    resumen.totales.ejercido += areaData.totales?.ejercido || 0;
    resumen.totales.comprometido += areaData.totales?.comprometido || 0;
    resumen.totales.disponible += areaData.totales?.disponible || 0;
  });

  // Calcular porcentajes
  CAPITULOS_CONAC.forEach(cap => {
    const c = resumen.capitulos[cap.codigo];
    c.pctEjercido = c.asignado > 0 ? Math.round((c.ejercido / c.asignado) * 100) : 0;
  });

  resumen.totales.pctEjercido = resumen.totales.asignado > 0
    ? Math.round((resumen.totales.ejercido / resumen.totales.asignado) * 100)
    : 0;

  return resumen;
}

// Exportar CSV oficial para abrir en Excel
export function exportarControlPresupuestalCSV(presupuestos) {
  const encabezados = [
    'Direccion',
    'Area Operativa',
    'Encargado',
    'Capitulo',
    'Concepto CONAC',
    'Presupuesto Asignado',
    'Presupuesto Ejercido',
    'Presupuesto Comprometido',
    'Saldo Disponible',
    '% Avance'
  ];

  const filas = [];
  presupuestos.forEach(area => {
    CAPITULOS_CONAC.forEach(cap => {
      const c = area.capitulos?.[cap.codigo] || {};
      filas.push([
        `"${area.direccion}"`,
        `"${area.areaNombre}"`,
        `"${area.encargado}"`,
        `"Capitulo ${cap.codigo}"`,
        `"${cap.nombre}"`,
        (c.asignado || 0).toFixed(2),
        (c.ejercido || 0).toFixed(2),
        (c.comprometido || 0).toFixed(2),
        (c.disponible || 0).toFixed(2),
        `${c.pctEjercido || 0}%`
      ]);
    });
  });

  const contenido = [encabezados.join(','), ...filas.map(f => f.join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + contenido], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Control_Presupuestal_OOMAPASC_Capitulos_${new Date().getFullYear()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
