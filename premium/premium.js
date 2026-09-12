/* Adds a subtle shadow to the sticky header once the page is scrolled.
   Purely additive — toggles one class, doesn't touch any existing site
   behavior (the theme's own sticky-header logic, menus, etc. keep working
   exactly as before). */
(function () {
  'use strict';
  var header = document.getElementById('masthead');
  if (!header) return;

  function update() {
    if (window.scrollY > 12) {
      header.classList.add('elct-scrolled');
    } else {
      header.classList.remove('elct-scrolled');
    }
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
})();
