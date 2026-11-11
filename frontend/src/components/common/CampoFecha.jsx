// Campo de fecha institucional: se captura y se ve como dd/mm/aaaa sin importar el idioma del navegador.
// Guarda aaaa-mm-dd y llama onChange({ target: { name, value } }) igual que un <input type="date">,
// así que reemplaza a <input type="date"> sin tocar la lógica de cada pantalla.
import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { formatearFecha, mascaraFecha, dmyAISO } from '../../constants/workflow';

const aTexto = (iso) => (iso ? formatearFecha(iso) : '');

export default function CampoFecha({ value, onChange, name, className = '', envoltura = 'w-full', disabled, min, max, ...resto }) {
  const [texto, setTexto] = useState(aTexto(value));
  const selector = useRef(null);

  useEffect(() => { setTexto(aTexto(value)); }, [value]);

  const emitir = (iso) => onChange?.({ target: { name, value: iso } });

  const escribir = (e) => {
    const t = mascaraFecha(e.target.value);
    setTexto(t);
    if (!t) emitir('');
    else if (t.length === 10 && dmyAISO(t)) emitir(dmyAISO(t));
  };

  const invalida = texto.length === 10 && !dmyAISO(texto);

  return (
    <span className={`relative inline-flex items-center ${envoltura}`}>
      <input
        {...resto}
        type="text"
        inputMode="numeric"
        name={name}
        value={texto}
        onChange={escribir}
        onBlur={() => { if (texto && !dmyAISO(texto)) setTexto(aTexto(value)); }}
        placeholder="dd/mm/aaaa"
        maxLength={10}
        disabled={disabled}
        aria-invalid={invalida || undefined}
        className={`${className} pr-8 ${invalida ? 'border-rose-400' : ''}`}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={() => selector.current?.showPicker?.()}
        title="Abrir calendario"
        className="absolute right-1.5 p-1 text-slate-400 hover:text-sky-700 disabled:opacity-40"
      >
        <CalendarDays size={14} />
      </button>
      {/* Calendario del sistema solo para elegir; lo que se ve siempre es dd/mm/aaaa */}
      <input
        ref={selector}
        type="date"
        value={value || ''}
        min={min}
        max={max}
        onChange={(e) => emitir(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute right-0 bottom-0 w-0 h-0 opacity-0 pointer-events-none"
      />
    </span>
  );
}
