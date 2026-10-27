(() => {
  'use strict';
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const mobileToggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('site-nav');
  const year = document.getElementById('year');
  const savedTheme = (() => { try { return localStorage.getItem('atabak-theme'); } catch { return null; } })();
  const applyTheme = theme => {
    root.dataset.theme = theme;
    toggle?.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#061321' : '#e8edf2');
  };
  applyTheme(savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark');
  toggle?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('atabak-theme', next); } catch { /* Theme still works without storage. */ }
  });
  const closeMenu = () => {
    nav?.classList.remove('is-open');
    mobileToggle?.setAttribute('aria-expanded', 'false');
    mobileToggle?.setAttribute('aria-label', 'Open navigation');
  };
  mobileToggle?.addEventListener('click', () => {
    const open = nav?.classList.toggle('is-open') ?? false;
    mobileToggle.setAttribute('aria-expanded', String(open));
    mobileToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    closeMenu();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.classList.contains('is-open')) {
      closeMenu();
      mobileToggle?.focus();
    }
  });
  if (year) year.textContent = String(new Date().getFullYear());
})();
