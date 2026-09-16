/* ============================================================
   Sistema de íconos ilustrados (SVG) del catálogo SIC-Ubaté.
   Sustituye los emojis por pictogramas vectoriales reales,
   consistentes en cualquier dispositivo y sin depender de fuentes
   externas. Cada ícono vive dentro de una insignia de color
   asociada a su categoría, lo que ayuda a la jerarquía visual.
   ============================================================ */

const ICON_PATHS = {
  queso: '<path d="M6 34 L24 10 L42 34 L38 40 L10 40 Z" fill="currentColor"/><circle cx="20" cy="30" r="2" fill="var(--thumb-bg)"/><circle cx="28" cy="26" r="1.6" fill="var(--thumb-bg)"/><circle cx="24" cy="34" r="1.6" fill="var(--thumb-bg)"/>',
  cup: '<path d="M14 12 h20 l-2 22 a4 4 0 0 1-4 4 H20 a4 4 0 0 1-4-4 Z" fill="currentColor"/><rect x="12" y="9" width="24" height="4" rx="2" fill="currentColor"/>',
  jar: '<rect x="14" y="16" width="20" height="22" rx="4" fill="currentColor"/><rect x="18" y="9" width="12" height="8" rx="2" fill="currentColor"/><rect x="16" y="22" width="16" height="3" fill="var(--thumb-bg)" opacity=".55"/>',
  ruana: '<path d="M24 8 L40 20 L34 22 L34 40 H14 V22 L8 20 Z" fill="currentColor"/><circle cx="24" cy="16" r="3" fill="var(--thumb-bg)"/><path d="M14 26 H34 M14 32 H34" stroke="var(--thumb-bg)" stroke-width="1.6" opacity=".6"/>',
  basket: '<path d="M10 20 H38 L34 38 a4 4 0 0 1-4 3 H18 a4 4 0 0 1-4-3 Z" fill="currentColor"/><path d="M14 20 L18 9 M34 20 L30 9" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M14 26 H34 M15 32 H33" stroke="var(--thumb-bg)" stroke-width="1.6" opacity=".55"/>',
  sombrero: '<ellipse cx="24" cy="30" rx="18" ry="5" fill="currentColor"/><path d="M15 30 a9 9 0 0 1 18 0 Z" fill="currentColor"/><ellipse cx="24" cy="21.5" rx="7" ry="2.4" fill="var(--thumb-bg)" opacity=".5"/>',
  belt: '<rect x="8" y="20" width="32" height="8" rx="2" fill="currentColor"/><rect x="19" y="16" width="10" height="16" rx="2" fill="var(--thumb-bg)"/><circle cx="24" cy="24" r="2.4" fill="currentColor"/>',
  pot: '<path d="M16 18 Q24 12 32 18 L34 36 a4 4 0 0 1-4 4 H18 a4 4 0 0 1-4-4 Z" fill="currentColor"/><ellipse cx="24" cy="18" rx="8" ry="3" fill="var(--thumb-bg)" opacity=".55"/>',
  wood: '<rect x="8" y="14" width="32" height="20" rx="3" fill="currentColor"/><circle cx="15" cy="20" r="1.6" fill="var(--thumb-bg)"/><circle cx="33" cy="28" r="1.6" fill="var(--thumb-bg)"/><path d="M14 28 H34" stroke="var(--thumb-bg)" stroke-width="1.4" opacity=".5"/>',
  tamale: '<path d="M10 16 L38 12 L40 24 L12 34 Z" fill="currentColor"/><path d="M15 17 L16 30 M22 15.5 L23.5 32 M29 14.3 L31 30" stroke="var(--thumb-bg)" stroke-width="1.6" opacity=".55"/>',
  bread: '<path d="M8 26 a16 10 0 0 1 32 0 v4 a4 4 0 0 1-4 4 H12 a4 4 0 0 1-4-4 Z" fill="currentColor"/><path d="M16 22 q2 -4 4 0 M24 20 q2 -5 4 0 M32 22 q2 -4 4 0" stroke="var(--thumb-bg)" stroke-width="1.8" fill="none" opacity=".6"/>',
  chocolate: '<rect x="9" y="14" width="30" height="20" rx="2" fill="currentColor"/><path d="M9 20 H39 M9 28 H39 M18.5 14 V34 M29.5 14 V34" stroke="var(--thumb-bg)" stroke-width="1.4" opacity=".55"/>',
  meat: '<path d="M12 30 Q8 22 16 16 Q26 8 34 18 Q40 26 30 32 Q20 38 12 30 Z" fill="currentColor"/><path d="M30 30 L38 38" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><circle cx="19" cy="22" r="1.6" fill="var(--thumb-bg)"/><circle cx="26" cy="26" r="1.6" fill="var(--thumb-bg)"/>',
  potato: '<ellipse cx="23" cy="25" rx="15" ry="11" fill="currentColor" transform="rotate(-12 23 25)"/><circle cx="18" cy="21" r="1.4" fill="var(--thumb-bg)" opacity=".6"/><circle cx="27" cy="29" r="1.4" fill="var(--thumb-bg)" opacity=".6"/><circle cx="29" cy="19" r="1.2" fill="var(--thumb-bg)" opacity=".6"/>',
  cake: '<path d="M24 8 L32 20 H16 Z" fill="currentColor"/><path d="M13 20 H35 L32 38 a3 3 0 0 1-3 3 H19 a3 3 0 0 1-3-3 Z" fill="currentColor"/><path d="M16 27 H32" stroke="var(--thumb-bg)" stroke-width="1.6" opacity=".55"/>',
  sugar: '<path d="M12 34 L18 14 H30 L36 34 Z" fill="currentColor"/><path d="M16 28 H32" stroke="var(--thumb-bg)" stroke-width="1.6" opacity=".55"/>',
  burger: '<path d="M8 20 a16 8 0 0 1 32 0 Z" fill="currentColor"/><rect x="8" y="21" width="32" height="4" fill="currentColor"/><path d="M9 27 h30 l-2 4 H11 Z" fill="currentColor"/><rect x="8" y="33" width="32" height="5" rx="2.5" fill="currentColor"/><path d="M12 22.5 H36" stroke="var(--thumb-bg)" stroke-width="1.4" opacity=".5"/>',
  hotdog: '<path d="M10 24 a14 8 0 0 1 28 0 a14 8 0 0 1-28 0 Z" fill="currentColor"/><path d="M13 21 Q24 30 35 21" stroke="var(--thumb-bg)" stroke-width="2" fill="none" opacity=".6" stroke-linecap="round"/>',
  pizza: '<path d="M24 8 L42 36 Q24 46 6 36 Z" fill="currentColor"/><circle cx="20" cy="22" r="2" fill="var(--thumb-bg)"/><circle cx="28" cy="26" r="2" fill="var(--thumb-bg)"/><circle cx="22" cy="31" r="1.6" fill="var(--thumb-bg)"/>',
  arepa: '<ellipse cx="24" cy="24" rx="16" ry="9" fill="currentColor"/><ellipse cx="24" cy="21" rx="16" ry="9" fill="currentColor"/><path d="M11 21 a13 7 0 0 0 26 0" stroke="var(--thumb-bg)" stroke-width="1.4" opacity=".5" fill="none"/>',
  default: '<circle cx="24" cy="24" r="16" fill="currentColor"/><path d="M17 24 h14 M24 17 v14" stroke="var(--thumb-bg)" stroke-width="2.4" stroke-linecap="round"/>',
};

