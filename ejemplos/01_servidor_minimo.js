// Demostración inicial sin base de datos. Detener con Ctrl+C antes de npm start.
const express = require('express');
const app = express();
app.use(express.json());
app.get('/saludo', (req, res) => {
  res.json({ mensaje: 'Hola desde la API de la tienda de Huaraz' });
});
app.get('/productos', (req, res) => {
  res.json({ data: [{ id: 1, nombre: 'Mouse', precio: 45, stock: 30 }] });
});
app.listen(3000, '127.0.0.1', () => console.log('Demo en http://localhost:3000/saludo'));
