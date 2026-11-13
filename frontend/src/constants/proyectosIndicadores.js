// Setup anual de indicadores: Formato de Presentación de Proyectos → fichas técnicas → PEMS → Cuadro de Control.
// Una sola captura por proyecto; los formatos oficiales los llena el servidor (backend/services/formatos_indicadores.py).
export const CLAVE_PROYECTOS = 'sgc-proyectos-indicadores';
export const CAPITULOS = [
  ['1000', 'Servicios Personales'], ['2000', 'Materiales y Suministros'], ['3000', 'Servicios Generales'],
  ['4000', 'Transferencias, Asignaciones, Subsidios y Otras Ayudas'], ['5000', 'Bienes Muebles, Inmuebles e Intangibles'],
];
export const ESTADOS_PROYECTO = {
  BORRADOR: ['Borrador', 'bg-slate-100 text-slate-700 border-slate-200'],
  EN_REVISION: ['En revisión SGC', 'bg-amber-50 text-amber-900 border-amber-200'],
  APROBADO: ['Aprobado', 'bg-emerald-50 text-emerald-800 border-emerald-200'],
};
export const TRIMESTRES = ['T1', 'T2', 'T3', 'T4'];

const num = (v) => {
  const n = parseFloat(String(v ?? '').replace(/[%,$\s]/g, ''));
  return Number.isFinite(n) ? n : null;
};

export const nuevaActividad = () => ({
  id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  actividad: '', indicador: '', unidad: 'Porcentaje', meta: '', trimestres: ['', '', '', ''], ponderado: '',
  periodicidad: 'Mensual', ap_clave: '', ap_nombre: '', indicador_id: '', ficha: {}, avances: {},
});

export const nuevoProyecto = (anio, area, base = {}) => ({
  id: `proy-${Date.now()}`, anio, area, estado: 'BORRADOR', tipo: 'OPERACION',
  dependencia: base.dependencia || '', unidad_responsable: '', eje_rector: base.eje_rector || '', programa_pmd: '',
  programa_presupuestario: '', folio_tesoreria: '', nombre: '', resumen: '', justificacion: '', objetivo: '',
  fecha_inicio: `${anio}-01-01`, fecha_conclusion: `${anio}-12-31`,
  objetivo_pmd: '', estrategia_pmd: '', tipo_objetivo: 'OPERATIVO', objetivo_institucional: base.objetivo_institucional || '', titular: { nombre: '', cargo: '' }, fecha_elaboracion: '',
  actividades: [nuevaActividad()], presupuesto: {},
  firmas: { director_general: { ...(base.director_general || { nombre: '', cargo: 'Director General' }) }, director_area: { nombre: '', cargo: '' } },
  pems: { ...(base.pems || {}) }, historial: [],
});

export const palabras = (t) => String(t || '').trim().split(/\s+/).filter(Boolean).length;
export const LIMITE_PALABRAS = { resumen: 150, justificacion: 350, objetivo: 50 };

/** Total anual y por trimestre del presupuesto. */
export function totalesPresupuesto(presupuesto = {}) {
  const t = [0, 0, 0, 0];
  CAPITULOS.forEach(([c]) => (presupuesto[c] || []).forEach((v, i) => { t[i] += num(v) || 0; }));
  return { trimestres: t, anual: t.reduce((a, b) => a + b, 0) };
}

/** Lo que falta para mandar a revisión (lista de textos; vacía = completo). */
export function faltantesProyecto(p) {
  const f = [];
  [['unidad_responsable', 'Unidad responsable'], ['eje_rector', 'Eje rector PMD'], ['programa_presupuestario', 'Programa presupuestario'],
    ['nombre', 'Nombre del proyecto'], ['resumen', 'Resumen ejecutivo'], ['justificacion', 'Justificación'], ['objetivo', 'Objetivo']]
    .forEach(([k, t]) => { if (!String(p[k] || '').trim()) f.push(t); });
  Object.entries(LIMITE_PALABRAS).forEach(([k, max]) => { if (palabras(p[k]) > max) f.push(`${k} excede ${max} palabras`); });
  const acts = p.actividades || [];
  if (!acts.length) f.push('Al menos una actividad');
  acts.forEach((a, i) => {
    if (!a.actividad?.trim() || !a.indicador?.trim() || num(a.meta) === null) f.push(`Actividad ${i + 1}: actividad, indicador y meta`);
  });
  const pond = acts.reduce((s, a) => s + (num(a.ponderado) || 0), 0);
  if (acts.length && Math.round(pond) !== 100) f.push(`El ponderado suma ${pond}% (debe sumar 100%)`);
  return f;
}

