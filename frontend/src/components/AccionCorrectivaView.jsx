import { useState } from 'react';

const AREAS = [
  "Agencia Esperanza", "Agencia Marte R. Gómez", "Agencia Providencia", "Agencia Pueblo Yaqui",
  "Alcantarillado y Saneamiento", "Atención Ciudadana", "Contabilidad", "Control de Calidad",
  "Informática", "Mantenimiento de Redes", "Recursos Humanos", "Sistema de Gestión de Calidad"
];

const PROCESOS = ["Comercialización", "Gestión de Recursos", "Medición Análisis y Mejora", "Producción"];

export default function AccionCorrectivaView({ accionesCorrectivas, setAccionesCorrectivas, usuarios, puedeTodasAreas, areaUsuario, usuarioLogueado }) {
  const [vista, setVista] = useState('lista');
  
  // Always show list first
  const acList = accionesCorrectivas || [];
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-[#002855] mb-4">Acciones Correctivas</h1>
      
      <button 
        onClick={() => setVista('nuevo')}
        className="px-4 py-2 bg-[#002855] text-white rounded-lg mb-4"
      >
        + Nueva Acción Correctiva
      </button>
      
      <div className="mt-4">
        <p className="text-slate-600">Total: {acList.length} acciones</p>
      </div>
      
      <table className="w-full mt-4 border">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-2 border">Folio</th>
            <th className="p-2 border">Área</th>
            <th className="p-2 border">Estado</th>
          </tr>
        </thead>
        <tbody>
          {acList.length === 0 ? (
            <tr>
              <td colSpan={3} className="p-4 text-center text-slate-500">
                No hay acciones correctivas
              </td>
            </tr>
          ) : (
            acList.map((ac, i) => (
              <tr key={i} className="border">
                <td className="p-2 border">{ac.folio_codigo || '-'}</td>
                <td className="p-2 border">{ac.area || '-'}</td>
                <td className="p-2 border">{ac.estado || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}