import { useState } from 'react';

export function useFormValidation(initialData, validationRules = {}) {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (data) => {
    const newErrors = {};
    Object.entries(validationRules).forEach(([field, rules]) => {
      const value = data[field];
      if (rules.required && (!value || value.toString().trim() === '')) {
        newErrors[field] = 'Este campo es requerido';
      } else if (rules.minLength && value && value.length < rules.minLength) {
        newErrors[field] = `Mínimo ${rules.minLength} caracteres`;
      } else if (rules.pattern && value && !rules.pattern.test(value)) {
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

  const clearErrors = () => {
    setErrors({});
    setTouched({});
  };

  return { errors, touched, validate, handleBlur, isValid, clearErrors };
}