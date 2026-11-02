function validarId(req, res, next) {
  const text = req.params.id;
  const id = Number(text);
  if (!/^[1-9]\d*$/.test(text) || !Number.isSafeInteger(id) || id > 2147483647) {
    return res.status(400).json({ mensaje: 'El id debe ser un entero positivo válido.' });
  }
  req.productoId = id;
  next();
}

function validarProducto({ parcial = false } = {}) {
  return (req, res, next) => {
    const data = req.body;
    const fields = ['nombre', 'precio', 'stock'];
    const errores = [];
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return res.status(400).json({ mensaje: 'Envíe un objeto JSON.' });
    }
    const keys = Object.keys(data);
    if (keys.length === 0 || keys.some(key => !fields.includes(key))) {
      return res.status(400).json({ mensaje: 'Use solamente nombre, precio y stock; envíe al menos un campo.' });
    }
    const has = field => Object.hasOwn(data, field);
    if (!parcial && fields.some(field => !has(field))) {
      errores.push('nombre, precio y stock son obligatorios en POST y PUT.');
    }
    if (has('nombre') && (typeof data.nombre !== 'string' ||
      data.nombre.trim().length < 3 || data.nombre.trim().length > 100)) {
      errores.push('nombre debe tener entre 3 y 100 caracteres.');
    }
    if (has('precio') && (typeof data.precio !== 'number' || !Number.isFinite(data.precio) ||
      data.precio < 0 || data.precio > 99999999.99 ||
      Math.abs(data.precio * 100 - Math.round(data.precio * 100)) > 0.000001)) {
      errores.push('precio debe ser numérico, entre 0 y 99999999.99, con máximo dos decimales.');
    }
    if (has('stock') && (!Number.isInteger(data.stock) || data.stock < 0 || data.stock > 2147483647)) {
      errores.push('stock debe ser un entero entre 0 y 2147483647.');
    }
    if (errores.length) return res.status(400).json({ mensaje: 'Datos inválidos.', errores });
    req.datosProducto = {};
    for (const field of fields) {
      if (has(field)) req.datosProducto[field] = field === 'nombre' ? data[field].trim() : data[field];
    }
    next();
  };
}
module.exports = { validarId, validarProducto };
