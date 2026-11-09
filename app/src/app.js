const path = require('path');
const express = require('express');
const helmet = require('helmet');
const pool = require('./db');
const rutasTareas = require('./rutas/tareas');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Comprueba la comunicación app -> base de datos. Lo usan el healthcheck de Docker y GitHub Actions.
app.get('/health', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT NOW() AS hora_bd, current_database() AS base_datos, current_user AS usuario_bd, version() AS version',
    );
    res.json({
      estado: 'ok',
      servicio: 'gestor-tareas-app',
      contenedor: process.env.HOSTNAME,
      base_datos: { conectada: true, host: process.env.DB_HOST, ...rows[0] },
    });
  } catch (err) {
    console.error('[health] Sin conexión con la base de datos:', err.message);
    res.status(503).json({ estado: 'error', base_datos: { conectada: false } });
  }
});

app.use('/api/tareas', rutasTareas);

app.use((_req, res) => res.status(404).json({ error: 'Ruta no encontrada.' }));

// No se devuelve el detalle interno del error al cliente; solo se registra en los logs del contenedor.
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
  console.error('[error]', err.message);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = app;
