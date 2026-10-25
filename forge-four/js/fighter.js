/* Fighter entity + animation state machine */
window.FF = window.FF || {};

FF.Fighter = function (charId, side, x) {
  const kit = FF.Kits[charId];
  this.kit = kit;
  this.id = charId;
  this.side = side; // 'p1' | 'p2'
  this.facing = side === 'p1' ? 1 : -1;
  this.x = x;
  this.y = FF.GROUND_Y;
  this.vx = 0;
  this.vy = 0;
  this.hp = kit.maxHp;
  this.maxHp = kit.maxHp;
  this.meter = 0;
  this.maxMeter = 100;
  this.state = 'idle';
  this.stateT = 0; // frames in state
  this.hitstun = 0;
  this.blockstun = 0;
  this.invuln = 0;
  this.armorFrames = 0;
  this.hitConnected = false;
  this.blocking = false;
  this.knockdownT = 0;
  this.alive = true;
  this.flash = 0;
  this.pose = 'idle';
  this.currentMove = null;
  this.hitbox = null;
  this.pushbox = { w: kit.width, h: kit.height };
};

FF.Fighter.prototype.resetRound = function (x) {
  this.x = x;
  this.y = FF.GROUND_Y;
  this.vx = 0;
  this.vy = 0;
  this.hp = this.maxHp;
  this.meter = Math.min(this.meter, 30); // keep a little meter between rounds
  this.state = 'idle';
  this.stateT = 0;
  this.hitstun = 0;
  this.blockstun = 0;
  this.invuln = 0;
  this.armorFrames = 0;
  this.hitConnected = false;
  this.blocking = false;
  this.knockdownT = 0;
  this.alive = true;
  this.flash = 0;
  this.pose = 'idle';
  this.currentMove = null;
  this.hitbox = null;
  this.facing = this.side === 'p1' ? 1 : -1;
};

FF.Fighter.prototype.setState = function (s, force) {
  if (!force && this.state === s && (s === 'idle' || s === 'walk' || s === 'block')) {
    this.pose = s;
    return;
  }
  this.state = s;
  this.stateT = 0;
  this.hitConnected = false;
  this.hitbox = null;
  this.currentMove = null;
  this.armorFrames = 0;
  if (s === 'idle') this.pose = 'idle';
  if (s === 'walk') this.pose = 'walk';
  if (s === 'block') this.pose = 'block';
  if (s === 'hurt') this.pose = 'hurt';
  if (s === 'knockdown') { this.pose = 'knockdown'; this.knockdownT = 40; }
  if (s === 'getup') { this.pose = 'getup'; this.invuln = 20; }
};

FF.Fighter.prototype.canAct = function () {
  return this.alive && this.hitstun <= 0 && this.blockstun <= 0 &&
    this.state !== 'light' && this.state !== 'heavy' && this.state !== 'special' &&
    this.state !== 'knockdown' && this.state !== 'getup' && this.state !== 'dead';
};

FF.Fighter.prototype.startMove = function (kind) {
  const mv = this.kit.moves[kind];
  if (!mv) return;
  if (mv.meterCost && this.meter < mv.meterCost) return;
  if (mv.meterCost) this.meter -= mv.meterCost;
  this.setState(kind);
  this.currentMove = mv;
  this.pose = kind;
  if (mv.armor) this.armorFrames = mv.startup + mv.active;
  if (mv.advance) this.vx = this.facing * mv.advance;
};

FF.Fighter.prototype.bodyRect = function () {
  const w = this.pushbox.w, h = this.pushbox.h;
  return { x: this.x - w / 2, y: this.y - h, w: w, h: h };
};

