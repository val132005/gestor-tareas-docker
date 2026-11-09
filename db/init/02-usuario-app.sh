#!/bin/sh
# Crea el usuario que usa la aplicación con permisos mínimos (principio de menor privilegio):
# solo puede leer y modificar la tabla "tareas", no crear ni borrar tablas ni administrar la base.
set -e

psql -v ON_ERROR_STOP=1 \
     -v app_user="$APP_DB_USER" \
     -v app_password="$APP_DB_PASSWORD" \
     -v db_name="$POSTGRES_DB" \
     --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'EOSQL'
CREATE ROLE :"app_user" LOGIN PASSWORD :'app_password';
GRANT CONNECT ON DATABASE :"db_name" TO :"app_user";
GRANT USAGE ON SCHEMA public TO :"app_user";
GRANT SELECT, INSERT, UPDATE, DELETE ON tareas TO :"app_user";
GRANT USAGE, SELECT ON SEQUENCE tareas_id_seq TO :"app_user";
EOSQL

echo "Usuario de aplicación '$APP_DB_USER' creado con permisos mínimos."
