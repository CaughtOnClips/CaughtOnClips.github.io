/* Client-side background removal + manual cutout editor.
   1. Fast edge flood-fill / chroma matte (good for clothes on a plain wall or floor)
   2. Optional @imgly/background-removal from CDN (heavy on iOS — never blocks the UI)
   3. Manual eraser + tap-to-remove (magic wand) fallback
*/
(() => {
  const IMGLY_VER = "1.5.8";
  const IMGLY_MOD = `https://cdn.jsdelivr.net/npm/@imgly/background-removal@${IMGLY_VER}/+esm`;
  const IMGLY_PUBLIC = `https://cdn.jsdelivr.net/npm/@imgly/background-removal@${IMGLY_VER}/dist/`;

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = src;
    });
  }

  async function blobToImage(blob) {
    const url = URL.createObjectURL(blob);
    try { return await loadImage(url); }
    finally { URL.revokeObjectURL(url); }
  }

  function canvasToBlob(canvas, type = "image/png", quality) {
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
  }

  function alreadyCutout(imgData) {
    const px = imgData.data;
    let trans = 0;
    for (let i = 3; i < px.length; i += 16) if (px[i] < 20) trans++;
    const samples = Math.floor(px.length / 16);
    return samples > 0 && trans / samples > 0.08;
  }

  async function chromaMatte(blob) {
    const img = await blobToImage(blob);
    const maxW = 1000;
    const scale = Math.min(1, maxW / img.naturalWidth);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h);
    if (alreadyCutout(data)) return canvasToBlob(c);

    const px = data.data;
    const corner = Math.max(4, Math.min(16, Math.round(Math.min(w, h) * 0.03)));
    function sample(x0, y0, x1, y1) {
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * w + x) * 4;
          r += px[i]; g += px[i + 1]; b += px[i + 2]; n++;
        }
      }
      return n ? [r / n, g / n, b / n] : [255, 255, 255];
    }
    const samples = [
      sample(0, 0, corner, corner),
      sample(w - corner, 0, w, corner),
      sample(0, h - corner, corner, h),
      sample(w - corner, h - corner, w, h)
    ];
    const bg = [
      samples.reduce((s, v) => s + v[0], 0) / 4,
      samples.reduce((s, v) => s + v[1], 0) / 4,
      samples.reduce((s, v) => s + v[2], 0) / 4
    ];

    function dist(i) {
      const dr = px[i] - bg[0], dg = px[i + 1] - bg[1], db = px[i + 2] - bg[2];
      return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    const THRESH = 48;
    const visited = new Uint8Array(w * h);
    const stack = [];
    function maybe(x, y) {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const idx = y * w + x;
      if (visited[idx]) return;
      stack.push(idx);
    }
    for (let x = 0; x < w; x++) { maybe(x, 0); maybe(x, h - 1); }
    for (let y = 0; y < h; y++) { maybe(0, y); maybe(w - 1, y); }

    while (stack.length) {
      const idx = stack.pop();
      if (visited[idx]) continue;
      visited[idx] = 1;
      if (dist(idx * 4) >= THRESH) continue;
      px[idx * 4 + 3] = 0;
      const x = idx % w, y = (idx / w) | 0;
      maybe(x + 1, y); maybe(x - 1, y); maybe(x, y + 1); maybe(x, y - 1);
    }

    // Light edge feather
    const copy = new Uint8ClampedArray(px);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4;
        if (copy[i + 3] === 0) continue;
        let near = 0;
        if (copy[((y) * w + (x - 1)) * 4 + 3] === 0) near++;
        if (copy[((y) * w + (x + 1)) * 4 + 3] === 0) near++;
        if (copy[((y - 1) * w + x) * 4 + 3] === 0) near++;
        if (copy[((y + 1) * w + x) * 4 + 3] === 0) near++;
        if (near) px[i + 3] = Math.round(copy[i + 3] * (1 - near * 0.22));
      }
    }

    ctx.putImageData(data, 0, 0);
    return canvasToBlob(c);
  }

  async function tryImgly(blob, onProgress, timeoutMs = 22000) {
    if (window.__CLOSET_SKIP_IMGLY) throw new Error("imgly skipped");
    const mod = await Promise.race([
      import(IMGLY_MOD),
      new Promise((_, rej) => setTimeout(() => rej(new Error("imgly import timeout")), 12000))
    ]);
    const removeBackground = mod.removeBackground || mod.default;
    if (typeof removeBackground !== "function") throw new Error("imgly API missing");
    const result = await Promise.race([
      removeBackground(blob, {
        publicPath: IMGLY_PUBLIC,
        model: "small",
        output: { format: "image/png", quality: 0.8 },
        progress: (key, current, total) => onProgress && onProgress(key, current, total)
      }),
      new Promise((_, rej) => setTimeout(() => rej(new Error("imgly process timeout")), timeoutMs))
    ]);
    if (result instanceof Blob) return result;
    if (result instanceof HTMLCanvasElement) return canvasToBlob(result);
    throw new Error("unexpected imgly result");
  }

  async function autoRemove(blob, { onProgress } = {}) {
    const chroma = await chromaMatte(blob);
    return { blob: chroma, method: "chroma", enhance: (prog) => tryImgly(blob, prog || onProgress) };
  }

  function floodErase(ctx, w, h, sx, sy, thresh) {
    const data = ctx.getImageData(0, 0, w, h);
    const px = data.data;
    const start = (sy * w + sx) * 4;
    const tr = px[start], tg = px[start + 1], tb = px[start + 2];
    const visited = new Uint8Array(w * h);
    const stack = [sy * w + sx];
    function close(i) {
      const dr = px[i] - tr, dg = px[i + 1] - tg, db = px[i + 2] - tb;
      return (dr * dr + dg * dg + db * db) < thresh * thresh;
    }
    while (stack.length) {
      const idx = stack.pop();
      if (idx < 0 || idx >= w * h || visited[idx]) continue;
      visited[idx] = 1;
      const i = idx * 4;
      if (px[i + 3] === 0 || !close(i)) continue;
      px[i + 3] = 0;
      const x = idx % w, y = (idx / w) | 0;
      if (x + 1 < w) stack.push(idx + 1);
      if (x > 0) stack.push(idx - 1);
      if (y + 1 < h) stack.push(idx + w);
      if (y > 0) stack.push(idx - w);
    }
    ctx.putImageData(data, 0, 0);
  }

  function openCutoutEditor(sourceBlob) {
    return new Promise(async (resolve, reject) => {
      const root = document.getElementById("editor-root");
      const img = await blobToImage(sourceBlob);
      const maxW = 900;
      const scale = Math.min(1, maxW / img.naturalWidth);
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      const original = ctx.getImageData(0, 0, w, h);
      const undo = [];
      let tool = "erase";
      let brush = 28;
      let drawing = false;

      root.hidden = false;
      root.innerHTML = `
        <header>
          <button type="button" class="ghost" data-act="cancel" style="background:#fff;color:#3b2a30;border:0;border-radius:12px;padding:8px 12px;font-weight:800">Cancel</button>
          <h2>Edit cutout</h2>
          <button type="button" data-act="done" style="background:#e891b0;color:#fff;border:0;border-radius:12px;padding:8px 12px;font-weight:800">Done</button>
        </header>
        <div class="editor-canvas-wrap"></div>
        <div class="editor-tools">
          <button type="button" data-tool="erase" class="active">Eraser</button>
          <button type="button" data-tool="restore">Restore</button>
          <button type="button" data-tool="wand">Tap to remove</button>
          <label>Size <input type="range" min="8" max="72" value="28"></label>
          <button type="button" data-act="undo">Undo</button>
        </div>`;
      root.querySelector(".editor-canvas-wrap").appendChild(canvas);
      document.body.classList.add("locked");

      const setTool = (t) => {
        tool = t;
        root.querySelectorAll("[data-tool]").forEach((b) => b.classList.toggle("active", b.dataset.tool === t));
      };
      root.querySelectorAll("[data-tool]").forEach((b) => b.onclick = () => setTool(b.dataset.tool));
      root.querySelector("input[type=range]").oninput = (e) => { brush = +e.target.value; };

      function pushUndo() {
        if (undo.length > 6) undo.shift();
        undo.push(ctx.getImageData(0, 0, w, h));
      }

      function canvasPoint(ev) {
        const r = canvas.getBoundingClientRect();
        const x = Math.round((ev.clientX - r.left) * (w / r.width));
        const y = Math.round((ev.clientY - r.top) * (h / r.height));
        return { x: Math.max(0, Math.min(w - 1, x)), y: Math.max(0, Math.min(h - 1, y)) };
      }

      function stroke(ev) {
        const { x, y } = canvasPoint(ev);
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, brush / 2, 0, Math.PI * 2);
        if (tool === "erase") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.fill();
        } else if (tool === "restore") {
          const tmp = document.createElement("canvas");
          tmp.width = w; tmp.height = h;
          tmp.getContext("2d").putImageData(original, 0, 0);
          ctx.globalCompositeOperation = "source-over";
          ctx.clip();
          ctx.drawImage(tmp, 0, 0);
        }
        ctx.restore();
      }

      canvas.addEventListener("pointerdown", (ev) => {
        ev.preventDefault();
        canvas.setPointerCapture(ev.pointerId);
        if (tool === "wand") {
          pushUndo();
          const { x, y } = canvasPoint(ev);
          floodErase(ctx, w, h, x, y, 36);
          return;
        }
        pushUndo();
        drawing = true;
        stroke(ev);
      });
      canvas.addEventListener("pointermove", (ev) => {
        if (!drawing) return;
        ev.preventDefault();
        stroke(ev);
      });
      const stop = () => { drawing = false; };
      canvas.addEventListener("pointerup", stop);
      canvas.addEventListener("pointercancel", stop);

      function cleanup() {
        root.hidden = true;
        root.innerHTML = "";
        document.body.classList.remove("locked");
      }

      root.addEventListener("click", async (ev) => {
        const act = ev.target.closest("[data-act]")?.dataset.act;
        if (act === "cancel") { cleanup(); reject(new Error("cancelled")); }
        if (act === "undo" && undo.length) ctx.putImageData(undo.pop(), 0, 0);
        if (act === "done") {
          const out = await canvasToBlob(canvas);
          cleanup();
          resolve(out);
        }
      });
    });
  }

  window.ClosetBG = {
    loadImage, blobToImage, canvasToBlob, chromaMatte, tryImgly, autoRemove, openCutoutEditor
  };
})();