FF.Fighter.prototype.getActiveHitbox = function () {
  if (!this.currentMove) return null;
  const mv = this.currentMove;
  const t = this.stateT;
  if (t < mv.startup || t >= mv.startup + mv.active) return null;
  if (this.hitConnected) return null;
  let box = mv.box;
  if (mv.lowThenRise && t >= mv.startup + Math.floor(mv.active / 2) && mv.box2) {
    box = mv.box2;
  }
  const fx = this.facing;
  return {
    x: this.x + (fx > 0 ? box.x : -box.x - box.w),
    y: this.y + box.y,
    w: box.w,
    h: box.h,
    move: mv,
    owner: this
  };
};

FF.Fighter.prototype.takeHit = function (dmg, kb, freeze, attackerFacing) {
  if (this.armorFrames > 0) {
    // armored — chip only
    this.hp = Math.max(1, this.hp - Math.floor(dmg * 0.15));
    this.flash = 4;
    return 'armor';
  }
  this.hp -= dmg;
  this.vx = attackerFacing * kb;
  this.hitstun = Math.max(this.hitstun, 12);
  this.flash = freeze;
  this.setState('hurt');
  this.pose = 'hurt';
  if (this.hp <= 0) {
    this.hp = 0;
    this.alive = false;
    this.setState('knockdown');
    this.pose = 'knockdown';
    this.knockdownT = 60;
    return 'ko';
  }
  return 'hit';
};

FF.Fighter.prototype.takeBlock = function (chip, stun, attackerFacing) {
  this.hp = Math.max(1, this.hp - chip);
  this.blockstun = stun;
  this.vx = attackerFacing * 2;
  this.setState('block');
  this.pose = 'block';
  this.blocking = true;
  return 'block';
};

FF.Fighter.prototype.gainMeter = function (amt) {
  if (!this.kit.hasAura) return;
  this.meter = Math.min(this.maxMeter, this.meter + amt);
};

FF.Fighter.prototype.update = function (inputSide, opponent, locked) {
  if (locked) return; // hit freeze
  this.stateT++;
  if (this.flash > 0) this.flash--;
  if (this.invuln > 0) this.invuln--;
  if (this.armorFrames > 0) this.armorFrames--;
  if (this.hitstun > 0) this.hitstun--;
  if (this.blockstun > 0) this.blockstun--;

  // face opponent
  if (this.canAct() || this.state === 'walk' || this.state === 'idle' || this.state === 'block') {
    if (opponent) this.facing = this.x < opponent.x ? 1 : -1;
  }

  // knockdown / getup / dead
  if (this.state === 'knockdown') {
    this.knockdownT--;
    this.vx *= 0.85;
    this.x += this.vx;
    if (this.knockdownT <= 0) {
      if (!this.alive) { this.state = 'dead'; this.pose = 'knockdown'; }
      else this.setState('getup');
    }
    return;
  }
  if (this.state === 'getup') {
    if (this.stateT > 18) this.setState('idle');
    return;
  }
  if (this.state === 'dead') return;

  if (this.hitstun > 0) {
    this.x += this.vx;
    this.vx *= 0.9;
    this.pose = 'hurt';
    return;
  }
  if (this.blockstun > 0) {
    this.x += this.vx;
    this.vx *= 0.85;
    this.pose = 'block';
    return;
  }

  // attack states
  if (this.state === 'light' || this.state === 'heavy' || this.state === 'special') {
    const mv = this.currentMove;
    if (!mv) { this.setState('idle'); return; }
    // advance during special
    if (mv.advance && this.stateT <= mv.startup + mv.active) {
      this.x += this.facing * (mv.advance * 0.55);
    }
    const total = mv.startup + mv.active + mv.recovery;
    this.pose = this.state;
    if (this.stateT >= total) this.setState('idle');
    return;
  }

  // input
  const axis = FF.Input.axis(inputSide);
  const holdBlock = FF.Input.action(inputSide, 'block');
  const back = (this.facing > 0 && axis < 0) || (this.facing < 0 && axis > 0) || holdBlock;
  this.blocking = back && this.canAct();

  if (FF.Input.actionPressed(inputSide, 'special') && this.canAct()) {
    this.startMove('special');
    return;
  }
  if (FF.Input.actionPressed(inputSide, 'heavy') && this.canAct()) {
    this.startMove('heavy');
    return;
  }
  if (FF.Input.actionPressed(inputSide, 'light') && this.canAct()) {
    this.startMove('light');
    return;
  }

  if (this.blocking) {
    this.setState('block');
    this.vx = 0;
    this.pose = 'block';
    return;
  }

  if (axis !== 0 && this.canAct()) {
    this.vx = axis * this.kit.speed;
    this.x += this.vx;
    this.setState('walk');
    this.pose = 'walk';
  } else if (this.canAct()) {
    this.vx = 0;
    this.setState('idle');
    this.pose = 'idle';
  }

  // stage bounds
  this.x = Math.max(60, Math.min(FF.W - 60, this.x));
};

