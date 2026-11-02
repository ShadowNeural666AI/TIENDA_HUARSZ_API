const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createApp } = require('../src/app');
const { createProductosModel } = require('../src/models/productos.model');

let server, base, token, consultaToken, createdId;
const config = {
  jwtSecret: 'secreto-de-pruebas-con-mas-de-32-caracteres', jwtExpiresIn: '1h',
  jwtIssuer: 'tienda-huaraz-api', jwtAudience: 'tienda-clientes',
  corsOrigin: 'http://localhost:5173'
};
const rows = [{ id: 1, nombre: 'Teclado mecánico', precio: 120, stock: 15 }];
let nextId = 2;
const productos = {
  async listar(nombre = '') {
    if (nombre === 'provocar-error-interno') throw Error('detalle privado de prueba');
    return rows.filter(row => row.nombre.toLowerCase().includes(nombre.toLowerCase()));
  },
  async obtener(id) { return rows.find(row => row.id === id) || null; },
  async crear(data) { const row = { id: nextId++, ...data }; rows.push(row); return row; },
  async actualizar(id, data) {
    const row = await this.obtener(id);
    if (!row) return null;
    Object.assign(row, data); return row;
  },
  async eliminar(id) {
    const index = rows.findIndex(row => row.id === id);
    if (index < 0) return false;
    rows.splice(index, 1); return true;
  }
};
async function request(method, path, body, credential) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (credential) headers.Authorization = `Bearer ${credential}`;
  const response = await fetch(base + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body)
  });
  return { status: response.status, headers: response.headers,
    body: response.status === 204 ? null : await response.json() };
}
before(async () => {
  const hash = await bcrypt.hash('Senati2026!', 4);
  const users = [
    { id: 1, email: 'admin@tienda.local', password_hash: hash, rol: 'admin' },
    { id: 2, email: 'consulta@tienda.local', password_hash: hash, rol: 'consulta' }
  ];
  const usuarios = { buscarPorEmail: async email => users.find(u => u.email === email) };
  const app = createApp({ productos, usuarios, config, comprobarBD: async () => {},
    log: () => {}, logError: () => {} });
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  token = (await request('POST', '/auth/login', { email: users[0].email, password: 'Senati2026!' })).body.token;
  consultaToken = (await request('POST', '/auth/login', { email: users[1].email, password: 'Senati2026!' })).body.token;
});
after(async () => { if (server) await new Promise(resolve => server.close(resolve)); });

