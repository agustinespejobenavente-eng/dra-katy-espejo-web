(() => {
  // Titular de la portada: cada palabra entra por separado
  const title = document.querySelector('.hero__title');
  if (title) {
    let i = 0;
    const wrap = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const inner = document.createElement('span'); inner.textContent = part; inner.style.setProperty('--i', i++);
            w.appendChild(inner); frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) { wrap(child); }
      });
    };
    title.setAttribute('aria-label', title.textContent.replace(/\s+/g, ' ').trim());
    wrap(title);
    [...title.children].forEach((c) => c.setAttribute('aria-hidden', 'true'));
    title.classList.add('is-split');
  }

  // Telón de entrada: se quita del DOM al terminar; un clic lo salta
  const intro = document.querySelector('[data-intro]');
  if (intro && document.documentElement.classList.contains('intro-on')) {
    intro.addEventListener('animationend', (e) => { if (e.animationName === 'curtain') intro.remove(); });
    intro.addEventListener('click', () => intro.remove());
  } else if (intro) { intro.remove(); }

  const top = document.querySelector('[data-top]');
  const onScroll = () => top.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  // Menú en celular
  const menu = document.querySelector('[data-menu]');
  const nav = document.getElementById('nav');
  const setMenu = (open) => {
    menu.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    menu.querySelector('.sr').textContent = open ? 'Cerrar menú' : 'Abrir menú';
  };
  menu.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  // Aparición al hacer scroll
  const items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  } else {
    items.forEach((el) => el.classList.add('is-in'));
  }

  // Carrusel de casos
  const track = document.querySelector('[data-track]');
  document.querySelectorAll('[data-scroll]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const card = track.querySelector('.case');
      const step = card ? card.getBoundingClientRect().width + 18 : 300;
      track.scrollBy({ left: step * Number(btn.dataset.scroll), behavior: 'smooth' });
    });
  });

  // Reels: se duplican para que el desplazamiento sea continuo
  const reels = document.querySelector('[data-reels]');
  if (reels && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    [...reels.children].forEach((li) => {
      const copy = li.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      copy.querySelector('a').tabIndex = -1;
      reels.appendChild(copy);
    });
  }

  // +900 se desliza al hacer scroll
  const big = document.querySelector('.bignum__n');
  if (big && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let ticking = false;
    const move = () => {
      const r = big.parentElement.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, 1 - r.top / window.innerHeight));
      big.style.transform = `translateX(${Math.max(0, (0.6 - p) / 0.6) * 10}vw)`;
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true });
    move();
  }

  // Formulario: arma el mensaje y abre WhatsApp
  const form = document.querySelector('[data-form]');
  const err = form.querySelector('[data-err]');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const nombre = String(data.get('nombre') || '').trim();
    if (!nombre) { err.hidden = false; form.nombre.focus(); return; }
    err.hidden = true;
    const msg = `Hola Dra. Katy, soy ${nombre}. Me interesa: ${data.get('tratamiento')}.` +
      (String(data.get('mensaje') || '').trim() ? ` ${String(data.get('mensaje')).trim()}` : '');
    window.open(`https://wa.me/56953253615?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });
})();
