/* =========================================================
   Clint Villanueva — Services page interactions
   Vanilla JS, progressive enhancement, accessible.
   ========================================================= */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sticky nav shadow ---------- */
  const nav = document.querySelector('.nav');
  const onScroll = () => { if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  function closeMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove('is-open');
    menu.hidden = true;
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      menu.hidden = !open;
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a, .btn').forEach((a) => a.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => { if (window.innerWidth > 720) closeMenu(); });
  }

  /* ---------- Scroll reveal (with light stagger) ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    document.querySelectorAll('.grid, .steps, .stack').forEach((group) => {
      Array.from(group.children).forEach((child, i) => {
        if (child.classList.contains('reveal')) child.style.setProperty('--rd', `${(i % 6) * 70}ms`);
      });
    });
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Scroll-spy ---------- */
  const spyLinks = Array.from(document.querySelectorAll('.nav__links a[data-spy]'));
  const spyTargets = spyLinks.map((a) => document.getElementById(a.dataset.spy)).filter(Boolean);
  if (spyTargets.length && 'IntersectionObserver' in window) {
    const setCurrent = (id) => spyLinks.forEach((a) => a.classList.toggle('is-current', a.dataset.spy === id));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setCurrent(entry.target.id); });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    spyTargets.forEach((t) => spy.observe(t));
  }

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const animateCount = (el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const suffix = el.dataset.suffix || '';
      if (prefersReduced) { el.textContent = target + suffix; return; }
      const dur = 1100; const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if ('IntersectionObserver' in window) {
      const co = new IntersectionObserver((entries, obs) => {
        entries.forEach((e) => { if (e.isIntersecting) { animateCount(e.target); obs.unobserve(e.target); } });
      }, { threshold: 0.5 });
      counters.forEach((c) => co.observe(c));
    } else {
      counters.forEach(animateCount);
    }
  }

  /* ---------- Copy email ---------- */
  const copyBtn = document.getElementById('copyEmail');
  const copyText = document.getElementById('copyEmailText');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.dataset.email || '';
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(email);
        } else {
          const ta = document.createElement('textarea');
          ta.value = email; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
        }
        if (copyText) copyText.textContent = 'Copied!';
        copyBtn.classList.add('is-copied');
      } catch (err) { if (copyText) copyText.textContent = 'Press Ctrl+C'; }
      setTimeout(() => { if (copyText) copyText.textContent = 'Copy email'; copyBtn.classList.remove('is-copied'); }, 2000);
    });
  }

  /* ---------- Back to top ---------- */
  const backTop = document.getElementById('backTop');
  if (backTop) {
    backTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Inquiry modal ---------- */
  const modal = document.getElementById('inquiryModal');
  const openBtn = document.getElementById('openInquiry');
  const form = document.getElementById('inquiryForm');
  const formError = document.getElementById('formError');
  let modalLastFocus = null;

  function openModal() {
    if (!modal) return;
    modalLastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    const first = modal.querySelector('#f-name');
    if (first) first.focus();
  }
  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (modalLastFocus && typeof modalLastFocus.focus === 'function') modalLastFocus.focus();
  }
  if (openBtn) openBtn.addEventListener('click', openModal);
  if (modal) {
    modal.querySelectorAll('[data-close]').forEach((el) => el.addEventListener('click', closeModal));
    // simple focus trap
    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusable = modal.querySelectorAll('button, input, select, textarea, a[href]');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.elements['name'];
      const email = form.elements['email'];
      const service = form.elements['service'];
      const budget = form.elements['budget'];
      const details = form.elements['details'];
      const required = [name, email, service, details];
      let valid = true;

      required.forEach((el) => {
        const ok = el.value && el.value.trim() !== '';
        el.classList.toggle('is-invalid', !ok);
        if (!ok) valid = false;
      });
      // basic email shape check
      if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        email.classList.add('is-invalid');
        valid = false;
      }
      if (!valid) {
        if (formError) formError.hidden = false;
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }
      if (formError) formError.hidden = true;

      const subject = `Project inquiry — ${service.value} (${name.value})`;
      const body =
        `Name: ${name.value}\n` +
        `Email: ${email.value}\n` +
        `Service: ${service.value}\n` +
        `Budget: ${budget.value || 'Not specified'}\n\n` +
        `Project details:\n${details.value}`;
      window.location.href =
        `mailto:clintvillanueva82@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      closeModal();
    });
    // clear invalid state as the user types
    form.querySelectorAll('input, select, textarea').forEach((el) => {
      el.addEventListener('input', () => el.classList.remove('is-invalid'));
    });
  }

  /* ---------- Global Escape ---------- */
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMenu(); closeModal(); } });
})();
