# Propuesta: multiempresa

**Fecha:** 2026-10-23 · **Autor:** @claude-code · **Solicita:** @human (Hpael)
**Estado:** PLAN — no implementar hasta que @human lo indique (el portal debe estar firme en OOMAPASC primero)

## Problema

El portal se venderá a otras empresas. La capa de datos ya aísla por organismo, pero la aplicación está
construida para un solo cliente (OOMAPASC): catálogos, marca, manual, nomenclatura y conocimiento del
Asesor ISO están fijos en el código. Un segundo cliente vería datos de referencia de OOMAPASC.

## Diagnóstico (2026-10-23)

**Ya multiempresa**
- 11 de 12 tablas con `organismo_id` (usuarios, documentos y revisiones, estado_portal, archivos, acciones, planes…).
- El organismo se toma del token de sesión, no de parámetros del cliente.
- Routers con datos filtran por organismo: estado, documentos, archivos, acciones, planes, auth/usuarios.
- Archivos en B2 bajo `org-<id>/`; deduplicación por organismo.

**Falta**
1. Frontend: "OOMAPASC" fijo en 43 archivos (232 menciones) y 15 catálogos en `frontend/src/constants/`.
2. Manual de la Calidad (`backend/knowledge/manual/`) y conocimiento del Asesor ISO globales.
3. `GET /api/v1/organismos` lista todos los organismos a cualquier usuario con sesión.
4. `usuarios.email` único global (no por organismo).
5. Nomenclatura propia de OOMAPASC: formatos OOMRSC-20/21, folios AC#/OM#, fichas del Ayuntamiento.
6. Sin alta de empresa (cliente nuevo, primer administrador, catálogos iniciales).
7. Un solo dominio, llave de IA y remitente de correo.

## Objetivo

Dar de alta una empresa nueva desde el portal y que vea solo su marca, catálogos, manual, nomenclatura y
datos, sin afectar a OOMAPASC (organismo 1).

## Alcance

**Entra:** configuración por organismo en base de datos (marca, catálogos, nomenclatura de formatos y
folios), manual y conocimiento del Asesor por organismo, alta de empresa con primer administrador,
rol de plataforma (dueño del producto) separado de los roles de cada empresa, cierre de fugas entre
organismos, pruebas automáticas de aislamiento.

**No entra (todavía):** facturación y planes de suscripción, base de datos separada por cliente,
dominios personalizados por cliente, marketplace de plantillas.

## Criterios de éxito

- Un usuario de la empresa B no puede leer ni escribir nada de la empresa A (prueba automática por endpoint).
- La empresa B ve su nombre, logo, áreas, procesos, formatos y folios; nunca "OOMAPASC".
- Alta de empresa en menos de 10 minutos sin tocar la base de datos a mano.
- OOMAPASC sigue funcionando igual durante y después de la migración.
