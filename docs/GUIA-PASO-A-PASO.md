# Guía paso a paso — Entrega 1 (semana 3)

Usa **Git Bash** para todos los comandos (clic derecho en la carpeta → *Open Git Bash here*).
Cada vez que veas **📸 Cn**, toma esa captura: tiene un espacio reservado en `docs/Informe_Entrega1.docx`.

> ⚠️ Nunca captures el contenido del archivo `.env`: tiene contraseñas.

---

## Paso 0 — Preparación (una sola vez)

1. Abre **Docker Desktop** y espera a que diga *Engine running*.
2. Configura tu identidad en Git (la que aparecerá en los commits):

```bash
git config --global user.name "Tu Nombre Completo"
git config --global user.email "tu_correo@poligran.edu.co"
git config --global --list
```

3. Entra a la carpeta del proyecto:

```bash
cd ~/Documents/gestor-tareas-docker
```

## Pasos 1 y 2 — Repositorio en GitHub, primer commit y push

> ✅ **Ya están hechos.** El repositorio <https://github.com/val132005/gestor-tareas-docker> se creó con
> GitHub CLI (`gh repo create val132005/gestor-tareas-docker --public --source . --push`) y ya tiene el primer commit.
> Para las evidencias:
>
> 📸 **C1** — La página principal del repositorio en GitHub.
> 📸 **C2** — En Git Bash, dentro de la carpeta: `git remote -v` y `git log --oneline`.
> 📸 **C3** — La lista de archivos del proyecto en GitHub.
>
> Lo que sigue en esta sección queda como referencia de cómo se hace a mano.

### Paso 1 (referencia) — Crear el repositorio en GitHub

1. En <https://github.com/new> crea un repositorio llamado `gestor-tareas-docker`, **público** y **vacío**
   (no marques *Add a README*, *.gitignore* ni *license*: ya los tenemos).
2. En `README.md`, cambia `USUARIO` (aparece 2 veces) por tu usuario de GitHub. Así funciona la insignia de CI.

### Paso 2 (referencia) — Primer commit y push

```bash
git init
git add .
git status                      # comprueba que .env NO aparece en la lista
git commit -m "Entrega 1: app Node + PostgreSQL con Docker Compose y GitHub Actions"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/gestor-tareas-docker.git
git push -u origin main
```

La primera vez se abrirá el navegador para iniciar sesión en GitHub (con tu doble factor).

## Paso 3 — Variables de entorno

```bash
cp .env.example .env
notepad .env        # cambia POSTGRES_PASSWORD y APP_DB_PASSWORD por claves tuyas y guarda
git check-ignore .env   # debe responder ".env": confirma que Git lo ignora
```

📸 **C4** — Solo la salida de `git check-ignore .env` (sin mostrar las contraseñas).

## Paso 4 — Construir y levantar los dos contenedores

```bash
docker compose up -d --build
docker compose ps
```

Espera unos segundos hasta que los dos aparezcan como `(healthy)`.

📸 **C5** — La salida de `docker compose up -d --build` (creación de red, volumen y contenedores).
📸 **C6** — `docker compose ps` con **tareas-app** y **tareas-db** en estado `healthy`.
📸 **C7** — Docker Desktop → *Containers*, con el grupo `gestor-tareas` y sus dos contenedores en verde.

## Paso 5 — Evidencia de la red compartida

```bash
docker network inspect red_tareas --format '{{range .Containers}}{{.Name}} -> {{.IPv4Address}}{{"\n"}}{{end}}'
docker volume ls
```

📸 **C8** — Los dos contenedores dentro de `red_tareas`, cada uno con su IP, y el volumen `datos_postgres`.

## Paso 6 — Prueba de comunicación entre contenedores (lo que más puntúa)

```bash
bash scripts/prueba-comunicacion.sh
```

Debe terminar con `OK: los contenedores app y db se comunican correctamente.`

📸 **C9** — La salida completa del script (si no cabe, toma dos capturas).

## Paso 7 — La aplicación funcionando

1. Abre <http://localhost:3000>.
2. Verifica el indicador verde **«Conectado a PostgreSQL en "db"»**.
3. Crea 2 o 3 tareas y marca una como completada.

📸 **C10** — La página con el indicador verde y tus tareas.

Ahora comprueba que esas tareas quedaron en la base de datos, consultando dentro del contenedor `db`:

```bash
docker compose exec -T db psql -U admin_tareas -d gestor_tareas -c "SELECT id, titulo, completada FROM tareas;"
```

📸 **C11** — El resultado de la consulta, con las mismas tareas que ves en la página.

## Paso 8 — Evidencias de seguridad

```bash
# 1) La app NO corre como root
docker compose exec -T app whoami

# 2) El usuario de la app tiene permisos mínimos: no puede borrar la tabla
set -a; . ./.env; set +a
docker compose exec -T -e PGPASSWORD="$APP_DB_PASSWORD" db psql -h 127.0.0.1 -U app_tareas -d gestor_tareas -c "DROP TABLE tareas;"

# 3) La base de datos no tiene puertos publicados en el equipo
docker port tareas-db; echo "(sin salida = sin puertos publicados)"
```

Resultados esperados: `node`, luego `ERROR: must be owner of table tareas` y, al final, ninguna línea de puertos para `tareas-db`.

📸 **C12** — Los tres resultados.

## Paso 9 — Persistencia con el volumen

```bash
docker compose down          # elimina los contenedores y la red, pero NO el volumen
docker compose up -d
docker compose exec -T db psql -U admin_tareas -d gestor_tareas -c "SELECT COUNT(*) FROM tareas;"
```

Las tareas siguen ahí, aunque los contenedores se destruyeron y se crearon de nuevo.

📸 **C13** — La secuencia de los tres comandos.

## Paso 10 — GitHub Actions

1. En GitHub, abre la pestaña **Actions**. El workflow **CI** se ejecutó solo con tu `push`.
2. Espera a que los dos jobs queden en verde ✅.

📸 **C14** — La lista de ejecuciones con el check verde.
📸 **C15** — El detalle del job **«Contenedores y comunicación app <-> db»** con el paso
**«Prueba de comunicación entre contenedores»** expandido, mostrando `OK`.
📸 **C16** — La página principal del repositorio con la insignia **CI passing**.

## Paso 11 (opcional, suma puntos) — Trabajo con ramas y pull request

Es lo que vimos en clase con `git merge`:

```bash
git checkout -b feature/mejora-readme
# edita algo pequeño en README.md, por ejemplo agrega tu nombre como autora
git add README.md
git commit -m "Agrega autora al README"
git push -u origin feature/mejora-readme
```

En GitHub, crea el **Pull Request** hacia `main`. Verás que GitHub Actions lo valida antes del merge.
Haz el merge y luego, en tu equipo:

```bash
git checkout main
git pull
```

📸 **C17** — El pull request con los checks en verde.

## Paso 12 — Entrega

1. Abre `docs/Informe_Entrega1.docx`, pega cada captura en su espacio y completa lo que está en **amarillo**.
2. Revisa las conclusiones y escríbelas con tus palabras.
3. *Archivo → Guardar como → PDF*.
4. Sube el **PDF** y el **enlace del repositorio** antes del **martes 10 de noviembre, 11:55 p. m.**

Para apagar todo al terminar: `docker compose down` (o `docker compose down -v` para borrar también los datos).
