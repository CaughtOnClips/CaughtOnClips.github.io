/* Forge Four — fixed timestep main loop + touch chrome */
(function () {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const touchPad = document.getElementById('touch-pad');
  const touchUi = document.getElementById('touch-ui');

  canvas.width = FF.W;
  canvas.height = FF.H;

  FF.Render.loadRoster('assets/roster.jpg');
  FF.Input.bind();

  const boot = document.getElementById('boot');
  if (boot) boot.style.display = 'none';
  canvas.focus();

  // Stop bounce-scroll / pinch while playing
  document.addEventListener('touchmove', function (e) {
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('gesturestart', function (e) { e.preventDefault(); });

  function canvasCoords(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * (FF.W / Math.max(1, r.width));
    const y = (e.clientY - r.top) * (FF.H / Math.max(1, r.height));
    return { x, y };
  }

  function onCanvasPointer(e) {
    // Ignore if the event originated on an overlay button
    if (e.target && e.target.closest && (e.target.closest('#touch-pad') || e.target.closest('#touch-ui'))) {
      return;
    }
    // Only primary button / touch
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const p = canvasCoords(e);
    if (FF.Scenes.handlePointer) FF.Scenes.handlePointer(p.x, p.y);
    canvas.focus();
  }

  canvas.addEventListener('pointerdown', onCanvasPointer);
  // click still focuses for keys
  canvas.addEventListener('click', () => canvas.focus());
  window.addEventListener('click', (e) => {
    if (!e.target.closest || !e.target.closest('#touch-pad, #touch-ui')) canvas.focus();
  });

  function syncTouchChrome() {
    const mode = FF.Scenes.S.mode;
    const wantTouch = FF.Input.isTouchPreferred();

    if (touchPad) {
      const showPad = wantTouch && (mode === 'fight' || mode === 'pause');
      touchPad.classList.toggle('show', showPad);
      touchPad.setAttribute('aria-hidden', showPad ? 'false' : 'true');
    }

    if (touchUi) {
      const showUi = wantTouch && (mode === 'title' || mode === 'select' || mode === 'match' || mode === 'pause');
      touchUi.classList.toggle('show', showUi);
      touchUi.setAttribute('aria-hidden', showUi ? 'false' : 'true');
      touchUi.querySelectorAll('[data-show]').forEach(btn => {
        const modes = (btn.getAttribute('data-show') || '').split(/\s+/);
        const on = showUi && modes.indexOf(mode) !== -1;
        if (on) btn.removeAttribute('hidden');
        else btn.setAttribute('hidden', '');
      });
      // Reflect CPU toggle label
      const cpuBtn = document.getElementById('btn-cpu');
      if (cpuBtn) cpuBtn.textContent = FF.Scenes.S.cpuP2 ? 'CPU: ON' : 'CPU: OFF';
    }

    // While fighting with pad, keep body from scrolling
    document.body.classList.toggle('playing', mode === 'fight' || mode === 'pause');
  }

  let acc = 0;
  let last = performance.now();
  let time = 0;

  function frame(now) {
    const raw = Math.min(0.05, (now - last) / 1000);
    last = now;
    acc += raw;
    while (acc >= FF.DT) {
      FF.Scenes.update();
      FF.Input.endFrame();
      acc -= FF.DT;
      time += FF.DT;
    }
    syncTouchChrome();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, FF.W, FF.H);
    FF.Scenes.draw(ctx, time);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
