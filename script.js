/* Dra. Katy Espejo — interacciones del sitio */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var esEscritorio = window.matchMedia('(hover: hover) and (pointer: fine)');
  function guardar(clave, valor) { try { sessionStorage.setItem(clave, valor); } catch (e) {} }
  // Desplazamiento animado propio (requestAnimationFrame): el "smooth" nativo se trababa en trayectos largos.
  // Frena al llegar (ease-out), dura según la distancia (máx. ~0,9 s) y respeta "movimiento reducido".
  var animacionScroll = null;
  function irA(el) {
    var header = document.querySelector('.site-header');
    var destino = Math.max(0, el.getBoundingClientRect().top + window.scrollY - (header ? header.offsetHeight : 0));
    var inicio = window.scrollY;
    var distancia = destino - inicio;
    if (animacionScroll) cancelAnimationFrame(animacionScroll);
    if (reduce.matches || Math.abs(distancia) < 4) { window.scrollTo(0, destino); return; }
    var duracion = Math.min(900, 350 + Math.abs(distancia) * 0.12);
    var t0 = null;
    var ease = function (t) { return 1 - Math.pow(1 - t, 4); };
    var paso = function (ahora) {
      if (t0 === null) t0 = ahora;
      var t = Math.min(1, (ahora - t0) / duracion);
      window.scrollTo(0, inicio + distancia * ease(t));
      animacionScroll = t < 1 ? requestAnimationFrame(paso) : null;
    };
    animacionScroll = requestAnimationFrame(paso);
    // Seguro: si el navegador no anima (pestaña en segundo plano, ahorro de energía), llega igual a la sección
    setTimeout(function () {
      if (animacionScroll && t0 === null) { cancelAnimationFrame(animacionScroll); animacionScroll = null; window.scrollTo(0, destino); }
    }, 250);
  }
  // Si la persona usa la rueda o el dedo durante la animación, se le devuelve el control
  ['wheel', 'touchstart', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function () { if (animacionScroll) { cancelAnimationFrame(animacionScroll); animacionScroll = null; } }, { passive: true });
  });

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------- Intro (una vez por sesión, se puede saltar) ---------- */
    var intro = document.getElementById('intro');
    if (intro && !root.classList.contains('sin-intro')) {
      root.classList.add('intro-activa');
      var cerrado = false;
      var onKey = function (e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') cerrarIntro(); };
      var cerrarIntro = function () {
        if (cerrado) return;
        cerrado = true;
        intro.classList.add('salir');
        root.classList.remove('intro-activa');
        guardar('intro-vista', '1');
        document.removeEventListener('keydown', onKey);
        setTimeout(function () { intro.remove(); }, 700);
      };
      intro.addEventListener('click', cerrarIntro);
      document.addEventListener('keydown', onKey);
      setTimeout(cerrarIntro, 2000);
    } else if (intro) {
      intro.remove();
    }

    /* ---------- Menú móvil ---------- */
    var menuBtn = document.getElementById('menu-toggle');
    var menu = document.getElementById('mobile-menu');
    var setMenu = function (abierto) {
      menu.hidden = !abierto;
      menuBtn.setAttribute('aria-expanded', String(abierto));
      menuBtn.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
    };
    menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
    menu.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      // Cerrar primero y luego desplazar: si no, el salto se pierde al ocultar el menú
      e.preventDefault();
      setMenu(false);
      var destino = document.querySelector(a.getAttribute('href'));
      if (destino) requestAnimationFrame(function () { irA(destino); history.replaceState(null, '', a.getAttribute('href')); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); } });

    /* ---------- Todos los enlaces internos (#seccion) usan el desplazamiento animado ---------- */
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href') === '#') return;
      var destino = document.querySelector(a.getAttribute('href'));
      if (!destino) return;
      e.preventDefault();
      irA(destino);
      history.replaceState(null, '', a.getAttribute('href'));
      // Para teclado y lector de pantalla: el foco acompaña al salto, sin volver a desplazar
      if (!destino.hasAttribute('tabindex')) destino.setAttribute('tabindex', '-1');
      destino.focus({ preventScroll: true });
    });

    /* ---------- Enlace activo según la sección visible ---------- */
    var navLinks = document.querySelectorAll('[data-nav]');
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          navLinks.forEach(function (a) {
            if (a.dataset.nav === en.target.id) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      ['inicio', 'quien-soy', 'servicios', 'resultados', 'contacto'].forEach(function (id) {
        var s = document.getElementById(id);
        if (s) obs.observe(s);
      });
    }

    /* ---------- Barra rápida móvil: aparece cuando los botones del inicio ya no se ven ---------- */
    var quick = document.getElementById('quick-bar');
    var heroCtas = document.getElementById('hero-ctas');
    if (quick && heroCtas && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        quick.classList.toggle('is-visible', !entries[0].isIntersecting);
      }).observe(heroCtas);
    } else if (quick) {
      quick.classList.add('is-visible');
    }

    /* ---------- Carrusel de casos: automático, con vecinos visibles y tipos arriba ---------- */
    var carousel = document.getElementById('cases');
    var viewport = carousel.querySelector('.carousel-viewport');
    var track = document.getElementById('case-track');
    var slides = Array.prototype.slice.call(track.querySelectorAll('.case'));
    var chips = Array.prototype.slice.call(carousel.querySelectorAll('.case-type'));
    var total = slides.length;
    var actual = 0;
    var INTERVALO = 6000;
    track.style.position = 'relative';

    var centrar = function () {
      var s = slides[actual];
      var padL = parseFloat(getComputedStyle(viewport).paddingLeft) || 0;
      var x = (viewport.clientWidth / 2 - padL) - (s.offsetLeft + s.offsetWidth / 2);
      track.style.transform = 'translateX(' + x + 'px)';
    };
    var irACaso = function (i) {
      actual = (i + total) % total;
      slides.forEach(function (s, j) {
        var activo = j === actual;
        s.classList.toggle('is-active', activo);
        s.inert = !activo; // solo el caso visible recibe foco y lector de pantalla
      });
      // El tipo de arriba se marca según la categoría del caso visible (hay varios casos por tipo)
      var tipo = slides[actual].dataset.tipo;
      chips.forEach(function (c) {
        if (c.dataset.tipo === tipo) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
      });
      centrar();
    };

    // Avance automático: no corre con movimiento reducido; se pausa al interactuar o si no se ve
    var pausadoPorUsuario = reduce.matches;
    var pausasTemporales = { hover: false, foco: false, arrastre: false, fuera: true, manual: false };
    var manualTimer = null;
    var timer = null;
    var debeCorrer = function () {
      if (pausadoPorUsuario) return false;
      for (var k in pausasTemporales) if (pausasTemporales[k]) return false;
      return true;
    };
    var programar = function () {
      clearInterval(timer);
      // Con la pestaña oculta el navegador ya frena los temporizadores; no se usa visibilitychange porque algunos visores lo informan mal
      timer = debeCorrer() ? setInterval(function () { irACaso(actual + 1); }, INTERVALO) : null;
    };
    var setPausa = function (motivo, valor) { pausasTemporales[motivo] = valor; programar(); };

    // Botón de pausa junto a los tipos de caso (pauta WCAG 2.2.2: control para detener lo que se mueve solo)
    var playBtn = document.getElementById('case-play');
    var syncPlay = function () {
      playBtn.setAttribute('aria-pressed', String(pausadoPorUsuario));
      playBtn.setAttribute('aria-label', pausadoPorUsuario ? 'Reanudar el carrusel' : 'Pausar el carrusel');
      playBtn.title = pausadoPorUsuario ? 'Reanudar' : 'Pausar';
    };
    playBtn.addEventListener('click', function () { pausadoPorUsuario = !pausadoPorUsuario; syncPlay(); programar(); });
    syncPlay();

    // Elegir un caso a mano da tiempo para mirarlo: el avance automático retoma tras 12 s sin tocar nada
    var elegir = function (i) {
      irACaso(i);
      setPausa('manual', true);
      clearTimeout(manualTimer);
      manualTimer = setTimeout(function () { setPausa('manual', false); }, 12000);
    };
    // Cada tipo lleva al primer caso de esa categoría; si ya se está viendo ese tipo, pasa al siguiente caso del mismo tipo
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        var delTipo = [];
        slides.forEach(function (s, j) { if (s.dataset.tipo === c.dataset.tipo) delTipo.push(j); });
        if (!delTipo.length) return;
        var pos = delTipo.indexOf(actual);
        elegir(pos === -1 ? delTipo[0] : delTipo[(pos + 1) % delTipo.length]);
      });
    });
    // Flechas a los lados
    document.getElementById('case-prev').addEventListener('click', function () { elegir(actual - 1); });
    document.getElementById('case-next').addEventListener('click', function () { elegir(actual + 1); });
    slides.forEach(function (s, j) { s.addEventListener('click', function () { if (j !== actual) elegir(j); }); });

    carousel.addEventListener('mouseenter', function () { setPausa('hover', true); });
    carousel.addEventListener('mouseleave', function () { setPausa('hover', false); });
    carousel.addEventListener('focusin', function () { setPausa('foco', true); });
    carousel.addEventListener('focusout', function (e) { if (!carousel.contains(e.relatedTarget)) setPausa('foco', false); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { setPausa('fuera', !entries[0].isIntersecting); }, { threshold: 0.35 }).observe(carousel);
    } else {
      setPausa('fuera', false);
    }

    // Deslizar con el dedo sobre la tarjeta
    var inicioX = null, inicioY = null, dx = 0;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse') return;
      inicioX = e.clientX; inicioY = e.clientY; dx = 0;
      setPausa('arrastre', true);
    });
    track.addEventListener('pointermove', function (e) {
      if (inicioX === null) return;
      dx = e.clientX - inicioX;
      if (Math.abs(dx) > Math.abs(e.clientY - inicioY) && Math.abs(dx) > 8) track.classList.add('dragging');
    });
    var soltar = function () {
      if (inicioX !== null && Math.abs(dx) > 50) elegir(actual + (dx < 0 ? 1 : -1));
      inicioX = null; dx = 0;
      track.classList.remove('dragging');
      setPausa('arrastre', false);
    };
    track.addEventListener('pointerup', soltar);
    track.addEventListener('pointercancel', soltar);
    document.addEventListener('pointerup', function () { if (pausasTemporales.arrastre && inicioX === null) setPausa('arrastre', false); });

    carousel.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); elegir(actual + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); elegir(actual - 1); }
    });
    window.addEventListener('resize', centrar);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(centrar);
    irACaso(0);
    programar();

    /* ---------- "Quiero este tratamiento" rellena el motivo del formulario ---------- */
    var select = document.getElementById('f-servicio');
    document.querySelectorAll('[data-motivo]').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        select.value = b.dataset.motivo;
        irA(document.getElementById('contacto'));
        history.replaceState(null, '', '#contacto');
        // Solo en escritorio: en el celular abrir el teclado sin pedirlo molesta
        if (esEscritorio.matches) document.getElementById('f-nombre').focus({ preventScroll: true });
      });
    });

    /* ---------- Formulario ---------- */
    var form = document.getElementById('contact-form');
    var status = document.getElementById('form-status');
    var submit = document.getElementById('form-submit');
    var reglas = [
      { id: 'f-nombre', ok: function (el) { return el.value.trim().length > 1; } },
      { id: 'f-tel', ok: function (el) { return el.value.replace(/\D/g, '').length >= 8; } },
      { id: 'f-email', ok: function (el) { return !el.value || el.checkValidity(); } },
      { id: 'f-ok', ok: function (el) { return el.checked; } }
    ];
    var validar = function (r) {
      var el = document.getElementById(r.id);
      var valido = r.ok(el);
      var campo = el.closest('.field');
      campo.classList.toggle('invalid', !valido);
      el.setAttribute('aria-invalid', String(!valido));
      var err = campo.querySelector('.field-error');
      if (!valido && err) el.setAttribute('aria-describedby', err.id); else el.removeAttribute('aria-describedby');
      return valido;
    };
    reglas.forEach(function (r) {
      var el = document.getElementById(r.id);
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'blur', function () {
        if (el.type !== 'checkbox' || el.closest('.field').classList.contains('invalid')) validar(r);
      });
    });
    var limpiar = function () {
      form.reset();
      reglas.forEach(function (r) {
        var el = document.getElementById(r.id);
        el.closest('.field').classList.remove('invalid');
        el.removeAttribute('aria-invalid');
      });
    };
    // En local y en la vista previa de GitHub Pages el formulario no envía (el envío real es con Netlify Forms)
    var esLocal = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || /\.github\.io$/.test(location.hostname) || location.protocol === 'file:';

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.classList.remove('error');
      var primero = null;
      reglas.forEach(function (r) { if (!validar(r) && !primero) primero = document.getElementById(r.id); });
      if (primero) { status.textContent = ''; primero.focus(); return; }

      if (esLocal) {
        status.textContent = 'Prototipo: en el sitio publicado, tus datos le llegarían a la Dra. Katy por correo.';
        limpiar();
        return;
      }
      // Envío real a Netlify Forms
      submit.setAttribute('aria-busy', 'true');
      submit.textContent = 'Enviando…';
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (res) {
        if (!res.ok) throw new Error(res.status);
        status.textContent = '¡Gracias! Recibí tus datos y te escribo dentro del día hábil.';
        limpiar();
      }).catch(function () {
        status.classList.add('error');
        status.textContent = 'No se pudo enviar. Revisa tu conexión e inténtalo de nuevo, o escríbeme por WhatsApp.';
      }).then(function () {
        submit.removeAttribute('aria-busy');
        submit.textContent = 'Enviar mis datos';
      });
    });

    document.getElementById('year').textContent = new Date().getFullYear();
  });
})();
