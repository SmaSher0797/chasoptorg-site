// ЧАСТОРГ / CHASTORG — общая логика: корзина, избранное, рендер карточек
const CART_KEY = 'chastorg_cart_v1';
const WISH_KEY = 'chastorg_wish_v1';

function formatPrice(n) {
  return n.toLocaleString('ru-RU') + ' ₽';
}

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch (e) { return fallback; }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

function getCart() { return readJSON(CART_KEY, {}); }
function setCart(cart) { writeJSON(CART_KEY, cart); updateBadges(); }
function addToCart(id, qty) {
  qty = qty || 1;
  var cart = getCart();
  cart[id] = (cart[id] || 0) + qty;
  setCart(cart);
}
function setCartQty(id, qty) {
  var cart = getCart();
  if (qty <= 0) { delete cart[id]; } else { cart[id] = qty; }
  setCart(cart);
}
function removeFromCart(id) {
  var cart = getCart();
  delete cart[id];
  setCart(cart);
}
function cartItems() {
  var cart = getCart();
  return Object.keys(cart).map(function (id) {
    var p = PRODUCTS.find(function (x) { return x.id === id; });
    return p ? { product: p, qty: cart[id] } : null;
  }).filter(Boolean);
}
function cartCount() {
  return cartItems().reduce(function (sum, it) { return sum + it.qty; }, 0);
}
function cartTotal() {
  return cartItems().reduce(function (sum, it) { return sum + it.product.price * it.qty; }, 0);
}

function getWish() { return readJSON(WISH_KEY, []); }
function toggleWish(id) {
  var wish = getWish();
  var i = wish.indexOf(id);
  if (i === -1) { wish.push(id); } else { wish.splice(i, 1); }
  writeJSON(WISH_KEY, wish);
  updateBadges();
  return wish.indexOf(id) !== -1;
}
function isWished(id) { return getWish().indexOf(id) !== -1; }

function updateBadges() {
  document.querySelectorAll('[data-cart-badge]').forEach(function (el) {
    var c = cartCount();
    el.textContent = c;
    el.style.display = c > 0 ? 'flex' : 'none';
  });
  document.querySelectorAll('[data-wish-badge]').forEach(function (el) {
    var c = getWish().length;
    el.textContent = c;
    el.style.display = c > 0 ? 'flex' : 'none';
  });
}

// --- Генератор иллюстраций товара (заменяет реальные фото, которых у нас нет) ---
var COLOR_MAP = {
  BLUE: '#2b4a8c', RED: '#b23a3a', BLACK: '#22252b', WHITE: '#e9e6dd',
  ORANGE: '#c9702f', BRONZE: '#8a6a3c', GOLD: '#c69a4e', ROSE: '#c98f8f',
  PHOENIX: '#8a2f2f', GIP: '#22252b', GSS: '#8a8f99'
};
function parseColor(p) {
  var m = p.model.toUpperCase();
  for (var key in COLOR_MAP) { if (m.indexOf(key) !== -1) return COLOR_MAP[key]; }
  var fallback = { men: '#22252b', women: '#8a6a6a', accessories: '#2b4a8c', interior: '#12213f' };
  return fallback[p.category] || '#8a8f99';
}

