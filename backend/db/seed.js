// Script de datos iniciales (seed): categorías, cuenta admin, negocios con dirección/WhatsApp y sus productos.
// Ejecutar con: npm run seed
const bcrypt = require('bcryptjs');
const db = require('./connection');

// ---------- Categorías ----------
const categorias = [
  { slug: 'lacteo', nombre: 'Lácteo', icono: '🥛' },
  { slug: 'artesanal', nombre: 'Artesanal', icono: '🧵' },
  { slug: 'gastronomico', nombre: 'Gastronómico', icono: '🍲' },
  { slug: 'comida_rapida', nombre: 'Comida Rápida', icono: '🍔' },
];
const insertCategoria = db.prepare('INSERT OR IGNORE INTO categorias (slug, nombre, icono) VALUES (?, ?, ?)');
categorias.forEach(c => insertCategoria.run(c.slug, c.nombre, c.icono));
const catId = (slug) => db.prepare('SELECT id FROM categorias WHERE slug = ?').get(slug).id;

// ---------- Usuarios base ----------
function asegurarUsuario(nombre, correo, contrasena, tipo) {
  let usuario = db.prepare('SELECT id FROM usuarios WHERE correo = ?').get(correo);
  if (!usuario) {
    const hash = bcrypt.hashSync(contrasena, 10);
    const info = db
      .prepare('INSERT INTO usuarios (nombre, correo, contrasena_hash, tipo) VALUES (?, ?, ?, ?)')
      .run(nombre, correo, hash, tipo);
    usuario = { id: info.lastInsertRowid };
  }
  return usuario.id;
}

asegurarUsuario('Administrador SIC-Ubaté', 'admin@sicubate.co', 'admin1234', 'admin');
asegurarUsuario('Cliente Demo', 'demo@sicubate.co', 'demo1234', 'cliente');

