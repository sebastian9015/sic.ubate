// Servidor principal del Sistema de Información Comercial para Ubaté (SIC-Ubaté).
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const categoriasRoutes = require('./routes/categorias');
const negociosRoutes = require('./routes/negocios');
const pedidosRoutes = require('./routes/pedidos');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/categorias', categoriasRoutes);
app.use('/api/negocios', negociosRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/salud', (req, res) => {
  res.json({ estado: 'ok', mensaje: 'SIC-Ubaté backend funcionando correctamente.' });
});

// Frontend estático (el prototipo HTML/CSS/JS)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.listen(PORT, () => {
  console.log(`SIC-Ubaté backend escuchando en http://localhost:${PORT}`);
});