function productIllustration(p, size) {
  size = size || 96;
  if (p.image) {
    var fallbackSrc = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="21" fill="#c9ccd3"/><circle cx="32" cy="32" r="16.5" fill="#f4f3ef"/></svg>');
    return '<img class="prod-photo" src="' + p.image + '" alt="' + p.name + '" loading="lazy" style="width:100%;height:100%;object-fit:contain;padding:5%;box-sizing:border-box" onerror="this.onerror=null;this.src=' + JSON.stringify(fallbackSrc) + ';">';
  }
  var accent = parseColor(p);
  var body = '';
  if (p.category === 'accessories') {
    body =
      '<path d="M8 34h8l3 5h18l3-5h8" stroke="#12213f" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      '<circle cx="20" cy="42" r="11" fill="' + accent + '" fill-opacity="0.85" stroke="#12213f" stroke-width="2.5"/>' +
      '<circle cx="44" cy="42" r="11" fill="' + accent + '" fill-opacity="0.85" stroke="#12213f" stroke-width="2.5"/>' +
      '<ellipse cx="17" cy="38" rx="3" ry="1.8" fill="#ffffff" fill-opacity="0.5"/>' +
      '<ellipse cx="41" cy="38" rx="3" ry="1.8" fill="#ffffff" fill-opacity="0.5"/>';
    return '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '">' + body + '</svg>';
  }
  if (p.category === 'interior') {
    body =
      '<rect x="10" y="8" width="44" height="48" rx="4" fill="#f8f6f1" stroke="#12213f" stroke-width="2.5"/>' +
      '<circle cx="32" cy="30" r="14" fill="#ffffff" stroke="' + accent + '" stroke-width="2.5"/>' +
      '<circle cx="32" cy="30" r="1.6" fill="#12213f"/>' +
      '<path d="M32 30V21" stroke="#12213f" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M32 30l6 3" stroke="' + accent + '" stroke-width="2" stroke-linecap="round"/>' +
      '<rect x="24" y="48" width="16" height="4" rx="2" fill="#d8d3c6"/>';
    return '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '">' + body + '</svg>';
  }
  // часы (мужские / женские)
  var hasWindow = ['FERRO', 'Bigotti'].indexOf(p.brand) !== -1;
  body =
    '<path d="M24 8h16l-3 10h-10z" fill="#3a3f4a"/>' +
    '<path d="M24 56h16l-3-10h-10z" fill="#3a3f4a"/>' +
    '<circle cx="32" cy="32" r="21" fill="' + accent + '"/>' +
    '<circle cx="32" cy="32" r="16.5" fill="' + (p.category === 'women' ? '#fbf9f4' : '#1b1e24') + '"/>' +
    '<circle cx="32" cy="16.5" r="1.3" fill="' + (p.category === 'women' ? '#12213f' : '#e9e6dd') + '"/>' +
    '<circle cx="32" cy="47.5" r="1.3" fill="' + (p.category === 'women' ? '#12213f' : '#e9e6dd') + '"/>' +
    '<circle cx="16.5" cy="32" r="1.3" fill="' + (p.category === 'women' ? '#12213f' : '#e9e6dd') + '"/>' +
    '<circle cx="47.5" cy="32" r="1.3" fill="' + (p.category === 'women' ? '#12213f' : '#e9e6dd') + '"/>' +
    (hasWindow ? '<rect x="37" y="29" width="6" height="6" rx="1" fill="#c9a24b" fill-opacity="0.7"/>' : '') +
    '<path d="M32 32V21" stroke="' + (p.category === 'women' ? '#12213f' : '#f0ede4') + '" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M32 32l8 4" stroke="#c69a4e" stroke-width="2.2" stroke-linecap="round"/>' +
    '<circle cx="32" cy="32" r="1.8" fill="#c69a4e"/>' +
    '<rect x="29.5" y="4" width="5" height="4" rx="1" fill="#3a3f4a"/>' +
    '<rect x="52" y="29" width="4" height="6" rx="1.2" fill="#3a3f4a"/>';
  return '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '">' + body + '</svg>';
}
function miniWatchOrIcon(p) { return productIllustration(p, 78); }

// --- Галерея фото товара (страница товара) ---
function productThumbsHTML(p) {
  var imgs = (p.images && p.images.length ? p.images : (p.image ? [p.image] : []));
  if (imgs.length < 2) return '';
  return '<div class="gallery-thumbs">' + imgs.map(function (url, i) {
    return '<button type="button" class="gallery-thumb' + (i === 0 ? ' active' : '') + '" data-thumb="' + i + '"><img src="' + url + '" alt="' + p.name + ' — фото ' + (i + 1) + '" loading="lazy"></button>';
  }).join('') + '</div>';
}
function wireGallery(p) {
  var imgs = (p.images && p.images.length ? p.images : (p.image ? [p.image] : []));
  if (!imgs.length) return;
  var main = document.getElementById('galleryMain');
  var mainImg = main ? main.querySelector('.prod-photo') : null;
  var curIndex = 0;

  if (imgs.length >= 2) {
    document.querySelectorAll('.gallery-thumb').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var i = parseInt(btn.getAttribute('data-thumb'), 10);
        curIndex = i;
        if (mainImg && imgs[i]) mainImg.src = imgs[i];
        document.querySelectorAll('.gallery-thumb').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });
  }

  if (mainImg) {
    mainImg.style.cursor = 'zoom-in';
    mainImg.addEventListener('click', function () {
      openLightbox(imgs, curIndex, p.name, function (newIndex) {
        curIndex = newIndex;
        if (mainImg) mainImg.src = imgs[curIndex];
        var thumbs = document.querySelectorAll('.gallery-thumb');
        if (thumbs.length) {
          thumbs.forEach(function (b) { b.classList.remove('active'); });
          var t = document.querySelector('.gallery-thumb[data-thumb="' + curIndex + '"]');
          if (t) t.classList.add('active');
        }
      });
    });
  }
}

