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

export async function uploadEvidencia(file) {
  if (!supabase) return { error: 'Supabase no configurado' };
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    // Asumimos que el bucket se llama 'evidencias' y es público
    const { error: uploadError } = await supabase.storage
      .from('evidencias')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('evidencias')
      .getPublicUrl(fileName);

    return { url: data.publicUrl };
  } catch (e) {
    console.error('Error uploading file:', e);
    return { error: e.message };
  }
}
