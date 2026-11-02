// Prueba la API REAL encendida. Crea un producto temporal y lo elimina al terminar.
const assert = require('node:assert/strict');
require('../src/config');
const base = process.env.API_URL || 'http://localhost:3000';
let temporaryId, adminToken, checks = 0;

async function call(method, path, expected, body, token) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(base + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body)
  });
  assert.equal(response.status, expected, `${method} ${path}`);
  checks++;
  console.log(`OK ${expected} ${method} ${path}`);
  return response.status === 204 ? null : response.json();
}
async function main() {
  await call('GET', '/salud', 200);
  const credentials = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
  adminToken = (await call('POST', '/auth/login', 200, credentials)).token;
  const viewer = (await call('POST', '/auth/login', 200, {
    email: process.env.CONSULTA_EMAIL, password: process.env.CONSULTA_PASSWORD
  })).token;
  await call('POST', '/auth/login', 401, { ...credentials, password: 'incorrecta' });
  const product = { nombre: `Monitor verificacion ${Date.now()}`, precio: 850.5, stock: 5 };
  await call('POST', '/productos', 401, product);
  await call('POST', '/productos', 403, product, viewer);
  const created = await call('POST', '/productos', 201, product, adminToken);
  temporaryId = created.data.id;
  const path = `/productos/${temporaryId}`;
  assert.equal((await call('GET', path, 200)).data.nombre, product.nombre);
  await call('GET', '/productos', 200);
  const search = await call('GET', '/productos/buscar?nombre=' + encodeURIComponent(product.nombre), 200);
  assert.ok(search.data.some(row => row.id === temporaryId));
  await call('POST', '/productos', 400, { ...product, precio: -1 }, adminToken);
  await call('PUT', path, 400, { stock: 8 }, adminToken);
  assert.equal((await call('PATCH', path, 200, { stock: 8 }, adminToken)).data.stock, 8);
  await call('PUT', path, 200, { ...product, stock: 8 }, adminToken);
  await call('PUT', path, 200, { ...product, stock: 8 }, adminToken);
  await call('PATCH', path, 400, {}, adminToken);
  await call('GET', '/productos/abc', 400);
  await call('GET', '/productos/2147483647', 404);
  await call('GET', '/productos/buscar?nombre=' + encodeURIComponent("' OR 1=1 --"), 200);
  await call('DELETE', path, 204, undefined, adminToken);
  temporaryId = undefined;
  await call('GET', path, 404);
  console.log(`${checks} comprobaciones HTTP completadas contra ${base}.`);
}
main().catch(error => { console.error('Fallo:', error.message); process.exitCode = 1; })
  .finally(async () => {
    if (temporaryId && adminToken) {
      await fetch(`${base}/productos/${temporaryId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {});
    }
  });
