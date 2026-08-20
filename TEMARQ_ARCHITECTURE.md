# TEMARQ Service Hub — Alcance y arquitectura inicial

## Objetivo de negocio

Convertir la operación de Temarqsa en una experiencia de servicio trazable y visible para todos: el equipo interno controla solicitudes, agenda, técnicos, materiales y evidencias desde una sola consola; el cliente consulta el estado y recibe actualizaciones sin depender de llamadas; y un agente de IA responde preguntas operativas usando únicamente información autorizada.

La propuesta debe sentirse alineada con la marca actual de Temarqsa: confiable, humana, técnica y orientada a relaciones de largo plazo. El MVP se presenta como **TEMARQ Service Hub**.

## Roles y permisos

| Rol | Propósito | Acceso principal |
| --- | --- | --- |
| Administrador | Configurar la operación y la seguridad | Toda la plataforma, usuarios, catálogos, SLA, auditoría |
| Coordinación | Controlar la demanda y asignar recursos | Todas las órdenes, agenda, tablero, alertas, clientes |
| Supervisor | Validar ejecución y calidad | Órdenes de su región/equipo, evidencias, aprobación y cierre |
| Técnico | Ejecutar el servicio en campo | Órdenes asignadas, checklist, tiempos, materiales, evidencias, firma |
| Cliente | Consultar y solicitar servicios | Sus cuentas, sitios, activos, órdenes, citas, documentos y chat IA |
| Dirección | Ver desempeño y decisiones | KPIs, cumplimiento SLA, rentabilidad, tendencias y cartera |

## Módulos del MVP

1. **Inicio de sesión y selección de perfil.** La demo incluye perfiles internos y cliente para mostrar distintos permisos. La versión productiva debe reemplazar la selección local por autenticación real y políticas por rol.
2. **Dashboard operativo.** Indicadores de órdenes activas, en riesgo, completadas, tiempo promedio, satisfacción y carga por sucursal.
3. **Órdenes de trabajo.** Alta, búsqueda, filtros, prioridad, cliente, sitio, activo, servicio, fecha compromiso, responsable, estado, costo estimado y línea de tiempo.
4. **Tablero de operación.** Vista por columnas para Nuevas, Programadas, En traslado, En sitio, En revisión y Cerradas. Incluye tarjetas de prioridad, SLA, técnico y ubicación.
5. **Agenda y despacho.** Calendario de visitas, disponibilidad de técnicos, sucursal, territorio, habilidades y carga. En el MVP se muestra como agenda visual; la optimización automática queda lista para segunda etapa.
6. **Detalle de orden.** Resumen, avance, actividad, checklist, materiales, fotos, notas, documentos, firma y comunicación.
7. **Portal de cliente.** Consulta de órdenes, próxima visita, histórico, activos, evidencias compartidas, aprobación y encuesta.
8. **Centro de clientes y activos.** Cuentas, contactos, sitios, equipos de aire acondicionado y datos de garantía/mantenimiento.
9. **Agente de IA.** Chat contextual para explicar estatus, fechas, próximos pasos y actualizaciones. Nunca inventa información; si no encuentra una respuesta, crea una solicitud de atención humana o indica el canal de contacto.
10. **Reportes.** Cumplimiento de SLA, órdenes por servicio/sucursal, tiempo de ciclo, reincidencias, consumo de materiales y satisfacción.

## Flujo de una orden

| Etapa | Responsable | Resultado esperado |
| --- | --- | --- |
| Nueva | Atención/coordinación | Se registra solicitud, prioridad, sitio, activo y problema |
| Programada | Coordinación | Se define fecha, ventana, técnico/cuadrilla y SLA |
| En traslado | Técnico | Se notifica salida y se registra hora de inicio de traslado |
| En sitio | Técnico | Se registra llegada y se ejecuta checklist |
| En revisión | Supervisor | Se revisan evidencias, consumos, horas y resultado |
| Cerrada | Supervisor/cliente | Se aprueba el trabajo, se genera reporte y se solicita encuesta |
| Seguimiento | Coordinación | Si requiere refacción, garantía o visita adicional, se crea una nueva orden relacionada |

