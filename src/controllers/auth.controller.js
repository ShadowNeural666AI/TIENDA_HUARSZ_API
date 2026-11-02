const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function createAuthController(usuarios, config) {
  return async (req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || email.length > 150 || !email.includes('@') ||
      typeof password !== 'string' || !password || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({ mensaje: 'Envíe email y password válidos.' });
    }
    const usuario = await usuarios.buscarPorEmail(email.trim().toLowerCase());
    if (!usuario || !await bcrypt.compare(password, usuario.password_hash)) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas.' });
    }
    const token = jwt.sign({ rol: usuario.rol }, config.jwtSecret, {
      algorithm: 'HS256', subject: String(usuario.id), expiresIn: config.jwtExpiresIn,
      issuer: config.jwtIssuer, audience: config.jwtAudience
    });
    res.json({ token, tipo: 'Bearer', usuario: { email: usuario.email, rol: usuario.rol } });
  };
}
module.exports = { createAuthController };
