import React from 'react';

export function InputField({ label, name, value, onChange, type = 'text', placeholder, required, error, disabled }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full p-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all ${
          error ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export default InputField;
