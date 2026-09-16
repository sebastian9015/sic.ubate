/* ============================================================
   SIC-Ubaté — script principal (JavaScript básico, sin frameworks)
   Maneja: catálogo, carrito, sesión, publicación de productos y
   panel de administración, todo contra la API real del backend.
   ============================================================ */

// Si el HTML se sirve desde el propio backend Express (npm start) esto
// queda vacío y usa rutas relativas. Si lo abres suelto, pon aquí la URL
// de tu backend, ej. 'http://localhost:3000'.
const API_BASE = '';

/* ---------------- Utilidades ---------------- */
function formatoPrecio(valor){
  return new Intl.NumberFormat('es-CO', {style:'currency', currency:'COP', maximumFractionDigits:0}).format(valor);
}
function soloDigitos(str){ return (str || '').replace(/[^\d]/g, ''); }
function enlaceWhatsapp(telefono, mensaje){
  return `https://wa.me/${soloDigitos(telefono)}?text=${encodeURIComponent(mensaje)}`;
}
function el(html){
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

function toast(mensaje, tipo){
  const cont = document.getElementById('toastContainer');
  const t = el(`<div class="toast ${tipo || ''}">${mensaje}</div>`);
  cont.appendChild(t);
  requestAnimationFrame(()=> t.classList.add('show'));
  setTimeout(()=>{
    t.classList.remove('show');
    setTimeout(()=> t.remove(), 250);
  }, 2600);
}

/* ---------------- Sesión ---------------- */
function getSesion(){
  const token = localStorage.getItem('sicubate_token');
  const usuarioRaw = localStorage.getItem('sicubate_usuario');
  if(!token || !usuarioRaw) return null;
  try { return { token, usuario: JSON.parse(usuarioRaw) }; } catch(e){ return null; }
}
function guardarSesion(usuario, token){
  localStorage.setItem('sicubate_token', token);
  localStorage.setItem('sicubate_usuario', JSON.stringify(usuario));
}
function cerrarSesion(){
  localStorage.removeItem('sicubate_token');
  localStorage.removeItem('sicubate_usuario');
}
async function apiFetch(path, opciones){
  const sesion = getSesion();
  const headers = Object.assign({'Content-Type':'application/json'}, (opciones && opciones.headers) || {});
  if(sesion) headers['Authorization'] = `Bearer ${sesion.token}`;
  const resp = await fetch(`${API_BASE}${path}`, Object.assign({}, opciones, {headers}));
  const data = await resp.json().catch(()=>({}));
  if(!resp.ok) throw new Error(data.error || 'Ocurrió un error al conectar con el servidor.');
  return data;
}

/* ---------------- Estado del catálogo ---------------- */
let categoriasCache = [];
let activeCat = 'todos';
let query = '';
let debounceTimer = null;

/* ---------------- Estado del carrito ---------------- */
let carrito = [];
try { carrito = JSON.parse(localStorage.getItem('sicubate_carrito') || '[]'); } catch(e){ carrito = []; }

function guardarCarrito(){
  localStorage.setItem('sicubate_carrito', JSON.stringify(carrito));
  actualizarBadgeCarrito();
}
function actualizarBadgeCarrito(pulse){
  const total = carrito.reduce((s, i) => s + i.cantidad, 0);
  const badge = document.getElementById('cartBadge');
  badge.textContent = total;
  badge.classList.toggle('show', total > 0);
  if(pulse && total > 0){
    badge.classList.remove('pulse');
    void badge.offsetWidth; // reinicia la animación
    badge.classList.add('pulse');
  }
}
function agregarAlCarrito(producto, botonEl){
  const existente = carrito.find(i => i.producto_id === producto.id);
  if(existente){
    existente.cantidad += 1;
  } else {
    carrito.push({
      producto_id: producto.id, nombre: producto.nombre, precio: producto.precio,
      icono: producto.icono, categoria: producto.categoria, negocio: producto.negocio,
      sector: producto.sector, direccion: producto.direccion, telefono: producto.telefono,
      cantidad: 1
    });
  }
  guardarCarrito(true);
  toast(`${producto.nombre} se agregó al carrito`, 'success');
  if(botonEl){
    botonEl.classList.add('added');
    const original = botonEl.dataset.label;
    botonEl.querySelector('.btn-label').textContent = 'Agregado ✓';
    setTimeout(()=>{
      botonEl.classList.remove('added');
      botonEl.querySelector('.btn-label').textContent = original;
    }, 900);
  }
}
function cambiarCantidad(productoId, delta){
  const item = carrito.find(i => i.producto_id === productoId);
  if(!item) return;
  item.cantidad += delta;
  if(item.cantidad <= 0){
    carrito = carrito.filter(i => i.producto_id !== productoId);
  }
  guardarCarrito();
  renderCarrito();
}
function quitarDelCarrito(productoId){
  carrito = carrito.filter(i => i.producto_id !== productoId);
  guardarCarrito();
  renderCarrito();
}

function renderCarrito(){
  const cont = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  if(carrito.length === 0){
    cont.innerHTML = `<div class="cart-empty">Tu carrito está vacío.<br>Explora el catálogo y agrega productos.</div>`;
    footer.style.display = 'none';
    return;
  }
  footer.style.display = 'block';
  cont.innerHTML = carrito.map(item => `
    <div class="cart-item">
      ${iconoSVG(item.icono, item.categoria)}
      <div class="cart-item-info">
        <h4>${item.nombre}</h4>
        <p class="biz">${item.negocio}</p>
        <div class="qty-stepper">
          <button data-qty-minus="${item.producto_id}" aria-label="Restar">−</button>
          <span>${item.cantidad}</span>
          <button data-qty-plus="${item.producto_id}" aria-label="Sumar">+</button>
        </div>
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
        <span class="cart-item-price">${formatoPrecio(item.precio * item.cantidad)}</span>
        <button class="cart-item-remove" data-remove="${item.producto_id}" aria-label="Quitar">🗑</button>
      </div>
    </div>
  `).join('');

  const total = carrito.reduce((s,i)=> s + i.precio * i.cantidad, 0);
  document.getElementById('cartTotal').textContent = formatoPrecio(total);
}

function abrirCarrito(){
  renderCarrito();
  document.getElementById('cartOverlay').classList.add('open');
}
function cerrarCarrito(){
  document.getElementById('cartOverlay').classList.remove('open');
}

async function confirmarPedido(){
  if(carrito.length === 0) return;
  const sesion = getSesion();
  if(!sesion){
    toast('Inicia sesión para confirmar tu pedido', 'error');
    cerrarCarrito();
    openModal('login');
    return;
  }
  const boton = document.getElementById('btnCheckout');
  boton.disabled = true;
  boton.textContent = 'Procesando...';
  try {
    const items = carrito.map(i => ({producto_id: i.producto_id, cantidad: i.cantidad}));
    const data = await apiFetch('/api/pedidos', {method:'POST', body: JSON.stringify({items})});
    carrito = [];
    guardarCarrito();
    cerrarCarrito();
    mostrarConfirmacionPedido(data);
  } catch(err){
    toast(err.message, 'error');
  } finally {
    boton.disabled = false;
    boton.textContent = 'Confirmar pedido';
  }
}

function mostrarConfirmacionPedido(data){
  const cont = document.getElementById('orderConfirmBody');
  const puntos = (data.puntos_recogida || []).map(p => `
    <div class="pickup-point">
      <strong>${p.negocio}</strong>
      ${p.direccion || p.sector || ''}<br>
      ${p.telefono ? `<a href="${enlaceWhatsapp(p.telefono, `Hola, acabo de confirmar el pedido #${data.id} en el Catálogo Comercial de Ubaté. ¿Podemos coordinar la entrega/recogida?`)}" target="_blank" rel="noopener">📲 Escribir por WhatsApp</a>` : ''}
    </div>
  `).join('');

  cont.innerHTML = `
    <p style="font-size:.9rem; color:#555;">Pedido <strong>#${data.id}</strong> confirmado por un total de
    <strong style="color:var(--green-dark)">${formatoPrecio(data.total)}</strong>.</p>
    <p style="font-size:.85rem; color:#666; margin-bottom:14px;">Puntos de recogida / contacto para coordinar la entrega:</p>
    ${puntos}
  `;
  openModal('orderConfirm');
}

/* ---------------- Catálogo: categorías y productos ---------------- */
async function cargarCategorias(){
  try {
    categoriasCache = await apiFetch('/api/categorias');
    renderChips();
    renderIconPicker();
  } catch(err){ /* si falla, se mantienen los chips fijos del HTML */ }
}

function renderChips(){
  const cont = document.getElementById('chips');
  const extra = categoriasCache.map(c => `<button class="chip" data-cat="${c.slug}">${c.icono || ''} ${c.nombre}</button>`).join('');
  cont.innerHTML = `<button class="chip active" data-cat="todos">Todos</button>${extra}`;
}

function skeletonGrid(n){
  const grid = document.getElementById('grid');
  grid.innerHTML = Array.from({length:n}).map(()=>`
    <div class="skeleton-card">
      <div class="skeleton-thumb"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line short"></div>
    </div>
  `).join('');
}

async function cargarProductos(){
  const grid = document.getElementById('grid');
  const count = document.getElementById('count');
  const empty = document.getElementById('empty');
  skeletonGrid(6);
  count.textContent = '';
  empty.style.display = 'none';

  const params = new URLSearchParams();
  if(activeCat && activeCat !== 'todos') params.set('categoria', activeCat);
  if(query) params.set('buscar', query);

  try {
    const productos = await apiFetch(`/api/productos?${params.toString()}`);
    renderProductos(productos);
  } catch(err){
    grid.innerHTML = '';
    empty.textContent = 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
    empty.style.display = 'block';
  }
}

function renderProductos(productos){
  const grid = document.getElementById('grid');
  const count = document.getElementById('count');
  const empty = document.getElementById('empty');

  grid.innerHTML = productos.map(p => `
    <div class="card">
      <div class="thumb">${iconoSVG(p.icono, p.categoria)}</div>
      <div class="body">
        <span class="cat-tag">${p.categoria_nombre || p.categoria}</span>
        <h3>${p.nombre}</h3>
        <p class="negocio-line">🏪 ${p.negocio}${p.sector ? ' · ' + p.sector : ''}</p>
        <div class="price-row"><span class="price">${formatoPrecio(p.precio)}</span></div>
        <div class="actions-row">
          <button class="btn btn-add" data-add='${JSON.stringify(p).replace(/'/g, "&#39;")}' data-label="Agregar">
            <span class="btn-label">＋ Agregar</span>
          </button>
          ${p.telefono ? `<a class="btn btn-whatsapp" target="_blank" rel="noopener" href="${enlaceWhatsapp(p.telefono, `Hola, estoy interesado en "${p.nombre}" (${formatoPrecio(p.precio)}) que vi en el Catálogo Comercial de Ubaté.`)}" title="Contactar por WhatsApp">📲</a>` : ''}
        </div>
      </div>
    </div>
  `).join('');

  count.textContent = productos.length + (productos.length === 1 ? ' producto encontrado' : ' productos encontrados');
  empty.textContent = 'No se encontraron productos con ese criterio.';
  empty.style.display = productos.length ? 'none' : 'block';

  grid.querySelectorAll('[data-add]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const producto = JSON.parse(btn.getAttribute('data-add').replace(/&#39;/g, "'"));
      agregarAlCarrito(producto, btn);
    });
  });
}

