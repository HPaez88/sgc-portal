import { useState, useEffect } from 'react';

/**
 * Hook para detección responsiva y activación del Modo Consulta Móvil
 * Retorna si el dispositivo actual es móvil (< 768px), tablet (< 1024px) o escritorio.
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < breakpoint;
  });

  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
      setIsTablet(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Validación inmediata al montar

    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return { isMobile, isTablet, isDesktop: !isMobile };
}

export default useIsMobile;
