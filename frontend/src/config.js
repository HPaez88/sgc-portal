const getApiBase = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  return 'http://127.0.0.1:8080';
};

const API_BASE = getApiBase();

export const getApiUrl = (path) => {
  if (!API_BASE || API_BASE === 'http://127.0.0.1:8080') {
    return path;
  }
  return `${API_BASE}${path}`;
};

export { API_BASE };

