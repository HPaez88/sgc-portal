#!/usr/bin/env bash
# prelaunch-guard/check.sh — sondas PASIVAS antes de lanzar (parte de los riesgos 1 y 3 del skill).
# Solo GET/HEAD: no envía credenciales, no hace POST, no modifica nada.
# Mensajes en español (predeterminado del harness); el agente reporta en el idioma del usuario.
#
# Uso:  PRELAUNCH_AUTORIZADO=<dominio> bash check.sh <URL-base> "<ruta-datos-1> <ruta-datos-2> ..."
#   PRELAUNCH_AUTORIZADO debe coincidir con el dominio de <URL-base>: es la confirmación explícita
#   de que el sistema es propio o se tiene autorización escrita para revisarlo.
set -u
BASE="${1:?URL base requerida}"; RUTAS="${2:-}"
HOST=$(printf '%s' "$BASE" | sed -E 's#^[a-z]+://([^/:]+).*#\1#')
if [ "${PRELAUNCH_AUTORIZADO:-}" != "$HOST" ]; then
  echo "Detenido: confirma la autorización con PRELAUNCH_AUTORIZADO=$HOST (solo sistemas propios o autorizados)." >&2
  exit 2
fi
FALLAS=0
ok()   { printf '  PASS  %s\n' "$1"; }
mal()  { printf '  FAIL  %s\n' "$1"; FALLAS=$((FALLAS+1)); }
nota() { printf '  INFO  %s\n' "$1"; }

echo "== 1. Cabeceras de seguridad en $BASE/"
CAB=$(curl -sSI "$BASE/" | tr -d '\r')
for h in strict-transport-security x-content-type-options x-frame-options referrer-policy content-security-policy; do
  if echo "$CAB" | grep -qi "^$h:"; then ok "$h"; else mal "falta $h"; fi
done

echo "== 2. Rutas de datos sin sesión"
[ -z "$RUTAS" ] && nota "sin rutas indicadas: omitido"
for r in $RUTAS; do
  c=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE$r")
  case "$c" in 401|403) ok "$r -> $c";; 404) nota "$r -> 404 (¿ruta correcta?)";; *) mal "$r -> $c (responde sin sesión)";; esac
done

echo "== 3. Secretos en el JavaScript servido al navegador"
# sk-/gsk_ deben empezar una palabra: sin el borde, clases como `mask-linear-from-pos` (Tailwind) contaban como clave.
JS=$(curl -sS "$BASE/" | grep -oE '(src|href)="[^"]+\.js"' | sed -E 's/.*"([^"]+)"/\1/' | sort -u)
encontrados=0
for j in $JS; do
  case "$j" in http*) url="$j";; /*) url="$BASE$j";; *) url="$BASE/$j";; esac
  n=$(curl -sS "$url" | grep -oE '(^|[^A-Za-z0-9_-])(sk-[A-Za-z0-9_-]{20,}|gsk_[A-Za-z0-9]{20,})|AKIA[0-9A-Z]{16}|service_role|BEGIN [A-Z ]*PRIVATE KEY' | wc -l)
  encontrados=$((encontrados + n))
done
[ "$encontrados" -eq 0 ] && ok "0 patrones de secreto en $(echo "$JS" | wc -w) archivo(s) JS" || mal "$encontrados patrón(es) de secreto en el JS servido"
nota "la clave 'anon' de Supabase es pública por diseño: solo es segura con RLS activo en todas las tablas"

echo "== 4. Documentación de API expuesta"
for d in /docs /redoc /openapi.json /swagger /api-docs /graphql; do
  c=$(curl -sS -o /dev/null -w '%{http_code}' "$BASE$d")
  [ "$c" = 200 ] && mal "$d responde 200: expone el mapa de la API" || true
done
nota "rutas de documentación revisadas"

echo
nota "límite de intentos de login: prueba activa, NO incluida aquí (ver paso manual del skill, requiere aprobación)"
[ "$FALLAS" -eq 0 ] && echo "RESULTADO: sin fallas en las sondas pasivas" || echo "RESULTADO: $FALLAS falla(s) en las sondas pasivas"
exit "$FALLAS"
