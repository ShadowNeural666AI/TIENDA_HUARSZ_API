// Los valores se envían separados del SQL mediante marcadores ?.
function createProductosModel(pool) {
  return {
    async listar(nombre = '') {
      const [rows] = nombre
        ? await pool.execute(
          'SELECT id, nombre, precio, stock FROM productos WHERE INSTR(nombre, ?) > 0 ORDER BY id',
          [nombre])
        : await pool.execute('SELECT id, nombre, precio, stock FROM productos ORDER BY id');
      return rows;
    },
    async obtener(id) {
      const [rows] = await pool.execute(
        'SELECT id, nombre, precio, stock FROM productos WHERE id = ?', [id]);
      return rows[0] || null;
    },
    async crear(data) {
      const [result] = await pool.execute(
        'INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)',
        [data.nombre, data.precio, data.stock]);
      return this.obtener(result.insertId);
    },
    async actualizar(id, data) {
      const current = await this.obtener(id);
      if (!current) return null;
      const updated = { ...current, ...data };
      await pool.execute(
        'UPDATE productos SET nombre = ?, precio = ?, stock = ? WHERE id = ?',
        [updated.nombre, updated.precio, updated.stock, id]);
      return this.obtener(id);
    },
    async eliminar(id) {
      const [result] = await pool.execute('DELETE FROM productos WHERE id = ?', [id]);
      return result.affectedRows > 0;
    }
  };
}
module.exports = { createProductosModel };
