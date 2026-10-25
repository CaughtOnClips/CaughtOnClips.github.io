/* Forge Four — shared config */
window.FF = window.FF || {};
FF.W = 1280;
FF.H = 720;
FF.GROUND_Y = 580;
FF.FPS = 60;
FF.DT = 1 / 60;
FF.HIT_FREEZE_MIN = 2;
FF.HIT_FREEZE_MAX = 4;
FF.ROUNDS_TO_WIN = 2; // best of 3
FF.ROUND_TIME = 99; // seconds display; soft timer
FF.CHARS = ['twist', 'pink', 'blue', 'green'];
FF.WIN_QUOTES = {
  twist: "Heat don't lie. You just couldn't hold it.",
  pink:  "Saw the opening. Took the whole match.",
  blue:  "No aura. No excuses. Just better.",
  green: "Steady breath. Clean finish."
};
FF.COLORS = {
  twist: { main: '#c41e3a', glow: '#ff3b3b', dark: '#4a0a14', name: 'TWIST' },
  pink:  { main: '#e91e8c', glow: '#ff4ec4', dark: '#4a0a32', name: 'PINK' },
  blue:  { main: '#1e6cff', glow: '#4ea0ff', dark: '#0a1e4a', name: 'BLUE' },
  green: { main: '#2d8a4e', glow: '#4ecf7a', dark: '#0a2e18', name: 'GREEN' }
};
