// Frontend sin dependencias. Se usa textContent (no innerHTML) para no ejecutar HTML que venga en las tareas.
const lista = document.getElementById('lista');
const contador = document.getElementById('contador');
const estado = document.getElementById('estado');
const formulario = document.getElementById('form-tarea');
const mensaje = document.getElementById('mensaje');

async function pedir(url, opciones = {}) {
  const respuesta = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones,
  });
  if (respuesta.status === 204) return null;
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) {
    throw new Error(cuerpo.errores ? cuerpo.errores.join(' ') : cuerpo.error || 'Error');
  }
  return cuerpo;
}

async function comprobarConexion() {
  try {
    const salud = await pedir('/health');
    estado.textContent = `Conectado a PostgreSQL en "${salud.base_datos.host}" (base ${salud.base_datos.base_datos})`;
    estado.className = 'estado ok';
  } catch {
    estado.textContent = 'Sin conexión con la base de datos';
    estado.className = 'estado error';
  }
}

function crearElemento(tarea) {
  const li = document.createElement('li');
  if (tarea.completada) li.classList.add('hecha');

  const casilla = document.createElement('input');
  casilla.type = 'checkbox';
  casilla.checked = tarea.completada;
  casilla.setAttribute('aria-label', `Marcar "${tarea.titulo}" como completada`);
  casilla.addEventListener('change', () => actualizar(tarea.id, { completada: casilla.checked }));

  const texto = document.createElement('div');
  texto.className = 'texto';
  const titulo = document.createElement('div');
  titulo.className = 'titulo';
  titulo.textContent = tarea.titulo;
  texto.appendChild(titulo);
  if (tarea.descripcion) {
    const descripcion = document.createElement('div');
    descripcion.className = 'descripcion';
    descripcion.textContent = tarea.descripcion;
    texto.appendChild(descripcion);
  }
  const fecha = document.createElement('div');
  fecha.className = 'fecha';
  fecha.textContent = `#${tarea.id} · creada ${new Date(tarea.creada_en).toLocaleString('es-CO')}`;
  texto.appendChild(fecha);

  const eliminar = document.createElement('button');
  eliminar.className = 'eliminar';
  eliminar.textContent = 'Eliminar';
  eliminar.addEventListener('click', () => borrar(tarea.id));

  li.append(casilla, texto, eliminar);
  return li;
}

async function cargarTareas() {
  try {
    const tareas = await pedir('/api/tareas');
    lista.replaceChildren(...tareas.map(crearElemento));
    const pendientes = tareas.filter((t) => !t.completada).length;
    contador.textContent = `(${pendientes} pendientes de ${tareas.length})`;
    if (tareas.length === 0) {
      const vacia = document.createElement('li');
      vacia.className = 'vacia';
      vacia.textContent = 'No hay tareas todavía.';
      lista.appendChild(vacia);
    }
  } catch (err) {
    mensaje.textContent = err.message;
  }
}

async function actualizar(id, cambios) {
  try {
    await pedir(`/api/tareas/${id}`, { method: 'PUT', body: JSON.stringify(cambios) });
  } catch (err) {
    mensaje.textContent = err.message;
  }
  cargarTareas();
}

async function borrar(id) {
  try {
    await pedir(`/api/tareas/${id}`, { method: 'DELETE' });
  } catch (err) {
    mensaje.textContent = err.message;
  }
  cargarTareas();
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  mensaje.textContent = '';
  const datos = Object.fromEntries(new FormData(formulario));
  try {
    await pedir('/api/tareas', { method: 'POST', body: JSON.stringify(datos) });
    formulario.reset();
    cargarTareas();
  } catch (err) {
    mensaje.textContent = err.message;
  }
});

comprobarConexion();
cargarTareas();
