// ЧАСТОРГ / CHASTORG — конструктор часов на заказ (custom.html)
(function () {
  var CASE_COLORS = [
    { id: 'silver', name: 'Серебро', hex: '#c9ccd3' },
    { id: 'gold', name: 'Золото', hex: '#c69a4e' },
    { id: 'black', name: 'Чёрный PVD', hex: '#22252b' },
    { id: 'rose', name: 'Розовое золото', hex: '#c98f8f' },
    { id: 'titan', name: 'Синий титан', hex: '#2b4a8c' }
  ];
  var DIAL_COLORS = [
    { id: 'white', name: 'Белый', hex: '#f8f6f1' },
    { id: 'black', name: 'Чёрный', hex: '#1b1e24' },
    { id: 'blue', name: 'Синий', hex: '#1e3a5f' },
    { id: 'green', name: 'Зелёный', hex: '#1f4d3a' },
    { id: 'silver', name: 'Серебристый', hex: '#c9ccd3' }
  ];
  var STRAP_MATERIALS = [
    { id: 'leather', name: 'Кожа', priceAdd: 500 },
    { id: 'metal', name: 'Металл', priceAdd: 1500 },
    { id: 'silicone', name: 'Силикон', priceAdd: 0 }
  ];
  var STRAP_COLORS = {
    leather: [
      { id: 'black', name: 'Чёрная', hex: '#22252b' },
      { id: 'brown', name: 'Коричневая', hex: '#6b4226' },
      { id: 'navy', name: 'Тёмно-синяя', hex: '#1e3a5f' },
      { id: 'wine', name: 'Бордовая', hex: '#6b1f2a' }
    ],
    metal: [
      { id: 'steel', name: 'Сталь', hex: '#c9ccd3' },
      { id: 'gold', name: 'Золото', hex: '#c69a4e' },
      { id: 'black', name: 'Чёрный PVD', hex: '#22252b' },
      { id: 'rose', name: 'Розовое золото', hex: '#c98f8f' }
    ],
    silicone: [
      { id: 'black', name: 'Чёрный', hex: '#22252b' },
      { id: 'white', name: 'Белый', hex: '#eceae3' },
      { id: 'blue', name: 'Синий', hex: '#2b4a8c' },
      { id: 'red', name: 'Красный', hex: '#b23a3a' }
    ]
  };
  var ACCENT_COLORS = [
    { id: 'gold', name: 'Золото', hex: '#c69a4e' },
    { id: 'silver', name: 'Серебро', hex: '#e9e6dd' },
    { id: 'black', name: 'Чёрный', hex: '#22252b' }
  ];
  var BASE_PRICE = 4990;
  var LOGO_TEXT_ADD = 300;
  var LOGO_IMAGE_ADD = 800;
  var ENGRAVE_ADD = 400;

  var state = {
    caseColor: CASE_COLORS[1],
    dialColor: DIAL_COLORS[1],
    strapMaterial: STRAP_MATERIALS[0],
    strapColor: STRAP_COLORS.leather[0],
    accent: ACCENT_COLORS[0],
    logoText: '',
    logoImage: null, // data URL
    engraveText: ''
  };

  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  function renderSwatches(containerId, items, stateKey, onPick) {
    var container = document.getElementById(containerId);
    container.innerHTML = '';
    items.forEach(function (item) {
      var sw = el('div', {
        class: 'swatch' + (state[stateKey] && state[stateKey].id === item.id ? ' active' : ''),
        style: 'background:' + item.hex,
        title: item.name,
        'aria-label': item.name
      });
      sw.addEventListener('click', function () {
        state[stateKey] = item;
        renderSwatches(containerId, items, stateKey, onPick);
        if (onPick) onPick();
        updatePreview();
      });
      container.appendChild(sw);
    });
  }

  function renderStrapMaterialChips() {
    var container = document.getElementById('strapMaterial');
    container.innerHTML = '';
    STRAP_MATERIALS.forEach(function (m) {
      var chip = el('button', {
        type: 'button',
        class: 'opt-chip' + (state.strapMaterial.id === m.id ? ' active' : '')
      }, m.name);
      chip.addEventListener('click', function () {
        state.strapMaterial = m;
        state.strapColor = STRAP_COLORS[m.id][0];
        renderStrapMaterialChips();
        renderSwatches('strapSwatches', STRAP_COLORS[m.id], 'strapColor');
        updatePreview();
      });
      container.appendChild(chip);
    });
  }

  function renderAccentChips() {
    var container = document.getElementById('accentSwatches');
    container.innerHTML = '';
    ACCENT_COLORS.forEach(function (a) {
      var chip = el('button', {
        type: 'button',
        class: 'opt-chip' + (state.accent.id === a.id ? ' active' : '')
      }, a.name);
      chip.addEventListener('click', function () {
        state.accent = a;
        renderAccentChips();
        updatePreview();
      });
      container.appendChild(chip);
    });
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function strapPattern(id, color) {
    // Возвращает SVG-разметку "текстуры" ремешка в зависимости от материала
    if (state.strapMaterial.id === 'metal') {
      var links = '';
      for (var y = 6; y < 82; y += 12) {
        links += '<line x1="6" y1="' + y + '" x2="46" y2="' + y + '" stroke="rgba(0,0,0,.18)" stroke-width="1.5"/>';
      }
      return links;
    }
    if (state.strapMaterial.id === 'leather') {
      return '<rect x="8" y="6" width="36" height="' + (id === 'top' ? 34 : 34) + '" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1" stroke-dasharray="3 3" rx="4"/>';
    }
    // silicone
    var dots = '';
    for (var yy = 10; yy < 80; yy += 10) {
      dots += '<circle cx="26" cy="' + yy + '" r="1.3" fill="rgba(0,0,0,.15)"/>';
    }
    return dots;
  }

  function buildWatchSVG() {
    var cCase = state.caseColor.hex;
    var cDial = state.dialColor.hex;
    var cStrap = state.strapColor.hex;
    var cAccent = state.accent.hex;
    var dialTextColor = (state.dialColor.id === 'white' || state.dialColor.id === 'silver') ? '#12213f' : '#f2efe6';

    var markers = '';
    for (var i = 0; i < 12; i++) {
      var angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      var x1 = 100 + Math.cos(angle) * 58, y1 = 138 + Math.sin(angle) * 58;
      var x2 = 100 + Math.cos(angle) * 50, y2 = 138 + Math.sin(angle) * 50;
      markers += '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + dialTextColor + '" stroke-width="' + (i % 3 === 0 ? 2.6 : 1.4) + '" stroke-linecap="round"/>';
    }

    var logoMarkup = '';
    if (state.logoImage) {
      logoMarkup =
        '<clipPath id="logoClip"><circle cx="100" cy="158" r="11"/></clipPath>' +
        '<circle cx="100" cy="158" r="12" fill="' + dialTextColor + '" fill-opacity="0.08"/>' +
        '<image href="' + state.logoImage + '" x="89" y="147" width="22" height="22" clip-path="url(#logoClip)" preserveAspectRatio="xMidYMid slice"/>';
    } else if (state.logoText) {
      logoMarkup = '<text x="100" y="163" text-anchor="middle" font-family="Playfair Display, serif" font-weight="700" font-size="10" fill="' + cAccent + '" letter-spacing="0.5">' + esc(state.logoText) + '</text>';
    }

    var svg =
      '<svg id="watchSvg" viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
        '<defs>' +
          '<radialGradient id="caseGrad" cx="35%" cy="30%" r="75%">' +
            '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.55"/>' +
            '<stop offset="45%" stop-color="' + cCase + '" stop-opacity="0"/>' +
          '</radialGradient>' +
        '</defs>' +
        // ремешок (верх и низ), под корпусом
        '<g>' +
          '<rect x="77" y="0" width="46" height="70" rx="8" fill="' + cStrap + '"/>' +
          '<g transform="translate(77,0)">' + strapPattern('top', cStrap) + '</g>' +
          '<rect x="77" y="230" width="46" height="70" rx="8" fill="' + cStrap + '"/>' +
          '<g transform="translate(77,218)">' + strapPattern('bottom', cStrap) + '</g>' +
        '</g>' +
        // ушки корпуса
        '<path d="M78 62 L70 78 L78 88 Z" fill="' + cCase + '"/>' +
        '<path d="M122 62 L130 78 L122 88 Z" fill="' + cCase + '"/>' +
        '<path d="M78 214 L70 198 L78 188 Z" fill="' + cCase + '"/>' +
        '<path d="M122 214 L130 198 L122 188 Z" fill="' + cCase + '"/>' +
        // заводная головка
        '<rect x="164" y="130" width="10" height="16" rx="3" fill="' + cCase + '"/>' +
        // корпус
        '<circle cx="100" cy="138" r="72" fill="' + cCase + '"/>' +
        '<circle cx="100" cy="138" r="72" fill="url(#caseGrad)"/>' +
        '<circle cx="100" cy="138" r="72" fill="none" stroke="rgba(0,0,0,.15)" stroke-width="1"/>' +
        // циферблат
        '<circle cx="100" cy="138" r="58" fill="' + cDial + '"/>' +
        markers +
        // стрелки
        '<line x1="100" y1="138" x2="100" y2="108" stroke="' + dialTextColor + '" stroke-width="3" stroke-linecap="round"/>' +
        '<line x1="100" y1="138" x2="124" y2="150" stroke="' + cAccent + '" stroke-width="3" stroke-linecap="round"/>' +
        '<circle cx="100" cy="138" r="3.2" fill="' + cAccent + '"/>' +
        // бренд
        '<text x="100" y="122" text-anchor="middle" font-family="Playfair Display, serif" font-weight="700" font-size="8" fill="' + dialTextColor + '" letter-spacing="1.5">CHASTORG</text>' +
        logoMarkup +
      '</svg>';
    return svg;
  }

  function strapMaterialLabel() {
    return state.strapMaterial.name + ' · ' + state.strapColor.name;
  }

  function calcPrice() {
    var total = BASE_PRICE + state.strapMaterial.priceAdd;
    if (state.logoImage) total += LOGO_IMAGE_ADD;
    else if (state.logoText) total += LOGO_TEXT_ADD;
    if (state.engraveText) total += ENGRAVE_ADD;
    return total;
  }

  function updatePreview() {
    document.getElementById('watchSvgHolder').innerHTML = buildWatchSVG();
    document.getElementById('cstAmount').textContent = calcPrice().toLocaleString('ru-RU') + ' ₽';
    var summary = document.getElementById('cstSummary');
    summary.innerHTML =
      '<div><span>Корпус</span><b>' + esc(state.caseColor.name) + '</b></div>' +
      '<div><span>Циферблат</span><b>' + esc(state.dialColor.name) + '</b></div>' +
      '<div><span>Ремешок</span><b>' + esc(strapMaterialLabel()) + '</b></div>' +
      '<div><span>Стрелки/метки</span><b>' + esc(state.accent.name) + '</b></div>' +
      (state.logoImage ? '<div><span>Логотип</span><b>своё изображение</b></div>' :
        state.logoText ? '<div><span>Логотип</span><b>«' + esc(state.logoText) + '»</b></div>' : '') +
      (state.engraveText ? '<div><span>Гравировка</span><b>есть</b></div>' : '');
  }

  function downloadPNG() {
    var svgEl = document.getElementById('watchSvg');
    var xml = new XMLSerializer().serializeToString(svgEl);
    var svgData = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
    var img = new Image();
    img.onload = function () {
      var scale = 3;
      var canvas = document.createElement('canvas');
      canvas.width = 200 * scale;
      canvas.height = 300 * scale;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#f8f6f1';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      var link = document.createElement('a');
      link.download = 'chastorg-custom-watch.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = svgData;
  }

  function readLogoFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      state.logoImage = e.target.result;
      state.logoText = '';
      document.getElementById('logoText').value = '';
      var preview = document.getElementById('logoPreview');
      preview.src = state.logoImage;
      preview.style.display = 'inline-block';
      document.getElementById('logoClear').style.display = 'inline';
      updatePreview();
    };
    reader.readAsDataURL(file);
  }

  function clearLogo() {
    state.logoImage = null;
    document.getElementById('logoFile').value = '';
    document.getElementById('logoPreview').style.display = 'none';
    document.getElementById('logoClear').style.display = 'none';
    updatePreview();
  }

  var ORDERS_KEY = 'chastorg_custom_orders_v1';
  function saveOrder(contact) {
    var orders = [];
    try { orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch (e) {}
    var order = {
      number: Date.now().toString().slice(-6),
      date: new Date().toISOString(),
      config: {
        case: state.caseColor.name,
        dial: state.dialColor.name,
        strap: strapMaterialLabel(),
        accent: state.accent.name,
        logoText: state.logoText || null,
        hasLogoImage: !!state.logoImage,
        engrave: state.engraveText || null,
        price: calcPrice()
      },
      contact: contact
    };
    orders.push(order);
    try { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); } catch (e) {}
    return order.number;
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderSwatches('caseSwatches', CASE_COLORS, 'caseColor');
    renderSwatches('dialSwatches', DIAL_COLORS, 'dialColor');
    renderStrapMaterialChips();
    renderSwatches('strapSwatches', STRAP_COLORS.leather, 'strapColor');
    renderAccentChips();
    updatePreview();

    document.getElementById('logoText').addEventListener('input', function (e) {
      state.logoText = e.target.value.trim();
      if (state.logoText) clearLogo();
      else updatePreview();
    });
    document.getElementById('logoFile').addEventListener('change', function (e) {
      readLogoFile(e.target.files[0]);
    });
    document.getElementById('logoClear').addEventListener('click', clearLogo);
    document.getElementById('engraveText').addEventListener('input', function (e) {
      state.engraveText = e.target.value.trim();
      updatePreview();
    });

    document.getElementById('downloadBtn').addEventListener('click', downloadPNG);

    var orderBtn = document.getElementById('orderBtn');
    var orderForm = document.getElementById('orderForm');
    var orderSuccess = document.getElementById('orderSuccess');
    orderBtn.addEventListener('click', function () {
      orderForm.style.display = orderForm.style.display === 'none' ? 'block' : 'none';
      orderSuccess.classList.remove('visible');
      if (orderForm.style.display === 'block') orderForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.getElementById('ordCancel').addEventListener('click', function () {
      orderForm.style.display = 'none';
    });
    document.getElementById('ordSubmit').addEventListener('click', function () {
      var name = document.getElementById('ordName').value.trim();
      var contact = document.getElementById('ordContact').value.trim();
      var comment = document.getElementById('ordComment').value.trim();
      var errEl = document.getElementById('ordError');
      if (!name || !contact) {
        errEl.textContent = 'Заполните имя и телефон или email — иначе мы не сможем с вами связаться.';
        errEl.style.display = 'block';
        return;
      }
      errEl.style.display = 'none';
      var number = saveOrder({ name: name, contact: contact, comment: comment });
      orderForm.style.display = 'none';
      document.getElementById('ordNumber').textContent = number;
      orderSuccess.classList.add('visible');
      orderSuccess.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });
})();
