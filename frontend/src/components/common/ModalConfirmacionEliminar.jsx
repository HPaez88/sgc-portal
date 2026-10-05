import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

export default function ModalConfirmacionEliminar({
  isOpen,
  onClose,
  onConfirm,
  titulo = 'Eliminar Registro',
  itemNombre = '',
  palabraRequerida = 'CONFIRMAR',
  descripcion = 'Esta acción es irreversible y afectará el historial de trazabilidad del Sistema de Gestión de Calidad (ISO 9001:2015).',
  requiereMotivo = true
}) {
  const [textoIngresado, setTextoIngresado] = useState('');
  const [motivo, setMotivo] = useState('');
  const [errorValidacion, setErrorValidacion] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTextoIngresado('');
      setMotivo('');
      setErrorValidacion('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const coincide = textoIngresado.trim().toUpperCase() === palabraRequerida.toUpperCase();

  const handleEjecutar = () => {
    if (!coincide) {
      setErrorValidacion(`Debe escribir exactamente "${palabraRequerida}" para confirmar.`);
      return;
    }
    if (requiereMotivo && motivo.trim().length < 5) {
      setErrorValidacion('Debe ingresar un motivo de al menos 5 caracteres para la bitácora.');
      return;
    }
    onConfirm(motivo.trim());
    onClose();
  };

  const modalEl = (
    <div className="fixed inset-0 z-[99999] flex items-start justify-center p-4 pt-16 bg-slate-950/80 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-rose-200 overflow-hidden animate-scale-up mb-8">
        {/* Encabezado con alerta */}
        <div className="bg-rose-50 px-6 py-4 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-rose-800">
            <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
              <ShieldAlert size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-rose-950">{titulo}</h3>
              <p className="text-[11px] text-rose-700 font-medium">Confirmación de seguridad requerida</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/80 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {descripcion}
          </p>

          {itemNombre && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Elemento a eliminar</p>
              <p className="text-xs font-bold text-slate-800 mt-0.5 break-words">{itemNombre}</p>
            </div>
          )}

          {requiereMotivo && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Motivo de la eliminación <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={motivo}
                onChange={(e) => { setMotivo(e.target.value); setErrorValidacion(''); }}
                placeholder="Indique la justificación para el registro de auditoría..."
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all placeholder:text-slate-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Escriba <span className="font-mono text-rose-600 font-extrabold">{palabraRequerida}</span> para autorizar:
            </label>
            <input
              type="text"
              autoFocus
              value={textoIngresado}
              onChange={(e) => { setTextoIngresado(e.target.value); setErrorValidacion(''); }}
              placeholder={`Escriba ${palabraRequerida} aquí`}
              className="w-full font-mono text-xs uppercase p-2.5 border-2 border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15 rounded-lg outline-none transition-all"
            />
          </div>

          {errorValidacion && (
            <p className="text-[11px] font-semibold text-rose-600 flex items-center gap-1.5 animate-shake">
              <AlertTriangle size={13} className="shrink-0" />
              {errorValidacion}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleEjecutar}
            disabled={!coincide || (requiereMotivo && motivo.trim().length < 5)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Trash2 size={14} />
            Eliminar Definitivamente
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalEl, document.body) : modalEl;
}
