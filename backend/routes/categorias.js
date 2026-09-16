const express = require('express');
const db = require('../db/connection');

const router = express.Router();

// GET /api/categorias
router.get('/', (req, res) => {
  const categorias = db.prepare('SELECT slug, nombre, icono FROM categorias ORDER BY nombre').all();
  res.json(categorias);
});

module.exports = router;
