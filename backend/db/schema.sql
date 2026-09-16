-- Esquema de base de datos del Sistema de Información Comercial para Ubaté (SIC-Ubaté)
-- Motor: SQLite

PRAGMA foreign_keys = ON;

-- Usuarios de la plataforma (clientes, dueños de negocio y administradores)
CREATE TABLE IF NOT EXISTS usuarios (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre          TEXT NOT NULL,
  correo          TEXT NOT NULL UNIQUE,
  contrasena_hash TEXT NOT NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('cliente', 'negocio', 'admin')) DEFAULT 'cliente',
  fecha_registro  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Categorías de productos (lácteo, artesanal, gastronómico, etc.)
CREATE TABLE IF NOT EXISTS categorias (
  id     INTEGER PRIMARY KEY AUTOINCREMENT,
  slug   TEXT NOT NULL UNIQUE,     -- ej. 'lacteo'
  nombre TEXT NOT NULL,            -- ej. 'Lácteo'
  icono  TEXT DEFAULT '🏷️'
);

-- Negocios registrados en el catálogo, cada uno ligado a un usuario tipo 'negocio'
CREATE TABLE IF NOT EXISTS negocios (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre          TEXT NOT NULL,
  sector          TEXT,             -- ubicación dentro de Ubaté, ej. 'Plaza de Mercado'
  direccion       TEXT,             -- dirección física del establecimiento
  telefono        TEXT,
  descripcion     TEXT,
  fecha_creacion  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Productos publicados por cada negocio
CREATE TABLE IF NOT EXISTS productos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  negocio_id      INTEGER NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
  categoria_id    INTEGER NOT NULL REFERENCES categorias(id),
  nombre          TEXT NOT NULL,
  descripcion     TEXT,
  precio          REAL NOT NULL CHECK (precio >= 0),
  icono           TEXT DEFAULT '🛍️',
  fecha_creacion  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Pedidos realizados por los clientes (carrito de compra confirmado)
CREATE TABLE IF NOT EXISTS pedidos (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id      INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  total           REAL NOT NULL DEFAULT 0,
  estado          TEXT NOT NULL CHECK (estado IN ('pendiente','confirmado','entregado','cancelado')) DEFAULT 'pendiente',
  fecha_creacion  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Ítems de cada pedido (relación producto-cantidad-precio al momento de la compra)
CREATE TABLE IF NOT EXISTS pedido_items (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id       INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id     INTEGER NOT NULL REFERENCES productos(id),
  negocio_id      INTEGER NOT NULL REFERENCES negocios(id),
  nombre_producto TEXT NOT NULL,     -- copia del nombre al momento de comprar
  precio_unitario REAL NOT NULL,     -- copia del precio al momento de comprar
  cantidad        INTEGER NOT NULL CHECK (cantidad > 0)
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_negocio ON productos(negocio_id);
CREATE INDEX IF NOT EXISTS idx_negocios_usuario ON negocios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedido_items_pedido ON pedido_items(pedido_id);
