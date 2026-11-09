-- Se ejecuta automáticamente la PRIMERA vez que arranca el contenedor de PostgreSQL
-- (cuando el volumen de datos está vacío).
CREATE TABLE IF NOT EXISTS tareas (
    id              SERIAL PRIMARY KEY,
    titulo          VARCHAR(120) NOT NULL,
    descripcion     TEXT,
    completada      BOOLEAN      NOT NULL DEFAULT FALSE,
    creada_en       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    actualizada_en  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO tareas (titulo, descripcion) VALUES
    ('Instalar Docker Desktop', 'Requisito para levantar los contenedores en local'),
    ('Crear el repositorio en GitHub', 'Subir el proyecto y activar GitHub Actions');
