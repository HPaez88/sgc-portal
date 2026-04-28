import { useState } from 'react';

export default function AccionCorrectivaView({ accionesCorrectivas, setAccionesCorrectivas, evidencias, setEvidencias, usuarios, puedeTodasAreas, areaUsuario }) {
  const [loading, setLoading] = useState(false);
  const [guardado, setGuardado] = useState(false);
  
  const [form, setForm] = useState({
    codigo: `AC-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    area: areaUsuario || '',
    proceso: '',
    origen: '',
    descripcion: ''
  });

  const handleChange = (e) => {
    setForm({...form, [e.target.name]: e.target.value});
  };

  const guardar = () => {
    setLoading(true);
    const nuevo = {
      ...form,
      id: Date.now(),
      estado: 'BORRADOR',
      fecha_creacion: new Date().toISOString()
    };
    setAccionesCorrectivas([...accionesCorrectivas, nuevo]);
    setLoading(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <h1 className="text-2xl font-bold text-[#002855] mb-4">Acciones Correctivas - OOMRSC-20</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
          <input type="text" value={form.codigo} className="w-full p-2 border rounded-lg bg-slate-50" readOnly />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Área *</label>
            <select name="area" value={form.area} onChange={handleChange} className="w-full p-2 border rounded-lg">
              <option value="">Seleccionar</option>
              <option value="Sistema de Gestión de Calidad">Sistema de Gestión de Calidad</option>
              <option value="Control de Calidad">Control de Calidad</option>
              <option value="Atención Ciudadana">Atención Ciudadana</option>
              <option value="Mantenimiento de Redes">Mantenimiento de Redes</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Proceso *</label>
            <select name="proceso" value={form.proceso} onChange={handleChange} className="w-full p-2 border rounded-lg">
              <option value="">Seleccionar</option>
              <option value="Gestión de Servicio">Gestión de Servicio</option>
              <option value="Gestión de Calidad">Gestión de Calidad</option>
              <option value="Atención a Usuarios">Atención a Usuarios</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Origen</label>
          <select name="origen" value={form.origen} onChange={handleChange} className="w-full p-2 border rounded-lg">
            <option value="">Seleccionar</option>
            <option value="Auditoría Interna">Auditoría Interna</option>
            <option value="Auditoría Externa">Auditoría Externa</option>
            <option value="Queja de Usuario">Queja de Usuario</option>
            <option value="Detección de Personal">Detección de Personal</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descripción No Conformidad *</label>
          <textarea name="descripcion" value={form.descripcion} onChange={handleChange} rows={4} className="w-full p-2 border rounded-lg" placeholder="Describa la no conformidad..." />
        </div>
        
        <button onClick={guardar} disabled={loading} className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600">
          {loading ? 'Guardando...' : 'Guardar Acción Correctiva'}
        </button>
        
        {guardado && (
          <div className="p-3 bg-emerald-100 text-emerald-700 rounded-lg">✓ Guardado exitosamente</div>
        )}
      </div>
      
      {/* Lista de AC existentes */}
      <div className="mt-8">
        <h2 className="text-lg font-bold text-[#002855] mb-4">Acciones Registradas</h2>
        {accionesCorrectivas?.length === 0 ? (
          <p className="text-slate-400">No hay acciones correctivas registradas</p>
        ) : (
          <div className="space-y-2">
            {accionesCorrectivas?.slice(-5).reverse().map((ac, i) => (
              <div key={i} className="p-3 border rounded-lg bg-slate-50">
                <div className="font-medium text-[#002855]">{ac.codigo}</div>
                <div className="text-sm text-slate-600">{ac.descripcion?.substring(0, 60)}...</div>
                <div className="text-xs text-slate-400">{ac.estado}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}