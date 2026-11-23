# Jenkins — gestor de operaciones (Entrega 2, semana 5)

Jenkins corre en contenedores y ejecuta el [`Jenkinsfile`](../Jenkinsfile) del repositorio con cada push a `main`.

| Contenedor       | Imagen                        | Función                                                         |
|------------------|-------------------------------|-----------------------------------------------------------------|
| `jenkins`        | `jenkins-gestor-tareas:1.0.0` | Controlador de Jenkins (LTS, JDK 21) — <http://localhost:8081>  |
| `jenkins-docker` | `docker:29-dind`              | Motor de Docker aislado donde el pipeline levanta `app` y `db`  |

Volúmenes: `jenkins_home` (jobs, builds, plugins y credenciales), `jenkins_docker_certs` (certificados TLS
entre Jenkins y el motor) y `jenkins_docker_data` (imágenes del motor aislado). Red: `red_jenkins`.

## Requisitos

- Docker Desktop con Docker Compose v2, 4 GB de RAM libres y unos 6 GB de disco.
- Puerto `8081` libre en el equipo (se cambia con la variable `JENKINS_PORT`).
- Salida a internet hacia `github.com`, `updates.jenkins.io`, `download.docker.com` y Docker Hub.

## Puesta en marcha

```bash
cd jenkins

# 1. Secretos (la carpeta jenkins/secrets/ está en .gitignore)
python -c "import secrets;print(secrets.token_urlsafe(18),end='')" > secrets/jenkins_admin_password.txt
cp ../.env.example secrets/gestor-tareas.env      # y escribe las contraseñas dentro

# 2. Construir la imagen y levantar Jenkins
docker compose up -d --build
docker compose ps                                  # jenkins y jenkins-docker en estado "Up"
```

Abre <http://localhost:8081> e inicia sesión con el usuario `admin` y la contraseña de
`secrets/jenkins_admin_password.txt`. No aparece el asistente de instalación: Configuration as Code
([`casc/jenkins.yaml`](casc/jenkins.yaml)) crea en el arranque el usuario, la seguridad, la credencial
`gestor-tareas-env` (tipo *Secret file*) y el job **Gestor de tareas - CI**.

## Disparador con cada push

- **Poll SCM `H/2 * * * *`:** Jenkins consulta GitHub cada 2 minutos y construye si hay un commit nuevo en `main`.
  Es el disparador que funciona con Jenkins en `localhost`, porque GitHub no puede llegar a un equipo local.
- **GitHub hook trigger (`githubPush()`):** queda activado para cuando Jenkins tenga una URL pública
  (o un túnel). Basta con crear en GitHub un webhook a `https://<url-de-jenkins>/github-webhook/`.
- El primer build del job se lanza con **Construir ahora**: el sondeo compara contra el último commit
  construido, así que necesita una ejecución previa con checkout.

## Etapas del pipeline

1. **Checkout** del commit que disparó el build.
2. **Verificar secretos:** falla si `.env` está versionado o si `docker-compose.yml` tiene una contraseña escrita.
3. **Pruebas unitarias** dentro de `node:20-alpine` (`npm ci`, `npm audit`, `npm test`).
4. **Preparar .env** desde la credencial `gestor-tareas-env`.
5. **Validar** `docker-compose.yml`.
6. **Construir** la imagen `gestor-tareas-app:1.0.0`.
7. **Levantar** `app` y `db` con `--wait` (espera a que estén *healthy*).
8. **Inspeccionar la red** `red_tareas` (`docker network inspect`).
9. **Prueba de comunicación** con `scripts/prueba-comunicacion.sh`.
10. **post:** logs si falla; al final apaga los contenedores (`down -v`) y borra el `.env` del workspace.

## Comandos útiles

```bash
docker compose logs -f jenkins          # log del controlador
docker compose restart jenkins          # vuelve a aplicar casc/jenkins.yaml
docker compose down                     # detiene Jenkins (los volúmenes se conservan)
docker exec jenkins docker ps           # contenedores que el pipeline tiene corriendo en el motor aislado
```