// --- Лайтбокс (увеличение фото по клику) ---
function ensureLightbox() {
  var el = document.getElementById('lightboxOverlay');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'lightboxOverlay';
  el.className = 'lightbox-overlay';
  el.innerHTML =
    '<button type="button" class="lightbox-close" aria-label="Закрыть">&times;</button>' +
    '<button type="button" class="lightbox-nav lightbox-prev" aria-label="Предыдущее фото">&#8249;</button>' +
    '<img class="lightbox-img" alt="">' +
    '<button type="button" class="lightbox-nav lightbox-next" aria-label="Следующее фото">&#8250;</button>';
  document.body.appendChild(el);
  return el;
}
function openLightbox(imgs, startIndex, altBase, onChange) {
  if (!imgs || !imgs.length) return;
  var el = ensureLightbox();
  var idx = startIndex || 0;
  var imgEl = el.querySelector('.lightbox-img');
  var closeBtn = el.querySelector('.lightbox-close');
  var prevBtn = el.querySelector('.lightbox-prev');
  var nextBtn = el.querySelector('.lightbox-next');
  var multi = imgs.length > 1;
  prevBtn.style.display = multi ? '' : 'none';
  nextBtn.style.display = multi ? '' : 'none';

  function render() {
    imgEl.src = imgs[idx];
    imgEl.alt = (altBase || '') + ' — фото ' + (idx + 1);
    if (typeof onChange === 'function') onChange(idx);
  }
  function go(delta) {
    idx = (idx + delta + imgs.length) % imgs.length;
    render();
  }
  function close() {
    el.classList.remove('open');
    document.body.classList.remove('lightbox-open');
    document.removeEventListener('keydown', onKey);
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft' && multi) go(-1);
    else if (e.key === 'ArrowRight' && multi) go(1);
  }

  closeBtn.onclick = close;
  prevBtn.onclick = function () { go(-1); };
  nextBtn.onclick = function () { go(1); };
  el.onclick = function (e) { if (e.target === el) close(); };
  document.addEventListener('keydown', onKey);

  render();
  el.classList.add('open');
  document.body.classList.add('lightbox-open');
}

// --- Недавно просмотренные ---
var RECENT_KEY = 'chastorg_recent_v1';
function addRecentView(id) {
  var arr = readJSON(RECENT_KEY, []);
  arr = arr.filter(function (x) { return x !== id; });
  arr.unshift(id);
  writeJSON(RECENT_KEY, arr.slice(0, 8));
}
function getRecentViews(excludeId) {
  var arr = readJSON(RECENT_KEY, []).filter(function (x) { return x !== excludeId; });
  return arr.map(function (id) { return PRODUCTS.find(function (p) { return p.id === id; }); }).filter(Boolean);
}

function productCardHTML(p) {
  var badge = '';
  if (p.badge === 'new') badge = '<span class="tag">Новинка</span>';
  if (p.badge === 'sale') {
    var pct = Math.round((1 - p.price / p.oldPrice) * 100);
    badge = '<span class="tag sale">-' + pct + '%</span>';
  }
  var wished = isWished(p.id);
  return (
    '<div class="product-card" data-id="' + p.id + '">' +
      '<a href="product-' + p.id + '.html" class="product-thumb">' + badge +
        '<div class="wish-btn' + (wished ? ' active' : '') + '" data-wish="' + p.id + '"><svg fill="' + (wished ? '#c69a4e' : 'none') + '" viewBox="0 0 24 24" stroke-width="2" stroke="' + (wished ? '#c69a4e' : '#12213f') + '"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 10-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"/></svg></div>' +
        productIllustration(p, 78) +
        '<button type="button" class="qv-btn" data-quickview="' + p.id + '" aria-label="Быстрый просмотр"><svg fill="none" viewBox="0 0 24 24" stroke-width="2"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>Быстрый просмотр</button>' +
      '</a>' +
      '<div class="product-info">' +
        '<div class="product-brand">' + p.brand + '</div>' +
        '<a href="product-' + p.id + '.html" class="product-name">' + p.name + '</a>' +
        '<div class="product-price"><span class="price-now">' + formatPrice(p.price) + '</span>' +
        (p.oldPrice ? '<span class="price-old">' + formatPrice(p.oldPrice) + '</span>' : '') + '</div>' +
        (p.stock <= 2 ? '<div style="font-size:11.5px;color:#c0392b;margin-top:4px">Осталось ' + p.stock + ' шт.</div>' : '') +
        '<div style="margin-top:auto;padding-top:10px"><button class="btn btn-navy btn-sm btn-block" data-add="' + p.id + '">В корзину</button></div>' +
      '</div>' +
    '</div>'
  );
}