El sistema debe mantener un historial inmutable de cambios de estado y actor. Los estados internos pueden ser más granulares que los estados visibles al cliente; por ejemplo, “En traslado” y “En sitio” pueden mostrarse como “Técnico en camino” y “Trabajo en proceso”.

## Modelo de datos productivo

| Entidad | Campos esenciales |
| --- | --- |
| User | id, nombre, email, rol, sucursal, activo, último acceso |
| CustomerAccount | id, razón social, contacto, teléfonos, email, SLA, estado |
| Site | id, cuenta, nombre, dirección, ciudad, geolocalización, horario de acceso |
| Asset | id, sitio, tipo, marca, modelo, serie, capacidad, garantía, última visita |
| ServiceCatalog | id, categoría, servicio, duración estándar, habilidades, checklist |
| WorkOrder | folio, cuenta, sitio, activo, servicio, prioridad, estado, SLA, descripción, fechas, asignados, costo |
| Booking | orden, técnico/cuadrilla, fecha, ventana, estado, llegada, salida, duración, ubicación |
| ChecklistItem | orden, concepto, respuesta, obligatorio, observación |
| MaterialUsage | orden, catálogo, cantidad, costo, almacén, técnico |
| Evidence | orden, tipo, URL segura, descripción, visibilidad para cliente |
| WorkOrderEvent | orden, actor, evento, estado anterior/nuevo, comentario, timestamp |
| CustomerMessage | orden/cuenta, autor, canal, contenido, visibilidad, respuesta IA/humana |
| Notification | destinatario, tipo, plantilla, estado de envío, timestamp |
| SatisfactionSurvey | orden, calificación, comentario, fecha |

## Arquitectura técnica de esta iteración

La base existente es React/Vite con FastAPI y Supabase/localStorage, pero su dominio principal está acoplado al SGC de OOMAPAS de Cajeme y no tiene autenticación real ni aislamiento robusto por cliente. Por ello, esta iteración implementa una demo comercial desacoplada en el frontend, con datos semilla y estado interactivo, mientras conserva el código SGC en `frontend/src/legacy/`.

Para producción, se recomienda migrar el dominio de servicios a un API con autenticación, autorización por rol, almacenamiento de archivos privado, auditoría de cambios y políticas de acceso por cuenta. El front actual se puede usar como demostrador de experiencia y como base para conectar esos endpoints sin rehacer la interfaz.

## Agente de IA: reglas de seguridad

El agente debe recibir el contexto mínimo de la cuenta/orden del usuario autenticado y consultar datos estructurados. Debe responder en español claro, mencionar folio y fecha de última actualización cuando estén disponibles, evitar revelar información de otras cuentas, no prometer horarios no confirmados y escalar a una persona para quejas, temas de seguridad, costos no aprobados, cancelaciones sensibles o falta de datos.

En la versión productiva, la llamada debe ejecutarse del lado servidor con el modelo configurado por el proyecto. Para preguntas de estado y clasificación de solicitudes se prefiere un modelo económico y rápido; para resúmenes complejos de reportes se puede usar un modelo de mayor capacidad. El chat del MVP usa una respuesta simulada determinista para que la demo funcione sin exponer credenciales.

## Roadmap comercial

| Fase | Entrega | Valor para Temarqsa |
| --- | --- | --- |
| MVP demostrable | Dashboard, tablero, detalle, portal cliente, roles simulados, chat IA contextual | Permite vender la visión y validar el flujo con dirección y operaciones |
| Operación real | Auth, API, base de datos, archivos, notificaciones, firma, auditoría, migración | Reemplaza hojas, llamadas y chats dispersos |
| Optimización | Agenda inteligente, rutas, app móvil/PWA offline, inventario, preventivo, garantías | Reduce tiempos muertos y eleva productividad |
| Escala | WhatsApp, correo transaccional, ERP/facturación, BI, multiempresa, SLA por contrato | Convierte la plataforma en producto repetible y diferenciador |