// ---------- Negocios de ejemplo (dirección + WhatsApp para contacto directo) ----------
// El campo "icono" es una CLAVE (no un emoji) que el frontend traduce a un ícono ilustrado real.
// El campo "telefono" va en formato +57XXXXXXXXXX para poder generar enlaces de WhatsApp (wa.me).
const negociosDemo = [
  // ---- Lácteo ----
  { nombre: 'Lácteos La Vaca', sector: 'Sector La Vaca', direccion: 'Vía La Vaca, km 2, Ubaté', telefono: '+573105550101', cat: 'lacteo',
    productos: [
      { nombre: 'Queso campesino 500g', precio: 13000, icono: 'queso' },
      { nombre: 'Cuajada fresca 1L', precio: 8500, icono: 'cuajada' },
    ]},
  { nombre: 'Derivados Ubaté', sector: 'Plaza de Mercado', direccion: 'Plaza de Mercado, local 12, Ubaté', telefono: '+573105550102', cat: 'lacteo',
    productos: [
      { nombre: 'Cuajada fresca', precio: 8000, icono: 'cuajada' },
      { nombre: 'Arequipe artesanal 250g', precio: 9500, icono: 'arequipe' },
    ]},
  { nombre: 'Lácteos San José', sector: 'Carrera 7', direccion: 'Cra. 7 # 5-21, Ubaté', telefono: '+573105550103', cat: 'lacteo',
    productos: [
      { nombre: 'Yogur artesanal 1L', precio: 10500, icono: 'yogur' },
      { nombre: 'Kumis natural 1L', precio: 8000, icono: 'kumis' },
    ]},
  { nombre: 'Quesos La Sabana', sector: 'Calle 8', direccion: 'Cl. 8 # 9-14, Ubaté', telefono: '+573105550104', cat: 'lacteo',
    productos: [
      { nombre: 'Queso doble crema 500g', precio: 15500, icono: 'queso' },
    ]},
  { nombre: 'Lácteos El Establo', sector: 'Vereda Centro', direccion: 'Vereda Centro, finca El Establo, Ubaté', telefono: '+573105550105', cat: 'lacteo',
    productos: [
      { nombre: 'Leche fresca 1L', precio: 3800, icono: 'leche' },
      { nombre: 'Mantequilla criolla 250g', precio: 10200, icono: 'mantequilla' },
    ]},
  { nombre: 'Productos Lácteos del Valle', sector: 'Sector La Ramada', direccion: 'Vía La Ramada, bodega 3, Ubaté', telefono: '+573105550106', cat: 'lacteo',
    productos: [
      { nombre: 'Queso campesino 1kg', precio: 24000, icono: 'queso' },
    ]},

  // ---- Artesanal ----
  { nombre: 'Tejidos La Legua', sector: 'La Legua', direccion: 'Vereda La Legua, casa 4, Ubaté', telefono: '+573115550201', cat: 'artesanal',
    productos: [
      { nombre: 'Ruana de lana', precio: 130000, icono: 'ruana' },
      { nombre: 'Bufanda tejida', precio: 42000, icono: 'bufanda' },
    ]},
  { nombre: 'Artesanías Cundinamarca', sector: 'Calle 6', direccion: 'Cl. 6 # 7-10, Ubaté', telefono: '+573115550202', cat: 'artesanal',
    productos: [
      { nombre: 'Canasto en fique', precio: 28000, icono: 'canasto' },
      { nombre: 'Individual tejido a mano', precio: 15000, icono: 'individual' },
    ]},
  { nombre: 'Sombreros Ubaté', sector: 'Carrera 4', direccion: 'Cra. 4 # 3-45, Ubaté', telefono: '+573115550203', cat: 'artesanal',
    productos: [
      { nombre: 'Sombrero de fieltro', precio: 58000, icono: 'sombrero' },
    ]},
  { nombre: 'Talabartería El Estribo', sector: 'Calle 10', direccion: 'Cl. 10 # 6-33, Ubaté', telefono: '+573115550204', cat: 'artesanal',
    productos: [
      { nombre: 'Cinturón de cuero repujado', precio: 55000, icono: 'cinturon' },
      { nombre: 'Alforja pequeña', precio: 78000, icono: 'alforja' },
    ]},
  { nombre: 'Cerámicas de la Sabana', sector: 'Vereda Volcán', direccion: 'Vereda El Volcán, taller 2, Ubaté', telefono: '+573115550205', cat: 'artesanal',
    productos: [
      { nombre: 'Jarra de barro pintada a mano', precio: 34000, icono: 'jarra' },
    ]},
  { nombre: 'Fique y Lana Ubaté', sector: 'Carrera 9', direccion: 'Cra. 9 # 4-18, Ubaté', telefono: '+573115550206', cat: 'artesanal',
    productos: [
      { nombre: 'Mochila en fique', precio: 46000, icono: 'mochila' },
    ]},
  { nombre: 'Madera y Arte Ubaté', sector: 'Calle 5', direccion: 'Cl. 5 # 8-02, Ubaté', telefono: '+573115550207', cat: 'artesanal',
    productos: [
      { nombre: 'Tabla de picar en madera nativa', precio: 32000, icono: 'madera' },
    ]},

  // ---- Gastronómico ----
  { nombre: 'Comidas Doña Rosa', sector: 'Plaza de Mercado', direccion: 'Plaza de Mercado, puesto 7, Ubaté', telefono: '+573125550301', cat: 'gastronomico',
    productos: [
      { nombre: 'Tamal ubatense', precio: 9500, icono: 'tamal' },
      { nombre: 'Envuelto de mazorca x4', precio: 6500, icono: 'envuelto' },
    ]},
  { nombre: 'Panadería El Trigal', sector: 'Calle del Comercio', direccion: 'Cl. del Comercio # 6-19, Ubaté', telefono: '+573125550302', cat: 'gastronomico',
    productos: [
      { nombre: 'Almojábanas x6', precio: 8000, icono: 'almojabana' },
      { nombre: 'Pan de yuca x8', precio: 9000, icono: 'pan' },
    ]},
  { nombre: 'Dulces de la Sabana', sector: 'Carrera 7', direccion: 'Cra. 7 # 4-50, Ubaté', telefono: '+573125550303', cat: 'gastronomico',
    productos: [
      { nombre: 'Chocolate santafereño', precio: 7500, icono: 'chocolate' },
      { nombre: 'Bocadillo de guayaba x10', precio: 8500, icono: 'bocadillo' },
    ]},
  { nombre: 'Asadero El Fogón Ubatense', sector: 'Salida a Chiquinquirá', direccion: 'Vía a Chiquinquirá km 1, Ubaté', telefono: '+573125550305', cat: 'gastronomico',
    productos: [
      { nombre: 'Media libra de chicharrón', precio: 16000, icono: 'chicharron' },
      { nombre: 'Papa criolla x libra', precio: 5500, icono: 'papa' },
    ]},
  { nombre: 'Postres Doña Inés', sector: 'Calle 9', direccion: 'Cl. 9 # 7-28, Ubaté', telefono: '+573125550306', cat: 'gastronomico',
    productos: [
      { nombre: 'Torta de natas porción', precio: 7000, icono: 'torta' },
    ]},
  { nombre: 'Trapiche La Colonia', sector: 'Vereda Tíquiza', direccion: 'Vereda Tíquiza, trapiche La Colonia, Ubaté', telefono: '+573125550307', cat: 'gastronomico',
    productos: [
      { nombre: 'Panela redonda x2', precio: 5000, icono: 'panela' },
      { nombre: 'Miel de caña 500ml', precio: 12000, icono: 'miel' },
    ]},

  // ---- Comida rápida ----
  { nombre: 'Hamburguesas El Gordo', sector: 'Parque Principal', direccion: 'Cra. 6 # 5-08, frente al parque, Ubaté', telefono: '+573135550401', cat: 'comida_rapida',
    productos: [
      { nombre: 'Hamburguesa clásica con papas', precio: 15000, icono: 'hamburguesa' },
      { nombre: 'Hamburguesa doble carne', precio: 21000, icono: 'hamburguesa' },
    ]},
  { nombre: 'Perros Calientes La 8', sector: 'Calle 8', direccion: 'Cl. 8 # 6-40, Ubaté', telefono: '+573135550402', cat: 'comida_rapida',
    productos: [
      { nombre: 'Perro caliente especial', precio: 10000, icono: 'perro-caliente' },
      { nombre: 'Salchipapa personal', precio: 12500, icono: 'salchipapa' },
    ]},
  { nombre: 'Pizzería Ubaté Express', sector: 'Carrera 8', direccion: 'Cra. 8 # 4-22, Ubaté', telefono: '+573135550403', cat: 'comida_rapida',
    productos: [
      { nombre: 'Pizza personal mixta', precio: 18000, icono: 'pizza' },
      { nombre: 'Pizza familiar 8 porciones', precio: 42000, icono: 'pizza' },
    ]},
  { nombre: 'Pollo Broaster Ubaté', sector: 'Salida a Chiquinquirá', direccion: 'Vía a Chiquinquirá # 2-15, Ubaté', telefono: '+573135550404', cat: 'comida_rapida',
    productos: [
      { nombre: '1/4 de pollo broaster con papas', precio: 17000, icono: 'pollo' },
      { nombre: 'Combo 2 personas', precio: 34000, icono: 'pollo' },
    ]},
  { nombre: 'Jugos y Arepas Doña Nelly', sector: 'Plaza de Mercado', direccion: 'Plaza de Mercado, puesto 15, Ubaté', telefono: '+573135550405', cat: 'comida_rapida',
    productos: [
      { nombre: 'Arepa con queso', precio: 5000, icono: 'arepa' },
      { nombre: 'Jugo natural en agua 500ml', precio: 5500, icono: 'jugo' },
    ]},
];

