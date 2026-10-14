# CONSTITUTION — SGC Portal OOMAPASC de Cajeme

> Principios inmutables del proyecto. Los agentes los respetan como ley.
> Se cambia solo con propuesta formal + aprobación del @human (ver sección final).

---

## Identidad del proyecto

- **Nombre:** SGC Portal — Sistema de Gestión de Calidad
- **Propósito:** Digitalizar y dar trazabilidad al Sistema de Gestión de Calidad ISO 9001:2015 de OOMAPASC de Cajeme: acciones correctivas (OOMRSC-20), planes de mejora (OOMRSC-21), matriz de riesgos, control documental, indicadores y auditorías.
- **Usuarios primarios:** Titulares de área del organismo (captura), Coordinación SGC (revisión/aprobación), Auditores internos (evaluación de eficacia), Dirección (revisión por la dirección).
- **Escala esperada:** ~33 áreas, ~86 indicadores, cientos de documentos y registros por ejercicio.

## Stack (no cambia sin propuesta formal)

- **Frontend:** React 18 + Vite + Tailwind CSS, sin TypeScript
- **Backend:** Python 3 + FastAPI + SQLModel
- **Base de datos:** SQLite en desarrollo · PostgreSQL (Supabase) en producción
- **Deploy:** Render (backend + frontend estático), Supabase para datos y storage
- **Multi-tenant:** por `organismo_id`, resuelto en `backend/tenant.py`

## Principios técnicos

1. **El backend es la fuente única de verdad del workflow.** Estados, transiciones y permisos viven en `backend/models.py` y se consumen vía `/api/v1/catalogos/workflow`. El frontend no mantiene una copia propia que pueda desincronizarse.
2. **Nada de `alert()` ni `confirm()` nativos.** Toda notificación al usuario pasa por `useToast` (`components/common/Toast.jsx`).
3. **Todo modal usa `ModalBase`** (`components/common/ModalBase.jsx`). Renderiza en portal para que `position: fixed` se ancle al viewport y no al contenedor animado.
4. **Toda llamada HTTP pasa por `services/apiClient.js`.** Nunca `fetch` crudo: se pierde el manejo de errores de FastAPI, el timeout y el header de organismo.
5. **Nunca `URL.revokeObjectURL` inmediato tras `click()`.** Usar `descargarBlob()` de `apiClient`, que respeta el ciclo de vida del objectURL.
6. **Escritura remota agrupada por debounce** (`services/syncService.js`). Nunca un `upsert` por pulsación de tecla.
7. **Diseño visual intocable.** Paleta institucional (`#0B192C`, `#1E3E62`, sky/cyan), clases Tailwind existentes (`rounded-2xl`, `shadow-card-subtle`), badges y semáforos actuales. Los cambios de UI se hacen con los componentes y estilos que ya existen.
8. **Responsividad real, sin scroll horizontal.** En móvil las tablas anchas se convierten en tarjetas apiladas, no en scroll lateral.

## Principios de producto

1. **Trazabilidad antes que comodidad.** Cada cambio queda en la bitácora con usuario, fecha y motivo.
2. **Un dato mal calculado es peor que un dato ausente.** Los indicadores sin captura muestran `--`, nunca `0%`.
3. **Los módulos se conectan.** Un indicador fuera de meta puede abrir una AC (§9.1.3 → §10.2); un hallazgo de auditoría también (§9.2 → §10.2); un riesgo sin plan abre un PM (§6.1 → §10.3).
4. **La información larga debe verse completa.** El plan de acción y los campos de texto libre son protagonistas, no columnas comprimidas.
5. **Supervisión Humana Obligatoria (Human-in-the-Loop & POL-TI-01).** Ningún análisis, causa raíz o plan de acción generado o asistido por IA puede remitirse al SGC de forma automática. El usuario responsable debe leer la información, aceptar la responsabilidad operativa y escribir la palabra clave estricta `CONFIRMAR` en el modal de ratificación.

