(() => {
  'use strict';
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const mobileToggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('site-nav');
  const year = document.getElementById('year');
  const savedTheme = (() => { try { return localStorage.getItem('atabak-theme'); } catch { return null; } })();
  const hasSavedTheme = savedTheme === 'light' || savedTheme === 'dark';
  let userThemeChosen = hasSavedTheme;
  const systemScheme = window.matchMedia?.('(prefers-color-scheme: light)');
  const systemTheme = () => systemScheme?.matches ? 'light' : 'dark';
  const applyTheme = theme => {
    root.dataset.theme = theme;
    toggle?.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    const activeColor = theme === 'dark' ? '#061321' : '#e8edf2';
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => { meta.media = meta.content === activeColor ? 'all' : 'not all'; });
  };
  applyTheme(hasSavedTheme ? savedTheme : systemTheme());
  const followSystemTheme = event => { if (!userThemeChosen) applyTheme(event.matches ? 'light' : 'dark'); };
  if (systemScheme?.addEventListener) systemScheme.addEventListener('change', followSystemTheme);
  else systemScheme?.addListener?.(followSystemTheme);
  toggle?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    userThemeChosen = true;
    applyTheme(next);
    try { localStorage.setItem('atabak-theme', next); } catch { /* Theme still works without storage. */ }
  });
  const closeMenu = () => {
    nav?.classList.remove('is-open');
    mobileToggle?.setAttribute('aria-expanded', 'false');
    mobileToggle?.setAttribute('aria-label', 'Open navigation');
  };
  const focusTarget = target => {
    if (!target.hasAttribute('tabindex')) {
      target.setAttribute('tabindex', '-1');
      target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
    }
    target.focus({ preventScroll: true });
  };
  mobileToggle?.addEventListener('click', () => {
    const open = nav?.classList.toggle('is-open') ?? false;
    mobileToggle.setAttribute('aria-expanded', String(open));
    mobileToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (open) requestAnimationFrame(() => nav?.querySelector('a')?.focus());
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', () => {
    const href = link.getAttribute('href') || '';
    if (!href.startsWith('#')) return;
    const target = document.getElementById(href.slice(1));
    if (target) focusTarget(target);
  }));
  const focusHashTarget = hash => {
    if (!hash || hash === '#') return;
    let id = '';
    try { id = decodeURIComponent(hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (target) focusTarget(target);
  };
  if (window.location.hash) requestAnimationFrame(() => focusHashTarget(window.location.hash));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.classList.contains('is-open')) {
      closeMenu();
      mobileToggle?.focus();
    }
  });
  if (year) year.textContent = String(new Date().getFullYear());
  root.classList.remove('no-js');
  root.classList.add('js');
})();
