/* Hit detection, push separation, hit freeze */
window.FF = window.FF || {};
FF.Combat = (function () {
  function overlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function separate(a, b) {
    const ar = a.bodyRect(), br = b.bodyRect();
    if (!overlap(ar, br)) return;
    const overlapX = Math.min(ar.x + ar.w, br.x + br.w) - Math.max(ar.x, br.x);
    if (a.x < b.x) {
      a.x -= overlapX / 2;
      b.x += overlapX / 2;
    } else {
      a.x += overlapX / 2;
      b.x -= overlapX / 2;
    }
    a.x = Math.max(60, Math.min(FF.W - 60, a.x));
    b.x = Math.max(60, Math.min(FF.W - 60, b.x));
  }

  function resolveHit(attacker, defender) {
    const hb = attacker.getActiveHitbox();
    if (!hb) return null;
    const hurt = defender.bodyRect();
    // crouch-ish block still uses full body for prototype; block = holding back
    if (!overlap(hb, hurt)) return null;
    if (defender.invuln > 0) return null;

    const mv = hb.move;
    attacker.hitConnected = true;

    // blocking?
    if (defender.blocking && defender.hitstun <= 0) {
      defender.takeBlock(mv.chip, mv.blockstun, attacker.facing);
      attacker.gainMeter(4);
      return { type: 'block', freeze: Math.max(FF.HIT_FREEZE_MIN, mv.hitFreeze - 1) };
    }

    const result = defender.takeHit(mv.damage, mv.knockback, mv.hitFreeze, attacker.facing);
    attacker.gainMeter(12);
    if (defender.kit.hasAura && result === 'hit') {
      // defender also gains a tiny bit on being hit? no — attacker fills on hit
    }
    return { type: result, freeze: mv.hitFreeze };
  }

  function step(p1, p2) {
    separate(p1, p2);
    let freeze = 0;
    let events = [];
    const h1 = resolveHit(p1, p2);
    if (h1) { freeze = Math.max(freeze, h1.freeze); events.push({ atk: 'p1', ...h1 }); }
    const h2 = resolveHit(p2, p1);
    if (h2) { freeze = Math.max(freeze, h2.freeze); events.push({ atk: 'p2', ...h2 }); }
    freeze = Math.min(FF.HIT_FREEZE_MAX, Math.max(freeze ? FF.HIT_FREEZE_MIN : 0, freeze));
    return { freeze, events };
  }

  return { step, overlap };
})();
