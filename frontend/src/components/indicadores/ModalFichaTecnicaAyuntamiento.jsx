import React from 'react';
import ModalGestionarIndicador from './ModalGestionarIndicador';

/**
 * ModalFichaTecnicaAyuntamiento
 * Adaptador / fachada unificada hacia ModalGestionarIndicador.
 * Asegura que tanto la Ficha Técnica para el Ayuntamiento (PMD) como la
 * Configuración Operativa del SGC (Cuadro OOMRSC-05) se gestionen
 * desde UNA SOLA VENTANA con pestañas, sin duplicar títulos ni información.
 */
export default function ModalFichaTecnicaAyuntamiento({
  isOpen,
  onClose,
  ficha,
  fichaData,
  indicadorOriginal,
  indicadorAEditar,
  onGuardarIndicador,
  onGuardarFicha,
  onGuardarFichaPersonalizada,
  fichasPersonalizadas = {},
  valoresMensuales = {},
  direccionesDisponibles = [],
  procesosDisponibles = [],
  areasDisponibles = [],
  totalIndicadores = 100,
  listaIndicadores = [],
  pestañaInicial = 'pmd'
}) {
  return (
    <ModalGestionarIndicador
      isOpen={isOpen}
      onClose={onClose}
      fichaData={ficha || fichaData}
      indicadorAEditar={indicadorOriginal || indicadorAEditar}
      onGuardarIndicador={onGuardarIndicador}
      onGuardarFichaPersonalizada={onGuardarFichaPersonalizada || onGuardarFicha}
      fichasPersonalizadas={fichasPersonalizadas}
      valoresMensuales={valoresMensuales}
      direccionesDisponibles={direccionesDisponibles}
      procesosDisponibles={procesosDisponibles}
      areasDisponibles={areasDisponibles}
      totalIndicadores={totalIndicadores}
      listaIndicadores={listaIndicadores}
      pestañaInicial={pestañaInicial}
    />
  );
}
