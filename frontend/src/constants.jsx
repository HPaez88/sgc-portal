export const COLORES = {
  azul: '#2A78B0',
  azulClaro: '#4a9fc9',
  azulOscuro: '#1e5a84',
  amarillo: '#f4c430',
  amarilloClaro: '#fff59d',
  verde: '#2e7d32',
  verdeClaro: '#a5d6a7',
  rojo: '#c62828',
  rojoClaro: '#ef9a9a',
  naranja: '#f57c00',
  naranjaClaro: '#ffcc80',
  grisClaro: '#f5f5f5',
  grisBorde: '#e0e0e0',
  blanco: '#ffffff',
  negro: '#212121',
  texto: '#424242',
  grisTexto: '#495057',
};

export const ESTADO_LABELS = {
  BORRADOR: 'Borrador',
  EN_REVISION: 'En Revisión',
  APROBADO: 'Aprobado',
  EN_SEGUIMIENTO: 'En Seguimiento',
  RECHAZADO: 'Rechazado',
  CERRADO: 'Cerrado',
};

export const ESTADO_COLORS = {
  BORRADOR: COLORES.texto,
  EN_REVISION: COLORES.naranja,
  APROBADO: COLORES.verde,
  EN_SEGUIMIENTO: COLORES.azul,
  RECHAZADO: COLORES.rojo,
  CERRADO: '#999',
};

export const ESTADO_BG = {
  BORRADOR: COLORES.grisClaro,
  EN_REVISION: '#fff3e0',
  APROBADO: '#e8f5e9',
  EN_SEGUIMIENTO: '#e3f2fd',
  RECHAZADO: '#ffebee',
  CERRADO: '#f5f5f5',
};

export const SectionTitle = ({ children, icon }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    background: COLORES.azul,
    borderRadius: '8px',
    marginBottom: '1rem',
  }}>
    {icon && <span style={{ fontSize: '1rem' }}>{icon}</span>}
    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: COLORES.blanco, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {children}
    </h3>
  </div>
);

export const InputLabel = ({ children, required }) => (
  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: COLORES.texto, marginBottom: '0.25rem' }}>
    {children}{required && <span style={{ color: COLORES.rojo }}> *</span>}
  </label>
);

export const Boton = ({ children, onClick, type = 'button', variant = 'primary', disabled = false, style: extraStyle }) => {
  const variants = {
    primary: { background: COLORES.azul, color: COLORES.blanco },
    success: { background: COLORES.verde, color: COLORES.blanco },
    danger: { background: COLORES.rojo, color: COLORES.blanco },
    secondary: { background: COLORES.grisClaro, color: COLORES.texto },
    warning: { background: COLORES.naranja, color: COLORES.blanco },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...v,
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: 6,
        fontSize: '0.85rem',
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...extraStyle,
      }}
    >
      {children}
    </button>
  );
};

export const Input = ({ value, onChange, placeholder, type = 'text', required = false, style: extraStyle }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    required={required}
    style={{
      width: '100%',
      padding: '0.5rem 0.75rem',
      border: `1px solid ${COLORES.grisBorde}`,
      borderRadius: 6,
      fontSize: '0.9rem',
      outline: 'none',
      ...extraStyle,
    }}
  />
);

export const Select = ({ value, onChange, options, placeholder = 'Seleccionar...' }) => (
  <select
    value={value}
    onChange={onChange}
    style={{
      width: '100%',
      padding: '0.5rem 0.75rem',
      border: `1px solid ${COLORES.grisBorde}`,
      borderRadius: 6,
      fontSize: '0.9rem',
      background: COLORES.blanco,
    }}
  >
    <option value="">{placeholder}</option>
    {options.map((opt, i) => (
      <option key={i} value={opt.value || opt}>{opt.label || opt}</option>
    ))}
  </select>
);

export const TextArea = ({ value, onChange, placeholder, rows = 3, required = false }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    required={required}
    style={{
      width: '100%',
      padding: '0.5rem 0.75rem',
      border: `1px solid ${COLORES.grisBorde}`,
      borderRadius: 6,
      fontSize: '0.9rem',
      resize: 'vertical',
      outline: 'none',
    }}
  />
);
