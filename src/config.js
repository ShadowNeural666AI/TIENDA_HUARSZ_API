const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

function loadConfig() {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32 || secret.startsWith('GENERAR_')) {
    throw new Error('Ejecute npm run preparar antes de iniciar la API.');
  }
  return {
    port: Number(process.env.PORT || 3000),
    host: process.env.HOST || '127.0.0.1',
    jwtSecret: secret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    jwtIssuer: 'tienda-huaraz-api',
    jwtAudience: 'tienda-clientes',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    db: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3307),
      user: process.env.DB_USER || 'tienda',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'tienda_huaraz',
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 10000,
      decimalNumbers: true
    }
  };
}
module.exports = { loadConfig };
