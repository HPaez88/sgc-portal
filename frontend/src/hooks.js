import { useState, useEffect, useCallback } from 'react';
import { esClaveSincronizada, guardar, leerCache, registrar } from './services/estadoService';

export function useLocalStorage(key, initialValue) {
  // Caché local para arrancar rápido; el servidor manda en cuanto carga (ver estadoService).
  const [storedValue, setStoredValue] = useState(() => {
    const cache = leerCache(key);
    return cache === undefined ? initialValue : cache;
  });

  useEffect(() => {
    if (!esClaveSincronizada(key)) return undefined;
    return registrar(key, setStoredValue, leerCache(key));
  }, [key]);

  const setValue = useCallback((value) => {
    setStoredValue((prev) => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      guardar(key, valueToStore);
      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue];
}

export function useFormValidation(initialData = {}, validationRules = {}) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = useCallback((data = initialData) => {
    const newErrors = {};
    
    Object.keys(validationRules).forEach(field => {
      const rules = validationRules[field];
      const value = data[field];
      const val = value == null ? '' : String(value);
      
      if (rules.required && val.trim() === '') {
        newErrors[field] = 'Este campo es requerido';
      }
      
      if (rules.minLength && val.length < rules.minLength) {
        newErrors[field] = `Mínimo ${rules.minLength} caracteres`;
      }
      
      if (rules.pattern && val && !rules.pattern.test(val)) {
        newErrors[field] = rules.patternMessage || 'Formato inválido';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [initialData, validationRules]);

  const handleBlur = useCallback((field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const isValid = useCallback(() => Object.keys(errors).length === 0, [errors]);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  return { errors, touched, validate, handleBlur, isValid, clearErrors };
}

export { useIsMobile } from './hooks/useIsMobile';