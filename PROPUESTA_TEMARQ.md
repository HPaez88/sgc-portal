# Propuesta comercial
## TEMARQ Service Hub

### Una plataforma para operar mejor y atender al cliente sin fricción

Temarqsa ya cuenta con una historia y una propuesta de valor fuertes: fue fundada en 1992, busca integrarse a la cultura de sus clientes y comunica relaciones comerciales de largo plazo bajo el lema **“Treat people as people”**. También opera servicios de aire acondicionado, instalación, mantenimiento y venta de equipos de marcas como YORK, LG, CARRIER y TRAIDEN, con cobertura en distintas sucursales y envíos a toda la República Mexicana [1] [2].

La oportunidad es convertir esa confianza en una experiencia digital que haga visible cada promesa: cada solicitud se convierte en una orden trazable, cada técnico trabaja con contexto, cada supervisor valida con evidencia y cada cliente puede consultar el avance sin perseguir a nadie por teléfono.

> **TEMARQ Service Hub:** más visibilidad para la operación, más tranquilidad para el cliente y más capacidad de crecimiento para Temarqsa.

## Qué se propone construir

La solución se organiza como una plataforma multi-rol con dos experiencias conectadas. El equipo interno trabaja en un **centro de control operativo**; los clientes ingresan a un **portal privado de seguimiento**. Ambos consultan la misma orden, pero cada uno ve únicamente la información que necesita y tiene permisos acordes a su responsabilidad.

| Experiencia | Funcionalidades principales | Beneficio directo |
| --- | --- | --- |
| Centro de control | Dashboard, tablero Kanban, agenda, despacho, filtros, alertas SLA y reportes | Reduce coordinación manual y permite priorizar en tiempo real |
| Técnico en campo | Órdenes asignadas, checklist, tiempos, materiales, fotos, notas, firma y modo móvil | Eleva la calidad de ejecución y evita reportes incompletos |
| Supervisor | Revisión de evidencias, aprobación, devoluciones, cierres y auditoría | Asegura calidad antes de comunicar “servicio terminado” |
| Portal de cliente | Estado, próxima visita, técnico, activos, evidencias autorizadas, reportes, encuesta y nuevas solicitudes | Disminuye llamadas y aumenta transparencia |
| Agente TEMARQ IA | Respuestas contextualizadas sobre folio, estado, cita, avance y siguiente paso | Atención inmediata, 24/7, sin inventar datos ni mezclar cuentas |
| Dirección | SLA, tiempo de ciclo, reincidencia, satisfacción, carga por sucursal, consumo y rentabilidad | Convierte la operación en decisiones medibles |

## Flujo de una orden

El flujo recomendado separa el estado interno de la explicación que recibe el cliente. Así, la operación puede ser precisa sin hacer que el cliente entienda tecnicismos innecesarios.

| Estado operativo | Mensaje para cliente | Evidencia mínima |
| --- | --- | --- |
| Nueva | Solicitud recibida | Folio, servicio, sitio y prioridad |
| Programada | Visita programada | Fecha, ventana, sucursal y técnico |
| En traslado | Técnico en camino | Hora de salida y ubicación aproximada |
| En sitio | Trabajo en proceso | Hora de llegada y checklist |
| En revisión | Validación de servicio | Fotos, materiales, horas y resultado |
| Cerrada | Servicio completado | Reporte, firma y encuesta |

Este tipo de ciclo es consistente con los patrones usados por plataformas de gestión de servicios en campo: creación, programación, despacho, ejecución, revisión, facturación e inventario [3]. También es recomendable conservar estados de orden y de cita separados, porque el estado del técnico —por ejemplo, en traslado o en sitio— puede actualizar la lectura general de la orden sin perder el historial [3].

## Agente de IA para clientes y operación

El agente se presenta como **TEMARQ IA**, un asistente que entiende el contexto de la cuenta autenticada. Puede responder preguntas como “¿cuál es el estado de mi orden?”, “¿cuándo viene el técnico?”, “¿qué falta para cerrar el servicio?” o “quiero solicitar una visita”. En el lado interno puede resumir la carga de la operación, detectar órdenes en riesgo y preparar respuestas para clientes.

La IA debe trabajar bajo reglas estrictas: consultar únicamente datos autorizados, identificar folio y última actualización, no prometer horarios no confirmados, no revelar información de otra cuenta, registrar la conversación y transferir a una persona cualquier queja, cancelación sensible, tema de seguridad, costo no aprobado o pregunta sin datos suficientes. El valor no está en “poner un chatbot”, sino en conectar atención, operación y trazabilidad en un mismo flujo.