const insertarNegocio = db.prepare(
  'INSERT INTO negocios (usuario_id, nombre, sector, direccion, telefono, descripcion) VALUES (?, ?, ?, ?, ?, ?)'
);
const buscarNegocioPorNombre = db.prepare('SELECT id FROM negocios WHERE nombre = ?');
const existeProducto = db.prepare('SELECT id FROM productos WHERE negocio_id = ? AND nombre = ?');
const insertarProducto = db.prepare(
  'INSERT INTO productos (negocio_id, categoria_id, nombre, descripcion, precio, icono) VALUES (?, ?, ?, ?, ?, ?)'
);

let contadorProductos = 0;
negociosDemo.forEach((n, i) => {
  const correo = `negocio${i + 1}@sicubate.co`;
  const usuarioId = asegurarUsuario(n.nombre, correo, 'negocio1234', 'negocio');

  let negocio = buscarNegocioPorNombre.get(n.nombre);
  let negocioId;
  if (!negocio) {
    const info = insertarNegocio.run(usuarioId, n.nombre, n.sector, n.direccion, n.telefono, '');
    negocioId = info.lastInsertRowid;
  } else {
    negocioId = negocio.id;
    // Aseguramos que dirección/teléfono queden actualizados aunque el negocio ya existiera
    db.prepare('UPDATE negocios SET direccion = ?, telefono = ? WHERE id = ?').run(n.direccion, n.telefono, negocioId);
  }

  n.productos.forEach(p => {
    const existente = existeProducto.get(negocioId, p.nombre);
    if (!existente) {
      insertarProducto.run(negocioId, catId(n.cat), p.nombre, '', p.precio, p.icono);
      contadorProductos++;
    } else {
      // Actualiza precio/ícono si el producto ya existía de una corrida anterior del seed
      db.prepare('UPDATE productos SET precio = ?, icono = ? WHERE id = ?').run(p.precio, p.icono, existente.id);
    }
  });
});

console.log(`Datos de ejemplo listos: ${negociosDemo.length} negocios, ${contadorProductos} productos nuevos.`);
console.log('Cuenta admin       -> correo: admin@sicubate.co · contraseña: admin1234');
console.log('Cliente demo       -> correo: demo@sicubate.co · contraseña: demo1234');
console.log('Cuentas de negocio -> correo: negocio1@sicubate.co ... negocio25@sicubate.co · contraseña: negocio1234');
