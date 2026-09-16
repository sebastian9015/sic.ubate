// Rutas de negocios: listado público con dirección (para el mapa de "dónde comprar").
const express = require('express');
const db = require('../db/connection');

const router = express.Router();

// GET /api/negocios  -> lista pública de los negocios con su dirección
router.get('/', (req, res) => {
  const negocios = db
    .prepare('SELECT id, nombre, sector, direccion, telefono, descripcion FROM negocios ORDER BY nombre')
    .all();
  res.json(negocios);
});

// GET /api/negocios/:id
router.get('/:id', (req, res) => {
  const negocio = db
    .prepare('SELECT id, nombre, sector, direccion, telefono, descripcion FROM negocios WHERE id = ?')
    .get(req.params.id);
  if (!negocio) return res.status(404).json({ error: 'Negocio no encontrado.' });
  res.json(negocio);
});

module.exports = router;
