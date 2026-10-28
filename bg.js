/* ═══ Scary Town — Background (shared) ═══ */
(function () {
  if (document.querySelector('.bg')) return;
  var bg = document.createElement('div');
  bg.className = 'bg';
  bg.setAttribute('aria-hidden', 'true');
  bg.innerHTML = '<div class="bg-media"></div><div class="bg-glow"></div><div class="bg-grid"></div><div class="bg-spot"></div><div class="bg-vignette"></div>';
  document.body.insertBefore(bg, document.body.firstChild);

  var raf = 0;
  window.addEventListener('mousemove', function (e) {
    if (raf) return;
    raf = requestAnimationFrame(function () {
      bg.style.setProperty('--mx', e.clientX + 'px');
      bg.style.setProperty('--my', e.clientY + 'px');
      raf = 0;
    });
  }, { passive: true });
})();
