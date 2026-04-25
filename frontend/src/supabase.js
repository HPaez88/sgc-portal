import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yrjlmqxpakjiwrfwhgaj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyamxxeHBhY2ppd3Jmd2hnYWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0ODM4NjM4MywiZXhwIjoxOTYzOTYyMzgzfQ.K4AXLx0VHI6Uw2ThcHj7dXjZNL5N3zK6Q4zFzFj7TZY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function loadFromSupabase(table) {
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
  evidencias: 'evidencias'
};