import { useState, useEffect } from 'react';

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

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue];
}

export function useFormValidation(initialData, validationRules) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (data = initialData) => {
    const newErrors = {};
    
    Object.keys(validationRules).forEach(field => {
      const rules = validationRules[field];
      const value = data[field];
      
      if (rules.required && (!value || value.trim() === '')) {
        newErrors[field] = 'Este campo es requerido';
      }
      
      if (rules.minLength && value && value.length < rules.minLength) {
        newErrors[field] = `Mínimo ${rules.minLength} caracteres`;
      }
      
      if (rules.pattern && value && !rules.pattern.test(value)) {
        newErrors[field] = rules.patternMessage || 'Formato inválido';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const isValid = () => Object.keys(errors).length === 0;

  return { errors, touched, validate, handleBlur, isValid };
}