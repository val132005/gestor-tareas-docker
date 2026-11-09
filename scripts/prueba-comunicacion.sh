#!/usr/bin/env bash
# Prueba de punta a punta de la comunicación entre los dos contenedores.
# Se usa en GitHub Actions y también se puede correr en local (Git Bash) con los contenedores arriba.
set -euo pipefail

# Lee las variables de .env sin necesidad de exportarlas a mano
if [ -f .env ]; then
  set -a; . ./.env; set +a
fi

URL="${APP_URL:-http://localhost:${APP_PORT:-3000}}"

echo "== 1. La app responde y confirma conexión con PostgreSQL (GET /health)"
curl -fsS "$URL/health"
echo

echo "== 2. Desde el contenedor app se resuelve el nombre del servicio 'db' por la red interna"
docker compose exec -T app node -e "require('dns').lookup('db', (e, ip) => { if (e) { console.error(e.message); process.exit(1) } console.log('db ->', ip) })"

echo "== 3. Se crea una tarea por la API (app -> INSERT en db)"
TITULO="Prueba de comunicacion $(date +%s)"
RESPUESTA=$(curl -fsS -X POST "$URL/api/tareas" \
  -H "Content-Type: application/json" \
  -d "{\"titulo\": \"$TITULO\", \"descripcion\": \"Creada por scripts/prueba-comunicacion.sh\"}")
echo "$RESPUESTA"
ID=$(echo "$RESPUESTA" | sed -E 's/.*"id":([0-9]+).*/\1/')

echo "== 4. La tarea se lee de vuelta por la API (db -> app)"
curl -fsS "$URL/api/tareas/$ID"
echo

echo "== 5. La tarea existe directamente en PostgreSQL (consulta dentro del contenedor db)"
docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -c "SELECT id, titulo, completada FROM tareas WHERE id = $ID;"
FILAS=$(docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT COUNT(*) FROM tareas WHERE id = $ID;")
if [ "$FILAS" != "1" ]; then
  echo "ERROR: la tarea $ID no se encontró en la base de datos" >&2
  exit 1
fi

echo "== 6. Se elimina la tarea de prueba"
curl -fsS -w "DELETE -> HTTP %{http_code}\n" -X DELETE "$URL/api/tareas/$ID"

echo
echo "OK: los contenedores app y db se comunican correctamente."
