// Rutas de autenticación: registro e inicio de sesión.
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/connection');

const router = express.Router();

function firmarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo, tipo: usuario.tipo },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/registro
router.post('/registro', (req, res) => {
  const { nombre, correo, contrasena, tipo } = req.body;

  if (!nombre || !correo || !contrasena) {
    return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios.' });
  }
  if (contrasena.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }
  const tipoFinal = tipo === 'negocio' ? 'negocio' : 'cliente';

  const existente = db.prepare('SELECT id FROM usuarios WHERE correo = ?').get(correo);
  if (existente) {
    return res.status(409).json({ error: 'Ya existe una cuenta registrada con ese correo.' });
  }

  const hash = bcrypt.hashSync(contrasena, 10);
  const info = db
    .prepare('INSERT INTO usuarios (nombre, correo, contrasena_hash, tipo) VALUES (?, ?, ?, ?)')
    .run(nombre, correo, hash, tipoFinal);

  const usuario = { id: info.lastInsertRowid, nombre, correo, tipo: tipoFinal };
  const token = firmarToken(usuario);

  res.status(201).json({ usuario, token });
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { correo, contrasena } = req.body;

  if (!correo || !contrasena) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
  }

  const fila = db.prepare('SELECT * FROM usuarios WHERE correo = ?').get(correo);
  if (!fila || !bcrypt.compareSync(contrasena, fila.contrasena_hash)) {
    return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
  }

  const usuario = { id: fila.id, nombre: fila.nombre, correo: fila.correo, tipo: fila.tipo };
  const token = firmarToken(usuario);

  res.json({ usuario, token });
});

module.exports = router;
