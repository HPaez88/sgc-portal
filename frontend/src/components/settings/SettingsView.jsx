import React, { useState } from 'react';
import { AREAS, PROCESOS, DIRECCIONES, getRolColor } from '../../constants';
import { useLocalStorage } from '../../hooks';
import { Users, Building, Plus, Trash2, CheckCircle2, Edit } from 'lucide-react';
export default function SettingsView({ usuarios = [], setUsuarios }) {
  const [mostrarModalUser, setMostrarModalUser] = useState(false);
  const [procesos, setProcesos] = useLocalStorage('sgc-config-procesos', PROCESOS);
  const [areas, setAreas] = useLocalStorage('sgc-config-areas', AREAS);
  const [direcciones, setDirecciones] = useLocalStorage('sgc-config-direcciones', DIRECCIONES);
  const [nuevoProceso, setNuevoProceso] = useState('');
  const [nuevaArea, setNuevaArea] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre: '', email: '', telefono: '', area: '', rol: 'Usuario', direccion: '', password: '' });
  const [confirmDelete, setConfirmDelete] = useState({ show: false, type: '', name: '', action: null });
  const [editandoUsuario, setEditandoUsuario] = useState({ show: false, user: null });
  
  const usuariosList = Array.isArray(usuarios) ? usuarios : [];
  
  const safeSetUsuarios = typeof setUsuarios === 'function' ? setUsuarios : () => {};

  const guardarEdicionUsuario = () => {
    if (editandoUsuario.user) {
      safeSetUsuarios(usuariosList.map(u => u.id === editandoUsuario.user.id ? editandoUsuario.user : u));
      setEditandoUsuario({ show: false, user: null });
    }
  };
  
  const agregarProceso = () => {
    const value = nuevoProceso.trim();
    if (value && !procesos.includes(value)) {
      setProcesos([...procesos, value]);
      setNuevoProceso('');
    }
  };
  
  const eliminarProceso = (p) => {
    setConfirmDelete({ show: true, type: 'proceso', name: p, action: () => {
      setProcesos(procesos.filter(x => x !== p));
      setConfirmDelete({ show: false, type: '', name: '', action: null });
    }});
  };
  
  const agregarArea = () => {
    const value = nuevaArea.trim();
    if (value && !areas.includes(value)) {
      setAreas([...areas, value]);
      setNuevaArea('');
    }
  };
  
  const eliminarArea = (a) => {
    setConfirmDelete({ show: true, type: 'área', name: a, action: () => {
      setAreas(areas.filter(x => x !== a));
      setConfirmDelete({ show: false, type: '', name: '', action: null });
    }});
  };
  
  const agregarDireccion = () => {
    const value = nuevaDireccion.trim();
    if (value && !direcciones.includes(value)) {
      setDirecciones([...direcciones, value]);
      setNuevaDireccion('');
    }
  };
  
  const eliminarDireccion = (d) => {
    setConfirmDelete({ show: true, type: 'dirección', name: d, action: () => {
      setDirecciones(direcciones.filter(x => x !== d));
      setConfirmDelete({ show: false, type: '', name: '', action: null });
    }});
  };
  
  const agregarUsuario = () => {
    if (!nuevoUsuario.nombre.trim() || !nuevoUsuario.email.trim() || !nuevoUsuario.area) return;
    safeSetUsuarios(prev => [...prev, { ...nuevoUsuario, id: Date.now() }]);
    setNuevoUsuario({ nombre: '', email: '', telefono: '', area: '', rol: 'Usuario', direccion: '', password: '' });
    setMostrarModalUser(false);
  };

  const eliminarUsuario = (id) => {
    setConfirmDelete({ show: true, type: 'usuario', name: id, action: () => {
      safeSetUsuarios(prev => prev.filter(u => u.id !== id));
      setConfirmDelete({ show: false, type: '', name: '', action: null });
    }});
  };

  const getRolBadge = (rol) => {
    try {
      return getRolColor(rol) || 'bg-slate-100 text-slate-700';
    } catch {
      return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-8 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Total Usuarios</p>
          <p className="text-2xl font-bold text-white">{usuariosList.length}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
          <p className="text-xs text-yellow-600">Super Admin</p>
          <p className="text-2xl font-bold text-yellow-700">{usuariosList.filter(u => u.rol === 'Super Admin').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Admins</p>
          <p className="text-2xl font-bold text-white">{usuariosList.filter(u => u.rol === 'Admin').length}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
          <p className="text-xs text-blue-600">Auditores</p>
          <p className="text-2xl font-bold text-blue-700">{usuariosList.filter(u => u.rol === 'Auditor').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Encargados</p>
          <p className="text-2xl font-bold text-white">{usuariosList.filter(u => u.rol === 'Encargado').length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Áreas</p>
          <p className="text-2xl font-bold text-white">{areas.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Direcciones</p>
          <p className="text-2xl font-bold text-white">{direcciones.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500">Procesos</p>
          <p className="text-2xl font-bold text-white">{procesos.length}</p>
        </div>
      </div>

      {/* Usuarios */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-[#002855] flex items-center gap-2">
            <Users size={20} className="text-cyan-500" />
            Gestión de Usuarios
          </h2>
          <button onClick={() => setMostrarModalUser(true)} className="flex items-center gap-2 px-4 py-2 bg-[#002855] text-white rounded-lg text-sm font-medium hover:bg-[#001f42]">
            <Plus size={16} /> Nuevo Usuario
          </button>
        </div>
        
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3 text-sm font-semibold text-slate-700">Nombre</th>
              <th className="p-3 text-sm font-semibold text-slate-700">Email</th>
              <th className="p-3 text-sm font-semibold text-slate-700">Teléfono</th>
              <th className="p-3 text-sm font-semibold text-slate-700">Área</th>
              <th className="p-3 text-sm font-semibold text-slate-700">Dirección</th>
              <th className="p-3 text-sm font-semibold text-slate-700">Rol</th>
              <th className="p-3 text-sm font-semibold text-slate-700">Contraseña</th>
              <th className="p-3 text-sm font-semibold text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosList.map(u => (
              <tr key={u.id} className={`border-t border-slate-100 hover:bg-slate-50/50 ${u.rol === 'Super Admin' ? 'bg-purple-50' : ''}`}>
                <td className="p-3 font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    {u.rol === 'Super Admin' && <span className="text-yellow-500" title="Super Admin">👑</span>}
                    {u.nombre}
                  </div>
                </td>
                <td className="p-3 text-sm text-slate-700">{u.email}</td>
                <td className="p-3 text-sm text-slate-700">{u.telefono}</td>
                <td className="p-3 text-sm text-slate-700">{u.area}</td>
                <td className="p-3 text-sm text-slate-700">{u.direccion || '-'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getRolBadge(u.rol)}`}>
                    {u.rol}
                  </span>
                </td>
                <td className="p-3">
                  <span className="text-sm text-slate-500">{u.password ? '••••••••' : '-'}</span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button onClick={() => { 
                      setEditandoUsuario({ show: true, user: u }); 
                    }} className="p-2 text-blue-500 hover:bg-blue-50 rounded" title="Editar usuario">
                      <Edit size={16} />
                    </button>
                    {u.rol !== 'Super Admin' ? (
                      <button onClick={() => eliminarUsuario(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <span className="p-2 text-slate-700 cursor-not-allowed" title="No se puede eliminar">
                        <Trash2 size={16} />
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Áreas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-[#002855] flex items-center gap-2">
            <Building size={20} className="text-cyan-500" />
            Catálogo de Áreas
          </h2>
          <div className="flex gap-2">
            <input 
              value={nuevaArea} 
              onChange={(e) => setNuevaArea(e.target.value)}
              placeholder="Nueva área..." 
              className="p-2 border border-slate-200 rounded-lg text-sm"
              onKeyDown={(e) => e.key === 'Enter' && agregarArea()}
            />
            <button onClick={agregarArea} className="px-3 py-2 bg-[#002855] text-white rounded-lg text-sm hover:bg-[#001f42]">
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {areas.map(a => (
            <div key={a} className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-sm text-slate-700">{a}</span>
              </div>
              <button onClick={() => eliminarArea(a)} className="text-red-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Direcciones */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-[#002855] flex items-center gap-2">
            <Building size={20} className="text-cyan-500" />
            Catálogo de Direcciones
          </h2>
          <div className="flex gap-2">
            <input 
              value={nuevaDireccion} 
              onChange={(e) => setNuevaDireccion(e.target.value)}
              placeholder="Nueva dirección..." 
              className="p-2 border border-slate-200 rounded-lg text-sm"
              onKeyDown={(e) => e.key === 'Enter' && agregarDireccion()}
            />
            <button onClick={agregarDireccion} className="px-3 py-2 bg-[#002855] text-white rounded-lg text-sm hover:bg-[#001f42]">
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {direcciones.map(d => (
            <div key={d} className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-sm text-slate-700">{d}</span>
              </div>
              <button onClick={() => eliminarDireccion(d)} className="text-red-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Procesos */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="font-bold text-[#002855] flex items-center gap-2">
            <Building size={20} className="text-cyan-500" />
            Catálogo de Procesos
          </h2>
          <div className="flex gap-2">
            <input 
              value={nuevoProceso} 
              onChange={(e) => setNuevoProceso(e.target.value)}
              placeholder="Nuevo proceso..." 
              className="p-2 border border-slate-200 rounded-lg text-sm"
              onKeyDown={(e) => e.key === 'Enter' && agregarProceso()}
            />
            <button onClick={agregarProceso} className="px-3 py-2 bg-[#002855] text-white rounded-lg text-sm hover:bg-[#001f42]">
              <Plus size={16} />
            </button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {procesos.map(p => (
            <div key={p} className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                <span className="text-sm text-slate-700">{p}</span>
              </div>
              <button onClick={() => eliminarProceso(p)} className="text-red-400 hover:text-red-600">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Confirmación Eliminar */}
      {confirmDelete.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="font-bold text-[#002855] mb-2">Confirmar eliminación</h3>
            <p className="text-slate-700 mb-4">¿Estás seguro de eliminar <strong>{confirmDelete.type}</strong>: "{confirmDelete.name}"?</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete({ show: false, type: '', name: '', action: null })} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg">Cancelar</button>
              <button onClick={confirmDelete.action} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Usuario */}
      {mostrarModalUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-[#002855] mb-4">Nuevo Usuario</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input value={nuevoUsuario.nombre} onChange={(e) => setNuevoUsuario({...nuevoUsuario, nombre: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="Nombre..." />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input type="email" value={nuevoUsuario.email} onChange={(e) => setNuevoUsuario({...nuevoUsuario, email: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="correo@oomapasc.gob.mx" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
                <input value={nuevoUsuario.telefono} onChange={(e) => setNuevoUsuario({...nuevoUsuario, telefono: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="644XXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Área</label>
                <select value={nuevoUsuario.area} onChange={(e) => setNuevoUsuario({...nuevoUsuario, area: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="">Seleccionar...</option>
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Dirección</label>
                <select value={nuevoUsuario.direccion} onChange={(e) => setNuevoUsuario({...nuevoUsuario, direccion: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="">Seleccionar...</option>
                  {direcciones.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Rol</label>
                <select value={nuevoUsuario.rol} onChange={(e) => setNuevoUsuario({...nuevoUsuario, rol: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="Usuario">Usuario (Ver + indicators/evidencias)</option>
                  <option value="Encargado">Encargado (Su área: AC, PM, indicadores)</option>
                  <option value="Auditor">Auditor (Crear AC/PM cualquier área, ver resultados)</option>
                  <option value="Admin">Admin (Compañeros SGC - todas las áreas)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Contraseña</label>
                <input type="password" value={nuevoUsuario.password || ''} onChange={(e) => setNuevoUsuario({...nuevoUsuario, password: e.target.value})} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="Contraseña inicial..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMostrarModalUser(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg">Cancelar</button>
              <button onClick={agregarUsuario} className="flex-1 px-4 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#001f42]">Agregar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Usuario */}
      {editandoUsuario.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-[#002855] mb-4">Editar Usuario</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input value={editandoUsuario.user.nombre} onChange={(e) => setEditandoUsuario({...editandoUsuario, user: {...editandoUsuario.user, nombre: e.target.value}})} className="w-full p-2.5 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input type="email" value={editandoUsuario.user.email} onChange={(e) => setEditandoUsuario({...editandoUsuario, user: {...editandoUsuario.user, email: e.target.value}})} className="w-full p-2.5 border border-slate-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
                <input value={editandoUsuario.user.telefono} onChange={(e) => setEditandoUsuario({...editandoUsuario, user: {...editandoUsuario.user, telefono: e.target.value}})} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="644XXXXXXX" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Área</label>
                <select value={editandoUsuario.user.area} onChange={(e) => setEditandoUsuario({...editandoUsuario, user: {...editandoUsuario.user, area: e.target.value}})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="">Seleccionar...</option>
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Dirección</label>
                <select value={editandoUsuario.user.direccion} onChange={(e) => setEditandoUsuario({...editandoUsuario, user: {...editandoUsuario.user, direccion: e.target.value}})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="">Seleccionar...</option>
                  {direcciones.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Rol</label>
                <select value={editandoUsuario.user.rol} onChange={(e) => setEditandoUsuario({...editandoUsuario, user: {...editandoUsuario.user, rol: e.target.value}})} className="w-full p-2.5 border border-slate-200 rounded-lg">
                  <option value="Usuario">Usuario</option>
                  <option value="Encargado">Encargado</option>
                  <option value="Auditor">Auditor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nueva Contraseña</label>
                <input type="password" value={editandoUsuario.user.newPassword || ''} onChange={(e) => setEditandoUsuario({...editandoUsuario, user: {...editandoUsuario.user, newPassword: e.target.value}})} className="w-full p-2.5 border border-slate-200 rounded-lg" placeholder="Nueva contraseña..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditandoUsuario({ show: false, user: null })} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg">Cancelar</button>
              <button onClick={guardarEdicionUsuario} className="flex-1 px-4 py-2 bg-[#002855] text-white rounded-lg hover:bg-[#001f42]">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
