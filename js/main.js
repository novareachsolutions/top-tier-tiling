/* =========================================================
   Top Tier Tiling Group — site scripts (no libraries needed)
   ========================================================= */
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Mobile menu ---------- */
  const toggle = $('.nav-toggle');
  const links = $('.nav-links');
  if (toggle && links) {
    const setOpen = (open) => {
      links.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };
    toggle.addEventListener('click', () => setOpen(!links.classList.contains('is-open')));
    links.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('click', (e) => { if (!e.target.closest('.navbar')) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }

  /* ---------- Services dropdown ---------- */
  $$('.nav-dd').forEach((dropdown) => {
    const button = $('.nav-dd__toggle', dropdown);
    const setOpen = (open) => {
      dropdown.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
    };
    button.addEventListener('click', () => setOpen(!dropdown.classList.contains('is-open')));
    document.addEventListener('click', (e) => { if (!dropdown.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  });

  /* ---------- Accordions (FAQ + services) ----------
     data-accordion="toggle"  → items can all be closed
     data-accordion="always"  → one item always stays open */
  $$('[data-accordion]').forEach((group) => {
    const mode = group.dataset.accordion;
    const items = $$('[data-accordion-item]', group);
    const images = $$('[data-accordion-image]', group);

    const setItem = (item, open) => {
      item.classList.toggle('is-open', open);
      $(':scope > button', item).setAttribute('aria-expanded', String(open));
      $(':scope > .collapse', item).inert = !open;
    };

    items.forEach((item, index) => {
      setItem(item, item.classList.contains('is-open'));
      $(':scope > button', item).addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');
        if (isOpen && mode === 'always') return;
        items.forEach((other) => setItem(other, other === item ? !isOpen : false));
        images.forEach((img, i) => img.classList.toggle('is-active', i === index));
      });
    });
  });

  /* ---------- Quote form ----------
     The browser checks required fields before this runs.
     TODO: send the data to a form service (Formspree, Netlify Forms, your own API)
     so enquiries actually reach toptiertiling@outlook.com. */
  $$('[data-contact-form]').forEach((form) => {
    const status = $('[data-form-status]', form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.reset();
      if (status) {
        status.hidden = false;
        status.textContent = "Thanks — your quote request has been received. We'll be in touch soon.";
      }
    });
  });

  /* ---------- Count-up numbers ---------- */
  const runCounter = (el) => {
    const target = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = target; return; }
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* ---------- Scroll reveal ---------- */
  $$('[data-stagger]').forEach((parent) => {
    [...parent.children].forEach((child, i) => {
      child.setAttribute('data-reveal', '');
      child.style.setProperty('--delay', `${i * 0.1}s`);
    });
  });

  const revealEls = $$('[data-reveal]');
  const counters = $$('[data-count]');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        observer.unobserve(el);
        if (el.hasAttribute('data-count')) { runCounter(el); return; }
        el.classList.add('is-visible');
        // Hand the element back to its own hover styles once it has arrived.
        el.addEventListener('transitionend', () => {
          el.removeAttribute('data-reveal');
          el.style.removeProperty('--delay');
        }, { once: true });
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el) => observer.observe(el));
    counters.forEach((el) => { el.textContent = '0'; observer.observe(el); });
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Process timeline progress line ---------- */
  $$('[data-steps]').forEach((steps) => {
    const line = $('.steps__progress', steps);
    if (!line) return;
    const update = () => {
      const rect = steps.getBoundingClientRect();
      const progress = Math.min(Math.max((window.innerHeight * 0.6 - rect.top) / rect.height, 0), 1);
      line.style.height = `${progress * 100}%`;
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  });

  /* ---------- Footer year ---------- */
  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
})();
