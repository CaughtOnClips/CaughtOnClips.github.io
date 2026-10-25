/* Keyboard + touch input — P1 WASD+JKL ; P2 arrows + numpad / UIOP
   Touch pad / UI drive the same channels via virtual key codes. */
window.FF = window.FF || {};
FF.Input = (function () {
  const down = Object.create(null);
  const pressed = Object.create(null);
  const released = Object.create(null);
  const pulseOnce = Object.create(null); // virtual codes released at endFrame

  const MAP = {
    p1: {
      left: ['KeyA', 'TouchP1Left'],
      right: ['KeyD', 'TouchP1Right'],
      light: ['KeyJ', 'TouchP1Light'],
      heavy: ['KeyK', 'TouchP1Heavy'],
      special: ['KeyL', 'TouchP1Special'],
      block: ['TouchP1Block'],
      confirm: ['Enter', 'KeyJ', 'TouchP1Confirm'],
      back: ['Escape', 'Backspace', 'TouchP1Back']
    },
    p2: {
      left: ['ArrowLeft', 'TouchP2Left'],
      right: ['ArrowRight', 'TouchP2Right'],
      light: ['Numpad1', 'KeyU', 'TouchP2Light'],
      heavy: ['Numpad2', 'KeyI', 'TouchP2Heavy'],
      special: ['Numpad3', 'KeyO', 'TouchP2Special'],
      block: ['TouchP2Block'],
      confirm: ['NumpadEnter', 'Enter', 'KeyU', 'TouchP2Confirm'],
      back: ['Escape', 'TouchP2Back']
    },
    p1Up: ['KeyW'],
    p1Down: ['KeyS'],
    p2Up: ['ArrowUp'],
    p2Down: ['ArrowDown'],
    pause: ['Escape', 'KeyP', 'TouchPause']
  };

  const VCODE = {
    p1: {
      left: 'TouchP1Left', right: 'TouchP1Right',
      light: 'TouchP1Light', heavy: 'TouchP1Heavy',
      special: 'TouchP1Special', block: 'TouchP1Block',
      confirm: 'TouchP1Confirm', back: 'TouchP1Back'
    },
    p2: {
      left: 'TouchP2Left', right: 'TouchP2Right',
      light: 'TouchP2Light', heavy: 'TouchP2Heavy',
      special: 'TouchP2Special', block: 'TouchP2Block',
      confirm: 'TouchP2Confirm', back: 'TouchP2Back'
    }
  };

  function isTouchPreferred() {
    try {
      if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return true;
      if (window.matchMedia && window.matchMedia('(hover: none)').matches) return true;
    } catch (_) { /* ignore */ }
    return Math.min(window.innerWidth || 9999, window.innerHeight || 9999) < 700;
  }

  function onDown(e) {
    if (e.code === 'Space' || e.code.startsWith('Arrow') || e.code.startsWith('Numpad')) e.preventDefault();
    if (!down[e.code]) pressed[e.code] = true;
    down[e.code] = true;
  }
  function onUp(e) {
    down[e.code] = false;
    released[e.code] = true;
  }

  function any(codes) {
    for (let i = 0; i < codes.length; i++) if (down[codes[i]]) return true;
    return false;
  }
  function anyPressed(codes) {
    for (let i = 0; i < codes.length; i++) if (pressed[codes[i]]) return true;
    return false;
  }

  function setVirtual(code, isDown) {
    if (!code) return;
    if (isDown) {
      if (!down[code]) pressed[code] = true;
      down[code] = true;
      delete pulseOnce[code];
    } else {
      if (down[code]) released[code] = true;
      down[code] = false;
    }
  }

  function pulse(code) {
    if (!code) return;
    if (!down[code]) pressed[code] = true;
    down[code] = true;
    pulseOnce[code] = true;
  }

  function setAction(side, name, isDown) {
    const code = VCODE[side] && VCODE[side][name];
    setVirtual(code, isDown);
  }

  function pulseAction(side, name) {
    const code = VCODE[side] && VCODE[side][name];
    pulse(code);
  }

  function bindTouchPad(root) {
    if (!root) return;
    root.querySelectorAll('[data-action]').forEach(btn => {
      const action = btn.getAttribute('data-action');
      const side = btn.getAttribute('data-side') || 'p1';
      const isHold = btn.getAttribute('data-hold') !== '0';

      const downFn = (e) => {
        e.preventDefault();
        e.stopPropagation();
        try { btn.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
        btn.classList.add('active');
        if (action === 'pause') {
          pulse('TouchPause');
          return;
        }
        if (isHold) setAction(side, action, true);
        else pulseAction(side, action);
      };
      const upFn = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.remove('active');
        if (action === 'pause') return;
        if (isHold) setAction(side, action, false);
      };

      btn.addEventListener('pointerdown', downFn);
      btn.addEventListener('pointerup', upFn);
      btn.addEventListener('pointercancel', upFn);
      btn.addEventListener('lostpointercapture', upFn);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  }

  function bindTouchUI(root) {
    if (!root) return;
    root.querySelectorAll('[data-ui]').forEach(btn => {
      const kind = btn.getAttribute('data-ui');
      const fire = (e) => {
        e.preventDefault();
        e.stopPropagation();
        btn.classList.add('active');
        if (kind === 'start' || kind === 'lock' || kind === 'confirm' || kind === 'resume') {
          if (kind === 'resume') pulse('TouchPause');
          else {
            pulseAction('p1', 'confirm');
            pulse('TouchUIStart');
          }
        } else if (kind === 'cpu') {
          pulse('TouchUICPU');
        } else if (kind === 'rematch') {
          pulseAction('p1', 'confirm');
          pulse('KeyR');
        } else if (kind === 'select') {
          pulse('KeyS');
        }
        setTimeout(() => btn.classList.remove('active'), 120);
      };
      btn.addEventListener('pointerdown', fire);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    });
  }

  function bind() {
    window.addEventListener('keydown', onDown, { passive: false });
    window.addEventListener('keyup', onUp);
    bindTouchPad(document.getElementById('touch-pad'));
    bindTouchUI(document.getElementById('touch-ui'));
  }

  function endFrame() {
    for (const k in pressed) delete pressed[k];
    for (const k in released) delete released[k];
    for (const k in pulseOnce) {
      down[k] = false;
      delete pulseOnce[k];
    }
  }

  function axis(side) {
    const m = MAP[side];
    let x = 0;
    if (any(m.left)) x -= 1;
    if (any(m.right)) x += 1;
    return x;
  }

  function action(side, name) {
    const codes = MAP[side][name];
    if (!codes) return false;
    return any(codes);
  }
  function actionPressed(side, name) {
    const codes = MAP[side][name];
    if (!codes) return false;
    return anyPressed(codes);
  }

  function selectMove(side) {
    if (side === 'p1') {
      if (anyPressed(MAP.p1.left) || anyPressed(MAP.p1Up)) return -1;
      if (anyPressed(MAP.p1.right) || anyPressed(MAP.p1Down)) return 1;
    } else {
      if (anyPressed(MAP.p2.left) || anyPressed(MAP.p2Up)) return -1;
      if (anyPressed(MAP.p2.right) || anyPressed(MAP.p2Down)) return 1;
    }
    return 0;
  }

  function isDown(code) { return !!down[code]; }
  function wasPressed(code) { return !!pressed[code]; }

  return {
    bind, endFrame, axis, action, actionPressed, selectMove,
    isDown, wasPressed, MAP, anyPressed,
    setAction, pulseAction, setVirtual, pulse,
    isTouchPreferred, VCODE
  };
})();
