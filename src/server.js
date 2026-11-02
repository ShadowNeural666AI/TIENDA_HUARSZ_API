const mysql = require('mysql2/promise');
const { loadConfig } = require('./config');
const { createApp } = require('./app');
const { createProductosModel } = require('./models/productos.model');
const { createUsuariosModel } = require('./models/usuarios.model');

async function main() {
  const config = loadConfig();
  const pool = mysql.createPool(config.db);
  try {
    await pool.execute('SELECT 1');
    const app = createApp({
      config, productos: createProductosModel(pool), usuarios: createUsuariosModel(pool),
      comprobarBD: () => pool.execute('SELECT 1')
    });
    const server = app.listen(config.port, config.host, () => {
      console.log(`API disponible en el puerto ${config.port}`);
    });
    server.on('error', async error => {
      console.error(error.code === 'EADDRINUSE' ? 'El puerto de la API está ocupado.' : error.message);
      await pool.end();
      process.exitCode = 1;
    });
    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.once(signal, () => server.close(async () => { await pool.end(); process.exit(0); }));
    }
  } catch (error) {
    console.error('No se pudo iniciar. Revise MySQL y .env:', error.message);
    await pool.end();
    process.exitCode = 1;
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
