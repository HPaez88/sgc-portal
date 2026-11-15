import React from 'react';
import { FileDown } from 'lucide-react';

// Botón único para los informes PDF institucionales del módulo de Indicadores.
export default function BotonInformePDF({ onClick, texto = 'Informe PDF', className = '' }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 text-xs font-bold text-white bg-marca-azul-oscuro hover:bg-marca-azul rounded-lg shadow-sm inline-flex items-center gap-1.5 transition-colors ${className}`}>
      <FileDown size={14} /> {texto}
    </button>
  );
}
