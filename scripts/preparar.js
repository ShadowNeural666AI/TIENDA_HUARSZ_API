const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const root = path.resolve(__dirname, '..');
const destination = path.join(root, '.env');
if (fs.existsSync(destination)) {
  console.log('El archivo .env ya existe. Se conserva su configuración.');
} else {
  let content = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
  for (const key of ['DB_PASSWORD', 'ROOT_PASSWORD', 'JWT_SECRET']) {
    content = content.replace(`GENERAR_${key}`, randomBytes(32).toString('hex'));
  }
  fs.writeFileSync(destination, content, { mode: 0o600 });
  console.log('.env creado con secretos aleatorios para este equipo.');
  console.log('Usuarios didácticos definidos en .env.example.');
}
