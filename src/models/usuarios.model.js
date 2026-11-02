function createUsuariosModel(pool) {
  return {
    async buscarPorEmail(email) {
      const [rows] = await pool.execute(
        'SELECT id, email, password_hash, rol FROM usuarios WHERE email = ?', [email]);
      return rows[0] || null;
    }
  };
}
module.exports = { createUsuariosModel };