/* Simple CPU for optional P2 */
FF.Fighter.prototype.updateCPU = function (opponent, locked) {
  if (locked) return;
  // synthesize fake input via direct decisions
  this.stateT++;
  if (this.flash > 0) this.flash--;
  if (this.invuln > 0) this.invuln--;
  if (this.armorFrames > 0) this.armorFrames--;
  if (this.hitstun > 0) this.hitstun--;
  if (this.blockstun > 0) this.blockstun--;

  if (opponent) this.facing = this.x < opponent.x ? 1 : -1;

  if (this.state === 'knockdown') {
    this.knockdownT--;
    this.vx *= 0.85;
    this.x += this.vx;
    if (this.knockdownT <= 0) {
      if (!this.alive) { this.state = 'dead'; this.pose = 'knockdown'; }
      else this.setState('getup');
    }
    return;
  }
  if (this.state === 'getup') { if (this.stateT > 18) this.setState('idle'); return; }
  if (this.state === 'dead') return;
  if (this.hitstun > 0) { this.x += this.vx; this.vx *= 0.9; this.pose = 'hurt'; return; }
  if (this.blockstun > 0) { this.x += this.vx; this.vx *= 0.85; this.pose = 'block'; return; }

  if (this.state === 'light' || this.state === 'heavy' || this.state === 'special') {
    const mv = this.currentMove;
    if (!mv) { this.setState('idle'); return; }
    if (mv.advance && this.stateT <= mv.startup + mv.active) this.x += this.facing * (mv.advance * 0.55);
    const total = mv.startup + mv.active + mv.recovery;
    this.pose = this.state;
    if (this.stateT >= total) this.setState('idle');
    return;
  }

  const dist = opponent ? Math.abs(opponent.x - this.x) : 999;
  const r = Math.random();

  // block if opponent attacking nearby
  if (opponent && (opponent.state === 'light' || opponent.state === 'heavy' || opponent.state === 'special') && dist < 120 && r < 0.55) {
    this.blocking = true;
    this.setState('block');
    this.vx = 0;
    this.pose = 'block';
    return;
  }
  this.blocking = false;

  if (this.canAct()) {
    if (dist > 160) {
      this.vx = this.facing * this.kit.speed;
      this.x += this.vx;
      this.setState('walk');
      this.pose = 'walk';
    } else if (dist < 70 && r < 0.08) {
      // back off sometimes
      this.vx = -this.facing * this.kit.speed;
      this.x += this.vx;
      this.setState('walk');
      this.pose = 'walk';
    } else if (r < 0.04 && this.kit.moves.special.meterCost <= this.meter) {
      this.startMove('special');
    } else if (r < 0.07) {
      this.startMove('heavy');
    } else if (r < 0.14) {
      this.startMove('light');
    } else if (dist > 90) {
      this.vx = this.facing * this.kit.speed * 0.8;
      this.x += this.vx;
      this.setState('walk');
      this.pose = 'walk';
    } else {
      this.vx = 0;
      this.setState('idle');
      this.pose = 'idle';
    }
  }
  this.x = Math.max(60, Math.min(FF.W - 60, this.x));
};
