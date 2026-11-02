const jwt = require('jsonwebtoken');

function createAuth(config) {
  function autenticar(req, res, next) {
    const match = /^Bearer\s+(\S+)$/i.exec(req.get('Authorization') || '');
    if (!match) return res.status(401).json({ mensaje: 'Se requiere un token Bearer.' });
    try {
      req.usuario = jwt.verify(match[1], config.jwtSecret, {
        algorithms: ['HS256'], issuer: config.jwtIssuer, audience: config.jwtAudience
      });
      next();
    } catch {
      res.status(401).json({ mensaje: 'Token inválido o vencido.' });
    }
  }
  function soloAdmin(req, res, next) {
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Esta operación requiere el rol admin.' });
    }
    next();
  }
  return { autenticar, soloAdmin };
}
module.exports = { createAuth };
