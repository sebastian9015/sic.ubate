// Rutas de pedidos: confirmar el carrito de compra y consultar el historial propio.
const express = require('express');
const db = require('../db/connection');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// POST /api/pedidos  { items: [{ producto_id, cantidad }, ...] }
// El precio SIEMPRE se recalcula desde la base de datos (nunca se confía en el precio del navegador).
router.post('/', requireAuth, (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'El carrito está vacío.' });
  }

  const buscarProducto = db.prepare(
    `SELECT p.id, p.nombre, p.precio, p.negocio_id, n.nombre AS negocio, n.sector, n.direccion, n.telefono
     FROM productos p JOIN negocios n ON n.id = p.negocio_id
     WHERE p.id = ?`
  );

  const detalles = [];
  let total = 0;

  for (const item of items) {
    const producto = buscarProducto.get(item.producto_id);
    if (!producto) {
      return res.status(400).json({ error: `El producto con id ${item.producto_id} ya no existe.` });
    }
    const cantidad = Math.max(1, parseInt(item.cantidad, 10) || 1);
    total += producto.precio * cantidad;
    detalles.push({ ...producto, cantidad });
  }

  const insertarPedido = db.prepare('INSERT INTO pedidos (usuario_id, total, estado) VALUES (?, ?, ?)');
  const insertarItem = db.prepare(
    `INSERT INTO pedido_items (pedido_id, producto_id, negocio_id, nombre_producto, precio_unitario, cantidad)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const transaccion = db.transaction(() => {
    const info = insertarPedido.run(req.usuario.id, total, 'confirmado');
    const pedidoId = info.lastInsertRowid;
    detalles.forEach(d => {
      insertarItem.run(pedidoId, d.id, d.negocio_id, d.nombre, d.precio, d.cantidad);
    });
    return pedidoId;
  });

  const pedidoId = transaccion();

  // Direcciones de recogida agrupadas por negocio, para mostrar en la confirmación
  const puntosRecogida = [...new Map(detalles.map(d => [d.negocio_id, {
    negocio: d.negocio, sector: d.sector, direccion: d.direccion, telefono: d.telefono
  }])).values()];

  res.status(201).json({
    id: pedidoId,
    total,
    estado: 'confirmado',
    puntos_recogida: puntosRecogida,
    mensaje: 'Pedido confirmado correctamente.'
  });
});

// GET /api/pedidos  -> historial de pedidos del usuario autenticado
router.get('/', requireAuth, (req, res) => {
  const pedidos = db
    .prepare('SELECT id, total, estado, fecha_creacion FROM pedidos WHERE usuario_id = ? ORDER BY fecha_creacion DESC')
    .all(req.usuario.id);

  const items = db.prepare('SELECT * FROM pedido_items WHERE pedido_id = ?');
  const conItems = pedidos.map(p => ({ ...p, items: items.all(p.id) }));

  res.json(conItems);
});

module.exports = router;