// --- Быстрый просмотр товара (модальное окно) ---
var qvOverlay = null;
function buildQuickViewModal() {
  if (qvOverlay) return qvOverlay;
  qvOverlay = document.createElement('div');
  qvOverlay.className = 'qv-overlay';
  qvOverlay.innerHTML = '<div class="qv-modal" role="dialog" aria-modal="true"><button type="button" class="qv-close" aria-label="Закрыть">&times;</button><div class="qv-body"></div></div>';
  document.body.appendChild(qvOverlay);
  qvOverlay.addEventListener('click', function (e) {
    if (e.target === qvOverlay) closeQuickView();
  });
  qvOverlay.querySelector('.qv-close').addEventListener('click', closeQuickView);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeQuickView();
  });
  return qvOverlay;
}
function closeQuickView() {
  if (qvOverlay) qvOverlay.classList.remove('visible');
  document.body.classList.remove('qv-lock');
}
function openQuickView(id) {
  var p = PRODUCTS.find(function (x) { return x.id === id; });
  if (!p) return;
  var overlay = buildQuickViewModal();
  var wished = isWished(p.id);
  var pct = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  overlay.querySelector('.qv-body').innerHTML =
    '<div class="qv-gallery">' + productIllustration(p, 200) + '</div>' +
    '<div class="qv-info">' +
      '<div class="product-brand">' + p.brand + '</div>' +
      '<h3 class="qv-title">' + p.name + '</h3>' +
      '<div class="product-price" style="margin:10px 0"><span class="price-now">' + formatPrice(p.price) + '</span>' +
      (p.oldPrice ? '<span class="price-old">' + formatPrice(p.oldPrice) + '</span><span class="tag sale" style="margin-left:8px">-' + pct + '%</span>' : '') + '</div>' +
      '<table class="qv-specs">' +
        (p.mechanism ? '<tr><td>Механизм</td><td>' + p.mechanism + '</td></tr>' : '') +
        (p.material ? '<tr><td>Материал</td><td>' + p.material + '</td></tr>' : '') +
        '<tr><td>Артикул</td><td>' + p.model + '</td></tr>' +
        '<tr><td>Наличие</td><td>' + (p.stock > 0 ? (p.stock <= 2 ? 'Осталось ' + p.stock + ' шт.' : 'В наличии') : 'Под заказ') + '</td></tr>' +
      '</table>' +
      '<div class="qv-actions">' +
        '<div class="qty-stepper" data-qv-stepper><button data-step="down">–</button><input type="text" value="1" data-qv-qty><button data-step="up">+</button></div>' +
        '<button class="btn btn-gold" data-qv-add="' + p.id + '">В корзину</button>' +
        '<div class="wish-btn' + (wished ? ' active' : '') + '" data-wish="' + p.id + '" style="position:static"><svg fill="' + (wished ? '#c69a4e' : 'none') + '" viewBox="0 0 24 24" stroke-width="2" stroke="' + (wished ? '#c69a4e' : '#12213f') + '"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 10-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"/></svg></div>' +
      '</div>' +
      '<a href="product-' + p.id + '.html" class="qv-full-link">Открыть страницу товара →</a>' +
    '</div>';

  var stepper = overlay.querySelector('[data-qv-stepper]');
  stepper.querySelectorAll('button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = stepper.querySelector('[data-qv-qty]');
      var val = parseInt(input.value || '1', 10);
      val = btn.dataset.step === 'up' ? val + 1 : Math.max(1, val - 1);
      input.value = val;
    });
  });
  overlay.querySelector('[data-qv-add]').addEventListener('click', function () {
    var qty = parseInt(overlay.querySelector('[data-qv-qty]').value, 10) || 1;
    addToCart(p.id, qty);
    var el = overlay.querySelector('[data-qv-add]');
    var old = el.textContent;
    el.textContent = 'Добавлено ✓';
    setTimeout(function () { el.textContent = old; }, 1200);
  });

  overlay.classList.add('visible');
  document.body.classList.add('qv-lock');
}

document.addEventListener('DOMContentLoaded', function () {
  updateBadges();

  document.addEventListener('click', function (e) {
    var addBtn = e.target.closest('[data-add]');
    if (addBtn) {
      e.preventDefault();
      addToCart(addBtn.dataset.add, 1);
      var old = addBtn.textContent;
      addBtn.textContent = 'Добавлено ✓';
      setTimeout(function () { addBtn.textContent = old; }, 1200);
    }
    var wishBtn = e.target.closest('[data-wish]');
    if (wishBtn) {
      e.preventDefault();
      var active = toggleWish(wishBtn.dataset.wish);
      wishBtn.classList.toggle('active', active);
      var svg = wishBtn.querySelector('svg');
      if (svg) {
        svg.setAttribute('fill', active ? '#c69a4e' : 'none');
        svg.setAttribute('stroke', active ? '#c69a4e' : '#12213f');
      }
    }
    var qvBtn = e.target.closest('[data-quickview]');
    if (qvBtn) {
      e.preventDefault();
      e.stopPropagation();
      openQuickView(qvBtn.dataset.quickview);
    }
  });
});