## Mejoras que elevan el ticket

| Mejora | Qué habilita | Momento recomendado |
| --- | --- | --- |
| Notificaciones por correo y WhatsApp | Avisos de cita, llegada, cambio de estado y cierre | Segunda etapa |
| Agenda inteligente | Asignar por habilidad, zona, disponibilidad y distancia | Segunda etapa |
| Aplicación móvil/PWA offline | Operar con poca señal y sincronizar después | Segunda etapa |
| Inventario y camioneta | Saber qué refacción existe antes de enviar una segunda visita | Segunda etapa |
| Mantenimiento preventivo | Generar órdenes recurrentes por equipo y contrato | Segunda etapa |
| Garantías y reincidencias | Relacionar órdenes, fallas repetidas y compromisos | Segunda etapa |
| Firma y aprobación digital | Cerrar servicios con conformidad verificable | Segunda etapa |
| Reportes ejecutivos | Comparar sucursales, clientes, técnicos y rentabilidad | MVP ampliado |
| Integración ERP/facturación | Evitar captura doble y conectar el cierre con cobro | Tercera etapa |
| IA para supervisores | Resumir reportes, detectar anomalías y sugerir acciones | Tercera etapa |

La programación de citas, portal de autoservicio, notificaciones, reprogramación y seguimiento del técnico son capacidades ya normalizadas en soluciones empresariales de field service [4]. La gestión por roles, recursos, territorios, habilidades, inventario, reportes y aplicaciones móviles también aparece como patrón recurrente en plataformas líderes [5].

## Lo que ya está listo para mostrar

Se construyó una demo navegable en el repositorio seleccionado. Incluye una pantalla de acceso con cuatro perfiles, dashboard de coordinación, tablero operativo con estados, búsqueda y filtros de órdenes, agenda, clientes y activos, reportes, portal de cliente, detalle de orden con checklist y línea de tiempo auditable, avance de estado y agente TEMARQ IA con respuestas contextuales.

La demo usa datos semilla para que pueda presentarse sin configurar credenciales ni exponer información real. El SGC previo quedó respaldado en `frontend/src/legacy/`, y se documentó un modelo de API productivo en FastAPI para clientes, sitios, activos, órdenes y eventos, listo para conectar autenticación y base de datos reales.

## Plan de implementación

| Fase | Duración orientativa | Entrega |
| --- | --- | --- |
| Demostración comercial | 1 semana | Validación de flujo, roles, tablero, portal y IA con dirección y operaciones |
| MVP operativo | 4–6 semanas | Autenticación real, base de datos, órdenes, clientes, técnicos, evidencias, notificaciones y auditoría |
| Optimización de campo | 3–5 semanas | PWA móvil, agenda inteligente, geolocalización, inventario y mantenimiento preventivo |
| Integraciones y escala | 4–8 semanas | WhatsApp, correo transaccional, ERP/facturación, BI y configuración multiempresa |

## Mensaje para cerrar la reunión

La conversación no debe comenzar con tecnología. Debe comenzar con el costo de la falta de visibilidad: llamadas para preguntar por avances, técnicos que llegan sin contexto, supervisores que revisan evidencias tarde, clientes que no saben qué sigue y dirección que recibe información fragmentada.

La propuesta es que Temarqsa tenga una plataforma propia, con su marca y sus procesos, que convierta cada orden en una experiencia medible. El cliente ve que Temarqsa cumple; el técnico sabe qué hacer; la coordinación sabe qué priorizar; y la dirección puede demostrar calidad, cumplimiento y capacidad de crecimiento.

> **La venta no es un sistema de tickets. Es una nueva forma de demostrar el compromiso de Temarqsa en cada servicio.**

## Referencias

[1]: https://temarqsa.com.mx/nosotros/ "Nosotros | TEMARQ"

[2]: https://temarqsa.com.mx/servicios-ac/ "Servicios AC | TEMARQ"

[3]: https://learn.microsoft.com/en-us/dynamics365/field-service/work-order-status-booking-status "Work order lifecycle and system statuses | Microsoft Learn"

[4]: https://learn.microsoft.com/en-us/dynamics365/field-service/customer-portal-overview "Dynamics 365 Field Service portal overview | Microsoft Learn"

[5]: https://trailhead.salesforce.com/es/content/learn/modules/field_service_basics/field_service_basics_intro "Get Started with Salesforce Field Service | Trailhead"