test('salud y consulta pública devuelven JSON', async () => {
  assert.equal((await request('GET', '/salud')).body.estado, 'ok');
  const r = await request('GET', '/productos');
  assert.equal(r.status, 200); assert.ok(Array.isArray(r.body.data));
});
test('el login omite el hash y el token tiene rol y vencimiento', async () => {
  const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  assert.equal(payload.rol, 'admin'); assert.ok(payload.exp > payload.iat);
  const r = await request('POST', '/auth/login', { email: 'admin@tienda.local', password: 'Senati2026!' });
  assert.equal(r.body.usuario.password_hash, undefined);
});
test('credenciales incorrectas devuelven 401', async () => {
  assert.equal((await request('POST', '/auth/login', { email: 'admin@tienda.local', password: 'incorrecta' })).status, 401);
});
test('escritura sin token devuelve 401', async () => {
  assert.equal((await request('POST', '/productos', { nombre: 'Mouse', precio: 10, stock: 1 })).status, 401);
});
test('rol consulta recibe 403 al intentar escribir', async () => {
  assert.equal((await request('POST', '/productos', { nombre: 'Mouse', precio: 10, stock: 1 }, consultaToken)).status, 403);
});
test('token alterado y token vencido devuelven 401', async () => {
  const expired = jwt.sign({ rol: 'admin' }, config.jwtSecret, {
    expiresIn: -10, issuer: config.jwtIssuer, audience: config.jwtAudience
  });
  for (const value of [token + 'x', expired]) {
    assert.equal((await request('DELETE', '/productos/1', undefined, value)).status, 401);
  }
});
test('POST válido devuelve 201 y Location', async () => {
  const r = await request('POST', '/productos', { nombre: '  Monitor de prueba  ', precio: 850.50, stock: 5 }, token);
  assert.equal(r.status, 201); createdId = r.body.data.id;
  assert.equal(r.body.data.nombre, 'Monitor de prueba');
  assert.equal(r.headers.get('location'), `/productos/${createdId}`);
});
test('el producto creado se puede consultar', async () => {
  const r = await request('GET', `/productos/${createdId}`);
  assert.equal(r.status, 200); assert.equal(r.body.data.precio, 850.50);
});
test('precio negativo, texto numérico y stock decimal se rechazan', async () => {
  const invalid = [{ precio: -1 }, { precio: '85' }, { precio: 1.234 }, { stock: 1.5 }, { stock: -1 }, { nombre: '' }];
  for (const data of invalid) {
    const r = await request('POST', '/productos', { nombre: 'Mouse', precio: 85, stock: 2, ...data }, token);
    assert.equal(r.status, 400);
  }
});
test('PUT requiere representación completa y PATCH acepta stock', async () => {
  assert.equal((await request('PUT', `/productos/${createdId}`, { stock: 9 }, token)).status, 400);
  const r = await request('PATCH', `/productos/${createdId}`, { stock: 9 }, token);
  assert.equal(r.status, 200); assert.equal(r.body.data.stock, 9);
  assert.equal(r.body.data.nombre, 'Monitor de prueba');
});
test('PATCH vacío o con campos desconocidos devuelve 400', async () => {
  for (const data of [{}, { id: 999 }, { stock: 1, rol: 'admin' }, []]) {
    assert.equal((await request('PATCH', `/productos/${createdId}`, data, token)).status, 400);
  }
});
test('PUT completo permite cero y repetir valores', async () => {
  const data = { nombre: 'Monitor final', precio: 0, stock: 0 };
  for (let i = 0; i < 2; i++) {
    assert.equal((await request('PUT', `/productos/${createdId}`, data, token)).status, 200);
  }
});
test('búsqueda usa la ruta fija antes del parámetro id', async () => {
  const r = await request('GET', '/productos/buscar?nombre=teclado');
  assert.equal(r.status, 200); assert.equal(r.body.total, 1);
  assert.equal((await request('GET', '/productos/buscar')).status, 400);
  assert.equal((await request('GET', '/productos/buscar?nombre=sin-coincidencias')).body.total, 0);
});
test('id inválido devuelve 400 y recurso inexistente 404', async () => {
  for (const id of ['abc', '0', '-1', '1.5', '999999999999999999999']) {
    assert.equal((await request('GET', `/productos/${id}`)).status, 400);
  }
  assert.equal((await request('GET', '/productos/2147483647')).status, 404);
});
test('un error inesperado devuelve 500 sin revelar detalles', async () => {
  const r = await request('GET', '/productos/buscar?nombre=provocar-error-interno');
  assert.equal(r.status, 500); assert.deepEqual(r.body, { mensaje: 'Error interno del servidor.' });
});
test('JSON mal formado devuelve 400', async () => {
  const r = await fetch(base + '/productos', { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: '{"nombre":' });
  assert.equal(r.status, 400);
});
test('DELETE devuelve 204 sin cuerpo y luego 404', async () => {
  const r = await request('DELETE', `/productos/${createdId}`, undefined, token);
  assert.equal(r.status, 204); assert.equal(r.body, null);
  assert.equal((await request('GET', `/productos/${createdId}`)).status, 404);
  assert.equal((await request('DELETE', `/productos/${createdId}`, undefined, token)).status, 404);
});
test('ruta inexistente y cabecera CORS son coherentes', async () => {
  assert.equal((await request('GET', '/ruta-inexistente')).status, 404);
  const r = await fetch(base + '/productos', { headers: { Origin: config.corsOrigin } });
  assert.equal(r.headers.get('access-control-allow-origin'), config.corsOrigin);
});
test('el modelo separa valores del SQL y admite UPDATE sin cambios', async () => {
  const calls = [];
  const pool = { async execute(sql, values) {
    calls.push({ sql, values });
    if (sql.startsWith('UPDATE')) return [{ affectedRows: 0 }];
    return [[{ id: 1, nombre: 'Teclado', precio: 120, stock: 15 }]];
  } };
  const model = createProductosModel(pool);
  const text = "' OR 1=1 --";
  await model.listar(text);
  assert.equal(calls[0].sql.includes(text), false); assert.deepEqual(calls[0].values, [text]);
  assert.equal((await model.actualizar(1, { stock: 15 })).stock, 15);
});
