import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, AlertCircle } from 'lucide-react';

/**
 * Componente SelectBuscable (Searchable Combobox)
 * Permite filtrar en tiempo real listas largas (indicadores, acciones, documentos, áreas, usuarios)
 * escribiendo directamente cualquier palabra clave, clave, número o área.
 */
export default function SelectBuscable({
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar una opción...',
  searchPlaceholder = 'Escribe para filtrar opciones...',
  label = null,
  getOptionValue = (opt) => opt?.value ?? opt?.id ?? opt,
  getOptionLabel = (opt) => opt?.label ?? opt?.nombre ?? opt?.titulo ?? String(opt ?? ''),
  getOptionSublabel = (opt) => opt?.sublabel ?? opt?.area ?? opt?.descripcion ?? null,
  getOptionBadge = (opt) => opt?.badge ?? (opt?.numero !== undefined ? `#${opt.numero}` : opt?.clave ?? null),
  filterFunction = null,
  renderOption = null,
  renderSelected = null,
  disabled = false,
  className = '',
  dropdownClassName = '',
  maxHeight = 'max-h-64',
  id = null,
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(0);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Encontrar opción seleccionada
  const selectedOption = useMemo(() => {
    if (value === null || value === undefined || value === '') return null;
    return options.find(opt => String(getOptionValue(opt)) === String(value)) || null;
  }, [value, options, getOptionValue]);

  // Filtrado de opciones en tiempo real
  const filteredOptions = useMemo(() => {
    if (!busqueda.trim()) return options;

    const term = busqueda.toLowerCase().trim();
    if (filterFunction) {
      return options.filter(opt => filterFunction(opt, term));
    }

    return options.filter(opt => {
      const optLabel = String(getOptionLabel(opt) || '').toLowerCase();
      const optSublabel = String(getOptionSublabel(opt) || '').toLowerCase();
      const optBadge = String(getOptionBadge(opt) || '').toLowerCase();
      const optVal = String(getOptionValue(opt) || '').toLowerCase();

      return (
        optLabel.includes(term) ||
        optSublabel.includes(term) ||
        optBadge.includes(term) ||
        optVal.includes(term)
      );
    });
  }, [options, busqueda, filterFunction, getOptionLabel, getOptionSublabel, getOptionBadge, getOptionValue]);

  // Manejar clic fuera para cerrar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus en el input de búsqueda al abrir
  useEffect(() => {
    if (isOpen) {
      setBusqueda('');
      setFocusedIndex(0);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Asegurar que el elemento con foco esté visible en el scroll
  useEffect(() => {
    if (isOpen && listRef.current && filteredOptions.length > 0) {
      const activeEl = listRef.current.children[focusedIndex];
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex, isOpen, filteredOptions.length]);

  const handleSelect = (option) => {
    const val = getOptionValue(option);
    onChange?.(val, option);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredOptions[focusedIndex]) {
        handleSelect(filteredOptions[focusedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
          <span>{label} {required && <strong className="text-rose-500">*</strong>}</span>
          {options.length > 0 && (
            <span className="text-[10px] font-mono font-medium text-slate-400">
              {options.length} disponibles
            </span>
          )}
        </label>
      )}

      {/* Botón Trigger Principal */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between gap-2 shadow-2xs cursor-pointer ${
          disabled
            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
            : isOpen
            ? 'bg-white border-sky-500 ring-2 ring-sky-500/20 shadow-xs'
            : 'bg-slate-50 hover:bg-white border-slate-300 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption ? (
            renderSelected ? (
              renderSelected(selectedOption)
            ) : (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {getOptionBadge(selectedOption) && (
                  <span className="px-1.5 py-0.5 rounded font-mono text-[10.5px] font-bold bg-[#0B192C] text-sky-300 shrink-0">
                    {getOptionBadge(selectedOption)}
                  </span>
                )}
                <span className="truncate font-semibold text-slate-900">
                  {getOptionLabel(selectedOption)}
                </span>
                {getOptionSublabel(selectedOption) && (
                  <span className="text-[11px] text-slate-500 truncate hidden sm:inline">
                    • ({getOptionSublabel(selectedOption)})
                  </span>
                )}
              </div>
            )
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-sky-600' : ''}`}
          />
        </div>
      </button>

      {/* Menú Desplegable Flotante con Barra de Búsqueda */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fade-in ${dropdownClassName}`}
          style={{ minWidth: '100%' }}
        >
          {/* Barra de Búsqueda Interactiva en Tiempo Real */}
          <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setFocusedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => {
                    setBusqueda('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-200/80 text-slate-700 px-2 py-1 rounded-md shrink-0">
              {filteredOptions.length} de {options.length}
            </span>
          </div>

          {/* Listado de Opciones Filtradas */}
          <div
            ref={listRef}
            className={`overflow-y-auto ${maxHeight} divide-y divide-slate-100 p-1`}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-8 px-4 text-center text-xs text-slate-500 space-y-1">
                <AlertCircle size={20} className="mx-auto text-amber-500 mb-1 opacity-80" />
                <p className="font-bold text-slate-700">No se encontraron resultados</p>
                <p className="text-[11px] text-slate-400">
                  Ninguna opción coincide con "{busqueda}"
                </p>
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const optVal = getOptionValue(opt);
                const isSelected = selectedOption && String(getOptionValue(selectedOption)) === String(optVal);
                const isFocused = focusedIndex === idx;
                const badge = getOptionBadge(opt);
                const labelText = getOptionLabel(opt);
                const sublabel = getOptionSublabel(opt);

                return (
                  <div
                    key={String(optVal) || idx}
                    onClick={() => handleSelect(opt)}
                    onMouseEnter={() => setFocusedIndex(idx)}
                    className={`px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50 text-sky-950 font-bold border border-sky-200 shadow-2xs'
                        : isFocused
                        ? 'bg-slate-100/90 text-slate-900 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {renderOption ? (
                      renderOption(opt, isSelected)
                    ) : (
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {badge && (
                            <span
                              className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-extrabold shrink-0 ${
                                isSelected
                                  ? 'bg-[#0B192C] text-sky-300'
                                  : 'bg-slate-200 text-slate-800'
                              }`}
                            >
                              {badge}
                            </span>
                          )}
                          <span className="truncate leading-tight font-semibold">
                            {labelText}
                          </span>
                        </div>
                        {sublabel && (
                          <span className="text-[10.5px] text-slate-500 truncate mt-0.5 pl-0.5">
                            {sublabel}
                          </span>
                        )}
                      </div>
                    )}

                    {isSelected && (
                      <Check size={15} className="text-sky-600 shrink-0 stroke-[2.5]" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
