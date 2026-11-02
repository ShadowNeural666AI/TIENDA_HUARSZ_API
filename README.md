# API REST de inventario de la tienda de Huaraz

Práctica para SENATI CFP Huaraz, Ingeniería de Software con IA, V semestre.
Instructor: Ing. Carlos Alberto Durán Cueva.

Node.js 24 LTS, Express 5, MySQL 8.4, JWT y Docker Compose.

## Primera ejecución en Windows

Instale Node.js LTS con soporte, Docker Desktop, Visual Studio Code y Postman Desktop.
Extraiga el ZIP y abra la carpeta `tienda-huaraz-api` en VS Code.
Ejecute los comandos en una terminal PowerShell dentro de esa carpeta.

```powershell
npm ci
npm run preparar
docker compose up -d db --wait
npm run seed
npm start
```

Si PowerShell bloquea `npm.ps1`, utilice `npm.cmd` en los mismos comandos.
Abra http://localhost:3000/salud y http://localhost:3000/productos .
Mantenga abierta la terminal del servidor.

La configuración `.env` se genera con secretos aleatorios. No se incluye en la entrega.
Conserve `.env` mientras exista el volumen de MySQL, para mantener las credenciales.

## Primera demostración sin MySQL

Antes de la API definitiva puede ejecutar `npm run demo` y abrir
http://localhost:3000/saludo . Detenga esta demostración con Ctrl+C antes de `npm start`.

## Postman

Importe `postman/Tienda_Huaraz.postman_collection.json`.
La variable de colección `base_url` comienza con `http://localhost:3000`.
Ejecute las 16 solicitudes en orden: el login guarda tokens y la creación guarda
el identificador del producto para las pruebas siguientes.
La colección elimina únicamente el monitor que crea durante la secuencia.

Perfiles locales de demostración:

| Email | Contraseña | Rol |
| --- | --- | --- |
| admin@tienda.local | Senati2026! | admin |
| consulta@tienda.local | Consulta2026! | consulta |

Los hashes bcrypt se guardan en MySQL. El script `seed` conserva los usuarios
existentes y no actualiza sus contraseñas. El JWT dura una hora.

## Endpoints

| Método | Ruta | Acceso |
| --- | --- | --- |
| GET | /salud | Público |
| POST | /auth/login | Credenciales |
| GET | /productos | Público |
| GET | /productos/buscar?nombre=teclado | Público |
| GET | /productos/:id | Público |
| POST | /productos | JWT y rol admin |
| PUT | /productos/:id | JWT y rol admin |
| PATCH | /productos/:id | JWT y rol admin |
| DELETE | /productos/:id | JWT y rol admin |

POST y PUT requieren `nombre`, `precio` y `stock`.
PATCH admite al menos uno de esos campos. Se rechazan campos desconocidos.
Nombre: 3 a 100 caracteres. Precio: número no negativo con máximo dos decimales.
Stock: entero no negativo. Se admiten precios y existencias iguales a cero.

## Despliegue local con Docker

Detenga `npm start` con Ctrl+C. Desde la raíz del proyecto:

```powershell
docker compose up -d --build --wait
docker compose ps
docker compose logs --tail 30 api
```

Abra http://localhost:8080/salud y cambie `base_url` de Postman a
`http://localhost:8080`. Repita el login y las pruebas.

La API del contenedor se conecta a `db:3306`. La API de Windows se conecta a
`127.0.0.1:3307`. `8080:3000` publica el puerto de la API.
La API y MySQL publican sus puertos únicamente en la interfaz local del equipo.

Después de cambiar código, reconstruya con `docker compose up -d --build --wait`.

## Verificación

```powershell
npm test
```

Ejecuta 19 pruebas automatizadas con repositorios simulados, sin MySQL.
Para probar la API real encendida en el puerto 3000:

```powershell
npm run verificar
```

Realiza 21 comprobaciones HTTP y elimina el producto temporal que crea.
Para el puerto 8080, use en PowerShell:

```powershell
$env:API_URL = "http://localhost:8080"
npm run verificar
Remove-Item Env:API_URL
```

Para demostrar persistencia, cree un producto desde Postman, anote su id,
ejecute `docker compose down` y después `docker compose up -d --wait`.
Consulte el mismo producto. El volumen `datos_tienda` debe conservarlo.
El SQL inicial solo se ejecuta cuando el volumen de MySQL está vacío.

## Dificultades frecuentes

- Motor Docker detenido: abra Docker Desktop y compruebe `docker info`.
- Puerto 3000 ocupado: detenga la demostración o una API anterior.
- Puerto 3307 ocupado: cambie `DB_PORT` y `DB_PUBLISHED_PORT` al mismo puerto
  libre en `.env`; vuelva a iniciar `db` y reinicie Node.js.
- Error de MySQL: revise `docker compose ps`, registros de `db` y `.env`.
- Login 401: compruebe las credenciales, la carga `seed` y el vencimiento del token.
- Escritura 403: utilice el perfil admin.
- JSON inválido: seleccione Body > raw > JSON en Postman.
- Cambiar `.env` no cambia contraseñas ya almacenadas en un volumen existente.

## Alcance

Material didáctico local. Postman representa al cliente. No incluye frontend.
CORS configura un origen de ejemplo `http://localhost:5173` para un futuro cliente
web; no sustituye JWT ni permisos. No se requiere cuenta AWS.
No publique `.env`, contraseñas ni tokens en evidencias o repositorios.
Antes de exponer el servicio en internet se requiere adaptar su operación,
HTTPS y gestión de identidades y secretos al entorno de destino.

La guía Word contiene la secuencia de clase, las explicaciones de código,
los resultados esperados y la rúbrica de 0 a 20.
