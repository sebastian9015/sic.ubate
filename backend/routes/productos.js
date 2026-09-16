// Rutas del catálogo de productos: listar (público), crear/editar/borrar (negocios autenticados).
const express = require('express');
const db = require('../db/connection');
const { requireAuth, requireNegocio } = require('../middleware/auth');

const router = express.Router();

// GET /api/productos?categoria=lacteo&buscar=queso
router.get('/', (req, res) => {
  const { categoria, buscar } = req.query;

  let sql = `
    SELECT p.id, p.nombre, p.descripcion, p.precio, p.icono,
           c.slug AS categoria, c.nombre AS categoria_nombre,
           n.id AS negocio_id, n.nombre AS negocio, n.sector, n.direccion, n.telefono
    FROM productos p
    JOIN categorias c ON c.id = p.categoria_id
    JOIN negocios n ON n.id = p.negocio_id
    WHERE 1 = 1
  `;
  const params = [];

  if (categoria && categoria !== 'todos') {
    sql += ' AND c.slug = ?';
    params.push(categoria);
  }
  if (buscar) {
    sql += ' AND (LOWER(p.nombre) LIKE ? OR LOWER(n.nombre) LIKE ?)';
    const like = `%${buscar.toLowerCase()}%`;
    params.push(like, like);
  }
  sql += ' ORDER BY p.fecha_creacion DESC';

  const productos = db.prepare(sql).all(...params);
  res.json(productos);
});

// GET /api/productos/mios  (productos del negocio autenticado)
router.get('/mios', requireAuth, requireNegocio, (req, res) => {
  const negocio = db.prepare('SELECT id FROM negocios WHERE usuario_id = ?').get(req.usuario.id);
  if (!negocio) return res.json([]);

  const productos = db
    .prepare(
      `SELECT p.id, p.nombre, p.descripcion, p.precio, p.icono, c.slug AS categoria, c.nombre AS categoria_nombre
       FROM productos p JOIN categorias c ON c.id = p.categoria_id
       WHERE p.negocio_id = ? ORDER BY p.fecha_creacion DESC`
    )
    .all(negocio.id);
  res.json(productos);
});

// POST /api/productos  (requiere sesión de tipo 'negocio')
router.post('/', requireAuth, requireNegocio, (req, res) => {
  const { nombre, descripcion, precio, icono, categoria_slug } = req.body;

  if (!nombre || precio === undefined || !categoria_slug) {
    return res.status(400).json({ error: 'Nombre, precio y categoría son obligatorios.' });
  }
  if (Number(precio) < 0) {
    return res.status(400).json({ error: 'El precio no puede ser negativo.' });
  }

  const categoria = db.prepare('SELECT id FROM categorias WHERE slug = ?').get(categoria_slug);
  if (!categoria) {
    return res.status(400).json({ error: 'Categoría no válida.' });
  }

  let negocio = db.prepare('SELECT id FROM negocios WHERE usuario_id = ?').get(req.usuario.id);
  if (!negocio) {
    const info = db
      .prepare('INSERT INTO negocios (usuario_id, nombre, sector, direccion) VALUES (?, ?, ?, ?)')
      .run(req.usuario.id, req.usuario.nombre, '', '');
    negocio = { id: info.lastInsertRowid };
  }

  const info = db
    .prepare(
      'INSERT INTO productos (negocio_id, categoria_id, nombre, descripcion, precio, icono) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(negocio.id, categoria.id, nombre, descripcion || '', precio, icono || '🛍️');

  res.status(201).json({ id: info.lastInsertRowid, mensaje: 'Producto publicado correctamente.' });
});

// DELETE /api/productos/:id  (solo el negocio dueño del producto)
router.delete('/:id', requireAuth, requireNegocio, (req, res) => {
  const negocio = db.prepare('SELECT id FROM negocios WHERE usuario_id = ?').get(req.usuario.id);
  if (!negocio) return res.status(404).json({ error: 'No tienes un negocio asociado.' });

  const producto = db.prepare('SELECT id FROM productos WHERE id = ? AND negocio_id = ?').get(req.params.id, negocio.id);
  if (!producto) return res.status(404).json({ error: 'Producto no encontrado o no te pertenece.' });

  db.prepare('DELETE FROM productos WHERE id = ?').run(producto.id);
  res.json({ mensaje: 'Producto eliminado.' });
});

module.exports = router;