/** Avance trimestral (PEMS, por actividad): ¿cumple contra la meta del trimestre? */
export function cumpleTrimestre(a, ti) {
  const meta = num(a.trimestres?.[ti]);
  const real = num(a.avances?.[TRIMESTRES[ti]]?.avance);
  if (meta === null || real === null) return null;
  return real >= meta;
}

/** Justificación automática que cumple el formato cuando una actividad no alcanza su meta trimestral (editable). */
export function justificacionAutomatica(a, ti) {
  const meta = a.trimestres?.[ti];
  const real = a.avances?.[TRIMESTRES[ti]]?.avance;
  const u = /porcent/i.test(a.unidad || '') ? '%' : '';
  return `En el ${['primer', 'segundo', 'tercer', 'cuarto'][ti]} trimestre se alcanzó ${real}${u} de la meta programada de ${meta}${u} `
    + `en la actividad "${String(a.actividad || '').trim()}". La diferencia obedece a factores operativos del periodo; el área `
    + 'reprogramará las acciones pendientes para el siguiente trimestre a fin de cumplir la meta anual comprometida.';
}

export const OBJETIVO_INSTITUCIONAL_OOMAPASC = 'PROCESAR Y SUMINISTRAR AGUA POTABLE BRINDANDO SERVICIO DE CALIDAD, APROVECHANDO EFICIENTEMENTE LOS RECURSOS HUMANOS, FINANCIEROS Y MATERIALES, PROMOVIENDO LA MEJORA CONTINUA, CAPACITANDO CONSTANTEMENTE A NUESTRO PERSONAL, ASÍ COMO GARANTIZAR EL ALCANTARILLADO Y SANEAMIENTO PARA CONTRIBUIR CON EL CUIDADO DEL MEDIO AMBIENTE, EL BIENESTAR Y SATISFACCIÓN DE NUESTROS USUARIOS.';