/* ---------------- Modales genéricos ---------------- */
const MODALES = ['login','register','publish','myProducts','admin','orderConfirm'];
function openModal(name){
  MODALES.forEach(m=>{
    const o = document.getElementById('overlay-' + m);
    if(o) o.classList.remove('open');
  });
  const target = document.getElementById('overlay-' + name);
  if(target) target.classList.add('open');
}
function closeModals(){
  MODALES.forEach(m=>{
    const o = document.getElementById('overlay-' + m);
    if(o) o.classList.remove('open');
  });
}

/* ---------------- Sesión: UI (navbar) ---------------- */
function setLoggedIn(usuario){
  document.getElementById('authButtons').style.display = 'none';
  const chip = document.getElementById('userChip');
  chip.style.display = 'flex';
  document.getElementById('userName').textContent = usuario.nombre;
  document.getElementById('userAvatar').textContent = (usuario.nombre.trim().charAt(0) || 'U').toUpperCase();

  document.getElementById('navPublish').style.display = usuario.tipo === 'negocio' ? 'inline-block' : 'none';
  document.getElementById('navAdmin').style.display = usuario.tipo === 'admin' ? 'inline-block' : 'none';
}
function setLoggedOut(){
  document.getElementById('authButtons').style.display = 'flex';
  document.getElementById('userChip').style.display = 'none';
  document.getElementById('navPublish').style.display = 'none';
  document.getElementById('navAdmin').style.display = 'none';
  cerrarSesion();
}
function restaurarSesion(){
  const sesion = getSesion();
  if(sesion) setLoggedIn(sesion.usuario);
}

