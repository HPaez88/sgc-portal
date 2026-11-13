# Línea de diseño institucional — OOMAPAS de Cajeme

Regla acordada con @human (2026-11-14): todo reporte y pantalla nueva respeta los colores del logo oficial.

| Uso | Color | Dónde está |
|---|---|---|
| Azul del logo | `#0083C0` | `MARCA.azul` / `marca-azul` |
| Azul institucional oscuro (títulos, encabezados de tabla, bandas) | `#005B86` | `MARCA.azulOscuro` / `marca-azul-oscuro` |
| Verde del logo (acentos, franjas) | `#76BE44` | `MARCA.verde` / `marca-verde` |
| Verde claro | `#B1D681` | `MARCA.verdeClaro` / `marca-verde-claro` |
| Azul profundo de la plataforma (menú, login) | `#0A1424` / `navy-900` | se mantiene |

- **PDF:** usar siempre `services/pdfMarca.js` → `encabezadoPDF()` (logo + título + barra azul/verde), `ESTILO_TABLA` y `piePDF()`. Nada de colores sueltos.
- **Plataforma:** colores `marca-*` en `tailwind.config.js`; logo en `public/logo-oomapasc.png` (y en base64 en `src/assets/logoOomapasc.js` para los PDF).
- Los colores con significado (rojo/ámbar/verde de niveles de riesgo, vencimientos) se conservan: son semánticos, no de marca.
- Excepción: formatos del H. Ayuntamiento / Tesorería (ficha técnica, CONAC) conservan su formato municipal.
