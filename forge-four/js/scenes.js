/* Scene flow: Select → Versus → Fight → Round → Match → Rematch/Select */
window.FF = window.FF || {};
FF.Scenes = (function () {
  const S = {
    mode: 'title', // title | select | versus | fight | round | match | pause
    p1Char: 0,
    p2Char: 1,
    p1Locked: false,
    p2Locked: false,
    cpuP2: false,
    versusT: 0,
    roundT: 0,
    matchT: 0,
    pauseMenu: 0,
    match: null,
    lastRoundWinner: null,
    announce: '',
    announceT: 0,
    hitFreeze: 0,
    showDebug: false
  };

  function freshMatch(c1, c2) {
    return {
      p1: new FF.Fighter(c1, 'p1', 320),
      p2: new FF.Fighter(c2, 'p2', 960),
      wins: { p1: 0, p2: 0 },
      round: 1,
      timeLeft: FF.ROUND_TIME,
      phase: 'intro', // intro | fight | ko | time
      phaseT: 0
    };
  }

  function startRound() {
    const m = S.match;
    m.p1.resetRound(320);
    m.p2.resetRound(960);
    m.timeLeft = FF.ROUND_TIME;
    m.phase = 'intro';
    m.phaseT = 0;
    S.announce = 'ROUND ' + m.round;
    S.announceT = 90;
    S.hitFreeze = 0;
  }

  function enterSelect() {
    S.mode = 'select';
    S.p1Locked = false;
    S.p2Locked = false;
    S.p1Char = 0;
    S.p2Char = 1;
    // Touch / narrow screens: default vs CPU so one player can play phone-only
    S.cpuP2 = FF.Input.isTouchPreferred();
  }

  function bothLocked() {
    return S.p1Locked && S.p2Locked;
  }

  function updateTitle() {
    if (FF.Input.actionPressed('p1', 'confirm') || FF.Input.wasPressed('Enter') || FF.Input.wasPressed('Space') || FF.Input.wasPressed('TouchUIStart')) {
      enterSelect();
    }
    if (FF.Input.wasPressed('KeyC') || FF.Input.wasPressed('TouchUICPU')) S.cpuP2 = !S.cpuP2;
  }

  function updateSelect() {
    // toggle CPU
    if (FF.Input.wasPressed('KeyC') || FF.Input.wasPressed('TouchUICPU')) S.cpuP2 = !S.cpuP2;

    if (!S.p1Locked) {
      const m = FF.Input.selectMove('p1');
      if (m) {
        let n = S.p1Char + m;
        if (n < 0) n = 3;
        if (n > 3) n = 0;
        // skip if same as locked p2
        if (S.p2Locked && n === S.p2Char) n = (n + m + 4) % 4;
        S.p1Char = n;
      }
      if (FF.Input.actionPressed('p1', 'confirm') || FF.Input.wasPressed('KeyJ') || FF.Input.wasPressed('Enter') || FF.Input.wasPressed('TouchUIStart')) {
        if (!(S.p2Locked && S.p1Char === S.p2Char)) S.p1Locked = true;
      }
    } else if (FF.Input.actionPressed('p1', 'back') || FF.Input.wasPressed('KeyH')) {
      S.p1Locked = false;
    } else if (
      // Shared Lock button: if P1 already locked, confirm locks human P2
      !S.cpuP2 && !S.p2Locked &&
      (FF.Input.actionPressed('p1', 'confirm') || FF.Input.wasPressed('TouchUIStart') || FF.Input.wasPressed('Enter'))
    ) {
      if (!(S.p1Locked && S.p2Char === S.p1Char)) S.p2Locked = true;
    }

    if (!S.cpuP2) {
      if (!S.p2Locked) {
        const m2 = FF.Input.selectMove('p2');
        if (m2) {
          let n = S.p2Char + m2;
          if (n < 0) n = 3;
          if (n > 3) n = 0;
          if (S.p1Locked && n === S.p1Char) n = (n + m2 + 4) % 4;
          S.p2Char = n;
        }
        if (FF.Input.actionPressed('p2', 'confirm') || FF.Input.wasPressed('KeyU') || FF.Input.wasPressed('Numpad1')) {
          if (!(S.p1Locked && S.p2Char === S.p1Char)) S.p2Locked = true;
        }
      } else if (FF.Input.wasPressed('Numpad0')) {
        S.p2Locked = false;
      }
    } else {
      // CPU auto-picks different character after P1 locks
      if (S.p1Locked && !S.p2Locked) {
        const options = [0, 1, 2, 3].filter(i => i !== S.p1Char);
        S.p2Char = options[Math.floor(Math.random() * options.length)];
        S.p2Locked = true;
      }
    }

    // same-character ban soft nudge while both unlocked
    if (!S.p1Locked && !S.p2Locked && S.p1Char === S.p2Char) {
      // allow browse overlap but cannot lock same
    }

    if (bothLocked()) {
      S.mode = 'versus';
      S.versusT = 0;
      S.match = freshMatch(FF.CHARS[S.p1Char], FF.CHARS[S.p2Char]);
    }
  }

  function updateVersus() {
    S.versusT++;
    if (S.versusT > 120 || FF.Input.actionPressed('p1', 'confirm') || FF.Input.wasPressed('Enter')) {
      S.mode = 'fight';
      startRound();
    }
  }

  function updateFight() {
    const m = S.match;
    if (FF.Input.wasPressed('Escape') || FF.Input.wasPressed('KeyP') || FF.Input.wasPressed('TouchPause')) {
      S.mode = 'pause';
      S.pauseMenu = 0;
      return;
    }
    if (FF.Input.wasPressed('F1')) S.showDebug = !S.showDebug;

    if (S.announceT > 0) S.announceT--;

    if (m.phase === 'intro') {
      m.phaseT++;
      if (m.phaseT === 60) { S.announce = 'FIGHT'; S.announceT = 40; }
      if (m.phaseT > 100) { m.phase = 'fight'; S.announce = ''; }
      return;
    }

    if (m.phase === 'ko' || m.phase === 'time') {
      m.phaseT++;
      if (m.phaseT > 100) {
        // tally
        if (S.lastRoundWinner === 'p1') m.wins.p1++;
        else if (S.lastRoundWinner === 'p2') m.wins.p2++;
        else {
          // draw — higher HP already decided, or split nothing
          if (m.p1.hp > m.p2.hp) m.wins.p1++;
          else if (m.p2.hp > m.p1.hp) m.wins.p2++;
        }
        if (m.wins.p1 >= FF.ROUNDS_TO_WIN || m.wins.p2 >= FF.ROUNDS_TO_WIN) {
          S.mode = 'match';
          S.matchT = 0;
        } else {
          m.round++;
          startRound();
        }
      }
      return;
    }

    // fight phase
    if (S.hitFreeze > 0) {
      S.hitFreeze--;
      return;
    }

    m.timeLeft -= FF.DT;
    if (m.timeLeft <= 0) {
      m.timeLeft = 0;
      m.phase = 'time';
      m.phaseT = 0;
      if (m.p1.hp > m.p2.hp) { S.lastRoundWinner = 'p1'; S.announce = 'TIME UP'; }
      else if (m.p2.hp > m.p1.hp) { S.lastRoundWinner = 'p2'; S.announce = 'TIME UP'; }
      else { S.lastRoundWinner = null; S.announce = 'DRAW'; }
      S.announceT = 90;
      return;
    }

    m.p1.update('p1', m.p2, false);
    if (S.cpuP2) m.p2.updateCPU(m.p1, false);
    else m.p2.update('p2', m.p1, false);

    const res = FF.Combat.step(m.p1, m.p2);
    if (res.freeze > 0) S.hitFreeze = res.freeze;

    if (!m.p1.alive || !m.p2.alive) {
      m.phase = 'ko';
      m.phaseT = 0;
      if (!m.p1.alive && !m.p2.alive) { S.lastRoundWinner = null; S.announce = 'DOUBLE KO'; }
      else if (!m.p1.alive) { S.lastRoundWinner = 'p2'; S.announce = 'K.O.'; }
      else { S.lastRoundWinner = 'p1'; S.announce = 'K.O.'; }
      S.announceT = 90;
    }
  }

  function updatePause() {
    if (FF.Input.wasPressed('ArrowUp') || FF.Input.wasPressed('KeyW')) S.pauseMenu = (S.pauseMenu + 2) % 3;
    if (FF.Input.wasPressed('ArrowDown') || FF.Input.wasPressed('KeyS')) S.pauseMenu = (S.pauseMenu + 1) % 3;
    if (FF.Input.actionPressed('p1', 'confirm') || FF.Input.wasPressed('Enter') || FF.Input.wasPressed('KeyJ')) {
      if (S.pauseMenu === 0) S.mode = 'fight';
      else if (S.pauseMenu === 1) { enterSelect(); }
      else if (S.pauseMenu === 2) { S.mode = 'title'; }
    }
    if (FF.Input.wasPressed('Escape') || FF.Input.wasPressed('KeyP') || FF.Input.wasPressed('TouchPause')) S.mode = 'fight';
  }

  function updateMatch() {
    S.matchT++;
    // Rematch or Select
    if (FF.Input.wasPressed('KeyR') || FF.Input.actionPressed('p1', 'confirm') || FF.Input.wasPressed('Enter')) {
      // rematch same chars
      S.match = freshMatch(FF.CHARS[S.p1Char], FF.CHARS[S.p2Char]);
      S.mode = 'versus';
      S.versusT = 0;
    }
    if (FF.Input.wasPressed('KeyS') || FF.Input.wasPressed('Backspace')) {
      enterSelect();
    }
  }

  function update() {
    switch (S.mode) {
      case 'title': updateTitle(); break;
      case 'select': updateSelect(); break;
      case 'versus': updateVersus(); break;
      case 'fight': updateFight(); break;
      case 'pause': updatePause(); break;
      case 'match': updateMatch(); break;
    }
  }

  function drawTitle(ctx, t) {
    FF.Render.drawStage(ctx, t);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, FF.W, FF.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff7a2a';
    ctx.font = 'bold 72px Segoe UI, sans-serif';
    ctx.fillText('FORGE FOUR', FF.W / 2, 220);
    ctx.fillStyle = '#f2e8d5';
    ctx.font = '20px Segoe UI, sans-serif';
    ctx.fillText('2D Local Versus Fighter  ·  Best of 3', FF.W / 2, 270);
    ctx.font = '18px Segoe UI, sans-serif';
    ctx.fillStyle = Math.sin(t * 4) > 0 ? '#ffcc66' : '#f2e8d5';
    ctx.fillText('TAP START  ·  ENTER / J', FF.W / 2, 380);
    ctx.fillStyle = '#aaa';
    ctx.font = '14px Segoe UI, sans-serif';
    ctx.fillText('CPU as Player 2  (' + (S.cpuP2 ? 'ON' : 'OFF') + ')  —  tap CPU or press C', FF.W / 2, 430);
    FF.Render.drawPromptStrip(ctx,
      'Touch: on-screen pad in fight  ·  Keys: A/D J/K/L (P1)  ←/→ U/I/O (P2)  ·  Hold back or Block to guard',
      FF.H - 48);
  }

  function drawSelect(ctx, t) {
    FF.Render.drawStage(ctx, t * 0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, FF.W, FF.H);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff7a2a';
    ctx.font = 'bold 36px Segoe UI, sans-serif';
    ctx.fillText('SELECT FIGHTER', FF.W / 2, 64);
    ctx.fillStyle = '#aaa';
    ctx.font = '14px Segoe UI, sans-serif';
    ctx.fillText('Same-character ban · P1 & P2 must choose different fighters · C toggles CPU P2 (' + (S.cpuP2 ? 'ON' : 'OFF') + ')', FF.W / 2, 92);

    const L = selectCardLayout();
    const cardW = L.cardW, cardH = L.cardH, gap = L.gap, startX = L.startX, cy = L.cy;

    for (let i = 0; i < 4; i++) {
      const id = FF.CHARS[i];
      const x = startX + i * (cardW + gap);
      const isP1 = S.p1Char === i;
      const isP2 = S.p2Char === i;
      let label = '';
      if (isP1 && isP2) label = S.cpuP2 ? 'P1 / CPU' : 'P1 / P2';
      else if (isP1) label = 'P1';
      else if (isP2) label = S.cpuP2 ? 'CPU' : 'P2';

      const locked = (isP1 && S.p1Locked) || (isP2 && S.p2Locked && !isP1);
      const cursorStyle = isP1 ? 'p1' : 'p2';
      FF.Render.drawPortraitCard(ctx, id, x, cy, cardW, cardH, isP1 || isP2, false, label, cursorStyle);

      // second cursor when both hover same card
      if (isP1 && isP2) {
        // draw P2 diamond under P1 chevron
        ctx.save();
        ctx.strokeStyle = '#66ccff';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(x - 10, cy - 10, cardW + 20, cardH + 20);
        ctx.setLineDash([]);
        ctx.restore();
      }

      if (S.p1Locked && isP1) {
        ctx.fillStyle = 'rgba(255,204,102,0.9)';
        ctx.font = 'bold 14px Segoe UI, sans-serif';
        ctx.fillText('P1 LOCKED', x + cardW / 2, cy + cardH + 22);
      }
      if (S.p2Locked && isP2) {
        ctx.fillStyle = 'rgba(102,204,255,0.9)';
        ctx.font = 'bold 14px Segoe UI, sans-serif';
        ctx.fillText(S.cpuP2 ? 'CPU LOCKED' : 'P2 LOCKED', x + cardW / 2, cy + cardH + 40);
      }
    }

    ctx.font = '13px Segoe UI, sans-serif';
    ctx.fillStyle = '#ccc';
    for (let i = 0; i < 4; i++) {
      const kit = FF.Kits[FF.CHARS[i]];
      const x = startX + i * (cardW + gap) + cardW / 2;
      ctx.fillText(kit.tag + (kit.hasAura ? ' · AURA' : ''), x, cy + cardH + 58);
    }

    FF.Render.drawPromptStrip(ctx,
      'Tap a fighter · LOCK  ·  Ban: cannot lock same  ·  Keys: A/D + J  ·  ←/→ + U',
      FF.H - 48);
  }

  function drawVersus(ctx, t) {
    FF.Render.drawStage(ctx, t);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, FF.W, FF.H);
    const c1 = FF.CHARS[S.p1Char], c2 = FF.CHARS[S.p2Char];
    FF.Render.drawPortraitCard(ctx, c1, 160, 160, 280, 400, true, true, 'P1', 'p1');
    FF.Render.drawPortraitCard(ctx, c2, FF.W - 160 - 280, 160, 280, 400, true, true, S.cpuP2 ? 'CPU' : 'P2', 'p2');
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff7a2a';
    ctx.font = 'bold 64px Segoe UI, sans-serif';
    ctx.fillText('VS', FF.W / 2, 380);
    ctx.fillStyle = '#f2e8d5';
    ctx.font = '20px Segoe UI, sans-serif';
    ctx.fillText('Best of 3', FF.W / 2, 430);
  }

  function drawFight(ctx, t) {
    const m = S.match;
    FF.Render.drawStage(ctx, t);
    FF.Render.drawFighter(ctx, m.p1, t);
    FF.Render.drawFighter(ctx, m.p2, t);
    if (S.showDebug) {
      FF.Render.drawHitboxes(ctx, m.p1);
      FF.Render.drawHitboxes(ctx, m.p2);
    }
    FF.Render.drawHUD(ctx, m);

    if (S.announceT > 0 && S.announce) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, FF.H / 2 - 50, FF.W, 80);
      ctx.fillStyle = '#ff9a3c';
      ctx.font = 'bold 56px Segoe UI, sans-serif';
      ctx.globalAlpha = Math.min(1, S.announceT / 10);
      ctx.fillText(S.announce, FF.W / 2, FF.H / 2 + 10);
      ctx.restore();
    }
  }

  function drawPause(ctx, t) {
    drawFight(ctx, t);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, FF.W, FF.H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff7a2a';
    ctx.font = 'bold 42px Segoe UI, sans-serif';
    ctx.fillText('PAUSED', FF.W / 2, 200);
    const items = ['Resume', 'Character Select', 'Title'];
    ctx.font = '22px Segoe UI, sans-serif';
    for (let i = 0; i < items.length; i++) {
      ctx.fillStyle = i === S.pauseMenu ? '#ffcc66' : '#ccc';
      ctx.fillText((i === S.pauseMenu ? '▸ ' : '  ') + items[i], FF.W / 2, 280 + i * 40);
    }
    FF.Render.drawPromptStrip(ctx,
      'P1: A/D J/K/L  ·  P2: ←/→ Numpad1/2/3 or U/I/O  ·  Hold back to block  ·  ESC/P resume',
      FF.H - 48);
  }

  function drawMatch(ctx, t) {
    FF.Render.drawStage(ctx, t);
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, FF.W, FF.H);
    const m = S.match;
    const winner = m.wins.p1 >= FF.ROUNDS_TO_WIN ? m.p1 : m.p2;
    const wSide = m.wins.p1 >= FF.ROUNDS_TO_WIN ? 'P1' : (S.cpuP2 ? 'CPU' : 'P2');

    ctx.textAlign = 'center';
    ctx.fillStyle = winner.kit.color.glow;
    ctx.font = 'bold 48px Segoe UI, sans-serif';
    ctx.fillText(wSide + ' WINS', FF.W / 2, 160);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Segoe UI, sans-serif';
    ctx.fillText(winner.kit.name, FF.W / 2, 220);

    // win quote
    const quote = FF.WIN_QUOTES[winner.id];
    ctx.fillStyle = '#f2e8d5';
    ctx.font = 'italic 22px Segoe UI, sans-serif';
    ctx.fillText('"' + quote + '"', FF.W / 2, 290);

    // portrait
    FF.Render.drawPortraitCard(ctx, winner.id, FF.W / 2 - 110, 320, 220, 280, true, false, wSide, wSide === 'P1' ? 'p1' : 'p2');

    ctx.fillStyle = Math.sin(t * 3) > 0 ? '#ffcc66' : '#aaa';
    ctx.font = '18px Segoe UI, sans-serif';
    ctx.fillText('TAP REMATCH / ENTER / R     ·     TAP SELECT / S', FF.W / 2, FF.H - 60);
  }

  function draw(ctx, t) {
    switch (S.mode) {
      case 'title': drawTitle(ctx, t); break;
      case 'select': drawSelect(ctx, t); break;
      case 'versus': drawVersus(ctx, t); break;
      case 'fight': drawFight(ctx, t); break;
      case 'pause': drawPause(ctx, t); break;
      case 'match': drawMatch(ctx, t); break;
    }
  }


  /** Card layout shared by drawSelect + pointer hit-test */
  function selectCardLayout() {
    const cardW = 220, cardH = 360, gap = 28;
    const total = 4 * cardW + 3 * gap;
    const startX = (FF.W - total) / 2;
    const cy = 130;
    return { cardW, cardH, gap, startX, cy };
  }

  /** Canvas-space tap on select / title / pause menus */
  function handlePointer(gx, gy) {
    if (S.mode === 'title') {
      // large center start zone as fallback when overlay missed
      if (gy > 340 && gy < 420) enterSelect();
      return;
    }
    if (S.mode === 'select') {
      const L = selectCardLayout();
      for (let i = 0; i < 4; i++) {
        const x = L.startX + i * (L.cardW + L.gap);
        if (gx >= x && gx <= x + L.cardW && gy >= L.cy && gy <= L.cy + L.cardH) {
          // pick for unlocked local player (P1 first; P2 if human and P1 locked)
          if (!S.p1Locked) {
            if (!(S.p2Locked && i === S.p2Char)) S.p1Char = i;
          } else if (!S.cpuP2 && !S.p2Locked) {
            if (!(S.p1Locked && i === S.p1Char)) S.p2Char = i;
          } else if (S.p1Locked && !S.cpuP2) {
            // both locked already — ignore
          } else {
            // P1 locked vs CPU — allow changing? no, wait for CPU auto-lock
          }
          return;
        }
      }
      return;
    }
    if (S.mode === 'pause') {
      const items = ['Resume', 'Character Select', 'Title'];
      for (let i = 0; i < items.length; i++) {
        const y = 280 + i * 40;
        if (gy > y - 22 && gy < y + 14) {
          S.pauseMenu = i;
          if (i === 0) S.mode = 'fight';
          else if (i === 1) enterSelect();
          else if (i === 2) S.mode = 'title';
          return;
        }
      }
    }
    if (S.mode === 'versus') {
      S.mode = 'fight';
      startRound();
    }
    if (S.mode === 'match') {
      if (gy > FF.H - 100) {
        // lower half: rematch by default if leftish, select if rightish
        if (gx < FF.W / 2) {
          S.match = freshMatch(FF.CHARS[S.p1Char], FF.CHARS[S.p2Char]);
          S.mode = 'versus';
          S.versusT = 0;
        } else {
          enterSelect();
        }
      }
    }
  }

  return { S, update, draw, enterSelect, handlePointer, selectCardLayout };
})();