## Restricciones estrictas (nunca)

- Nunca commitear `.env`, claves de Supabase, `GROQ_API_KEY` ni secretos.
- Nunca editar `render.yaml`, `Dockerfile` o configuración de despliegue sin aprobación explícita del @human.
- Nunca tocar `node_modules/`, `dist/`, `__pycache__/` ni `.git/`.
- Nunca borrado destructivo sin respaldo previo.
- Nunca afirmar que algo quedó hecho sin haber corrido el build (ver `verify-loop`).
- Nunca inventar datos, métricas o resultados de pruebas.

## Lecciones aprendidas en sesión (auto-corrección)

> Cada corrección del @human se escribe aquí como regla general para no repetirla.
> Sección aditiva — no requiere propuesta formal. Ver `skills/_quality/self-correction/SKILL.md`.

- **2026-09-27** — Antes de afirmar que un archivo o directorio no existe, buscar en todo el perfil del usuario, no solo en el directorio de trabajo. (incidente: se reportó que `hpaez-harness-full.zip` no existía cuando estaba en `Documents\ChatGPT Proyectos\SGC Portal`).
- **2026-09-27** — Antes de copiar o mover archivos entre directorios del mismo proyecto, comparar hash y fecha de cada archivo común y determinar cuál es más reciente. (incidente: existían dos copias del proyecto con 23 archivos divergentes; copiar la equivocada habría destruido 20 horas de trabajo).
- **2026-09-27** — Los modales deben renderizarse en un portal de `document.body`. Un ancestro con `transform` (p. ej. `animate-fade-in-up`) se convierte en el containing block de los descendientes `position: fixed` y desplaza el modal fuera de la vista. (incidente: el modal de "Nuevo Registro" en Riesgos aparecía anclado al contenedor de 872 px en lugar de a la ventana de 700 px, dejando el botón Cancelar inalcanzable).
- **2026-09-27** — Los selectores de ejercicio/año deben incluir el año en curso **y el siguiente**: la planificación de riesgos es prospectiva y la norma exige levantar la matriz antes de que inicie el periodo. (incidente: el selector de la matriz de riesgos solo ofrecía 2026 y no permitía planear 2027).
- **2026-09-27** — Antes de declarar resuelto un bug de layout, verificar la hipótesis en el navegador con `getComputedStyle` del elemento real; el primer diagnóstico puede ser un síntoma, no la causa. (incidente: se corrigieron dos veces los anchos del modal antes de encontrar que la causa raíz era el `transform` del contenedor).
- **2026-09-27** — Nunca embeber claves de API en código que se compila al cliente. Un secreto en el frontend queda en el bundle y es visible para cualquiera. La IA se consume vía backend. (incidente: una clave de Groq `gsk_...` estaba hardcodeada en `aiClient.js` y se sirvió públicamente en el bundle de producción).
- **2026-09-27** — Nunca usar `confirm()`, `prompt()` ni `alert()` nativos: bloquean el hilo, rompen el diseño y no son estilizables. Usar `useDialogos()` y `useToast()`. (incidente: 12 diálogos nativos dispersos en 6 módulos).
- **2026-09-27** — Nunca llamar `URL.revokeObjectURL` en el mismo tick que `a.click()`: la descarga puede cancelarse en Safari y Firefox. Usar `descargarBlob()`. (incidente: 4 exportadores con el patrón inseguro).

## Cómo se cambia esta constitución

1. Abrir `proposals/YYYY-MM-DD-<slug>.md` describiendo el cambio y la razón.
2. Aprobación explícita del @human registrada en `CHANGELOG.md` con tag `[CONSTITUTION-CHANGE]`.
3. Actualizar este archivo.
4. Notificar a los agentes que operen en el proyecto.

## Revisión

Última revisión: 2026-09-27
Próxima revisión: cada 3 meses o cuando un cambio material lo requiera.