/* ---------------- Publicar producto (negocio) ---------------- */
const ICONOS_DISPONIBLES = [
  'queso','yogur','arequipe','ruana','canasto','sombrero','cinturon','jarra','madera',
  'tamal','pan','chocolate','chicharron','papa','torta','panela','hamburguesa','perro-caliente','pizza','arepa'
];
function renderIconPicker(){
  const cont = document.getElementById('iconPicker');
  if(!cont) return;
  cont.innerHTML = ICONOS_DISPONIBLES.map((key, i) => `
    <label title="${key}">
      <input type="radio" name="prodIcono" value="${key}" ${i===0?'checked':''}>
      <span style="display:flex;">${iconoSVG(key, 'lacteo')}</span>
    </label>
  `).join('');
}
function renderCategoriaSelect(){
  const select = document.getElementById('prodCategoria');
  if(!select) return;
  select.innerHTML = categoriasCache.map(c => `<option value="${c.slug}">${c.nombre}</option>`).join('');
}

async function cargarMisProductos(){
  const cont = document.getElementById('misProductosBody');
  cont.innerHTML = `<p class="row-empty">Cargando...</p>`;
  try {
    const productos = await apiFetch('/api/productos/mios');
    if(productos.length === 0){
      cont.innerHTML = `<p class="row-empty">Aún no has publicado productos.</p>`;
      return;
    }
    cont.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th></th></tr></thead>
        <tbody>
          ${productos.map(p => `
            <tr>
              <td>${p.nombre}</td>
              <td>${p.categoria_nombre}</td>
              <td class="num">${formatoPrecio(p.precio)}</td>
              <td><button class="btn btn-sm btn-danger" data-del-prod="${p.id}">Eliminar</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    cont.querySelectorAll('[data-del-prod]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        if(!confirm('¿Eliminar este producto del catálogo?')) return;
        try {
          await apiFetch(`/api/productos/${btn.dataset.delProd}`, {method:'DELETE'});
          toast('Producto eliminado', 'success');
          cargarMisProductos();
          cargarProductos();
        } catch(err){ toast(err.message, 'error'); }
      });
    });
  } catch(err){
    cont.innerHTML = `<p class="row-empty">${err.message}</p>`;
  }
}

/* ---------------- Panel de administración ---------------- */
async function cargarAdminNegocios(){
  const cont = document.getElementById('adminNegociosBody');
  cont.innerHTML = `<p class="row-empty">Cargando...</p>`;
  try {
    const negocios = await apiFetch('/api/admin/negocios');
    if(negocios.length === 0){ cont.innerHTML = `<p class="row-empty">No hay negocios registrados.</p>`; return; }
    cont.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Negocio</th><th>Sector</th><th>Dueño</th><th>Productos</th><th></th></tr></thead>
        <tbody>
          ${negocios.map(n => `
            <tr>
              <td>${n.nombre}</td>
              <td>${n.sector || '—'}</td>
              <td>${n.correo}</td>
              <td class="num">${n.total_productos}</td>
              <td><button class="btn btn-sm btn-danger" data-del-neg="${n.id}">Eliminar</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    cont.querySelectorAll('[data-del-neg]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        if(!confirm('¿Eliminar este negocio y todos sus productos?')) return;
        try {
          await apiFetch(`/api/admin/negocios/${btn.dataset.delNeg}`, {method:'DELETE'});
          toast('Negocio eliminado', 'success');
          cargarAdminNegocios();
          cargarProductos();
        } catch(err){ toast(err.message, 'error'); }
      });
    });
  } catch(err){
    cont.innerHTML = `<p class="row-empty">${err.message}</p>`;
  }
}

