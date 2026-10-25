/* Character kits — stats + move frames (state-machine poses) */
window.FF = window.FF || {};
FF.Kits = {
  twist: {
    id: 'twist', name: 'TWIST', tag: 'Crimson Aura Heavy',
    hasAura: true,
    speed: 2.4, jumpV: 0, // ground only prototype
    maxHp: 1100,
    width: 54, height: 118,
    color: FF.COLORS.twist,
    moves: {
      light: {
        startup: 5, active: 3, recovery: 10,
        damage: 55, chip: 8, hitstun: 12, blockstun: 8,
        knockback: 4.5, hitFreeze: 3,
        box: { x: 28, y: -90, w: 48, h: 36 },
        push: 0
      },
      heavy: {
        startup: 10, active: 4, recovery: 18,
        damage: 110, chip: 18, hitstun: 18, blockstun: 12,
        knockback: 8, hitFreeze: 4,
        box: { x: 20, y: -100, w: 70, h: 50 },
        push: 2
      },
      special: { // Gold Seal — armored advance / surge
        name: 'Gold Seal', meterCost: 50,
        startup: 8, active: 10, recovery: 16,
        damage: 140, chip: 25, hitstun: 20, blockstun: 14,
        knockback: 10, hitFreeze: 4,
        armor: true, advance: 5.5,
        box: { x: 10, y: -110, w: 80, h: 100 },
        push: 4
      }
    }
  },
  pink: {
    id: 'pink', name: 'PINK', tag: 'Magenta Rushdown',
    hasAura: true,
    speed: 4.0,
    maxHp: 950,
    width: 46, height: 110,
    color: FF.COLORS.pink,
    moves: {
      light: {
        startup: 3, active: 2, recovery: 8,
        damage: 40, chip: 5, hitstun: 10, blockstun: 7,
        knockback: 3.5, hitFreeze: 2,
        box: { x: 24, y: -85, w: 42, h: 28 },
        push: 0
      },
      heavy: {
        startup: 7, active: 3, recovery: 14,
        damage: 85, chip: 12, hitstun: 15, blockstun: 10,
        knockback: 6.5, hitFreeze: 3,
        box: { x: 18, y: -95, w: 58, h: 40 },
        push: 1
      },
      special: { // Pink Overdrive — forward burst
        name: 'Pink Overdrive', meterCost: 40,
        startup: 5, active: 8, recovery: 14,
        damage: 100, chip: 18, hitstun: 16, blockstun: 11,
        knockback: 9, hitFreeze: 3,
        armor: false, advance: 9,
        box: { x: 0, y: -100, w: 90, h: 70 },
        push: 3
      }
    }
  },
  blue: {
    id: 'blue', name: 'BLUE', tag: 'Cobalt Fundamentals',
    hasAura: false,
    speed: 3.2,
    maxHp: 1000,
    width: 48, height: 114,
    color: FF.COLORS.blue,
    moves: {
      light: {
        startup: 4, active: 3, recovery: 9,
        damage: 48, chip: 6, hitstun: 11, blockstun: 8,
        knockback: 4, hitFreeze: 2,
        box: { x: 26, y: -88, w: 44, h: 32 },
        push: 0
      },
      heavy: {
        startup: 8, active: 3, recovery: 15,
        damage: 95, chip: 14, hitstun: 16, blockstun: 11,
        knockback: 7, hitFreeze: 3,
        box: { x: 20, y: -98, w: 62, h: 44 },
        push: 1.5
      },
      special: { // Blue Breaker — dash-in strike
        name: 'Blue Breaker', meterCost: 0,
        startup: 6, active: 5, recovery: 18,
        damage: 115, chip: 16, hitstun: 18, blockstun: 12,
        knockback: 8.5, hitFreeze: 4,
        armor: false, advance: 11,
        box: { x: 5, y: -95, w: 75, h: 55 },
        push: 2
      }
    }
  },
  green: {
    id: 'green', name: 'GREEN', tag: 'Forest Technical',
    hasAura: false,
    speed: 3.0,
    maxHp: 1000,
    width: 50, height: 116,
    color: FF.COLORS.green,
    moves: {
      light: {
        startup: 5, active: 3, recovery: 10,
        damage: 45, chip: 6, hitstun: 11, blockstun: 8,
        knockback: 3.8, hitFreeze: 2,
        box: { x: 30, y: -80, w: 55, h: 28 }, // longer reach
        push: 0
      },
      heavy: {
        startup: 9, active: 4, recovery: 16,
        damage: 90, chip: 14, hitstun: 16, blockstun: 11,
        knockback: 6.8, hitFreeze: 3,
        box: { x: 25, y: -100, w: 78, h: 42 },
        push: 1
      },
      special: { // Jade Sweep — low then rising
        name: 'Jade Sweep', meterCost: 0,
        startup: 7, active: 10, recovery: 16,
        damage: 105, chip: 15, hitstun: 18, blockstun: 13,
        knockback: 7.5, hitFreeze: 3,
        armor: false, advance: 2,
        lowThenRise: true,
        box: { x: 15, y: -40, w: 85, h: 40 }, // starts low
        box2: { x: 20, y: -110, w: 70, h: 70 }, // rising
        push: 2
      }
    }
  }
};
