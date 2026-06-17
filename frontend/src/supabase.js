import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const missingConfigResult = () => ({
  error: 'Supabase no esta configurado. Define VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.',
});

export async function loadFromSupabase(table) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase.from(table).select('*');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error(`Error loading ${table}:`, e);
    return [];
  }
}

export async function saveToSupabase(table, data) {
  if (!supabase) return missingConfigResult();
  try {
    const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.error(`Error saving ${table}:`, e);
    return { error: e.message };
  }
}

export async function insertToSupabase(table, data) {
  if (!supabase) return missingConfigResult();
  try {
    const { error } = await supabase.from(table).insert(data);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.error(`Error inserting ${table}:`, e);
    return { error: e.message };
  }
}

export async function deleteFromSupabase(table, id) {
  if (!supabase) return missingConfigResult();
  try {
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (e) {
    console.error(`Error deleting from ${table}:`, e);
    return { error: e.message };
  }
}

export const tables = {
  usuarios: 'usuarios',
  accionesCorrectivas: 'acciones_correctivas',
  planesMejora: 'planes_mejora',
  indicadoresData: 'indicadores_data',
  riesgos: 'riesgos',
  documentos: 'documentos',
  auditorias: 'auditorias',
  evidencias: 'evidencias',
};
