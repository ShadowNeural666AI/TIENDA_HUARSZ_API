function createProductosController(productos) {
  return {
    async listar(req, res) {
      const data = await productos.listar();
      res.json({ total: data.length, data });
    },
    async buscar(req, res) {
      const nombre = req.query.nombre;
      if (typeof nombre !== 'string' || !nombre.trim() || nombre.trim().length > 100) {
        return res.status(400).json({ mensaje: 'Envíe nombre con entre 1 y 100 caracteres.' });
      }
      const data = await productos.listar(nombre.trim());
      res.json({ total: data.length, data });
    },
    async obtener(req, res) {
      const data = await productos.obtener(req.productoId);
      if (!data) return res.status(404).json({ mensaje: 'Producto no encontrado.' });
      res.json({ data });
    },
    async crear(req, res) {
      const data = await productos.crear(req.datosProducto);
      res.location(`/productos/${data.id}`).status(201).json({ mensaje: 'Producto creado.', data });
    },
    async actualizar(req, res) {
      const data = await productos.actualizar(req.productoId, req.datosProducto);
      if (!data) return res.status(404).json({ mensaje: 'Producto no encontrado.' });
      res.json({ mensaje: 'Producto actualizado.', data });
    },
    async eliminar(req, res) {
      if (!await productos.eliminar(req.productoId)) {
        return res.status(404).json({ mensaje: 'Producto no encontrado.' });
      }
      res.status(204).end();
    }
  };
}
module.exports = { createProductosController };
