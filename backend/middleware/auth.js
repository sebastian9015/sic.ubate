// Middleware que valida el token JWT enviado en el header Authorization: Bearer <token>
const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'No se envió un token de autenticación.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, correo, tipo, nombre }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

// Middleware opcional: solo deja pasar a usuarios tipo 'negocio'
function requireNegocio(req, res, next) {
  if (req.usuario?.tipo !== 'negocio') {
    return res.status(403).json({ error: 'Solo cuentas de tipo negocio pueden realizar esta acción.' });
  }
  next();
}

// Middleware opcional: solo deja pasar a usuarios tipo 'admin'
function requireAdmin(req, res, next) {
  if (req.usuario?.tipo !== 'admin') {
    return res.status(403).json({ error: 'Esta acción requiere una cuenta de administrador.' });
  }
  next();
}

module.exports = { requireAuth, requireNegocio, requireAdmin };
