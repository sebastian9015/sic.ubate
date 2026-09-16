// Rutas de administración: gestión de categorías y negocios. Solo cuentas tipo 'admin'.
const express = require('express');
const db = require('../db/connection');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth, requireAdmin);

// ---- Categorías ----

// POST /api/admin/categorias  { slug, nombre, icono }
router.post('/categorias', (req, res) => {
  const { slug, nombre, icono } = req.body;
  if (!slug || !nombre) {
    return res.status(400).json({ error: 'slug y nombre son obligatorios.' });
  }
  const existente = db.prepare('SELECT id FROM categorias WHERE slug = ?').get(slug);
  if (existente) {
    return res.status(409).json({ error: 'Ya existe una categoría con ese slug.' });
  }
  const info = db
    .prepare('INSERT INTO categorias (slug, nombre, icono) VALUES (?, ?, ?)')
    .run(slug, nombre, icono || '🏷️');
  res.status(201).json({ id: info.lastInsertRowid });
});

// DELETE /api/admin/categorias/:id
router.delete('/categorias/:id', (req, res) => {
  const enUso = db.prepare('SELECT COUNT(*) AS total FROM productos WHERE categoria_id = ?').get(req.params.id);
  if (enUso.total > 0) {
    return res.status(409).json({ error: `No se puede eliminar: ${enUso.total} producto(s) usan esta categoría.` });
  }
  db.prepare('DELETE FROM categorias WHERE id = ?').run(req.params.id);
  res.json({ mensaje: 'Categoría eliminada.' });
});

// ---- Negocios ----

// GET /api/admin/negocios  -> lista completa con datos del dueño
router.get('/negocios', (req, res) => {
  const negocios = db
    .prepare(
      `SELECT n.id, n.nombre, n.sector, n.direccion, n.telefono, u.nombre AS dueno, u.correo,
              (SELECT COUNT(*) FROM productos p WHERE p.negocio_id = n.id) AS total_productos
       FROM negocios n JOIN usuarios u ON u.id = n.usuario_id
       ORDER BY n.nombre`
    )
    .all();
  res.json(negocios);
});

// PUT /api/admin/negocios/:id  { nombre, sector, direccion, telefono, descripcion }
router.put('/negocios/:id', (req, res) => {
  const negocio = db.prepare('SELECT id FROM negocios WHERE id = ?').get(req.params.id);
  if (!negocio) return res.status(404).json({ error: 'Negocio no encontrado.' });

  const { nombre, sector, direccion, telefono, descripcion } = req.body;
  db.prepare(
    `UPDATE negocios SET nombre = COALESCE(?, nombre), sector = COALESCE(?, sector),
     direccion = COALESCE(?, direccion), telefono = COALESCE(?, telefono),
     descripcion = COALESCE(?, descripcion) WHERE id = ?`
  ).run(nombre, sector, direccion, telefono, descripcion, req.params.id);

  res.json({ mensaje: 'Negocio actualizado.' });
});

// DELETE /api/admin/negocios/:id
router.delete('/negocios/:id', (req, res) => {
  db.prepare('DELETE FROM negocios WHERE id = ?').run(req.params.id);
  res.json({ mensaje: 'Negocio y sus productos fueron eliminados.' });
});

// GET /api/admin/usuarios -> lista de usuarios (para ver quién es cliente/negocio/admin)
router.get('/usuarios', (req, res) => {
  const usuarios = db
    .prepare('SELECT id, nombre, correo, tipo, fecha_registro FROM usuarios ORDER BY fecha_registro DESC')
    .all();
  res.json(usuarios);
});

module.exports = router;
