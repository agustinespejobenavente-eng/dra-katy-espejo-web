(() => {
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
