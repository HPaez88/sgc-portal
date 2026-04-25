const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const supabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY
};

export function getSupabaseClient() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase no configurado - usando localStorage');
    return null;
  }
  
  const { createClient } = require('@supabase/supabase-js');
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export const tables = {
  usuarios: 'usuarios',
  accionesCorrectivas: 'acciones_correctivas',
  planesMejora: 'planes_mejora',
  indicadores: 'indicadores',
  indicadoresData: 'indicadores_data',
  riesgos: 'riesgos',
  documentos: 'documentos',
  auditorias: 'auditorias',
  evidencies: 'evidencias',
  seguimientos: 'seguimientos'
};

export async function syncToSupabase(table, data) {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: 'Supabase no configurado' };
  
  const { error } = await supabase.from(table).upsert(data);
  return { error };
}

export async function fetchFromSupabase(table, filters = {}) {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: 'Supabase no configurado' };
  
  let query = supabase.from(table).select('*');
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      query = query.eq(key, value);
    }
  });
  
  const { data, error } = await query;
  return { data, error };
}