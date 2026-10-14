# Propuesta: control-documental

**Fecha:** 2026-10-13 · **Autor:** @claude-code · **Solicita:** @human (Hpael)
**Estado:** borrador para revisión humana

## Problema

La información documentada del SGC (manual, anexos, procedimientos, registros, políticas) vive
en archivos Word/Excel dispersos. Consecuencias observadas:

1. Un procedimiento nuevo puede no quedar en la Matriz de Procesos (A21) y por tanto no se audita.
   Problema recurrente reportado por el responsable del SGC.
2. Actualizar un dato obliga a tocar varios archivos (matriz de comunicación, matriz de procesos,
   manual) y nadie garantiza consistencia.
3. El portal hoy muestra un catálogo documental ficticio (MC-01, PR-CAL-01…) guardado solo en el
   navegador; el Asesor ISO "conoce" esos documentos inexistentes.
4. No hay ruta de aprobación ni control de cambios por documento. Cualquier usuario del portal
   puede editar el catálogo.

## Objetivo

Un módulo de Control Documental donde cada documento real del organismo:

- se consulta cómodamente desde el portal (ficha + contenido legible, no solo descarga);
- lo editan únicamente gerentes/encargados del área propietaria, y cada cambio pasa por
  aprobación del SGC antes de publicarse (ISO 9001 § 7.5.2 y § 7.5.3);
- lleva historial de revisiones con quién, cuándo, qué cambió y quién aprobó;
- declara desde su ficha a qué proceso(s) pertenece, qué cláusulas cubre y con qué documentos
  interactúa, de modo que las matrices A19/A20/A21 se **derivan** de las fichas y no se editan aparte;
- queda indexado para el Asesor ISO (y, a futuro, para un módulo de diagramas de flujo por servicio).

## Usuarios y permisos

| Rol (ya existe en el portal) | Documentos |
|---|---|
| Usuario | Ver ficha y contenido de documentos **publicados** |
| Encargado / Gerente de área | Lo anterior + crear y editar borradores de documentos de **su área**, enviar a aprobación |
| Admin (SGC) | Lo anterior en todas las áreas + aprobar/rechazar + publicar + dar de baja |
| Super Admin | Todo + configurar catálogos (tipos, procesos, áreas) |

Requisito previo: los usuarios y roles deben existir en el servidor (hoy son constantes del
frontend con contraseña visible). Sin identidad verificable no hay aprobación que valga.

## Alcance

**Entra**
- Tabla de documentos por organismo + revisiones + aprobaciones + relaciones (proceso, cláusula,
  documento↔documento, área).
- Carga del archivo original (PDF/Word/Excel) a Backblaze con el pipeline de seguridad ya propuesto,
  y extracción de texto para lectura en pantalla y para el Asesor.
- Ficha de documento, visor de contenido, editor de borrador, bandeja de aprobación del SGC,
  historial de cambios.
- Vistas derivadas: Matriz de Procesos (A21), Matriz de Comunicación (A19), Salidas no conformes
  (A20), Propiedad del cliente (A18), Partes interesadas (A10) como tablas vivas que se alimentan de
  las fichas y se exportan al Excel oficial.
- Semilla con los 8 documentos reales de `formatos/Docus Sistema`.
- Usuarios en servidor con contraseña cifrada y sesión (mínimo indispensable para la ruta de aprobación).

**No entra (todavía)**
- Diagramas de flujo por servicio (fase posterior; este módulo deja los datos listos).
- Editor WYSIWYG con formato Word completo; el contenido se edita como texto estructurado por
  secciones y se exporta a Word/Excel con la plantilla institucional.
- Firma electrónica. La aprobación queda registrada con usuario, fecha y hash del contenido.
- Revisión del Manual con IA (es un paso aparte que puede correr antes o después).

## Criterios de éxito

- Un gerente crea un procedimiento nuevo y, al guardarlo, **no puede publicarse** sin proceso
  asignado; aparece en A21 automáticamente.
- Un usuario normal no ve el botón editar y la API rechaza su intento (403).
- Cada documento publicado muestra su historial: revisiones, autor, aprobador, diff de texto.
- El Asesor ISO responde citando documentos reales con su clave y revisión vigente.
- Los 8 documentos reales están cargados y los ficticios eliminados del portal y del RAG.
