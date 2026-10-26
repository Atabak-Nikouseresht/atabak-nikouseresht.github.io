(() => {
  'use strict';
  const root = document.documentElement;
  const toggle = document.getElementById('theme-toggle');
  const mobileToggle = document.getElementById('menu-toggle');
  const nav = document.getElementById('site-nav');
  const year = document.getElementById('year');

  const getSavedTheme = () => {
    try { return window.localStorage.getItem('atabak-theme'); } catch { return null; }
  };
  const saveTheme = (theme) => {
    try { window.localStorage.setItem('atabak-theme', theme); } catch { /* storage disabled */ }
  };
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    toggle?.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0d1320' : '#f6f7f5');
  };
  const saved = getSavedTheme();
  const initial = saved === 'dark' || saved === 'light' ? saved : 'dark';
  applyTheme(initial);
  toggle?.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
  });

  const closeNav = () => {
    nav?.classList.remove('is-open');
    mobileToggle?.setAttribute('aria-expanded', 'false');
    mobileToggle?.setAttribute('aria-label', 'Open navigation');
  };
  mobileToggle?.addEventListener('click', () => {
    const isOpen = nav?.classList.toggle('is-open') ?? false;
    mobileToggle.setAttribute('aria-expanded', String(isOpen));
    mobileToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeNav(); });
  year.textContent = String(new Date().getFullYear());
})();
