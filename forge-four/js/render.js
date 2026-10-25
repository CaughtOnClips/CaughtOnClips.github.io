/* Procedural Canvas drawing — stage, fighters, HUD, select */
window.FF = window.FF || {};
FF.Render = (function () {
  let rosterImg = null;
  let rosterReady = false;

  function loadRoster(src) {
    rosterImg = new Image();
    rosterImg.onload = () => { rosterReady = true; };
    rosterImg.onerror = () => { rosterReady = false; };
    rosterImg.src = src;
  }

  function drawStage(ctx, t) {
    const W = FF.W, H = FF.H;
    // near-black forge
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0b0b10');
    g.addColorStop(0.55, '#121018');
    g.addColorStop(1, '#1a0e08');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // distant ember pillars
    for (let i = 0; i < 7; i++) {
      const x = 80 + i * 180 + Math.sin(t * 0.4 + i) * 6;
      const hg = 180 + (i % 3) * 40;
      const gg = ctx.createLinearGradient(x, H - 200 - hg, x, H - 80);
      gg.addColorStop(0, 'rgba(255,80,10,0)');
      gg.addColorStop(0.5, 'rgba(255,100,20,0.08)');
      gg.addColorStop(1, 'rgba(255,60,0,0.18)');
      ctx.fillStyle = gg;
      ctx.fillRect(x - 30, H - 200 - hg, 60, hg + 120);
    }

    // floor glow
    const floorG = ctx.createLinearGradient(0, FF.GROUND_Y - 40, 0, H);
    floorG.addColorStop(0, 'rgba(255,90,20,0)');
    floorG.addColorStop(0.3, 'rgba(255,90,20,0.12)');
    floorG.addColorStop(1, 'rgba(40,10,0,0.9)');
    ctx.fillStyle = floorG;
    ctx.fillRect(0, FF.GROUND_Y - 40, W, H - (FF.GROUND_Y - 40));

    // ground line
    ctx.strokeStyle = 'rgba(255,140,40,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, FF.GROUND_Y + 2);
    ctx.lineTo(W - 40, FF.GROUND_Y + 2);
    ctx.stroke();

    // embers
    ctx.fillStyle = 'rgba(255,160,40,0.7)';
    for (let i = 0; i < 24; i++) {
      const ex = (i * 97 + t * (20 + i % 5) * 8) % W;
      const ey = FF.GROUND_Y - 60 - ((t * 30 + i * 40) % 280);
      const s = 1.5 + (i % 3);
      ctx.globalAlpha = 0.35 + (i % 4) * 0.1;
      ctx.fillRect(ex, ey, s, s);
    }
    ctx.globalAlpha = 1;
  }

  function drawAura(ctx, f, t) {
    if (!f.kit.hasAura) return;
    const col = f.kit.color;
    const pulse = 0.55 + Math.sin(t * 6 + f.x * 0.01) * 0.2;
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.globalAlpha = 0.35 * pulse + (f.meter / 100) * 0.25;
    ctx.fillStyle = col.glow;
    ctx.beginPath();
    ctx.ellipse(0, -f.pushbox.h * 0.45, f.pushbox.w * 0.85, f.pushbox.h * 0.65, 0, 0, Math.PI * 2);
    ctx.fill();
    // jagged blobs
    for (let i = 0; i < 5; i++) {
      const ang = t * 2 + i * 1.2;
      const rr = 28 + i * 6 + Math.sin(t * 5 + i) * 4;
      const ax = Math.cos(ang) * rr * 0.4;
      const ay = -f.pushbox.h * 0.5 + Math.sin(ang * 1.3) * rr * 0.5;
      ctx.globalAlpha = 0.2 + (f.meter / 200);
      ctx.beginPath();
      ctx.arc(ax, ay, 10 + (i % 3) * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawFighter(ctx, f, t) {
    const col = f.kit.color;
    const w = f.pushbox.w, h = f.pushbox.h;
    const facing = f.facing;
    drawAura(ctx, f, t);

    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.scale(facing, 1);

    // flash
    if (f.flash > 0) ctx.globalAlpha = 0.5 + (f.flash % 2) * 0.5;

    const pose = f.pose;
    let bodyY = -h;
    let legSpread = 10;
    let armL = { x: -18, y: -h * 0.55, len: 28 };
    let armR = { x: 16, y: -h * 0.55, len: 30 };
    let crouch = 0;
    let tilt = 0;

    if (pose === 'walk') {
      legSpread = 14 + Math.sin(f.stateT * 0.4) * 8;
      armR.y += Math.sin(f.stateT * 0.4) * 4;
    }
    if (pose === 'block') {
      armL = { x: 8, y: -h * 0.7, len: 26 };
      armR = { x: 18, y: -h * 0.55, len: 24 };
      crouch = 8;
    }
    if (pose === 'hurt') {
      tilt = -0.15;
      armL = { x: -22, y: -h * 0.4, len: 22 };
      armR = { x: 10, y: -h * 0.35, len: 22 };
    }
    if (pose === 'knockdown' || pose === 'dead') {
      ctx.restore();
      ctx.save();
      ctx.translate(f.x, f.y - 18);
      ctx.rotate(facing > 0 ? 1.2 : -1.2);
      ctx.fillStyle = col.main;
      ctx.fillRect(-h * 0.45, -w * 0.35, h * 0.85, w * 0.7);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(-h * 0.1, -w * 0.2, 22, 18);
      ctx.restore();
      return;
    }
    if (pose === 'getup') {
      crouch = 30 - f.stateT;
      armL.y = -40; armR.y = -40;
    }
    if (pose === 'light') {
      const p = f.stateT / (f.currentMove ? f.currentMove.startup + 1 : 5);
      armR = { x: 10 + Math.min(1, Math.max(0, p)) * 36, y: -h * 0.65, len: 34 };
    }
    if (pose === 'heavy') {
      const p = f.stateT / (f.currentMove ? f.currentMove.startup + 1 : 8);
      armR = { x: 8 + Math.min(1, Math.max(0, p)) * 42, y: -h * 0.75, len: 38 };
      tilt = 0.08;
    }
    if (pose === 'special') {
      const p = Math.min(1, f.stateT / 8);
      if (f.id === 'green' && f.currentMove && f.currentMove.lowThenRise) {
        if (f.stateT < f.currentMove.startup + f.currentMove.active / 2) {
          crouch = 35; armR = { x: 30, y: -30, len: 40 };
        } else {
          crouch = 0; armR = { x: 20, y: -h * 0.9, len: 36 };
        }
      } else {
        armR = { x: 15 + p * 40, y: -h * 0.6, len: 40 };
        armL = { x: -10 + p * 20, y: -h * 0.5, len: 30 };
      }
      // gold seal / overdrive glow
      if (f.kit.hasAura || f.id === 'blue') {
        ctx.fillStyle = col.glow;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(40, -h * 0.5, 28 + p * 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = f.flash > 0 ? 0.5 : 1;
      }
    }

    ctx.rotate(tilt);

    // legs
    ctx.strokeStyle = '#111';
    ctx.fillStyle = f.id === 'green' ? col.main : '#151515';
    ctx.lineWidth = 3;
    ctx.fillRect(-legSpread - 6, -36 + crouch, 14, 36 - crouch * 0.3);
    ctx.fillRect(legSpread - 8, -36 + crouch, 14, 36 - crouch * 0.3);

    // torso
    const tw = w * 0.7, th = h * 0.45;
    ctx.fillStyle = col.main;
    if (f.id === 'blue') {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(-tw / 2, bodyY + crouch + 28, tw, th);
      // blue belt
      ctx.fillStyle = col.main;
      ctx.fillRect(-tw / 2 - 2, bodyY + crouch + 28 + th - 14, tw + 4, 12);
    } else if (f.id === 'green') {
      ctx.fillRect(-tw / 2, bodyY + crouch + 24, tw, th + 8);
      ctx.fillStyle = col.dark;
      ctx.fillRect(-tw / 2, bodyY + crouch + 24 + th - 6, tw, 10);
    } else {
      // twist / pink — dark pants, colored accents
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(-tw / 2, bodyY + crouch + 28, tw, th);
      ctx.fillStyle = col.main;
      ctx.fillRect(-tw / 2, bodyY + crouch + 28, tw, 10);
      if (f.id === 'pink') {
        ctx.fillRect(-tw / 2, bodyY + crouch + 28, tw, 18);
      }
    }

    // head
    ctx.fillStyle = '#c4a882';
    ctx.beginPath();
    ctx.arc(0, bodyY + crouch + 16, 14, 0, Math.PI * 2);
    ctx.fill();
    // hair accent
    ctx.fillStyle = f.id === 'pink' ? col.glow : '#111';
    if (f.id === 'twist') {
      ctx.fillStyle = '#111';
      ctx.fillRect(-12, bodyY + crouch + 2, 24, 10);
      ctx.fillStyle = '#d4a017';
      ctx.fillRect(-10, bodyY + crouch + 8, 6, 4);
      ctx.fillRect(4, bodyY + crouch + 8, 6, 4);
    } else if (f.id === 'pink') {
      ctx.fillRect(-8, bodyY + crouch - 4, 16, 14);
    } else if (f.id === 'green') {
      ctx.fillStyle = '#111';
      ctx.fillRect(-4, bodyY + crouch + 8, 8, 30); // braid hint
    } else {
      ctx.fillStyle = '#111';
      ctx.fillRect(-12, bodyY + crouch + 2, 24, 8);
    }

    // arms
    ctx.strokeStyle = '#c4a882';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-8, bodyY + crouch + 45);
    ctx.lineTo(armL.x, bodyY + crouch + 45 + (armL.y + h * 0.55));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, bodyY + crouch + 45);
    ctx.lineTo(armR.x, armR.y + (bodyY + h) + crouch * 0.2);
    ctx.stroke();

    // fists / wraps
    ctx.fillStyle = f.id === 'blue' || f.id === 'green' ? col.main : '#222';
    ctx.beginPath();
    ctx.arc(armR.x, armR.y + (bodyY + h) + crouch * 0.2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(armL.x, bodyY + crouch + 45 + (armL.y + h * 0.55), 6, 0, Math.PI * 2);
    ctx.fill();

    // Twist gold seal prop during special
    if (f.id === 'twist' && pose === 'special') {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(armR.x + 10, armR.y + (bodyY + h), 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,215,0,0.35)';
      ctx.fill();
    }

    // armor flash
    if (f.armorFrames > 0) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.6;
      ctx.strokeRect(-w / 2 - 4, bodyY + crouch - 4, w + 8, h + 4);
    }

    ctx.restore();

    // debug hitbox optional — off by default
  }

  function drawHitboxes(ctx, f) {
    const hb = f.getActiveHitbox && f.getActiveHitbox();
    if (!hb) return;
    ctx.fillStyle = 'rgba(255,40,40,0.35)';
    ctx.fillRect(hb.x, hb.y, hb.w, hb.h);
  }

  function hatchBar(ctx, x, y, w, h, mirror) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1;
    for (let i = -h; i < w + h; i += 6) {
      ctx.beginPath();
      if (mirror) {
        ctx.moveTo(x + w - i, y);
        ctx.lineTo(x + w - i - h, y + h);
      } else {
        ctx.moveTo(x + i, y);
        ctx.lineTo(x + i + h, y + h);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHUD(ctx, match) {
    const p1 = match.p1, p2 = match.p2;
    const barW = 420, barH = 22;
    const y = 28;

    // P1 HP (left, depletes toward left edge — fill from right of bar area conceptually mirrored)
    const p1x = 80;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(p1x - 3, y - 3, barW + 6, barH + 6);
    ctx.strokeStyle = p1.kit.color.main;
    ctx.lineWidth = 2;
    ctx.strokeRect(p1x - 3, y - 3, barW + 6, barH + 6);
    const p1r = Math.max(0, p1.hp / p1.maxHp);
    ctx.fillStyle = '#3a1010';
    ctx.fillRect(p1x, y, barW, barH);
    ctx.fillStyle = p1.kit.color.main;
    ctx.fillRect(p1x + barW * (1 - p1r), y, barW * p1r, barH);
    hatchBar(ctx, p1x + barW * (1 - p1r), y, barW * p1r, barH, false);

    // P2 HP mirrored
    const p2x = FF.W - 80 - barW;
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(p2x - 3, y - 3, barW + 6, barH + 6);
    ctx.strokeStyle = p2.kit.color.main;
    ctx.strokeRect(p2x - 3, y - 3, barW + 6, barH + 6);
    const p2r = Math.max(0, p2.hp / p2.maxHp);
    ctx.fillStyle = '#3a1010';
    ctx.fillRect(p2x, y, barW, barH);
    ctx.fillStyle = p2.kit.color.main;
    ctx.fillRect(p2x, y, barW * p2r, barH);
    hatchBar(ctx, p2x, y, barW * p2r, barH, true);

    // names
    ctx.font = 'bold 16px Segoe UI, sans-serif';
    ctx.fillStyle = '#f2e8d5';
    ctx.textAlign = 'left';
    ctx.fillText(p1.kit.name, p1x, y - 8);
    ctx.textAlign = 'right';
    ctx.fillText(p2.kit.name, p2x + barW, y - 8);

    // round pips
    drawPips(ctx, p1x, y + barH + 10, match.wins.p1, false, p1.kit.color.main);
    drawPips(ctx, p2x + barW, y + barH + 10, match.wins.p2, true, p2.kit.color.main);

    // timer
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px Segoe UI, sans-serif';
    ctx.fillStyle = '#ff9a3c';
    ctx.fillText(String(Math.max(0, Math.ceil(match.timeLeft))), FF.W / 2, 48);

    // aura meters
    if (p1.kit.hasAura) drawMeter(ctx, p1x, y + barH + 28, 180, p1.meter, p1.kit.color, false);
    if (p2.kit.hasAura) drawMeter(ctx, p2x + barW - 180, y + barH + 28, 180, p2.meter, p2.kit.color, true);

    // pause hint
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.fillStyle = 'rgba(242,232,213,0.45)';
    ctx.textAlign = 'center';
    ctx.fillText('ESC pause', FF.W / 2, FF.H - 16);
  }

  function drawPips(ctx, x, y, wins, mirror, col) {
    for (let i = 0; i < FF.ROUNDS_TO_WIN; i++) {
      const px = mirror ? x - 14 - i * 22 : x + i * 22;
      ctx.beginPath();
      ctx.arc(px, y, 7, 0, Math.PI * 2);
      ctx.fillStyle = i < wins ? col : 'rgba(255,255,255,0.15)';
      ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawMeter(ctx, x, y, w, meter, col, mirror) {
    const h = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = col.glow;
    const r = meter / 100;
    if (mirror) ctx.fillRect(x + w * (1 - r), y, w * r, h);
    else ctx.fillRect(x, y, w * r, h);
    ctx.strokeStyle = col.main;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.font = '10px Segoe UI, sans-serif';
    ctx.fillStyle = col.glow;
    ctx.textAlign = mirror ? 'right' : 'left';
    ctx.fillText('AURA', mirror ? x + w : x, y + h + 11);
  }

  function drawPortraitCard(ctx, charId, x, y, w, h, selected, locked, label, cursorStyle) {
    const col = FF.COLORS[charId];
    ctx.save();
    // frame
    ctx.fillStyle = col.dark;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = selected ? col.glow : col.main;
    ctx.lineWidth = selected ? 4 : 2;
    ctx.strokeRect(x, y, w, h);

    // try roster crop: image is 4 panels wide
    const idx = FF.CHARS.indexOf(charId);
    if (rosterReady && rosterImg) {
      const sw = rosterImg.width / 4;
      const sh = rosterImg.height;
      ctx.drawImage(rosterImg, idx * sw, 0, sw, sh, x + 4, y + 4, w - 8, h - 48);
    } else {
      // fallback silhouette
      ctx.fillStyle = col.main;
      ctx.globalAlpha = 0.35;
      ctx.fillRect(x + 4, y + 4, w - 8, h - 48);
      ctx.globalAlpha = 1;
      ctx.fillStyle = col.glow;
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h * 0.35, 36, 0, Math.PI * 2);
      ctx.fill();
    }

    // name plate
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(x, y + h - 44, w, 44);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(col.name, x + w / 2, y + h - 18);

    // P1/P2 label
    if (label) {
      ctx.font = 'bold 14px Segoe UI, sans-serif';
      ctx.fillStyle = label === 'P1' ? '#ffcc66' : '#66ccff';
      ctx.fillText(label, x + w / 2, y + 22);
    }

    // distinct cursor (not color-only)
    if (selected && !locked) {
      drawCursor(ctx, x, y, w, h, cursorStyle);
    }
    if (locked) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 18px Segoe UI, sans-serif';
      ctx.fillText('LOCKED', x + w / 2, y + h / 2);
    }
    ctx.restore();
  }

  function drawCursor(ctx, x, y, w, h, style) {
    ctx.save();
    if (style === 'p1') {
      // chevron brackets
      ctx.strokeStyle = '#ffcc66';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 8, y + 16); ctx.lineTo(x - 8, y - 4); ctx.lineTo(x + 16, y - 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w + 8, y + h - 16); ctx.lineTo(x + w + 8, y + h + 4); ctx.lineTo(x + w - 16, y + h + 4);
      ctx.stroke();
      // triangle marker top
      ctx.fillStyle = '#ffcc66';
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y - 14);
      ctx.lineTo(x + w / 2 - 10, y - 2);
      ctx.lineTo(x + w / 2 + 10, y - 2);
      ctx.fill();
    } else {
      // diamond + dashed frame
      ctx.strokeStyle = '#66ccff';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(x - 6, y - 6, w + 12, h + 12);
      ctx.setLineDash([]);
      ctx.fillStyle = '#66ccff';
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + h + 6);
      ctx.lineTo(x + w / 2 - 8, y + h + 18);
      ctx.lineTo(x + w / 2, y + h + 30);
      ctx.lineTo(x + w / 2 + 8, y + h + 18);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPromptStrip(ctx, text, y) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, y, FF.W, 36);
    ctx.fillStyle = '#f2e8d5';
    ctx.font = '14px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, FF.W / 2, y + 23);
  }

  return {
    loadRoster, drawStage, drawFighter, drawHitboxes, drawHUD,
    drawPortraitCard, drawPromptStrip, isRosterReady: () => rosterReady
  };
})();
