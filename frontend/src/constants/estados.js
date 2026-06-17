// Estados del workflow SGC y funciones de color
export const ESTADOS_SGC = [
  'BORRADOR',
  'EN_REVISION',
  'APROBADO',
  'EN_SEGUIMIENTO',
  'RECHAZADO',
  'CERRADO'
];

export const ROLES = ['Super Admin', 'Admin', 'Auditor', 'Encargado', 'Usuario'];

export const getEstadoColor = (estado) => {
  switch (estado) {
    case 'BORRADOR': 
    case 'GENERADO_IA': return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'EN_REVISION': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'APROBADO': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'EN_SEGUIMIENTO': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'REVISION_AUDITOR': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case 'RECHAZADO': return 'bg-red-100 text-red-700 border-red-200';
    case 'CERRADO':
    case 'CERRADO_EFECTIVO': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'CERRADO_NO_EFECTIVO': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-slate-100 text-slate-600 border-slate-200';
  }
};

export const getEstadoLabel = (estado) => {
  const labels = {
    BORRADOR: 'Borrador',
    GENERADO_IA: 'Borrador',
    EN_REVISION: 'Pendiente',
    APROBADO: 'Aprobado',
    EN_SEGUIMIENTO: 'En Seguimiento',
    REVISION_AUDITOR: 'Revisión Auditor',
    RECHAZADO: 'Rechazado',
    CERRADO: 'Cerrado',
    CERRADO_EFECTIVO: 'Cerrado (Efectiva)',
    CERRADO_NO_EFECTIVO: 'Cerrado (No Efectiva)'
  };
  return labels[estado] || estado;
};

export const getRolColor = (rol) => {
  switch (rol) {
    case 'Super Admin': return 'bg-purple-100 text-purple-700';
    case 'Admin': return 'bg-cyan-100 text-cyan-700';
    case 'Auditor': return 'bg-blue-100 text-blue-700';
    case 'Encargado': return 'bg-amber-100 text-amber-700';
    case 'Usuario': return 'bg-slate-100 text-slate-600';
    default: return 'bg-slate-100 text-slate-600';
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'Aprobado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'Pendiente': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'En Seguimiento': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'Borrador': return 'bg-slate-100 text-slate-700 border-slate-200';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};