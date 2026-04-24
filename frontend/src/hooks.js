import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key, storedValue]);

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