// Piloto: Informática 2027, tomado tal cual de sus formatos oficiales (MIR_INFORMATICA_2027).
const ALINEACION_PILOTO = {
  objetivo_pmd: 'REHABILITACIÓN Y MANTENIMIENTO DE LA RED HIDRÁULICA Y SANITARIA',
  estrategia_pmd: 'ESTABLECER UN PROGRAMA DE MEDICIÓN DEL USO DE AGUA Y CUMPLIMIENTO CIUDADANO, QUE PERMITA UNA MAYOR MODERNIZACIÓN DEL SERVICIO.',
};
const FICHA_COMUN = { tipo_indicador: 'GESTIÓN', dimension: 'EFICACIA', sentido: 'ASCENDENTE', recopilacion: 'REGISTROS ESTABLECIDOS EN LA MASTERWEB', otro: 'NO APLICA' };
export const PILOTO_INFORMATICA_2027 = {
  anio: 2027, area: 'Informática', estado: 'BORRADOR', tipo: 'OPERACION',
  dependencia: 'OOMAPAS DE CAJEME', unidad_responsable: 'DIRECCIÓN ADMINISTRATIVA / GERENCIA DE INFORMATICA',
  eje_rector: 'INFRAESTRUCTURA Y SUSTENTABILIDAD PARA EL DESARROLLO', programa_pmd: '',
  programa_presupuestario: 'PP10 GESTIÓN Y FORTALECIMIENTO DEL OOMAPASC', folio_tesoreria: '',
  nombre: 'ASEGURAR EL BUEN FUNCIONAMIENTO DE LOS SISTEMAS TECNOLÓGICOS',
  resumen: 'TENER LOS SERVICIOS INFORMÁTICOS EL MAYOR TIEMPO POSIBLE PARA GARANTIZAR CUALQUIER AFECTACIÓN EN LA OPERATIVIDAD DE LAS ÁREAS, ADEMÁS DE GARANTIZAR LA VIDA ÚTIL DE LOS EQUIPOS DE CÓMPUTO, ASÍ COMO ASEGURAR CUALQUIER PERDIDA DE INFORMACIÓN',
  justificacion: 'AL ESTAR EN ÓPTIMAS CONDICIONES LOS EQUIPOS TECNOLÓGICOS, GARANTIZAMOS LA COBRANZA ENTRE AGENCIAS Y NO SE VE AFECTADA LA OPERACIÓN DE LAS DIFERENTES ÁREAS.',
  objetivo: 'GARANTIZAR EL SERVICIO QUE SE PRESTA A LAS DIFERENTES ÁREAS DEL ORGANISMO.',
  fecha_inicio: '2027-01-01', fecha_conclusion: '2027-12-31',
  ...ALINEACION_PILOTO, tipo_objetivo: 'OPERATIVO', objetivo_institucional: OBJETIVO_INSTITUCIONAL_OOMAPASC,
  titular: { nombre: 'JESÚS ALFREDO TORRES MIRANDA', cargo: 'GERENTE DE INFORMÁTICA' }, fecha_elaboracion: '2026-10-26',
  actividades: [
    { actividad: 'DAR CUMPLIMIENTO AL CALENDARIO DE MANTENIMIENTO PREVENTIVO', indicador: 'CUMPLIR CON EL PROGRAMA DE MANTENIMIENTO PREVENTIVO DE LOS EQUIPOS DE CÓMPUTO',
      unidad: 'Porcentaje', meta: '100', trimestres: ['25', '25', '25', '25'], ponderado: '20', periodicidad: 'Mensual', ap_clave: '605', ap_nombre: 'ADMINISTRACIÓN DE LOS RECURSOS INFORMÁTICOS',
      ficha: { ...FICHA_COMUN, definicion: 'CUMPLIMIENTO AL 100% DEL CALENDARIO DE MANTENIMIENTO PREVENTIVO', metodo: 'MANTENIMIENTOS REALIZADOS / MANTENIMIENTOS PROGRAMADOS *100',
        variables: 'MANTENIMIENTOS REALIZADOS Y MANTENIMIENTOS PROGRAMADOS', linea_base: '100%', supuestos: 'EN CASO DE PRESENTARSE UNA SUSPENSIÓN DE LABORES POR PANDEMIA, SE VERÍA AFECTADO EL MANTENIMIENTO PREVENTIVO.',
        claridad: 'PORCENTAJE DE CUMPLIMIENTO DE PROGRAMADO CON EL REALIZADO', relevancia: 'ES DE SUMA IMPORTANCIA LOS MANTENIMIENTOS PREVENTIVOS PORQUE ASÍ EVITAMOS EL MANTENIMIENTO CORRECTIVO',
        economia: 'AL REALIZAR EL MANTENIMIENTO PREVENTIVO A EQUIPOS SE EXTIENDE LA VIDA ÚTIL DEL EQUIPO', monitoreable: 'SE PUEDE DAR SEGUIMIENTO A CADA SERVICIO PRESTADO',
        adecuado: 'SE REALIZA EL CORRECTO MANTENIMIENTO DE LOS DIFERENTES EQUIPOS.', medios: 'REGISTRO OOMRGI-05' } },
    { actividad: 'SOLUCIONAR LAS SOLICITUDES DE SERVICIOS REALIZADAS POR LOS USUARIOS EN UN TIEMPO MENOR A 3 DÍAS', indicador: 'SOLUCIONAR LAS SOLICITUDES DE SERVICIO',
      unidad: 'Porcentaje', meta: '95', trimestres: ['24', '24', '24', '23'], ponderado: '60', periodicidad: 'Mensual', ap_clave: '610', ap_nombre: 'DEFINIR Y EJECUTAR ACCIONES DE MANTENIMIENTO  Y CONSERVACIÓN DE RECURSOS INFORMÁTICOS.',
      ficha: { ...FICHA_COMUN, definicion: 'SOLUCIONAR EL 95% DE LAS SOLICITUDES EN UN PLAZO NO MAYOR A 3 DÍAS', metodo: 'NÚMERO DE SOLICITUDES ATENDIDAS EN MENOS DE 3 DÍAS / NÚMERO DE SOLICITUDES INGRESADAS * 100',
        variables: 'NÚMERO DE SOLICITUDES ATENDIDAS EN MENOS DE 3 DÍAS Y NÚMERO DE SOLICITUDES INGRESADAS', linea_base: '98%', supuestos: 'EN CASO DE PRESENTARSE UNA SUSPENSIÓN DE LABORES POR PANDEMIA, SE VERÁ AFECTADO EL SERVICIO PRESTADO A LAS ÁREAS.',
        claridad: 'PORCENTAJE DE CUMPLIMIENTO EN UN PLAZO NO MAYOR A 3 DÍAS', relevancia: 'SE DA SOLUCIÓN A LA PROBLEMÁTICA DE LOS USUARIOS',
        economia: 'AL RESOLVER LAS SOLICITUDES DE SERVICIOS GARANTIZAMOS LA COBRANZA ENTRE LAS AGENCIAS', adecuado: 'ES ADECUADO POR QUE SE ASEGURA LA OPERACIÓN DEL ORGANISMO', medios: 'REGISTRO OOMRGI-13' } },
    { actividad: 'REALIZAR OPORTUNAMENTE LOS MANTENIMIENTOS A SERVIDORES', indicador: 'ASEGURAR LA DISPONIBILIDAD DE LOS SERVICIOS CRÍTICOS DE INFORMÁTICA',
      unidad: 'Porcentaje', meta: '95', trimestres: ['24', '24', '24', '23'], ponderado: '20', periodicidad: 'Mensual', ap_clave: '618', ap_nombre: 'FORMULAR Y EJECUTAR ACCIONES DE PEDIDOS Y CONTRATOS DE LOS RECURSOS INFORMÁTICOS.',
      ficha: { ...FICHA_COMUN, definicion: 'ASEGURAR EL 95% DE LA DISPONIBILIDAD DE LOS SERVICIOS CRÍTICOS DE INFORMÁTICA', metodo: 'NÚMERO DE FALLAS / NÚMEROS DE SERVICIOS * 100',
        variables: 'NÚMERO DE FALLAS Y NÚMERO DE SERVICIOS', linea_base: '100%', supuestos: 'EN CASO DE PRESENTARSE UNA SUSPENSIÓN DE LABORES POR PANDEMIA SE VERÍA AFECTADO EL SERVICIO PRESTADO A LAS ÁREAS.',
        claridad: 'PORCENTAJE DE CUMPLIMIENTO DE LOS SERVICIOS CRÍTICOS', relevancia: 'TENIENDO TODOS LOS SERVICIOS ACTIVOS AYUDA A LA OPERACIÓN DIARIA',
        economia: 'SE ASEGURA LA COBRANZA ENTRE LAS AGENCIAS', monitoreable: 'SE PUEDE LLEVAR UN MONITOREO DIARIO, SEMANAL O MENSUAL DE TODOS LOS SERVICIOS',
        adecuado: 'ES NECESARIO TENER LA DISPONIBILIDAD DE LOS SERVICIOS', medios: 'REGISTRO OOMRGI-08' } },
  ],
  presupuesto: {
    1000: ['1333671', '1333671', '1333671', '1333671'], 2000: ['405000', '212000', '150000', '25000'],
    3000: ['2516179', '923513', '803513', '693513'], 4000: ['0', '0', '0', '0'], 5000: ['1357400', '375600', '85400', '12400'],
  },
  firmas: { director_general: { nombre: 'ING. JOSÉ LUIS PABLOS MONTES', cargo: 'DIRECTOR GENERAL' }, director_area: { nombre: 'C.P. ROBERTO VALENZUELA ORTEGA', cargo: 'DIRECTOR ADMINISTRATIVO' } },
  pems: {
    municipio: '19 CAJEME', finalidad: '02 DESARROLLO SOCIAL', funcion: '01 PROTECCION AMBIENTAL', subfuncion: '02 ADMINISTRACION DEL AGUA',
    dependencia: 'OB OOMAPAS DE CAJEME', clave_subdependencia: '05 03', subdependencia: 'GERENCIA DE INFORMATICA',
    programa: '03 APOYO A LA OPERACIÓN  DEL SISTEMA MUNICIPAL HIDRÁULICO.', subprograma: '01 ADMINISTRACIÓN DE RECURSOS MATERIALES Y FINANCIEROS.', clave_grupo: '600',
  },
};
