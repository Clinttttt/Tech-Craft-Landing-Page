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
    menu.setAttribute('aria-hidden', 'true');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('is-open');
      menu.setAttribute('aria-hidden', String(!open));
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.querySelectorAll('a, .btn').forEach((a) => a.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => { if (window.innerWidth > 720) closeMenu(); });
  }

  /* ---------- Custom select menus ---------- */
  const customSelects = [];

  function closeAllCustomSelects(exceptRoot) {
    customSelects.forEach((entry) => {
      if (entry.root !== exceptRoot) entry.close();
    });
  }

  function enhanceSelect(select, index) {
    if (!select || select.dataset.enhancedSelect === 'true') return;

    const selectId = select.id || `custom-select-${index}`;
    const label = document.querySelector(`label[for="${selectId}"]`);
    if (label && !label.id) label.id = `${selectId}-label`;

    select.dataset.enhancedSelect = 'true';
    select.classList.add('select-native');
    select.tabIndex = -1;
    select.setAttribute('aria-hidden', 'true');

    const root = document.createElement('div');
    root.className = 'select-field';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'select-field__button';
    button.id = `${selectId}-button`;
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', `${selectId}-menu`);
    if (label && label.id) button.setAttribute('aria-labelledby', `${label.id} ${selectId}-value`);

    const value = document.createElement('span');
    value.className = 'select-field__value';
    value.id = `${selectId}-value`;

    const icon = document.createElement('span');
    icon.className = 'select-field__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m5 8 5 5 5-5"/></svg>';

    const menu = document.createElement('div');
    menu.className = 'select-field__menu';
    menu.id = `${selectId}-menu`;
    menu.setAttribute('role', 'listbox');
    if (label && label.id) menu.setAttribute('aria-labelledby', label.id);

    button.append(value, icon);
    root.append(button, menu);
    select.insertAdjacentElement('afterend', root);

    const optionButtons = () => Array.from(menu.querySelectorAll('.select-field__option'));
    const enabledOptions = () => optionButtons().filter((option) => !option.disabled);

    function updateButton() {
      const selected = select.options[select.selectedIndex] || select.options[0];
      value.textContent = selected ? selected.textContent : '';
      button.classList.toggle('is-placeholder', Boolean(selected && selected.disabled));

      optionButtons().forEach((option, optionIndex) => {
        const isSelected = Number(option.dataset.index) === select.selectedIndex;
        option.classList.toggle('is-selected', isSelected);
        option.setAttribute('aria-selected', String(isSelected));
      });
    }

    function focusOption(targetIndex) {
      const options = optionButtons();
      let target = options.find((option) => Number(option.dataset.index) === targetIndex);
      if (!target || target.disabled) target = enabledOptions()[0];
      if (target) target.focus();
    }

    function openSelect(focusSelected) {
      closeAllCustomSelects(root);
      root.classList.add('is-open');
      button.setAttribute('aria-expanded', 'true');
      if (focusSelected) focusOption(select.selectedIndex);
    }

    function closeSelect() {
      root.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
    }

    function chooseOption(optionIndex) {
      const option = select.options[optionIndex];
      if (!option || option.disabled) return;

      select.selectedIndex = optionIndex;
      updateButton();
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      closeSelect();
      button.focus();
    }

    function moveOption(direction) {
      const options = enabledOptions();
      const currentIndex = options.indexOf(document.activeElement);
      const nextIndex = currentIndex < 0
        ? 0
        : (currentIndex + direction + options.length) % options.length;
      if (options[nextIndex]) options[nextIndex].focus();
    }

    Array.from(select.options).forEach((option, optionIndex) => {
      if (option.disabled) return;

      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'select-field__option';
      item.setAttribute('role', 'option');
      item.dataset.index = String(optionIndex);
      item.textContent = option.textContent;
      if (option.disabled) {
        item.disabled = true;
        item.setAttribute('aria-disabled', 'true');
      }

      item.addEventListener('click', () => chooseOption(optionIndex));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); moveOption(1); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); moveOption(-1); }
        else if (e.key === 'Home') { e.preventDefault(); const first = enabledOptions()[0]; if (first) first.focus(); }
        else if (e.key === 'End') { e.preventDefault(); const options = enabledOptions(); const last = options[options.length - 1]; if (last) last.focus(); }
        else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chooseOption(optionIndex); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeSelect(); button.focus(); }
        else if (e.key === 'Tab') { closeSelect(); }
      });

      menu.appendChild(item);
    });

    button.addEventListener('click', () => {
      if (root.classList.contains('is-open')) closeSelect();
      else openSelect(false);
    });

    button.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        openSelect(true);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (root.classList.contains('is-open')) closeSelect();
        else openSelect(true);
      } else if (e.key === 'Escape') {
        e.stopPropagation();
        closeSelect();
      }
    });

    select.addEventListener('change', updateButton);
    if (select.form) {
      select.form.addEventListener('reset', () => {
        window.setTimeout(updateButton, 0);
      });
    }

    updateButton();
    customSelects.push({ root, close: closeSelect });
  }

  document.querySelectorAll('.field select').forEach(enhanceSelect);
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.select-field')) closeAllCustomSelects();
  });

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
        .filter((el) => !el.hidden && el.offsetParent !== null && el.tabIndex >= 0 && window.getComputedStyle(el).visibility !== 'hidden');
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
        if (firstInvalid) {
          const enhancedSelect = firstInvalid.matches('select')
            ? firstInvalid.nextElementSibling && firstInvalid.nextElementSibling.querySelector('.select-field__button')
            : null;
          (enhancedSelect || firstInvalid).focus();
        }
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
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeMenu(); closeAllCustomSelects(); closeModal(); } });
})();
