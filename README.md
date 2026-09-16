# Sistema de Información Comercial para Ubaté (SIC-Ubaté)

Catálogo comercial digital de Ubaté con carrito de compra, publicación de productos por
parte de los negocios y panel de administración, programa de Ingeniería de Sistemas y Computación


Autor: jhon sebastian barreto moyano

## Estructura del repositorio

```
sic-ubate/
├── backend/
│   ├── db/
│   │   ├── schema.sql       Esquema de la base de datos
│   │   ├── connection.js    Conexión y carga automática del esquema
│   │   └── seed.js          24 negocios de ejemplo con dirección, WhatsApp y productos
│   ├── middleware/
│   │   └── auth.js          Verificación de sesión (JWT) y de rol (negocio / admin)
│   ├── routes/
│   │   ├── auth.js          Registro e inicio de sesión
│   │   ├── productos.js     Catálogo: listar, publicar, mis productos, eliminar
│   │   ├── categorias.js    Listado público de categorías
│   │   ├── negocios.js      Listado público de negocios (dirección, contacto)
│   │   ├── pedidos.js       Carrito de compra: confirmar pedido e historial
│   │   └── admin.js         Panel de administración (negocios, categorías, usuarios)
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── css/styles.css       Jerarquía visual, micro-interacciones, efectos de botones
│   └── js/
│       ├── icons.js         Íconos SVG reales (sustituyen los emojis)
│       └── app.js           Lógica de la aplicación (JavaScript plano, sin frameworks)
└── README.md
```

## Cómo ejecutarlo