// Traduce la clave de ícono guardada en cada producto a una de las familias visuales de arriba.
const ICON_FAMILY = {
  queso: 'queso',
  cuajada: 'cup', yogur: 'cup', kumis: 'cup', leche: 'cup', jugo: 'cup',
  arequipe: 'jar', mantequilla: 'jar', miel: 'jar',
  ruana: 'ruana', bufanda: 'ruana',
  canasto: 'basket', individual: 'basket', mochila: 'basket',
  sombrero: 'sombrero',
  cinturon: 'belt', alforja: 'belt',
  jarra: 'pot',
  madera: 'wood',
  tamal: 'tamale', envuelto: 'tamale',
  almojabana: 'bread', pan: 'bread',
  chocolate: 'chocolate', bocadillo: 'chocolate',
  chicharron: 'meat', pollo: 'meat',
  papa: 'potato', salchipapa: 'potato',
  torta: 'cake',
  panela: 'sugar',
  hamburguesa: 'burger',
  'perro-caliente': 'hotdog',
  pizza: 'pizza',
  arepa: 'arepa',
};

// Color de insignia por categoría (ayuda a escanear el catálogo por tipo de negocio).
const CATEGORY_COLOR = {
  lacteo: '#4F8FE0',
  artesanal: '#B5793B',
  gastronomico: '#E0954C',
  comida_rapida: '#E0524C',
};
const CATEGORY_COLOR_DEFAULT = '#1D9A5B';

function iconoSVG(iconoKey, categoriaSlug){
  const familia = ICON_FAMILY[iconoKey] || 'default';
  const path = ICON_PATHS[familia] || ICON_PATHS.default;
  const color = CATEGORY_COLOR[categoriaSlug] || CATEGORY_COLOR_DEFAULT;
  return `<span class="thumb-badge" style="--thumb-bg:${color}"><svg viewBox="0 0 48 48" width="42" height="42" aria-hidden="true">${path}</svg></span>`;
}
