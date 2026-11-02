const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const { createProductosRouter } = require('./routes/productos.routes');
const { createAuthController } = require('./controllers/auth.controller');

function createApp({ productos, usuarios, config, comprobarBD, log = console.log, logError = console.error }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '20kb' }));
  app.use((req, res, next) => {
    res.on('finish', () => log(`${req.method} ${req.path} ${res.statusCode}`));
    next();
  });
  app.get('/salud', async (req, res) => {
    await comprobarBD();
    res.json({ estado: 'ok', servicio: 'tienda-huaraz-api', baseDeDatos: 'conectada' });
  });
  app.post('/auth/login', rateLimit({
    windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { mensaje: 'Demasiados intentos. Intente nuevamente en 15 minutos.' }
  }), createAuthController(usuarios, config));
  app.use('/productos', createProductosRouter(productos, config));
  app.use((req, res) => res.status(404).json({ mensaje: 'Ruta no encontrada.' }));
  // En Express 5 los errores de funciones async llegan a este middleware.
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ mensaje: 'El JSON está mal formado.' });
    }
    if (error.type === 'entity.too.large') {
      return res.status(413).json({ mensaje: 'El cuerpo supera el límite de 20 KB.' });
    }
    logError(error);
    res.status(500).json({ mensaje: 'Error interno del servidor.' });
  });
  return app;
}
module.exports = { createApp };
