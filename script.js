/* =========================================================
   TechCraft Studio — Services page interactions
   Vanilla JS, progressive enhancement, accessible.
   No network calls: the inquiry form submits natively into
   a hidden iframe, so submissions go straight to email.
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
    document.querySelectorAll('.grid, .steps, .skillmap').forEach((group) => {
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
  const formSuccess = document.getElementById('formSuccess');
  const frame = document.getElementById('inquiryFrame');
  let modalLastFocus = null;

  function openModal() {
    if (!modal) return;
    modalLastFocus = document.activeElement;
    if (form) form.hidden = false;
    if (formSuccess) formSuccess.hidden = true;
    if (formError) formError.hidden = true;
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
    modal.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      const focusable = Array.from(modal.querySelectorAll('button, input, select, textarea, a[href]'))
        .filter((el) => !el.hidden && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- Form validation + native submit to hidden iframe ---------- */
  if (form) {
    const submitBtn = form.querySelector('button[type="submit"]');
    let submitting = false;
    let origText = submitBtn ? submitBtn.textContent : '';

    form.addEventListener('submit', (e) => {
      const name = form.elements['name'];
      const email = form.elements['email'];
      const service = form.elements['service'];
      const details = form.elements['details'];
      const required = [name, email, service, details];
      let valid = true;

      required.forEach((el) => {
        const ok = el.value && el.value.trim() !== '';
        el.classList.toggle('is-invalid', !ok);
        if (!ok) valid = false;
      });
      if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        email.classList.add('is-invalid');
        valid = false;
      }

      if (!valid) {
        e.preventDefault();
        if (formError) { formError.textContent = 'Please complete the required fields.'; formError.hidden = false; }
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // Valid: allow the native submit into the hidden iframe.
      const keyField = form.elements['access_key'];
      if (keyField && /REPLACE_WITH/.test(keyField.value)) {
        e.preventDefault();
        if (formError) { formError.textContent = 'Contact form is not connected yet — add your Web3Forms access key in index.html.'; formError.hidden = false; }
        return;
      }
      if (formError) formError.hidden = true;
      submitting = true;
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
    });

    form.querySelectorAll('input, select, textarea').forEach((el) => {
      el.addEventListener('input', () => el.classList.remove('is-invalid'));
    });

    // The hidden iframe finishes loading after a successful POST.
    if (frame) {
      frame.addEventListener('load', () => {
        if (!submitting) return; // ignore the initial blank load
        submitting = false;
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = origText; }
        form.reset();
        form.hidden = true;
        if (formSuccess) formSuccess.hidden = false;
      });
    }
  }

  /* ---------- Global Escape ---------- */
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMenu(); closeModal(); } });
})();