Requisitos: [Node.js](https://nodejs.org) 18 o superior.

```bash
cd backend
npm install
cp .env.example .env
npm run seed        # crea la base de datos y carga los datos de ejemplo
npm start            # http://localhost:3000
```

## Cuentas de prueba (creadas por el seed)

| Rol               | Correo                  | Contraseña      |
|-------------------|--------------------------|-----------------|
| Administrador     | admin@sicubate.co        | admin1234       |
| Cliente           | demo@sicubate.co         | demo1234        |
| Negocio (x24)     | negocio1@sicubate.co ... negocio24@sicubate.co | negocio1234 |

## Qué incluye esta versión

- **Carrito de compra real**: se agrega desde cada tarjeta de producto, se ajustan
  cantidades en un panel lateral, y al confirmar el pedido el backend recalcula los
  precios desde la base de datos (nunca confía en lo que envía el navegador).
- **Contacto directo por WhatsApp**: cada negocio tiene un número de contacto; tanto en
  cada producto como en la confirmación del pedido hay un botón que abre WhatsApp con un
  mensaje pre-escrito, para coordinar la entrega o recogida.
- **Publicar productos**: cualquier cuenta tipo "negocio" puede publicar y eliminar sus
  propios productos desde el catálogo (`Mi negocio` en el menú).
- **Panel de administración**: cuentas tipo "admin" pueden ver y eliminar negocios, y
  crear/eliminar categorías (`Admin` en el menú).
- **24 negocios de ejemplo** con dirección real dentro de Ubaté y número de contacto,
  repartidos en 4 categorías (incluida la nueva categoría **Comida Rápida**), con
  precios ajustados a valores de mercado actuales.
- **Íconos ilustrados reales** en lugar de emojis: cada producto usa un pictograma SVG
  vectorial, coloreado según su categoría, lo que además mejora la jerarquía visual del
  catálogo (se lee de un vistazo qué tipo de negocio es cada tarjeta).
- **Micro-interacciones y efectos**: tarjetas que se elevan al pasar el mouse, botones
  con efecto de presión y confirmación visual al agregar al carrito, notificaciones tipo
  "toast", contador del carrito animado, y pantallas de carga tipo "skeleton" mientras se
  consulta el catálogo.

## Endpoints de la API

| Método | Ruta                        | Descripción                                   | Requiere sesión     |
|--------|------------------------------|------------------------------------------------|:---:|
| GET    | `/api/salud`                | Verifica que el servidor esté activo            | No |
| GET    | `/api/categorias`           | Lista las categorías disponibles                | No |
| GET    | `/api/negocios`             | Lista los negocios con dirección y contacto      | No |
| GET    | `/api/productos`            | Lista productos (`?categoria=` y `?buscar=`)     | No |
| GET    | `/api/productos/mios`       | Productos del negocio autenticado                | Sí (negocio) |
| POST   | `/api/productos`            | Publica un producto nuevo                        | Sí (negocio) |
| DELETE | `/api/productos/:id`        | Elimina un producto propio                       | Sí (negocio) |
| POST   | `/api/pedidos`               | Confirma el carrito y crea un pedido             | Sí |
| GET    | `/api/pedidos`               | Historial de pedidos propio                      | Sí |
| POST   | `/api/auth/registro`        | Crea una cuenta nueva                            | No |
| POST   | `/api/auth/login`           | Inicia sesión y devuelve un token JWT             | No |
| GET    | `/api/admin/negocios`       | Lista todos los negocios (con dueño)              | Sí (admin) |
| PUT    | `/api/admin/negocios/:id`   | Edita un negocio                                 | Sí (admin) |
| DELETE | `/api/admin/negocios/:id`   | Elimina un negocio y sus productos                | Sí (admin) |
| POST   | `/api/admin/categorias`     | Crea una categoría                                | Sí (admin) |
| DELETE | `/api/admin/categorias/:id` | Elimina una categoría (si no tiene productos)     | Sí (admin) |
| GET    | `/api/admin/usuarios`       | Lista todos los usuarios registrados              | Sí (admin) |

## Recomendación: migrar de SQLite a PostgreSQL

SQLite es la elección correcta para esta etapa del proyecto: no requiere instalar ni
administrar un servidor de base de datos aparte, el archivo `.db` se puede versionar y
compartir fácilmente, y el rendimiento es más que suficiente para un catálogo de este
tamaño con un solo servidor backend.

La razón para migrar a **PostgreSQL** aparecería únicamente si el proyecto pasa a
producción real con **más de un servidor backend corriendo a la vez** (por ejemplo, para
soportar más tráfico con balanceo de carga): SQLite guarda todo en un solo archivo local,
por lo que dos servidores no pueden escribir en él de forma segura y simultánea.
PostgreSQL sí está diseñado para eso, porque corre como un servicio de base de datos
independiente al que varios servidores backend se conectan por red.

Si en el futuro se necesita ese escalamiento, los pasos generales serían:

1. Levantar una instancia de PostgreSQL (local, en un VPS, o un servicio administrado
   como Render, Railway o Supabase).
2. Cambiar la librería `better-sqlite3` por `pg` en `backend/package.json`.
3. Adaptar `backend/db/connection.js` para conectarse por URL de conexión (`DATABASE_URL`)
   en vez de abrir un archivo local.
4. Revisar `backend/db/schema.sql`: la sintaxis es casi idéntica, pero hay pequeñas
   diferencias (por ejemplo, `AUTOINCREMENT` se llama `SERIAL` en PostgreSQL).
5. El resto del código (rutas, lógica de negocio) no necesita cambios, porque las
   consultas SQL usadas en este proyecto son estándar.

Por ahora, para la sustentación académica y para desplegar un link de demostración (por
ejemplo en Render), SQLite es suficiente y más simple de mantener.

## Notas para la sustentación

- Las contraseñas se cifran con `bcryptjs` antes de guardarse; nunca se almacenan en
  texto plano.
- Las sesiones se manejan con JWT, guardado en `localStorage` del navegador y enviado en
  el header `Authorization: Bearer <token>`.
- El carrito de compra también vive en `localStorage` mientras el cliente navega, y solo
  se envía al servidor (creando un pedido real) al confirmar la compra.
- Los íconos de producto (`js/icons.js`) son vectores SVG dibujados a mano para este
  proyecto — no dependen de ninguna librería externa ni de conexión a internet, por lo
  que se ven igual en cualquier computador o celular.
