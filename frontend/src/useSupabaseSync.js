import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from './supabase';

const TABLE_MAP = {
  'sgc-usuarios': 'usuarios',
  'sgc-acciones-correctivas': 'acciones_correctivas',
  'sgc-planes-mejora': 'planes_mejora',
  'sgc-indicadores-data': 'indicadores_data',
  'sgc-riesgos': 'riesgos',
  'sgc-documentos': 'documentos',
  'sgc-auditorias': 'auditorias',
  'sgc-evidencias': 'evidencias',
  'sgc-seguimientos': 'seguimientos',
  'sgc-aprobaciones': 'aprobaciones',
};

export function useSupabaseSync(key, initialValue, options = {}) {
  const { debounceMs = 1000, tableName = TABLE_MAP[key] || key, skip = false } = options;
  const [data, setData] = useState(initialValue);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState(null);
  const [synced, setSynced] = useState(false);
  const debounceRef = useRef(null);

  // Load from Supabase on mount
  useEffect(() => {
    if (skip) {
      setLoading(false);
      return;
    }

    async function loadData() {
      try {
        // Load from localStorage first (immediate)
        const localData = localStorage.getItem(key);
        if (localData) {
          setData(JSON.parse(localData));
        }

        // Then try Supabase
        const { data: supabaseData, error: sbError } = await supabase
          .from(tableName)
          .select('*')
          .order('id', { ascending: true });

        if (sbError) {
          console.warn(`Supabase load error for ${tableName}:`, sbError);
          // Keep localStorage data
        } else if (supabaseData && supabaseData.length > 0) {
          // Merge with localStorage - Supabase takes precedence if newer
          const localArray = localData ? JSON.parse(localData) : [];
          if (Array.isArray(supabaseData) && supabaseData.length > 0) {
            // Map Supabase data to app format
            const mappedData = supabaseData.map(item => {
              // Remove Supabase metadata
              const { created_at, ...rest } = item;
              return rest;
            });
            
            // Use Supabase data (source of truth)
            setData(mappedData);
            localStorage.setItem(key, JSON.stringify(mappedData));
          }
        }
      } catch (e) {
        console.error(`Error loading ${key}:`, e);
        setError(e.message);
      } finally {
        setLoading(false);
        setSynced(true);
      }
    }

    loadData();
  }, [key, tableName, skip]);

  // Save to both localStorage and Supabase
  const setDataWithSync = useCallback((value) => {
    setData(prev => {
      const newValue = value instanceof Function ? value(prev) : value;
      
      // Save to localStorage immediately
      localStorage.setItem(key, JSON.stringify(newValue));
      
      // Debounced Supabase sync
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      
      debounceRef.current = setTimeout(async () => {
        try {
          if (Array.isArray(newValue)) {
            // For arrays, upsert each item
            const itemsToUpsert = newValue.map(item => {
              // Extract just the data we need
              const { created_at, ...rest } = item;
              return rest;
            }).filter(item => item.id); // Only items with id
            
            if (itemsToUpsert.length > 0) {
              const { error: sbError } = await supabase
                .from(tableName)
                .upsert(itemsToUpsert, { onConflict: 'id' });
              
              if (sbError) {
                console.warn(`Supabase sync error for ${key}:`, sbError);
              }
            }
          } else if (newValue && typeof newValue === 'object') {
            // For objects (like indicadores_data)
            const { error: sbError } = await supabase
              .from(tableName)
              .upsert([{ key, data: JSON.stringify(newValue), updated_at: new Date().toISOString() }], { onConflict: 'key' });
            
            if (sbError) {
              console.warn(`Supabase sync error for ${key}:`, sbError);
            }
          }
        } catch (e) {
          console.error(`Sync error for ${key}:`, e);
        }
      }, debounceMs);
      
      return newValue;
    });
  }, [key, tableName, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return [data, setDataWithSync, { loading, error, synced }];
}

// Helper to check if Supabase is available
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('usuarios').select('id').limit(1);
    return { connected: !error, error };
  } catch (e) {
    return { connected: false, error: e };
  }
}