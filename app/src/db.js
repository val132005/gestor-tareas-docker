// Conexión a PostgreSQL. El host es el nombre del servicio en docker-compose ("db"),
// que Docker resuelve por DNS dentro de la red interna.
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[db] Error inesperado en una conexión inactiva:', err.message);
});

module.exports = pool;
