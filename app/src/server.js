const app = require('./app');
const pool = require('./db');

const PUERTO = Number(process.env.PORT || 3000);

const servidor = app.listen(PUERTO, () => {
  console.log(`[app] Gestor de tareas escuchando en el puerto ${PUERTO}`);
  console.log(`[app] Base de datos: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

// Apagado ordenado cuando Docker detiene el contenedor (docker compose down / stop).
function apagar(senal) {
  console.log(`[app] ${senal} recibido, cerrando conexiones...`);
  servidor.close(() => {
    pool.end().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => apagar('SIGTERM'));
process.on('SIGINT', () => apagar('SIGINT'));
