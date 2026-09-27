/* =========================================================
   Top Tier Tiling Group — site scripts
   Core behaviour needs no libraries. Two motion layers sit on top when
   the visitor hasn't asked for reduced motion:
   - GSAP + ScrollTrigger + Lenis: scroll storytelling (reveals, parallax, pinning)
   - Motion: UI interactions (menus, buttons, page transitions)
   ========================================================= */
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const refreshScroll = () => { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); };
  const entering = document.documentElement.classList.contains('is-entering');

  /* ---------- Mobile menu ---------- */
  const toggle = $('.nav-toggle');
  const links = $('.nav-links');
  if (toggle && links) {
    const setOpen = (open) => {
      const changed = links.classList.contains('is-open') !== open;
      links.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (changed) links.dispatchEvent(new CustomEvent('menuchange', { detail: open }));
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
      const changed = dropdown.classList.contains('is-open') !== open;
      dropdown.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
      if (changed) dropdown.dispatchEvent(new CustomEvent('menuchange', { detail: open }));
    };
    button.addEventListener('click', () => setOpen(!dropdown.classList.contains('is-open')));
    document.addEventListener('click', (e) => { if (!dropdown.contains(e.target)) setOpen(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  });

  /* ---------- Floating nav ----------
     Once the in-page nav has scrolled away it becomes fixed: hidden while
     scrolling down, back in view when scrolling up. A spacer holds its place
     so nothing jumps, and it only returns to the flow at the very top,
     where the fixed and in-flow positions line up. While floating it lives
     directly under <body>, so a transformed ancestor (e.g. the pinned hero)
     can't drag it along. */
  const navbar = $('.navbar');
  if (navbar) {
    const spacer = document.createElement('div');
    spacer.setAttribute('aria-hidden', 'true');
    navbar.before(spacer);
    let fixed = false;
    let lastY = window.scrollY;
    const menuOpen = () => navbar.querySelector('.is-open') !== null;
    const moveTo = (place) => {
      const focused = navbar.contains(document.activeElement) ? document.activeElement : null;
      place(navbar);
      if (focused) focused.focus({ preventScroll: true });
    };

    const update = () => {
      const y = window.scrollY;
      const passed = y > spacer.offsetTop + navbar.offsetHeight + 40;

      if (!fixed && passed) {
        const margin = parseFloat(getComputedStyle(navbar).marginTop);
        spacer.style.height = `${navbar.offsetHeight + margin}px`;
        navbar.classList.add('no-anim', 'is-fixed', 'is-hidden');
        moveTo((el) => document.body.append(el));
        void navbar.offsetWidth; // apply the hidden state before transitions return
        navbar.classList.remove('no-anim');
        fixed = true;
      } else if (fixed && y <= 4) {
        navbar.classList.add('no-anim');
        navbar.classList.remove('is-fixed', 'is-hidden');
        moveTo((el) => spacer.after(el));
        spacer.style.height = '';
        void navbar.offsetWidth;
        navbar.classList.remove('no-anim');
        fixed = false;
      } else if (fixed && Math.abs(y - lastY) > 4) {
        navbar.classList.toggle('is-hidden', y > lastY && passed && !menuOpen());
      }
      lastY = y;
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

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
        // Page height changed — let scroll-linked animations re-measure.
        setTimeout(refreshScroll, 550);
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

  /* ---------- Staggered groups ---------- */
  $$('[data-stagger]').forEach((parent) => {
    [...parent.children].forEach((child, i) => {
      child.setAttribute('data-reveal', '');
      child.style.setProperty('--delay', `${i * 0.1}s`);
    });
  });

  /* ---------- Motion layer (GSAP + ScrollTrigger + Lenis) ----------
     Runs before the reveal observer so it can take over the elements it
     animates itself (hero, headings, images). */
  if (!reduceMotion && window.gsap && window.ScrollTrigger) initMotion();
  if (!reduceMotion && window.Motion) initUiMotion();
  document.documentElement.classList.remove('is-entering', 'is-intro');

  /* ---------- Scroll reveal (everything else) ---------- */
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

  /* =========================================================
     Motion
     ========================================================= */
  function initMotion() {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);
    // Mobile browsers resize the viewport as the address bar shows/hides; don't re-measure for that.
    ScrollTrigger.config({ ignoreMobileResize: true });
    document.documentElement.classList.add('has-motion');
    const ease = 'expo.out';
    const radius = (el) => getComputedStyle(el).borderTopLeftRadius;
    const unreveal = (el) => { el.removeAttribute('data-reveal'); el.style.removeProperty('--delay'); };

    /* Smooth scroll. Touch devices keep native scrolling (Lenis default). */
    if (window.Lenis) {
      const lenis = new window.Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
      // In-page links glide; the skip link keeps its native jump so focus moves too.
      $$('a[href^="#"]:not(.skip-link)').forEach((a) => {
        const target = a.getAttribute('href').length > 1 && $(a.getAttribute('href'));
        if (target) a.addEventListener('click', (e) => { e.preventDefault(); lenis.scrollTo(target, { offset: -24 }); });
      });
    }

    /* Wrap each word of a heading in a mask so it can rise into place. */
    const splitWords = (el) => {
      const walk = (node) => {
        [...node.childNodes].forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.append(part); return; }
              const outer = document.createElement('span');
              const inner = document.createElement('span');
              outer.className = 'w';
              inner.className = 'w__i';
              inner.textContent = part;
              outer.append(inner);
              frag.append(outer);
            });
            child.replaceWith(frag);
          } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
            walk(child);
          }
        });
      };
      walk(el);
      return $$('.w__i', el);
    };

    /* Line index of each split word, so a block of text can rise line by line. */
    const lineOf = (words) => {
      let top = null;
      let line = -1;
      return words.map((word) => {
        const y = Math.round(word.parentElement.offsetTop);
        if (y !== top) { top = y; line += 1; }
        return line;
      });
    };
    const revealLines = (el, vars = {}) => {
      const words = splitWords(el);
      const lines = lineOf(words);
      return gsap.from(words, { yPercent: 115, duration: 1.2, ease, stagger: (i) => lines[i] * 0.12, ...vars });
    };

    /* ---- Page intro: nav, hero image, headline ---- */
    /* Scroll-played frame sequences ([data-sequence]). Portrait phones get a lighter, pre-cropped
       frame set; data-saver and 2G connections keep the still image. */
    const conn = navigator.connection;
    const lowData = !!conn && (conn.saveData || /2g/.test(conn.effectiveType || ''));
    const phone = window.matchMedia('(max-width: 767px) and (orientation: portrait)').matches;
    const sequenceFor = (host, { eager = false } = {}) => {
      if (!host || !host.dataset.sequence || lowData) return null;
      const d = host.dataset;
      return createSequence(host, phone
        ? { path: d.sequenceMobile, count: Number(d.sequenceMobileCount), focusX: 0.5, eager }
        : { path: d.sequence, count: Number(d.sequenceCount), focusX: Number(d.sequenceFocus || 0.5), eager });
    };

    // Behind a curtain (logo intro / page transition) the intro waits until the curtain lifts.
    const waitForCurtain = entering && !!window.Motion;
    const intro = gsap.timeline({ defaults: { ease }, paused: waitForCurtain });
    if (waitForCurtain) {
      const play = () => { if (!intro.isActive() && intro.progress() === 0) intro.play(); };
      document.addEventListener('curtain:lift', play, { once: true });
      setTimeout(play, 3500); // never leave the page waiting
    }
    let sequence = null;
    const banner = $('header.banner');
    if (navbar) intro.from(navbar, { yPercent: -60, autoAlpha: 0, duration: 1.2, clearProps: 'all' }, 0);

    if (banner) {
      const bg = $('.banner__bg', banner);
      // Home hero: a camera move played by scroll (frames start loading straight away).
      sequence = sequenceFor(bg, { eager: true });
      const content = $('.hero, .banner__content', banner);
      const title = $('h1', banner);
      [content, ...$$('[data-reveal]', banner)].forEach((el) => el && unreveal(el));

      const words = title ? splitWords(title) : [];
      const titleLines = lineOf(words);
      const lead = $('.banner__lead', banner);
      const leadWords = lead ? splitWords(lead) : [];
      const leadLines = lineOf(leadWords);
      const supporting = $$('.eyebrow, .breadcrumb, .actions', banner).filter((el) => !el.closest('.hero-card'));
      const card = $('.hero-card', banner);
      const rule = $('.hero__foot', banner);

      // The image itself arrives still — it reads as a photograph; motion only starts with the scroll.
      intro
        .from(words, { yPercent: 115, duration: 1.3, stagger: (i) => titleLines[i] * 0.14 }, 0.2)
        .from(leadWords, { yPercent: 115, duration: 1.1, stagger: (i) => leadLines[i] * 0.08 }, 0.5)
        .from(supporting, { y: 24, autoAlpha: 0, duration: 1.1, stagger: 0.1 }, 0.45);
      if (rule) intro.fromTo(rule, { borderTopColor: 'rgba(255,255,255,0)' }, { borderTopColor: 'rgba(255,255,255,.18)', duration: 1.2 }, 0.45);
      if (card) intro.from(card, { y: 40, autoAlpha: 0, duration: 1.2 }, 0.7);
    }

    /* ---- Headings: words rise out of their masks ---- */
    $$('main h1, main h2.h2, main h2.h3, [data-split]').forEach((heading) => {
      revealLines(heading, { scrollTrigger: { trigger: heading, start: 'top 88%', once: true } });
    });
    $$('main .lead').forEach((lead) => {
      revealLines(lead, { duration: 1, scrollTrigger: { trigger: lead, start: 'top 90%', once: true } });
    });

    /* ---- Images: mask reveal, then gentle parallax ---- */
    const mm = gsap.matchMedia();
    const parallax = [];

    $$('main .media, main .svc-media, main .tile').forEach((media) => {
      unreveal(media);
      const r = radius(media);
      gsap.fromTo(media,
        { clipPath: `inset(100% 0% 0% 0% round ${r})` },
        {
          clipPath: `inset(0% 0% 0% 0% round ${r})`,
          duration: 1.6,
          ease: 'expo.inOut',
          scrollTrigger: { trigger: media, start: 'top 88%', once: true },
          onComplete: () => gsap.set(media, { clearProps: 'clipPath' }),
        });

      if (!media.classList.contains('media')) return; // accordion images and project tiles keep their own hover
      const img = $('img', media);
      gsap.fromTo(img, { scale: 1.35 }, {
        scale: 1.12, duration: 2, ease,
        scrollTrigger: { trigger: media, start: 'top 88%', once: true },
      });
      parallax.push([media, img]);
    });

    /* Desktop / tablet: layered depth. Phones skip scrubbed effects to stay light. */
    mm.add('(min-width: 768px)', () => {
      parallax.forEach(([media, img]) => {
        gsap.fromTo(img, { yPercent: -5 }, {
          yPercent: 5, ease: 'none',
          scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
      // Layered compositions: [data-depth] pieces drift against the scroll for depth.
      $$('[data-depth]').forEach((el) => {
        const d = Number(el.dataset.depth) || 1;
        gsap.fromTo(el, { y: 60 * d }, {
          y: -60 * d, ease: 'none',
          scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
      if (banner && !sequence) {
        const out = { trigger: banner, start: 'top top', end: 'bottom top', scrub: true };
        gsap.to($('.banner__bg img', banner), { yPercent: 14, ease: 'none', scrollTrigger: out });
        gsap.to($('.hero, .banner__content', banner), { y: -90, autoAlpha: 0.15, ease: 'none', scrollTrigger: { ...out, start: 'center 45%' } });
      }
    });

    /* ---- Home hero: pin it and let the scroll drive the camera ----
       The copy steps aside early so the move reads cleanly. If the hero is taller than the
       screen (small phones), it pins by its bottom edge so nothing is cut off. */
    if (banner && sequence) {
      const state = { progress: 0 };
      const fitsScreen = () => banner.offsetHeight + 24 <= window.innerHeight;
      gsap.timeline({
        scrollTrigger: {
          trigger: banner,
          start: () => (fitsScreen() ? 'top 12px' : 'bottom bottom-=8'),
          end: () => `+=${Math.round(window.innerHeight * (window.innerWidth < 768 ? 1.1 : 1.4))}`,
          pin: true,
          scrub: window.innerWidth < 768 ? true : 0.6,
          invalidateOnRefresh: true,
        },
      })
        .to(state, { progress: 1, ease: 'none', duration: 1, onUpdate: () => sequence.set(state.progress) }, 0)
        .to($('.hero', banner), { y: -120, autoAlpha: 0, ease: 'power1.in', duration: 0.45 }, 0.08)
        .to(banner, { '--scrim': 0.35, ease: 'none', duration: 0.4 }, 0.3);
    }

    /* ---- Tiles we supply: pinned copy while tile textures layer in ---- */
    mm.add('(min-width: 992px)', () => {
      $$('[data-tile-story]').forEach((section) => {
        const layers = $$('.tile-stack__layer', section);
        if (!layers.length) return;
        const tl = gsap.timeline({
          scrollTrigger: { trigger: $('.about', section), start: 'center center', end: `+=${layers.length * 60}%`, pin: true, scrub: 0.8 },
        });
        layers.forEach((layer, i) => {
          tl.fromTo(layer, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'none' }, i)
            .fromTo($('img', layer), { scale: 1.25, yPercent: 6 }, { scale: 1, yPercent: 0, ease: 'none' }, i);
        });
      });
    });

    /* ---- Sections that tint the page background while in view ---- */
    $$('[data-bg]').forEach((section) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 55%',
        end: 'bottom 45%',
        onToggle: (self) => gsap.to(document.body, {
          backgroundColor: self.isActive ? section.dataset.bg : '#ffffff',
          duration: 1, ease: 'power2.out', overwrite: true,
        }),
      });
    });

    /* ---- Showcase: the image opens out to full frame as it scrolls in ---- */
    $$('.showcase').forEach((section) => {
      const media = $('.showcase__media', section);
      const seq = sequenceFor(media);
      const img = [$('img', media), seq && seq.canvas].filter(Boolean);
      if (seq) {
        // Frames download only as the section approaches, then play across its whole pass.
        ScrollTrigger.create({ trigger: section, start: 'top bottom+=100%', once: true, onEnter: seq.start });
        const state = { progress: 0 };
        gsap.to(state, {
          progress: 1, ease: 'none', onUpdate: () => seq.set(state.progress),
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: phone ? true : 0.6 },
        });
      }
      const scrub = { trigger: section, start: 'top 95%', end: 'top 10%', scrub: true };
      const inset = window.innerWidth < 768 ? '8% 6% 8% 6%' : '14% 18% 14% 18%';
      gsap.fromTo(media, { clipPath: `inset(${inset} round 32px)` }, { clipPath: 'inset(0% 0% 0% 0% round 32px)', ease: 'none', scrollTrigger: scrub });
      gsap.fromTo(img, { scale: 1.35 }, { scale: 1, ease: 'none', scrollTrigger: scrub });
      gsap.fromTo(img, { yPercent: 0 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
      });
    });

    /* ---- Type marquee: rows slide in opposite directions with the scroll ---- */
    $$('[data-marquee]').forEach((track) => {
      const dir = Number(track.dataset.marquee) || -1;
      gsap.fromTo(track, { xPercent: dir < 0 ? 0 : -30 }, {
        xPercent: dir < 0 ? -30 : 0, ease: 'none',
        scrollTrigger: { trigger: track.parentElement, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      });
    });

    /* ---- Footer wordmark rises as the footer arrives ---- */
    $$('.footer__mark').forEach((mark) => {
      gsap.fromTo(mark, { yPercent: 70 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: mark.closest('footer'), start: 'top bottom', end: 'bottom bottom', scrub: true },
      });
    });

    /* ---- Desktop: dark panels widen to full frame as they arrive ---- */
    mm.add('(min-width: 992px)', () => {
      $$('.section--dark').forEach((section) => {
        gsap.fromTo(section, { clipPath: 'inset(0% 4% 0% 4% round 48px)' }, {
          clipPath: 'inset(0% 0% 0% 0% round 32px)', ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'top 30%', scrub: true },
        });
      });
    });

    /* ---- Fine pointers: cursor ring ---- */
    mm.add('(hover: hover) and (pointer: fine)', () => {
      const cursor = document.createElement('div');
      cursor.className = 'cursor';
      cursor.setAttribute('aria-hidden', 'true');
      document.body.append(cursor);
      gsap.set(cursor, { xPercent: -50, yPercent: -50 });
      const xTo = gsap.quickTo(cursor, 'x', { duration: 0.45, ease: 'power3' });
      const yTo = gsap.quickTo(cursor, 'y', { duration: 0.45, ease: 'power3' });

      const onMove = (e) => { xTo(e.clientX); yTo(e.clientY); cursor.classList.add('is-active'); };
      const onOver = (e) => cursor.classList.toggle('is-hover', !!e.target.closest('a, button, label, select'));
      const onLeave = () => cursor.classList.remove('is-active');
      window.addEventListener('pointermove', onMove);
      document.addEventListener('pointerover', onOver);
      document.documentElement.addEventListener('pointerleave', onLeave);

      return () => {
        window.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerover', onOver);
        document.documentElement.removeEventListener('pointerleave', onLeave);
        cursor.remove();
      };
    });

    /* Frame-sequence player: draws the nearest loaded frame to a canvas, cover-fitted like the <img>.
       The first frame loads straight away; the rest stream in after page load, coarse to fine,
       so scrubbing works early and sharpens as frames arrive. */
    function createSequence(host, { path, count, focusX, eager }) {
      const src = (i) => `${path}${String(i + 1).padStart(4, '0')}.webp`;
      const canvas = document.createElement('canvas');
      canvas.className = 'hero-seq';
      canvas.setAttribute('aria-hidden', 'true');
      $('img', host).after(canvas);
      const ctx = canvas.getContext('2d');
      const frames = [];
      let current = 0;

      const ready = (i) => frames[i] && frames[i].naturalWidth > 0;
      const draw = () => {
        let frame = null;
        for (let d = 0; d < count && !frame; d += 1) {
          if (ready(current - d)) frame = frames[current - d];
          else if (ready(current + d)) frame = frames[current + d];
        }
        if (!frame) return;
        const scale = Math.max(canvas.width / frame.naturalWidth, canvas.height / frame.naturalHeight);
        const w = frame.naturalWidth * scale;
        const h = frame.naturalHeight * scale;
        ctx.drawImage(frame, (canvas.width - w) * focusX, (canvas.height - h) / 2, w, h); // matches the <img> crop
      };
      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = Math.round(host.clientWidth * dpr);
        const height = Math.round(host.clientHeight * dpr);
        if (width === canvas.width && height === canvas.height) return; // e.g. mobile address bar moving
        canvas.width = width;
        canvas.height = height;
        draw();
      };
      const load = (i) => new Promise((resolve) => {
        if (frames[i]) { resolve(); return; }
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => { if (Math.abs(i - current) < 3) draw(); resolve(); };
        img.onerror = resolve;
        img.src = src(i);
        frames[i] = img;
      });
      const loadRest = async () => {
        const order = [];
        [8, 4, 2, 1].forEach((step) => { for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i); });
        for (let i = 0; i < order.length; i += 6) await Promise.all(order.slice(i, i + 6).map(load));
      };

      let started = false;
      const start = () => {
        if (started) return;
        started = true;
        load(0).then(() => { resize(); canvas.classList.add('is-ready'); loadRest(); });
      };
      if (eager) {
        // First frame now; the rest once the page itself has finished loading.
        started = true;
        load(0).then(() => { resize(); canvas.classList.add('is-ready'); });
        if (document.readyState === 'complete') loadRest();
        else window.addEventListener('load', loadRest, { once: true });
      }
      window.addEventListener('resize', resize);

      return {
        canvas,
        start,
        set(progress) {
          // Until the scroll starts, the still <img> shows; the canvas takes over once there's motion to play.
          canvas.classList.toggle('is-active', progress > 0.004);
          const i = Math.round(progress * (count - 1));
          if (i !== current) { current = i; draw(); }
        },
      };
    }

    // Late-loading images and fonts shift the layout; re-measure once settled.
    window.addEventListener('load', refreshScroll);
    if (document.fonts) document.fonts.ready.then(refreshScroll);
  }

  /* =========================================================
     UI motion (Motion): menus, buttons, page transitions
     ========================================================= */
  function initUiMotion() {
    const { animate, stagger } = window.Motion;
    const easeOut = [0.16, 1, 0.3, 1];
    const easeInOut = [0.76, 0, 0.24, 1];
    const spring = (stiffness, damping) => ({ type: 'spring', stiffness, damping });

    /* ---- Menus: contents cascade in when opened ---- */
    if (links) {
      links.addEventListener('menuchange', (e) => {
        if (e.detail) animate([...links.children], { opacity: [0, 1], y: [12, 0] }, { duration: 0.6, delay: stagger(0.05), ease: easeOut });
      });
    }
    $$('.nav-dd').forEach((dropdown) => {
      const items = $$('.nav-dd__cols li, .nav-dd__foot', dropdown);
      const play = () => animate(items, { opacity: [0, 1], y: [8, 0] }, { duration: 0.6, delay: stagger(0.04, { startDelay: 0.05 }), ease: easeOut });
      dropdown.addEventListener('menuchange', (e) => { if (e.detail) play(); });
      if (window.matchMedia('(hover: hover) and (min-width: 992px)').matches) dropdown.addEventListener('mouseenter', play);
    });

    /* ---- Buttons: magnetic pull on fine pointers, a soft press everywhere ---- */
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    $$('.btn, .nav-toggle').forEach((btn) => {
      if (fine) {
        btn.addEventListener('pointermove', (e) => {
          const r = btn.getBoundingClientRect();
          animate(btn, { x: (e.clientX - r.left - r.width / 2) * 0.16, y: (e.clientY - r.top - r.height / 2) * 0.28 }, spring(260, 22));
        });
        btn.addEventListener('pointerleave', () => animate(btn, { x: 0, y: 0, scale: 1 }, spring(180, 12)));
      }
      btn.addEventListener('pointerdown', () => animate(btn, { scale: 0.96 }, { duration: 0.2, ease: easeOut }));
      const release = () => animate(btn, { scale: 1 }, spring(420, 16));
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointercancel', release);
    });

    /* ---- Logo curtain: first-visit intro and page transitions ---- */
    const curtain = document.createElement('div');
    curtain.className = 'page-curtain';
    curtain.setAttribute('aria-hidden', 'true');
    curtain.innerHTML = '<div class="page-curtain__brand"><img src="public/images/logo-horizontal.png" alt="" width="1000" height="352"><span class="page-curtain__line"></span></div>';
    document.body.append(curtain);
    const brand = $('.page-curtain__brand', curtain);
    const line = $('.page-curtain__line', curtain);
    const fill = (to, duration) => animate(line, { '--progress': to }, { duration, ease: easeOut });

    if (entering) {
      const firstVisit = document.documentElement.classList.contains('is-intro');
      try {
        sessionStorage.removeItem('tt-transition');
        sessionStorage.setItem('tt-intro', '1');
      } catch (err) { /* storage blocked */ }
      curtain.style.transform = 'translateY(0%)';

      // Hold on the logo while the page loads (a beat longer on the first visit), capped so it never drags.
      const pageLoaded = new Promise((resolve) => {
        if (document.readyState === 'complete') resolve();
        else window.addEventListener('load', resolve, { once: true });
      });
      const minHold = new Promise((resolve) => { setTimeout(resolve, firstVisit ? 1200 : 300); });
      const maxHold = new Promise((resolve) => { setTimeout(resolve, firstVisit ? 2800 : 1600); });
      fill(0.85, firstVisit ? 1.2 : 0.3);

      Promise.race([Promise.all([pageLoaded, minHold]), maxHold]).then(() => {
        fill(1, 0.3);
        animate(brand, { opacity: [1, 0], y: [0, -16] }, { duration: 0.5, delay: 0.2, ease: easeOut });
        animate(curtain, { transform: ['translateY(0%)', 'translateY(-100%)'] }, { duration: 1, delay: 0.35, ease: easeInOut });
        setTimeout(() => document.dispatchEvent(new Event('curtain:lift')), 700);
      });
    }

    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      const url = new URL(a.href, window.location.href);
      if (url.protocol !== window.location.protocol || url.host !== window.location.host) return; // tel:, mailto:, other sites
      if (url.pathname === window.location.pathname) return; // same page / in-page anchors
      if (!/(\.html?|\/)$/.test(url.pathname)) return;
      e.preventDefault();
      try { sessionStorage.setItem('tt-transition', '1'); } catch (err) { /* storage blocked */ }
      line.style.setProperty('--progress', '0');
      animate(brand, { opacity: [0, 1], y: [16, 0] }, { duration: 0.5, delay: 0.45, ease: easeOut });
      animate(curtain, { transform: ['translateY(100%)', 'translateY(0%)'] }, { duration: 0.7, ease: easeInOut })
        .then(() => new Promise((resolve) => { setTimeout(resolve, 250); }))
        .then(() => { window.location.href = url.href; });
    });

    // Coming back via the browser's back/forward cache: make sure the curtain is gone.
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) { curtain.style.transform = 'translateY(100%)'; brand.style.opacity = ''; }
    });
  }
})();
