const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { loadConfig } = require('../src/config');

async function seed() {
  const config = loadConfig();
  const pool = mysql.createPool(config.db);
  try {
    const users = [
      [process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD, 'admin'],
      [process.env.CONSULTA_EMAIL, process.env.CONSULTA_PASSWORD, 'consulta']
    ];
    for (const [email, password, rol] of users) {
      if (!email || !password || Buffer.byteLength(password, 'utf8') > 72) {
        throw new Error('Revise las credenciales didácticas en .env. Máximo 72 bytes por contraseña.');
      }
      const hash = await bcrypt.hash(password, 12);
      await pool.execute(
        'INSERT INTO usuarios (email, password_hash, rol) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE email = email',
        [email.toLowerCase(), hash, rol]);
    }
    const products = [
      [1, 'Laptop de oficina', 2500, 8],
      [2, 'Mouse inalámbrico', 45, 30],
      [3, 'Teclado mecánico', 120, 15]
    ];
    for (const product of products) {
      await pool.execute(
        'INSERT INTO productos (id, nombre, precio, stock) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id = id', product);
    }
    console.log('Datos de demostración listos. Los registros existentes se conservan.');
  } finally { await pool.end(); }
}
seed().catch(error => { console.error('Error al cargar datos:', error.message); process.exitCode = 1; });