async function cargarAdminCategorias(){
  const cont = document.getElementById('adminCategoriasBody');
  cont.innerHTML = `<p class="row-empty">Cargando...</p>`;
  try {
    const categorias = await apiFetch('/api/categorias');
    cont.innerHTML = `
      <table class="data-table">
        <thead><tr><th>Categoría</th><th>Slug</th><th></th></tr></thead>
        <tbody>
          ${categorias.map(c => `
            <tr>
              <td>${c.icono || ''} ${c.nombre}</td>
              <td>${c.slug}</td>
              <td><button class="btn btn-sm btn-danger" data-del-cat="${c.slug}">Eliminar</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    cont.querySelectorAll('[data-del-cat]').forEach(btn=>{
      btn.addEventListener('click', async ()=>{
        const categoria = categorias.find(c => c.slug === btn.dataset.delCat);
        if(!confirm('¿Eliminar esta categoría?')) return;
        try {
          // El backend espera el id numérico; lo resolvemos a partir del slug
          const listaAdmin = await apiFetch('/api/categorias');
          const info = listaAdmin.find(c => c.slug === btn.dataset.delCat);
          await apiFetch(`/api/admin/categorias/${info.id}`, {method:'DELETE'});
          toast('Categoría eliminada', 'success');
          cargarAdminCategorias();
          cargarCategorias();
        } catch(err){ toast(err.message, 'error'); }
      });
    });
  } catch(err){
    cont.innerHTML = `<p class="row-empty">${err.message}</p>`;
  }
}

