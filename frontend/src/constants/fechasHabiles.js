// Fechas de vencimiento en día hábil (regla de @human 2026-11-14): si caen en sábado o domingo se recorren al lunes.
// Recibe y devuelve 'aaaa-mm-dd' (o '' si viene vacía). Igual a backend/services/avisos_calendario.py.
export const esFinDeSemana = (iso) => {
  if (!iso) return false;
  const [a, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  const dia = new Date(a, m - 1, d).getDay();
  return dia === 0 || dia === 6;
};

export const siguienteHabil = (iso) => {
  if (!iso) return '';
  const [a, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  const f = new Date(a, m - 1, d);
  while (f.getDay() === 0 || f.getDay() === 6) f.setDate(f.getDate() + 1);
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;
};
