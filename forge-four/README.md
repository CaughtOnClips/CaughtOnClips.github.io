# Forge Four — Vertical Slice

Local 2D versus fighter prototype (HTML5 Canvas + JS). Best of 3 rounds. No engine, no network at runtime. Playable on desktop **keyboard** or **phone touch**.

## Run

**Option A — static server (recommended)**

```bash
cd /workspace/forge-four
python3 -m http.server 8765
# open http://127.0.0.1:8765/
```

Or: `npx --yes serve -l 8765`

On a phone on the same network: `http://<your-lan-ip>:8765/`

**Option B — open file**

Open `index.html` in a modern browser (Chrome / Firefox / Edge / mobile Safari). Roster portraits load from `assets/roster.jpg` (works on `file://` in most browsers).

## Controls

### Keyboard (desktop)

| Action | Player 1 | Player 2 |
|--------|----------|----------|
| Move | A / D | ← / → |
| Light | J | Numpad 1 or **U** |
| Heavy | K | Numpad 2 or **I** |
| Special | L | Numpad 3 or **O** |
| Block | Hold back (away from opponent) | Hold back |
| Pause | Esc or P | Esc or P |

**Select screen:** A/D (P1) and ←/→ (P2) to move cursor; J/Enter (P1) and U/Num1 (P2) to lock. Same fighter ban. **C** toggles CPU as Player 2.

**After match:** Enter / **R** rematch · **S** character select.

**Debug:** F1 toggles hitbox draw during fight.

### Touch (phone / coarse pointer)

On touch or narrow screens the UI shows large on-screen controls. Touch drives the **same input channels** as the keyboard (virtual codes in `js/input.js`).

**Title**
- Tap **START** (or the prompt area) → character select
- Tap **CPU** to toggle CPU as Player 2

**Character select**
- Defaults to **CPU P2 = ON** on touch/narrow so you can play solo
- Tap a fighter card to choose
- Tap **LOCK** to confirm (locks P1; vs CPU the opponent auto-picks a different fighter)
- Tap **CPU** to toggle human P2
- Same-character ban still applies

**Fight — bottom touch pad (P1)**

| Button | Maps to |
|--------|---------|
| ◀ Left | P1 left (`A` / `TouchP1Left`) |
| ▶ Right | P1 right (`D` / `TouchP1Right`) |
| BLK Block | Hold-block channel (`TouchP1Block`) — same as holding back |
| L Light | P1 light (`J`) |
| H Heavy | P1 heavy (`K`) |
| SP Special | P1 special (`L`) |
| ❚❚ Pause | Pause / resume |

**Match end:** tap **REMATCH** or **SELECT**.

Landscape is more comfortable; portrait is supported (canvas letterboxed to 16:9, bounce-scroll disabled while playing).

## Cast

| Fighter | Style | Special | Aura meter |
|---------|-------|---------|------------|
| **Twist** | Slow heavy | Gold Seal (armored advance) | Yes |
| **Pink** | Fast rushdown | Pink Overdrive (forward burst) | Yes |
| **Blue** | Fundamentals | Blue Breaker (dash-in) | No |
| **Green** | Technical reach | Jade Sweep (low → rising) | No |

## Flow

Title → Character Select → Versus → Fight → Round result → (BO3 loop) → Match win quote → Rematch or Select.

## Files

```
forge-four/
  index.html
  README.md
  css/style.css
  assets/roster.jpg
  js/config.js  input.js  characters.js  fighter.js
     combat.js  render.js  scenes.js  main.js
```
