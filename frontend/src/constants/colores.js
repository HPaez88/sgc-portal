// Funciones de color para riesgos e indicadores
export const getColorNivel = (nivel) => {
  if (nivel >= 15) return 'bg-red-600 text-white';
  if (nivel >= 10) return 'bg-orange-500 text-white';
  if (nivel >= 5) return 'bg-yellow-400 text-black';
  return 'bg-green-400 text-black';
};

export const getNivelRiesgo = (probabilidad, impacto) => probabilidad * impacto;

export const getSemaphoreColor = (pct) => {
  if (pct >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-700', icon: '🟢', border: 'border-emerald-200' };
  if (pct >= 50) return { bg: 'bg-amber-500', text: 'text-amber-700', icon: '🟡', border: 'border-amber-200' };
  return { bg: 'bg-red-500', text: 'text-red-700', icon: '🔴', border: 'border-red-200' };
};

// Paleta de colores legacy para formularios (AC/PM)
export const COLORES = {
  azul: '#005a9c',
  azulOscuro: '#002855',
  azulClaro: '#e0f0ff',
  blanco: '#ffffff',
  grisBorde: '#e2e8f0',
  grisTexto: '#64748b',
  rojo: '#ef4444',
  verde: '#10b981',
  grisClaro: '#f8fafc',
  negro: '#0f172a'
};