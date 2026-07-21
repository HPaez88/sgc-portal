import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isSupabaseConfigured, supabase } from './supabase';
import { USUARIOS_INICIALES, AREAS as defaultAreas, PROCESOS as defaultProcesos, DIRECCIONES as defaultDirecciones } from './constants';
import { useLocalStorage } from './hooks';

const SGCContext = createContext();

export const useSGC = () => {
  const context = useContext(SGCContext);
  if (context === undefined) {
    console.warn("useSGC must be used within a SGCProvider. Returning default values.");
    return {
      isLoaded: false,
      accionesCorrectivas: [], setAccionesCorrectivas: () => {},
      planesMejora: [], setPlanesMejora: () => {},
      indicadoresData: {}, setIndicadoresData: () => {},
      usuarios: [], setUsuarios: () => {},
      riesgos: [], setRiesgos: () => {},
      documentos: [], setDocumentos: () => {},
      auditorias: [], setAuditorias: () => {},
      evidencias: [], setEvidencias: () => {},
      usuarioLogueado: null,
      puedeTodasAreas: false,
      areaUsuario: '',
      areas: [], setAreas: () => {},
      procesos: [], setProcesos: () => {},
      direcciones: [], setDirecciones: () => {}
    };
  }
  return context;
};

export const SGCProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  // === ESTADO GLOBAL DE DATOS ===
  const [accionesCorrectivas, setAccionesCorrectivas] = useLocalStorage('sgc-acciones-correctivas', []);
  const [planesMejora, setPlanesMejora] = useLocalStorage('sgc-planes-mejora', []);
  const [indicadoresData, setIndicadoresData] = useLocalStorage('sgc-indicadores-data', {});
  const [usuarios, setUsuarios] = useLocalStorage('sgc-usuarios', USUARIOS_INICIALES);
  
  // Catálogos
  const [areas, setAreas] = useLocalStorage('sgc-config-areas', defaultAreas);
  const [procesos, setProcesos] = useLocalStorage('sgc-config-procesos', defaultProcesos);
  const [direcciones, setDirecciones] = useLocalStorage('sgc-config-direcciones', defaultDirecciones);
  const [riesgos, setRiesgos] = useLocalStorage('sgc-riesgos', [
    { id: 1, riesgo: 'Contaminación del agua', causa: 'Fallas en proceso de potabilización', efecto: 'Problemas de salud', probabilidad: 3, impacto: 4, control: 'Cloración', tipo: 'Riesgo', area: 'Operación', direccion: 'Dir. Técnica', proceso: 'Producción', plan_accion: 'Mejorar monitoreo de cloro', fecha_termino: '2026-06-30', evaluacion: 'En proceso', estado_plan: 'EN_PROCESO' },
    { id: 2, riesgo: 'Falla de bombas', causa: 'Falta de mantenimiento', efecto: 'Sin servicio', probabilidad: 2, impacto: 4, control: 'Mantenimiento preventivo', tipo: 'Riesgo', area: 'Mantenimiento de Redes', direccion: 'Dir. Técnica', proceso: 'Mantenimiento y Calibración', plan_accion: '', fecha_termino: '', evaluacion: '', estado_plan: 'SIN_PLAN' },
  ]);
  const [documentos, setDocumentos] = useLocalStorage('sgc-documentos', [
    { id: 1, titulo: 'Manual de Calidad del Agua v3.0', tipo: 'Manual', estado: 'APROBADO', area: 'Sistema de Gestión de Calidad', version: '3.0', fecha: '2026-01-15', autor: 'Ing. Juan López' },
    { id: 2, titulo: 'Procedimiento de Saneamiento', tipo: 'Procedimiento', estado: 'EN_REVISION', area: 'Alcantarillado y Saneamiento', version: '1.2', fecha: '2026-03-20', autor: 'Lic. García' },
  ]);
  const [auditorias, setAuditorias] = useLocalStorage('sgc-auditorias', [
    { id: 1, numero: 'AUD-2026-001', tipo: 'Interna', area: 'Sistema de Gestión de Calidad', fecha_inicio: '2026-01-15', fecha_fin: '2026-01-17', estado: 'COMPLETADA', hallazgos: 3, no_conformidades: 1 },
  ]);
  const [evidencias, setEvidencias] = useLocalStorage('sgc-evidencias', []);

  // === SYNC SUPABASE ===
  const saveToSupabase = useCallback(async (table, data) => {
    if (!isSupabaseConfigured || !supabase) return;
    if (!data || !Array.isArray(data)) return;
    try {
      const items = data.filter(item => item.id).map(({ created_at, ...rest }) => rest);
      if (items.length === 0) return;
      const { error } = await supabase.from(table).upsert(items, { onConflict: 'id' });
      if (error) console.warn(`Save error [${table}]:`, error.message);
    } catch (e) {
      console.error(`Save error [${table}]:`, e);
    }
  }, []);

  const saveObjectToSupabase = useCallback(async (table, key, data) => {
    if (!isSupabaseConfigured || !supabase) return;
    if (!data) return;
    try {
      const { error } = await supabase
        .from(table)
        .upsert([{ key, data: JSON.stringify(data), updated_at: new Date().toISOString() }], { onConflict: 'key' });
      if (error) console.warn(`Save object error [${table}]:`, error.message);
    } catch (e) {
      console.error(`Save object error [${table}]:`, e);
    }
  }, []);

  const setAccionesCorrectivasSync = useCallback((data) => {
    setAccionesCorrectivas((prev) => {
      const newValue = typeof data === 'function' ? data(prev) : data;
      saveToSupabase('acciones_correctivas', Array.isArray(newValue) ? newValue : [newValue]);
      return newValue;
    });
  }, [setAccionesCorrectivas, saveToSupabase]);

  const setPlanesMejoraSync = useCallback((data) => {
    setPlanesMejora((prev) => {
      const newValue = typeof data === 'function' ? data(prev) : data;
      saveToSupabase('planes_mejora', Array.isArray(newValue) ? newValue : [newValue]);
      return newValue;
    });
  }, [setPlanesMejora, saveToSupabase]);

  const setRiesgosSync = useCallback((data) => {
    setRiesgos((prev) => {
      const newValue = typeof data === 'function' ? data(prev) : data;
      saveToSupabase('riesgos', Array.isArray(newValue) ? newValue : [newValue]);
      return newValue;
    });
  }, [setRiesgos, saveToSupabase]);

  const setUsuariosSync = useCallback((data) => {
    setUsuarios((prev) => {
      const newValue = typeof data === 'function' ? data(prev) : data;
      saveToSupabase('usuarios', Array.isArray(newValue) ? newValue : [newValue]);
      return newValue;
    });
  }, [setUsuarios, saveToSupabase]);

  const setDocumentosSync = useCallback((data) => {
    setDocumentos((prev) => {
      const newValue = typeof data === 'function' ? data(prev) : data;
      saveToSupabase('documentos', Array.isArray(newValue) ? newValue : [newValue]);
      return newValue;
    });
  }, [setDocumentos, saveToSupabase]);

  const setAuditoriasSync = useCallback((data) => {
    setAuditorias((prev) => {
      const newValue = typeof data === 'function' ? data(prev) : data;
      saveToSupabase('auditorias', Array.isArray(newValue) ? newValue : [newValue]);
      return newValue;
    });
  }, [setAuditorias, saveToSupabase]);

  const setEvidenciasSync = useCallback((data) => {
    setEvidencias((prev) => {
      const newValue = typeof data === 'function' ? data(prev) : data;
      saveToSupabase('evidencias', Array.isArray(newValue) ? newValue : [newValue]);
      return newValue;
    });
  }, [setEvidencias, saveToSupabase]);

  const setIndicadoresDataSync = useCallback((data) => {
    setIndicadoresData((prev) => {
      const newValue = typeof data === 'function' ? data(prev) : data;
      saveObjectToSupabase('indicadores_data', 'sgc-indicadores-data', newValue);
      return newValue;
    });
  }, [setIndicadoresData, saveObjectToSupabase]);

  // === SYNC INICIAL DESDE SUPABASE ===
  useEffect(() => {
    setIsLoaded(true);
    if (!isSupabaseConfigured || !supabase) return;

    async function syncAllData() {
      try {
        const syncTable = async (table, setter, key) => {
          const { data } = await supabase.from(table).select('*').order('id');
          if (data && data.length > 0) {
            const mapped = data.map(({ created_at, ...rest }) => rest);
            setter(mapped);
            localStorage.setItem(key, JSON.stringify(mapped));
          }
        };

        const syncObjectTable = async (table, setter, key) => {
          const { data } = await supabase.from(table).select('*').eq('key', key).single();
          if (data && data.data) {
            const parsed = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
            setter(parsed);
            localStorage.setItem(key, JSON.stringify(parsed));
          }
        };

        await syncTable('acciones_correctivas', setAccionesCorrectivas, 'sgc-acciones-correctivas');
        await syncTable('planes_mejora', setPlanesMejora, 'sgc-planes-mejora');
        await syncTable('usuarios', setUsuarios, 'sgc-usuarios');
        await syncTable('riesgos', setRiesgos, 'sgc-riesgos');
        await syncTable('documentos', setDocumentos, 'sgc-documentos');
        await syncTable('auditorias', setAuditorias, 'sgc-auditorias');
        await syncObjectTable('indicadores_data', setIndicadoresData, 'sgc-indicadores-data');
      } catch (e) {
        console.error('Sync error:', e);
      }
    }
    syncAllData();
  }, [setAccionesCorrectivas, setPlanesMejora, setUsuarios, setRiesgos, setDocumentos, setAuditorias, setIndicadoresData]);

  // === PERMISOS ===
  const usuarioLogueado = usuarios && usuarios.length > 0 ? usuarios[0] : null;
  const puedeTodasAreas = ['Admin', 'Auditor', 'Super Admin'].includes(usuarioLogueado?.rol);
  const areaUsuario = usuarioLogueado?.area || '';

  const value = {
    isLoaded,
    accionesCorrectivas: accionesCorrectivas || [],
    setAccionesCorrectivas: setAccionesCorrectivasSync,
    planesMejora: planesMejora || [],
    setPlanesMejora: setPlanesMejoraSync,
    indicadoresData: indicadoresData || {},
    setIndicadoresData: setIndicadoresDataSync,
    usuarios: usuarios || [],
    setUsuarios: setUsuariosSync,
    riesgos: riesgos || [],
    setRiesgos: setRiesgosSync,
    documentos: documentos || [],
    setDocumentos: setDocumentosSync,
    auditorias: auditorias || [],
    setAuditorias: setAuditoriasSync,
    evidencias: evidencias || [],
    setEvidencias: setEvidenciasSync,
    usuarioLogueado,
    puedeTodasAreas,
    areaUsuario,
    areas, setAreas,
    procesos, setProcesos,
    direcciones, setDirecciones
  };

  return (
    <SGCContext.Provider value={value}>
      {children}
    </SGCContext.Provider>
  );
};
