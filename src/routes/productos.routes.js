const { Router } = require('express');
const { createProductosController } = require('../controllers/productos.controller');
const { createAuth } = require('../middleware/auth');
const { validarId, validarProducto } = require('../middleware/validacion');

function createProductosRouter(productos, config) {
  const router = Router();
  const c = createProductosController(productos);
  const { autenticar, soloAdmin } = createAuth(config);
  router.get('/', c.listar);
  // /buscar debe declararse antes de /:id.
  router.get('/buscar', c.buscar);
  router.get('/:id', validarId, c.obtener);
  router.post('/', autenticar, soloAdmin, validarProducto(), c.crear);
  router.put('/:id', autenticar, soloAdmin, validarId, validarProducto(), c.actualizar);
  router.patch('/:id', autenticar, soloAdmin, validarId, validarProducto({ parcial: true }), c.actualizar);
  router.delete('/:id', autenticar, soloAdmin, validarId, c.eliminar);
  return router;
}
module.exports = { createProductosRouter };