/* ============================================================
   Inicialización y listeners
   ============================================================ */
function init(){
  restaurarSesion();
  actualizarBadgeCarrito();
  cargarCategorias();
  cargarProductos();

  // Menú móvil
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  menuToggle.addEventListener('click', ()=> navLinks.classList.toggle('open'));

  // Búsqueda
  document.getElementById('search').addEventListener('input', e=>{
    query = e.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(cargarProductos, 300);
  });

  // Chips de categoría (delegación, porque se regeneran dinámicamente)
  document.getElementById('chips').addEventListener('click', e=>{
    if(!e.target.classList.contains('chip')) return;
    document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
    e.target.classList.add('active');
    activeCat = e.target.dataset.cat;
    cargarProductos();
  });

  // Enlaces del menú que filtran por categoría o abren secciones
  navLinks.addEventListener('click', e=>{
    const target = e.target.closest('a');
    if(!target) return;
    if(target.dataset.cat){
      activeCat = target.dataset.cat;
      cargarProductos();
      document.getElementById('catalogo').scrollIntoView({behavior:'smooth'});
    }
    navLinks.classList.remove('open');
  });

  // Carrito
  document.getElementById('cartBtn').addEventListener('click', abrirCarrito);
  document.getElementById('cartCloseBtn').addEventListener('click', cerrarCarrito);
  document.getElementById('cartOverlay').addEventListener('click', e=>{
    if(e.target.id === 'cartOverlay') cerrarCarrito();
  });
  document.getElementById('cartItems').addEventListener('click', e=>{
    const plus = e.target.closest('[data-qty-plus]');
    const minus = e.target.closest('[data-qty-minus]');
    const remove = e.target.closest('[data-remove]');
    if(plus) cambiarCantidad(Number(plus.dataset.qtyPlus), 1);
    if(minus) cambiarCantidad(Number(minus.dataset.qtyMinus), -1);
    if(remove) quitarDelCarrito(Number(remove.dataset.remove));
  });
  document.getElementById('btnCheckout').addEventListener('click', confirmarPedido);
  document.getElementById('btnCloseOrderConfirm').addEventListener('click', closeModals);

  // Botones de sesión
  document.getElementById('btnLogin').addEventListener('click', ()=>openModal('login'));
  document.getElementById('btnRegister').addEventListener('click', ()=>openModal('register'));
  document.getElementById('btnLogout').addEventListener('click', ()=>{ setLoggedOut(); toast('Sesión cerrada', 'success'); });

  document.querySelectorAll('[data-close]').forEach(btn=> btn.addEventListener('click', closeModals));
  document.querySelectorAll('.overlay').forEach(ov=>{
    ov.addEventListener('click', e=>{ if(e.target === ov) closeModals(); });
  });
  document.querySelectorAll('[data-switch-to]').forEach(link=>{
    link.addEventListener('click', ()=> openModal(link.dataset.switchTo));
  });
  document.addEventListener('keydown', e=>{ if(e.key === 'Escape'){ closeModals(); cerrarCarrito(); } });

  // Registro
  document.getElementById('registerForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const errorBox = document.getElementById('registerError');
    const successBox = document.getElementById('registerSuccess');
    errorBox.style.display = 'none'; successBox.style.display = 'none';
    const nombre = document.getElementById('regName').value.trim();
    const correo = document.getElementById('regEmail').value.trim();
    const tipo = document.getElementById('regTipo').value;
    const contrasena = document.getElementById('regPassword').value;
    try {
      await apiFetch('/api/auth/registro', {method:'POST', body: JSON.stringify({nombre, correo, contrasena, tipo})});
      successBox.textContent = 'Cuenta creada con éxito. Ya puedes iniciar sesión.';
      successBox.style.display = 'block';
      e.target.reset();
      setTimeout(()=>{ openModal('login'); successBox.style.display = 'none'; }, 1100);
    } catch(err){
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
    }
  });

  // Login
  document.getElementById('loginForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const errorBox = document.getElementById('loginError');
    errorBox.style.display = 'none';
    const correo = document.getElementById('loginEmail').value.trim();
    const contrasena = document.getElementById('loginPassword').value;
    try {
      const data = await apiFetch('/api/auth/login', {method:'POST', body: JSON.stringify({correo, contrasena})});
      guardarSesion(data.usuario, data.token);
      setLoggedIn(data.usuario);
      closeModals();
      e.target.reset();
      toast(`¡Hola, ${data.usuario.nombre}!`, 'success');
    } catch(err){
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
    }
  });

  // Nav: publicar producto / mis productos / admin
  document.getElementById('navPublish').addEventListener('click', e=>{
    e.preventDefault();
    renderCategoriaSelect();
    openModal('publish');
    switchTab('publish', 'form');
  });
  document.getElementById('navAdmin').addEventListener('click', e=>{
    e.preventDefault();
    openModal('admin');
    switchTab('admin', 'negocios');
    cargarAdminNegocios();
  });

  // Tabs del modal "publicar producto"
  document.querySelectorAll('[data-tab-group]').forEach(btn=>{
    btn.addEventListener('click', ()=> switchTab(btn.dataset.tabGroup, btn.dataset.tab));
  });

  // Formulario publicar producto
  document.getElementById('publishForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const errorBox = document.getElementById('publishError');
    const successBox = document.getElementById('publishSuccess');
    errorBox.style.display = 'none'; successBox.style.display = 'none';
    const nombre = document.getElementById('prodNombre').value.trim();
    const descripcion = document.getElementById('prodDescripcion').value.trim();
    const precio = Number(document.getElementById('prodPrecio').value);
    const categoria_slug = document.getElementById('prodCategoria').value;
    const icono = (document.querySelector('input[name="prodIcono"]:checked') || {}).value || 'default';
    try {
      await apiFetch('/api/productos', {method:'POST', body: JSON.stringify({nombre, descripcion, precio, categoria_slug, icono})});
      successBox.textContent = 'Producto publicado correctamente.';
      successBox.style.display = 'block';
      e.target.reset();
      cargarProductos();
      setTimeout(()=> successBox.style.display = 'none', 1800);
    } catch(err){
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
    }
  });

  // Al abrir la pestaña "Mis productos" dentro del modal de publicar
  document.querySelector('[data-tab-group="publish"][data-tab="mine"]').addEventListener('click', cargarMisProductos);
  // Al abrir la pestaña "Categorías" del admin
  document.querySelector('[data-tab-group="admin"][data-tab="categorias"]').addEventListener('click', cargarAdminCategorias);

  // Formulario admin: nueva categoría
  document.getElementById('adminCatForm').addEventListener('submit', async e=>{
    e.preventDefault();
    const errorBox = document.getElementById('adminCatError');
    errorBox.style.display = 'none';
    const nombre = document.getElementById('adminCatNombre').value.trim();
    const slug = document.getElementById('adminCatSlug').value.trim().toLowerCase().replace(/\s+/g, '_');
    try {
      await apiFetch('/api/admin/categorias', {method:'POST', body: JSON.stringify({nombre, slug, icono:'🏷️'})});
      toast('Categoría creada', 'success');
      e.target.reset();
      cargarAdminCategorias();
      cargarCategorias();
    } catch(err){
      errorBox.textContent = err.message;
      errorBox.style.display = 'block';
    }
  });
}

function switchTab(group, tab){
  document.querySelectorAll(`[data-tab-group="${group}"]`).forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll(`[data-tab-panel-group="${group}"]`).forEach(panel=>{
    panel.classList.toggle('active', panel.dataset.tabPanel === tab);
  });
}

init();
