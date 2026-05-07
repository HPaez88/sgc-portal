# SGC Portal - Testing Guide

## Pruebas del Módulo Acciones Correctivas

### Funcionalidades a Probar

1. **Crear Nueva AC**
   - Ir a "Acciones Correctivas"
   - Click "Nueva Acción Correctiva"
   - Llenar área, proceso, origen
   - Escribir descripción de no conformidad
   - Click "Guardar Borrador"
   - Verificar que aparece en la lista

2. **Editar AC**
   - Click en una AC existente
   - Modificar algún campo
   - Click "Guardar"
   - Verificar cambios reflejados

3. **Cambiar Estados**
   - **Borrador → Enviar a SGC**: Click botón "Enviar a SGC"
   - **Enviado → Aprobar**: Click "Aprobar y Asignar Folio"
   - **Abierta → Asignar Auditor**: Click "Asignar Auditor"
   - **En Revisión → Cerrar**: Click "Cerrar Efectiva"

4. **Exportar PDF**
   - Abrir una AC
   - Click "Exportar PDF"
   - Verificar que se descarga el archivo

5. **Eliminar AC**
   - Click botón 🗑️ en una AC
   - Confirmar eliminación
   - Verificar que se borra de la lista

---

## Casos de Prueba Esperados

| # | Escenario | Resultado Esperado |
|---|----------|-------------------|
| 1 | Crear AC sin área | Error: "Selecciona el área" |
| 2 | Crear AC sin descripción | Error: "Describe la no conformidad" |
| 3 | Crear AC completa | Aparece en lista con estado "Borrador" |
| 4 | Enviar AC | Estado cambia a "En revisión SGC" |
| 5 | Aprobar AC | Se asigna folio (ej: AC#1/26) |
| 6 | Cerrar AC Efectiva | Estado "Cerrada efectiva" |

---

## Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|------|----------|
| No se guarda | Sin internet/Supabase caido | Se guarda en localStorage automáticamente |
| No aparece en lista | Error de sincronización | Recargar página |
| PDF no descarga | Error de jspdf | Ver consola del navegador |

---

## Cómo Reportar Bugs

1. Abrir DevTools (F12)
2. Revisar consola (pestaña Console)
3. Si hay errores `[AC]`, capturarlos
4. Describir pasos para reproducir
5. Indicar navegador y dispositivo