const test = require('node:test');
const assert = require('node:assert/strict');
const { validarId, validarNuevaTarea, validarActualizacion, MAX_TITULO } = require('../src/validacion');

test('validarId acepta enteros positivos y rechaza el resto', () => {
  assert.equal(validarId('7'), 7);
  assert.equal(validarId('0'), null);
  assert.equal(validarId('-3'), null);
  assert.equal(validarId('abc'), null);
  assert.equal(validarId('1.5'), null);
});

test('una tarea nueva exige título', () => {
  assert.deepEqual(validarNuevaTarea({}).errores, ['El título es obligatorio.']);
  assert.deepEqual(validarNuevaTarea({ titulo: '   ' }).errores, ['El título es obligatorio.']);
});

test('una tarea nueva válida se normaliza', () => {
  const { errores, datos } = validarNuevaTarea({ titulo: '  Estudiar Docker ', descripcion: ' Semana 3 ' });
  assert.equal(errores.length, 0);
  assert.deepEqual(datos, { titulo: 'Estudiar Docker', descripcion: 'Semana 3' });
});

test('el título no puede superar el máximo', () => {
  const { errores } = validarNuevaTarea({ titulo: 'x'.repeat(MAX_TITULO + 1) });
  assert.equal(errores.length, 1);
});

test('la actualización exige al menos un campo', () => {
  assert.equal(validarActualizacion({}).errores.length, 1);
});

test('"completada" debe ser booleano', () => {
  assert.equal(validarActualizacion({ completada: 'si' }).errores.length, 1);
  assert.deepEqual(validarActualizacion({ completada: true }).datos, { completada: true });
});
