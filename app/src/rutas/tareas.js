// CRUD de tareas. Todas las consultas usan parámetros ($1, $2...) para evitar inyección SQL.
const express = require('express');
const pool = require('../db');
const { validarId, validarNuevaTarea, validarActualizacion } = require('../validacion');

const router = express.Router();
const COLUMNAS = 'id, titulo, descripcion, completada, creada_en, actualizada_en';

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM tareas ORDER BY completada, creada_en DESC`);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Id inválido.' });
  try {
    const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM tareas WHERE id = $1`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  const { errores, datos } = validarNuevaTarea(req.body);
  if (errores.length) return res.status(400).json({ errores });
  try {
    const { rows } = await pool.query(
      `INSERT INTO tareas (titulo, descripcion) VALUES ($1, $2) RETURNING ${COLUMNAS}`,
      [datos.titulo, datos.descripcion],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Id inválido.' });
  const { errores, datos } = validarActualizacion(req.body);
  if (errores.length) return res.status(400).json({ errores });

  // Solo se actualizan los campos enviados; los nombres de columna vienen de una lista fija.
  const campos = Object.keys(datos);
  const asignaciones = campos.map((campo, i) => `${campo} = $${i + 1}`);
  const valores = campos.map((campo) => datos[campo]);
  try {
    const { rows } = await pool.query(
      `UPDATE tareas SET ${asignaciones.join(', ')}, actualizada_en = NOW()
       WHERE id = $${campos.length + 1} RETURNING ${COLUMNAS}`,
      [...valores, id],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Tarea no encontrada.' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  const id = validarId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Id inválido.' });
  try {
    const { rowCount } = await pool.query('DELETE FROM tareas WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Tarea no encontrada.' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
