import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yrjlmqxpakjiwrfwhgaj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyamxxeHBhY2ppd3Jmd2hnYWoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0ODM4NjM4MywiZXhwIjoxOTYzOTYyMzgzfQ.K4AXLx0VHI6Uw2ThcHj7dXjZNL5N3zK6Q4zFzFj7TZY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const tables = {
  usuarios: 'usuarios',
  accionesCorrectivas: 'acciones_correctivas',
  planesMejora: 'planes_mejora',
  indicadoresData: 'indicadores_data',
  riesgos: 'riesgos',
  documentos: 'documentos',
  auditorias: 'auditorias',
  evidencias: 'evidencias',
  seguimientos: 'seguimientos'
};

export async function syncTable(table, data) {
  try {
    const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
    return { error };
  } catch (e) {
    return { error: e.message };
  }
}

export async function fetchTable(table, filters = {}) {
  try {
    let query = supabase.from(table).select('*');
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        query = query.eq(key, value);
      }
    });
    const { data, error } = await query;
    return { data, error };
  } catch (e) {
    return { data: null, error: e.message };
  }
}

export async function loginUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  return { data, error };
}

export async function signOut() {
  return await supabase.auth.signOut();
}