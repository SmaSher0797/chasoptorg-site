// ЧасОптТорг — общие интерактивные элементы
document.addEventListener('DOMContentLoaded', function () {
  // Табы (продукт, аккаунт, авторизация)
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var buttons = group.querySelectorAll('[data-tab-btn]');
    var panels = group.querySelectorAll('[data-tab-panel]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        buttons.forEach(function (b) { b.classList.remove('active'); });
        panels.forEach(function (p) { p.style.display = 'none'; });
        btn.classList.add('active');
        var target = group.querySelector('[data-tab-panel="' + btn.dataset.tabBtn + '"]');
        if (target) target.style.display = 'block';
      });
    });
  });

  // Степпер количества
  document.querySelectorAll('.qty-stepper').forEach(function (stepper) {
    var input = stepper.querySelector('input');
    stepper.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var val = parseInt(input.value || '1', 10);
        val = btn.dataset.step === 'up' ? val + 1 : Math.max(1, val - 1);
        input.value = val;
      });
    });
  });

  // Мобильное меню
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.main-nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      nav.classList.toggle('nav-open');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { nav.classList.remove('nav-open'); });
    });
  }

  // Мобильная панель фильтров каталога
  var filters = document.querySelector('.filters');
  var filtersToggle = document.querySelector('.filters-toggle');
  var filtersOverlay = document.querySelector('.filters-overlay');
  var filtersClose = document.querySelector('.filters-close');
  function openFilters() {
    if (filters) filters.classList.add('filters-open');
    if (filtersOverlay) filtersOverlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }
  function closeFilters() {
    if (filters) filters.classList.remove('filters-open');
    if (filtersOverlay) filtersOverlay.classList.remove('visible');
    document.body.style.overflow = '';
  }
  if (filtersToggle) filtersToggle.addEventListener('click', openFilters);
  if (filtersClose) filtersClose.addEventListener('click', closeFilters);
  if (filtersOverlay) filtersOverlay.addEventListener('click', closeFilters);
  if (filters) {
    var resetBtn = filters.querySelector('#resetFilters');
    if (resetBtn) resetBtn.addEventListener('click', closeFilters);
  }

  // Подсветка активного пункта меню (по текущей странице + категории в URL)
  var navLinks = document.querySelectorAll('.main-nav a');
  if (navLinks.length) {
    var curPath = location.pathname.split('/').pop() || 'index.html';
    var curCat = new URLSearchParams(location.search).get('cat');
    navLinks.forEach(function (a) {
      var linkUrl;
      try { linkUrl = new URL(a.getAttribute('href'), location.href); } catch (e) { return; }
      var linkPath = linkUrl.pathname.split('/').pop() || 'index.html';
      var linkCat = new URLSearchParams(linkUrl.search).get('cat');
      var isMatch = linkPath === curPath && linkCat === curCat;
      a.classList.toggle('active', isMatch);
    });
  }

  // Баннер согласия на использование cookie (152-ФЗ)
  var COOKIE_KEY = 'chastorg_cookie_consent_v1';
  try {
    if (!localStorage.getItem(COOKIE_KEY)) {
      var banner = document.createElement('div');
      banner.className = 'cookie-banner';
      banner.innerHTML =
        '<div class="cookie-banner-text">Мы используем файлы cookie для улучшения работы сайта и персонализации контента. Продолжая пользоваться сайтом, вы соглашаетесь с <a href="policy.html">политикой обработки персональных данных</a>.</div>' +
        '<div class="cookie-banner-actions"><button type="button" class="btn btn-gold btn-sm" data-cookie-accept>Понятно</button></div>';
      document.body.appendChild(banner);
      requestAnimationFrame(function () { banner.classList.add('visible'); });
      banner.querySelector('[data-cookie-accept]').addEventListener('click', function () {
        try { localStorage.setItem(COOKIE_KEY, '1'); } catch (e) {}
        banner.classList.remove('visible');
        setTimeout(function () { banner.remove(); }, 300);
      });
    }
  } catch (e) {}

  // Анимация стрелок часов (главная витрина + логотип) при прокрутке
  var watchFace = document.querySelector('.watch-face');
  var logoSvgs = document.querySelectorAll('.logo svg, .footer-logo svg');
  if (watchFace || logoSvgs.length) {
    var updateWatchHands = function () {
      var angle1 = 35 + window.scrollY * 0.5;
      var angle2 = 110 + window.scrollY * 1.3;
      if (watchFace) {
        watchFace.style.setProperty('--hand-angle', angle1 + 'deg');
        watchFace.style.setProperty('--hand2-angle', angle2 + 'deg');
      }
      if (logoSvgs.length) {
        var logoAngle1 = window.scrollY * 0.9;
        var logoAngle2 = window.scrollY * 2.4;
        logoSvgs.forEach(function (svg) {
          svg.style.setProperty('--logo-hand1-angle', logoAngle1 + 'deg');
          svg.style.setProperty('--logo-hand2-angle', logoAngle2 + 'deg');
        });
      }
    };
    window.addEventListener('scroll', updateWatchHands, { passive: true });
    updateWatchHands();
  }

  // Кнопка "наверх"
  var toTop = document.createElement('button');
  toTop.type = 'button';
  toTop.className = 'to-top-btn';
  toTop.setAttribute('aria-label', 'Наверх');
  toTop.innerHTML = '<svg fill="none" viewBox="0 0 24 24" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.appendChild(toTop);
  window.addEventListener('scroll', function () {
    toTop.classList.toggle('visible', window.scrollY > 500);
  });
  toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});
