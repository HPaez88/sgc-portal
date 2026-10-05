import { describe, it, expect } from 'vitest';
import {
  generarContextoOperativo,
  generarBriefingMarkdownLocal,
  calcularDiasAntiguedad,
  calcularDiasRestantes
} from '../contextoOperativoService';

describe('Servicio de Contexto Operativo y Briefing Ejecutivo SGC', () => {
  it('calcula correctamente días de antigüedad de documentos', () => {
    const fechaAntigua = '2024-01-01';
    const dias = calcularDiasAntiguedad(fechaAntigua);
    expect(dias).toBeGreaterThan(365);

    const fechaReciente = new Date().toISOString().split('T')[0];
    const diasRecientes = calcularDiasAntiguedad(fechaReciente);
    expect(diasRecientes).toBeLessThanOrEqual(2);
  });

  it('genera el contexto completo para un usuario de Control y Servicios', () => {
    const usuario = {
      id: 7,
      nombre: 'Lic. Carmen Leyva',
      area: 'Control y Servicios',
      direccion: 'Dir. Comercial',
      rol: 'Encargado'
    };

    const accionesCorrectivas = [
      {
        id: 1,
        folio: 'AC#1/26',
        titulo: 'Demoras en reconexiones',
        descripcion: 'Retraso de más de 48 horas',
        area: 'Control y Servicios',
        estado: 'EN_SEGUIMIENTO',
        fecha_limite: '2026-06-30'
      },
      {
        id: 2,
        folio: 'AC#2/26',
        titulo: 'Calibración de equipo de corte',
        descripcion: 'Falta registro de calibración',
        area: 'Control y Servicios',
        estado: 'APROBADO',
        fecha_limite: '2026-06-15'
      },
      {
        id: 3,
        folio: 'AC#3/26',
        titulo: 'Lecturas de cloro',
        descripcion: 'Cloro bajo en Planta 1',
        area: 'Operación',
        estado: 'EN_SEGUIMIENTO',
        fecha_limite: '2026-06-20'
      }
    ];

    const planesMejora = [
      {
        id: 1,
        folio: 'PM#1/26',
        titulo: 'Digitalización de Órdenes de Reconexión',
        area: 'Control y Servicios',
        estado: 'EN_EJECUCION',
        fechaCompromiso: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().split('T')[0], // En 10 días (próximo a vencer)
        presupuestoEstimado: 85000,
        avance: 80
      }
    ];

    const documentos = [
      {
        id: 101,
        clave: 'PR-CS-01',
        titulo: 'Procedimiento de Inspección y Suspensión de Servicios',
        tipo: 'Procedimiento',
        area: 'Control y Servicios',
        version: 'Rev. 02',
        fecha: '2024-11-10', // > 1 año sin revisar
        estado: 'APROBADO'
      },
      {
        id: 102,
        clave: 'PR-CS-03',
        titulo: 'Procedimiento de Verificación de Medidores',
        tipo: 'Procedimiento',
        area: 'Control y Servicios',
        version: 'Rev. 01',
        fecha: '2026-04-10',
        estado: 'BORRADOR' // Pendiente de aprobación SGC
      }
    ];

    const indicadoresData = {
      70: { abril: 72 } // Indicador #70 con valor 72% vs meta 90% -> Crítico / Incumplido 🔴
    };

    const contexto = generarContextoOperativo({
      usuario,
      accionesCorrectivas,
      planesMejora,
      indicadoresData,
      documentos
    });

    expect(contexto.nombre).toBe('Lic. Carmen Leyva');
    expect(contexto.area).toBe('Control y Servicios');
    expect(contexto.resumen_conteos.total_ac_pendientes).toBe(2);
    expect(contexto.resumen_conteos.total_pm_activos).toBe(1);
    expect(contexto.resumen_conteos.total_pm_proximos_vencer).toBe(1);
    expect(contexto.resumen_conteos.total_docs_antiguos_sin_revision).toBe(1);
    expect(contexto.resumen_conteos.total_docs_pendientes_aprobacion).toBe(1);
    expect(contexto.indicadores_area.length).toBeGreaterThanOrEqual(2);

    // Validar generación de Briefing Markdown
    const markdown = generarBriefingMarkdownLocal(contexto);
    expect(markdown).toContain('Lic. Carmen Leyva');
    expect(markdown).toContain('Control y Servicios');
    expect(markdown).toContain('AC#1/26');
    expect(markdown).toContain('PM#1/26');
    expect(markdown).toContain('PR-CS-01');
    expect(markdown).toContain('PR-CS-03');
    expect(markdown).toContain('ALERTA DE REVISIÓN PERIÓDICA');
  });
});
