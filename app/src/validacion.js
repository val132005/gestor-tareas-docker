// Validación de entradas de la API. Se mantiene separada de Express para poder probarla sin base de datos.
const MAX_TITULO = 120;
const MAX_DESCRIPCION = 1000;

function validarId(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validarTitulo(titulo, errores) {
  if (typeof titulo !== 'string' || titulo.trim() === '') {
    errores.push('El título es obligatorio.');
    return undefined;
  }
  if (titulo.trim().length > MAX_TITULO) {
    errores.push(`El título no puede superar ${MAX_TITULO} caracteres.`);
    return undefined;
  }
  return titulo.trim();
}

function validarDescripcion(descripcion, errores) {
  if (descripcion === undefined || descripcion === null) return null;
  if (typeof descripcion !== 'string') {
    errores.push('La descripción debe ser texto.');
    return undefined;
  }
  if (descripcion.length > MAX_DESCRIPCION) {
    errores.push(`La descripción no puede superar ${MAX_DESCRIPCION} caracteres.`);
    return undefined;
  }
  return descripcion.trim() || null;
}

function validarNuevaTarea(cuerpo = {}) {
  const errores = [];
  const titulo = validarTitulo(cuerpo.titulo, errores);
  const descripcion = validarDescripcion(cuerpo.descripcion, errores);
  return { errores, datos: { titulo, descripcion } };
}

function validarActualizacion(cuerpo = {}) {
  const errores = [];
  const datos = {};
  if ('titulo' in cuerpo) datos.titulo = validarTitulo(cuerpo.titulo, errores);
  if ('descripcion' in cuerpo) datos.descripcion = validarDescripcion(cuerpo.descripcion, errores);
  if ('completada' in cuerpo) {
    if (typeof cuerpo.completada !== 'boolean') errores.push('"completada" debe ser true o false.');
    else datos.completada = cuerpo.completada;
  }
  if (errores.length === 0 && Object.keys(datos).length === 0) {
    errores.push('Envía al menos uno de estos campos: titulo, descripcion, completada.');
  }
  return { errores, datos };
}

module.exports = { validarId, validarNuevaTarea, validarActualizacion, MAX_TITULO, MAX_DESCRIPCION };
