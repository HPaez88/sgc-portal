import React from 'react';

export function SelectField({ label, name, value, onChange, options = [], required, error, disabled, placeholder = 'Seleccionar...' }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-300 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        name={name}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        className={`w-full p-2.5 border rounded-lg text-sm glass-card-dark focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all ${
          error ? 'border-red-400 bg-red-50' : 'border-cyan-500/20'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={typeof opt === 'object' ? opt.value : opt} value={typeof opt === 'object' ? opt.value : opt}>
            {typeof opt === 'object' ? opt.label : opt}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default SelectField;
