/* Closet — mix-and-match 2D layering (not a realistic try-on). */
(() => {
  const CATS = ["top", "bottom", "shoes", "dress", "outer"];
  const CAT_LABEL = { top: "Top", bottom: "Bottom", shoes: "Shoes", dress: "Dress", outer: "Outerwear" };
  const DEFAULT_FIT = {
    top:    { nx: 0.50, ny: 0.395, scale: 0.68, rot: 0 },
    bottom: { nx: 0.50, ny: 0.66, scale: 0.54, rot: 0 },
    shoes:  { nx: 0.50, ny: 0.918, scale: 0.42, rot: 0 },
    dress:  { nx: 0.50, ny: 0.52, scale: 0.50, rot: 0 },
    outer:  { nx: 0.50, ny: 0.43, scale: 0.82, rot: 0 }
  };
  const DEMOS = [
    { id: "demo-top-pink-tee", category: "top", name: "Pink tee", src: "assets/demo/top-pink-tee.png" },
    { id: "demo-top-cream-knit", category: "top", name: "Cream knit", src: "assets/demo/top-cream-knit.png" },
    { id: "demo-top-yellow-blouse", category: "top", name: "Yellow blouse", src: "assets/demo/top-yellow-blouse.png" },
    { id: "demo-top-plaid", category: "top", name: "Plaid shirt", src: "assets/demo/top-plaid.png" },
    { id: "demo-top-white-tank", category: "top", name: "White tank", src: "assets/demo/top-white-tank.png" },
    { id: "demo-bottom-jeans", category: "bottom", name: "Blue jeans", src: "assets/demo/bottom-jeans.png" },
    { id: "demo-bottom-black-pants", category: "bottom", name: "Black trousers", src: "assets/demo/bottom-black-pants.png" },
    { id: "demo-bottom-plaid-skirt", category: "bottom", name: "Plaid skirt", src: "assets/demo/bottom-plaid-skirt.png" },
    { id: "demo-bottom-khaki-skirt", category: "bottom", name: "Khaki skirt", src: "assets/demo/bottom-khaki-skirt.png" },
    { id: "demo-bottom-denim-shorts", category: "bottom", name: "Denim shorts", src: "assets/demo/bottom-denim-shorts.png" },
    { id: "demo-shoes-sneakers", category: "shoes", name: "White sneakers", src: "assets/demo/shoes-sneakers.png" },
    { id: "demo-shoes-boots", category: "shoes", name: "Black boots", src: "assets/demo/shoes-boots.png" },
    { id: "demo-shoes-maryjane", category: "shoes", name: "Strap flats", src: "assets/demo/shoes-maryjane.png" },
    { id: "demo-dress-pink", category: "dress", name: "Pink dress", src: "assets/demo/dress-pink.png" },
    { id: "demo-outer-denim", category: "outer", name: "Denim jacket", src: "assets/demo/outer-denim.png" }
  ];

  const state = {
    person: { src: "assets/demo/person.png", isDemo: true },
    items: [],
    outfits: [],
    equipped: { top: "demo-top-pink-tee", bottom: "demo-bottom-jeans", shoes: "demo-shoes-sneakers", dress: null, outer: null },
    adjust: false,
    selectedLayer: "top",
    swipe: { cat: null, startX: 0, startY: 0, dx: 0, locked: null },
    pendingCat: "top",
    urlCache: new Map()
  };

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, 2200);
  }

  function uid(prefix) {
    return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function getItem(id) {
    if (!id) return null;
    return state.items.find((i) => i.id === id) || null;
  }

  function itemsOf(cat) {
    return [null, ...state.items.filter((i) => i.category === cat)];
  }

  function urlOf(item) {
    if (!item) return "";
    if (item.src) return item.src;
    if (item.blob) {
      if (!state.urlCache.has(item.id)) state.urlCache.set(item.id, URL.createObjectURL(item.blob));
      return state.urlCache.get(item.id);
    }
    return "";
  }

  function personContentRect() {
    const wrap = $("#figure-wrap");
    const img = $("#person-img");
    const W = wrap.clientWidth, H = wrap.clientHeight;
    const iw = img.naturalWidth || 800, ih = img.naturalHeight || 1600;
    const scale = Math.min(W / iw, H / ih);
    const dw = iw * scale, dh = ih * scale;
    // object-position: center bottom
    return { x: (W - dw) / 2, y: H - dh, w: dw, h: dh };
  }

  function fitOf(item, cat) {
    if (item && item.fit) return item.fit;
    return { ...(DEFAULT_FIT[cat] || DEFAULT_FIT.top) };
  }

  function applyFit(cat) {
    const layer = $(`.layer[data-cat="${cat}"]`);
    if (!layer) return;
    const item = getItem(state.equipped[cat]);
    const hideTB = !!(state.equipped.dress && (cat === "top" || cat === "bottom"));
    if (!item || hideTB) {
      layer.hidden = true;
      return;
    }
    layer.hidden = false;
    const fit = fitOf(item, cat);
    const rect = personContentRect();
    const displayW = Math.max(24, rect.w * fit.scale);
    const cx = rect.x + fit.nx * rect.w;
    const cy = rect.y + fit.ny * rect.h;
    layer.style.width = displayW + "px";
    layer.style.left = cx + "px";
    layer.style.top = cy + "px";
    layer.style.transform = `translate(-50%, -50%) rotate(${fit.rot || 0}deg)`;
    layer.classList.toggle("selected", state.adjust && state.selectedLayer === cat);
    const img = layer.querySelector(".current");
    const src = urlOf(item);
    if (img && img.dataset.src !== src) {
      img.src = src;
      img.dataset.src = src;
      img.alt = item.name || cat;
    }
  }

  function renderLayers() {
    CATS.forEach(applyFit);
    updateZoneLabels();
    $("#banner-demo").hidden = !state.person.isDemo;
  }

  function updateZoneLabels() {
    const set = (id, cat) => {
      const item = getItem(state.equipped[cat]);
      const el = $(id);
      if (!el) return;
      if (cat === "top" && state.equipped.dress) {
        const d = getItem(state.equipped.dress);
        el.textContent = d ? d.name : "Dress";
        return;
      }
      el.textContent = item ? item.name : CAT_LABEL[cat];
    };
    set("#label-top", "top");
    set("#label-bottom", "bottom");
    set("#label-shoes", "shoes");
  }

  async function persistEquipped() {
    await ClosetDB.kvSet("equipped", { ...state.equipped });
  }

  async function persistFit(item) {
    if (!item) return;
    await ClosetDB.itemsPut(item);
  }

  function cycle(cat, dir) {
    if (state.equipped.dress && (cat === "top" || cat === "bottom")) {
      state.equipped.dress = null;
    }
    const list = itemsOf(cat);
    let idx = list.findIndex((i) => (i && i.id) === state.equipped[cat]);
    if (idx < 0) idx = 0;
    const next = (idx + dir + list.length) % list.length;
    state.equipped[cat] = list[next] ? list[next].id : null;
    renderLayers();
    persistEquipped();
  }

  function neighbor(cat, dir) {
    const list = itemsOf(cat);
    let idx = list.findIndex((i) => (i && i.id) === state.equipped[cat]);
    if (idx < 0) idx = 0;
    return list[(idx + dir + list.length) % list.length];
  }

  function applySwipePreview(cat, dx) {
    const layer = $(`.layer[data-cat="${cat}"]`);
    if (!layer) return;
    const img = layer.querySelector(".current");
    const peek = layer.querySelector(".peek");
    const w = layer.clientWidth || 200;
    if (img) {
      img.style.transition = dx === 0 ? "transform .34s cubic-bezier(.22,1,.36,1), opacity .3s" : "none";
      img.style.transform = `translateX(${dx}px)`;
      img.style.opacity = String(1 - Math.min(0.55, Math.abs(dx) / 380));
    }
    if (peek) {
      if (Math.abs(dx) > 16) {
        const incoming = neighbor(cat, dx < 0 ? 1 : -1);
        if (incoming) {
          const src = urlOf(incoming);
          if (peek.dataset.src !== src) { peek.src = src; peek.dataset.src = src; }
          peek.hidden = false;
          peek.style.transition = "none";
          peek.style.transform = `translateX(${dx + (dx < 0 ? w : -w)}px)`;
          peek.style.opacity = String(Math.min(1, Math.abs(dx) / 140));
        } else {
          peek.hidden = true;
        }
      } else {
        peek.hidden = true;
      }
    }
  }

  function clearSwipePreview(cat, animateInFrom) {
    const layer = $(`.layer[data-cat="${cat}"]`);
    if (!layer) return;
    const img = layer.querySelector(".current");
    const peek = layer.querySelector(".peek");
    if (peek) { peek.hidden = true; peek.style.transform = ""; peek.style.opacity = ""; }
    if (img) {
      if (animateInFrom) {
        const w = layer.clientWidth || 200;
        img.style.transition = "none";
        img.style.transform = `translateX(${animateInFrom === "left" ? w : -w}px)`;
        img.style.opacity = "0.2";
        requestAnimationFrame(() => {
          img.style.transition = "transform .34s cubic-bezier(.22,1,.36,1), opacity .3s";
          img.style.transform = "translateX(0)";
          img.style.opacity = "1";
        });
      } else {
        img.style.transition = "transform .28s cubic-bezier(.22,1,.36,1), opacity .25s";
        img.style.transform = "translateX(0)";
        img.style.opacity = "1";
      }
    }
  }

  function bindZones() {
    $$(".zone").forEach((zone) => {
      const cat = zone.dataset.cat;
      zone.querySelectorAll(".arrow").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const dir = +btn.dataset.dir;
          cycle(cat, dir);
          clearSwipePreview(cat, dir > 0 ? "right" : "left");
        });
      });

      zone.addEventListener("pointerdown", (e) => {
        if (state.adjust) return;
        if (e.target.closest(".arrow")) return;
        zone.setPointerCapture(e.pointerId);
        state.swipe = { cat, startX: e.clientX, startY: e.clientY, dx: 0, locked: null };
      });
      zone.addEventListener("pointermove", (e) => {
        const s = state.swipe;
        if (s.cat !== cat) return;
        const dx = e.clientX - s.startX;
        const dy = e.clientY - s.startY;
        if (!s.locked) {
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
          s.locked = Math.abs(dx) > Math.abs(dy) ? "h" : "v";
        }
        if (s.locked !== "h") return;
        s.dx = dx;
        e.preventDefault();
        applySwipePreview(cat, dx);
      });
      const end = (e) => {
        const s = state.swipe;
        if (s.cat !== cat) return;
        const width = zone.clientWidth || 300;
        if (s.locked === "h" && Math.abs(s.dx) > Math.max(46, width * 0.16)) {
          const dir = s.dx < 0 ? 1 : -1;
          cycle(cat, dir);
          clearSwipePreview(cat, dir > 0 ? "right" : "left");
        } else {
          clearSwipePreview(cat, null);
        }
        state.swipe = { cat: null, startX: 0, startY: 0, dx: 0, locked: null };
      };
      zone.addEventListener("pointerup", end);
      zone.addEventListener("pointercancel", end);
    });
  }

  /* ----- Adjust (drag / pinch / nudge) ----- */
  const pointers = new Map();
  let drag = null;
  let pinch = null;

  function hitLayer(clientX, clientY) {
    const order = ["shoes", "outer", "dress", "top", "bottom"];
    for (const cat of order) {
      const layer = $(`.layer[data-cat="${cat}"]`);
      if (!layer || layer.hidden) continue;
      const r = layer.getBoundingClientRect();
      if (clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom) return cat;
    }
    return state.selectedLayer;
  }

  function selectedItem() {
    return getItem(state.equipped[state.selectedLayer]);
  }

  function bindAdjust() {
    const wrap = $("#figure-wrap");
    wrap.addEventListener("pointerdown", (e) => {
      if (!state.adjust) return;
      wrap.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        const cat = hitLayer(e.clientX, e.clientY);
        if (cat) state.selectedLayer = cat;
        drag = { cat: state.selectedLayer, x: e.clientX, y: e.clientY };
        renderLayers();
        renderLayerChips();
      }
    });
    wrap.addEventListener("pointermove", (e) => {
      if (!state.adjust) return;
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const item = selectedItem();
      if (!item) return;
      if (!item.fit) item.fit = { ...DEFAULT_FIT[item.category] };
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (!pinch) pinch = { dist, scale: item.fit.scale };
        else {
          item.fit.scale = clamp(pinch.scale * (dist / pinch.dist), 0.16, 2.2);
          applyFit(item.category);
        }
      } else if (drag && drag.cat) {
        const rect = personContentRect();
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        drag.x = e.clientX;
        drag.y = e.clientY;
        item.fit.nx = clamp(item.fit.nx + dx / rect.w, 0.04, 0.96);
        item.fit.ny = clamp(item.fit.ny + dy / rect.h, 0.04, 0.98);
        applyFit(item.category);
      }
    });
    const endAdj = (e) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) {
        if (drag) persistFit(selectedItem());
        drag = null;
      }
    };
    wrap.addEventListener("pointerup", endAdj);
    wrap.addEventListener("pointercancel", endAdj);

    $$("#adjust-bar [data-nudge]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = selectedItem();
        if (!item) return;
        if (!item.fit) item.fit = { ...DEFAULT_FIT[item.category] };
        const [dx, dy] = btn.dataset.nudge.split(",").map(Number);
        const rect = personContentRect();
        item.fit.nx = clamp(item.fit.nx + dx / rect.w, 0.04, 0.96);
        item.fit.ny = clamp(item.fit.ny + dy / rect.h, 0.04, 0.98);
        applyFit(item.category);
        persistFit(item);
      });
    });
    $$("#adjust-bar [data-scale]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = selectedItem();
        if (!item) return;
        if (!item.fit) item.fit = { ...DEFAULT_FIT[item.category] };
        item.fit.scale = clamp(item.fit.scale + Number(btn.dataset.scale), 0.16, 2.2);
        applyFit(item.category);
        persistFit(item);
      });
    });
  }

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function setAdjust(on) {
    state.adjust = on;
    document.body.classList.toggle("adjusting", on);
    $("#adjust-bar").hidden = !on;
    $("#btn-adjust").setAttribute("aria-pressed", on ? "true" : "false");
    renderLayers();
    if (on) renderLayerChips();
  }

  function renderLayerChips() {
    const host = $("#layer-chips");
    const visible = CATS.filter((c) => {
      if (!state.equipped[c]) return false;
      if (state.equipped.dress && (c === "top" || c === "bottom")) return false;
      return true;
    });
    host.innerHTML = visible.map((c) =>
      `<button type="button" data-cat="${c}" class="${state.selectedLayer === c ? "active" : ""}">${CAT_LABEL[c]}</button>`
    ).join("");
    host.querySelectorAll("button").forEach((b) => {
      b.onclick = () => { state.selectedLayer = b.dataset.cat; renderLayers(); renderLayerChips(); };
    });
  }

  /* ----- Sheets ----- */
  function closeSheet() {
    const root = $("#sheet-root");
    root.hidden = true;
    root.innerHTML = "";
    document.body.classList.remove("locked");
  }

  function openSheet(title, bodyHTML) {
    const root = $("#sheet-root");
    root.hidden = false;
    document.body.classList.add("locked");
    root.innerHTML = `
      <div class="sheet-backdrop" data-close="1"></div>
      <div class="sheet" role="dialog" aria-label="${title}">
        <div class="sheet-handle"></div>
        <header class="sheet-head">
          <h2>${title}</h2>
          <button type="button" class="icon-btn" data-close="1" aria-label="Close">✕</button>
        </header>
        <div class="sheet-body">${bodyHTML}</div>
      </div>`;
    root.querySelectorAll("[data-close]").forEach((el) => { el.onclick = closeSheet; });
    return $(".sheet-body", root);
  }

  function openPhotoSheet() {
    const body = openSheet("Your photo", `
      <p class="hint">Take or upload a full-body photo. Clothes will layer on top — this is a mix-and-match view, not a realistic try-on.</p>
      <div class="btn-row">
        <button type="button" class="primary pink" data-act="cam">Take photo</button>
        <button type="button" class="ghost" data-act="lib">Choose from library</button>
        <button type="button" class="ghost" data-act="demo">Use demo figure</button>
      </div>`);
    body.querySelector("[data-act=cam]").onclick = () => $("#file-person-camera").click();
    body.querySelector("[data-act=lib]").onclick = () => $("#file-person-lib").click();
    body.querySelector("[data-act=demo]").onclick = async () => {
      state.person = { src: "assets/demo/person.png", isDemo: true };
      await ClosetDB.kvSet("person", state.person);
      loadPerson();
      closeSheet();
      toast("Demo figure restored");
    };
  }

  function openCloset(tab) {
    const current = tab || "top";
    const body = openSheet("Your closet", `
      <div class="chips" id="closet-tabs">
        ${CATS.map((c) => `<button type="button" data-cat="${c}" class="${c === current ? "active" : ""}">${CAT_LABEL[c]}</button>`).join("")}
      </div>
      <div class="grid" id="closet-grid" data-testid="closet-grid"></div>`);
    const render = (cat) => {
      body.querySelectorAll("#closet-tabs button").forEach((b) => b.classList.toggle("active", b.dataset.cat === cat));
      const grid = $("#closet-grid", body);
      const items = state.items.filter((i) => i.category === cat);
      grid.innerHTML = `<button type="button" class="add-tile" data-testid="btn-add-piece">＋ Add ${CAT_LABEL[cat].toLowerCase()}</button>` +
        items.map((item) => `
          <article class="card ${state.equipped[cat] === item.id ? "wearing" : ""}" data-id="${item.id}">
            ${item.isDemo ? "" : `<button type="button" class="del" data-del="${item.id}" aria-label="Delete">✕</button>`}
            <img src="${urlOf(item)}" alt="${item.name}">
            <div class="meta">${item.name}</div>
          </article>`).join("");
      grid.querySelector(".add-tile").onclick = () => openAddFlow(cat);
      grid.querySelectorAll(".card").forEach((card) => {
        card.onclick = (e) => {
          if (e.target.closest("[data-del]")) return;
          const item = getItem(card.dataset.id);
          if (!item) return;
          if (item.category === "dress") {
            state.equipped.dress = item.id;
          } else {
            if (item.category === "top" || item.category === "bottom") state.equipped.dress = null;
            state.equipped[item.category] = item.id;
          }
          persistEquipped();
          renderLayers();
          render(cat);
          toast("Wearing " + item.name);
        };
      });
      grid.querySelectorAll("[data-del]").forEach((btn) => {
        btn.onclick = async (e) => {
          e.stopPropagation();
          const id = btn.dataset.del;
          const item = getItem(id);
          if (!item || item.isDemo) return;
          if (!confirm("Remove this piece from your closet?")) return;
          await ClosetDB.itemsDelete(id);
          state.items = state.items.filter((i) => i.id !== id);
          CATS.forEach((c) => { if (state.equipped[c] === id) state.equipped[c] = null; });
          await persistEquipped();
          if (state.urlCache.has(id)) { URL.revokeObjectURL(state.urlCache.get(id)); state.urlCache.delete(id); }
          renderLayers();
          render(cat);
        };
      });
    };
    body.querySelectorAll("#closet-tabs button").forEach((b) => b.onclick = () => render(b.dataset.cat));
    render(current);
  }

  function openAddFlow(cat) {
    state.pendingCat = cat || "top";
    const body = openSheet("Add a piece", `
      <p class="hint">Photograph a top, bottom, or shoes on a plain background for the cleanest cutout.</p>
      <div class="chips" id="add-cats">
        ${CATS.map((c) => `<button type="button" data-cat="${c}" class="${c === state.pendingCat ? "active" : ""}" data-testid="add-cat-${c}">${CAT_LABEL[c]}</button>`).join("")}
      </div>
      <div class="btn-row">
        <button type="button" class="primary pink" data-act="cam">Take photo</button>
        <button type="button" class="ghost" data-act="lib" data-testid="btn-add-lib">Choose from library</button>
      </div>`);
    body.querySelectorAll("#add-cats button").forEach((b) => {
      b.onclick = () => {
        state.pendingCat = b.dataset.cat;
        body.querySelectorAll("#add-cats button").forEach((x) => x.classList.toggle("active", x === b));
      };
    });
    body.querySelector("[data-act=cam]").onclick = () => $("#file-item-camera").click();
    body.querySelector("[data-act=lib]").onclick = () => $("#file-item-lib").click();
  }

  function openAddPreview(cutBlob, originalBlob, method) {
    const url = URL.createObjectURL(cutBlob);
    const n = state.items.filter((i) => i.category === state.pendingCat && !i.isDemo).length + 1;
    const defaultName = CAT_LABEL[state.pendingCat] + " " + n;
    const body = openSheet("Cutout preview", `
      <div class="preview-wrap"><img id="cut-preview" alt="Cutout preview" src="${url}"></div>
      <p class="progress" id="cut-status">${method === "imgly" ? "Cut out with on-device AI." : "Quick cutout from the background. You can refine it or improve it."}</p>
      <label class="hint" style="display:block;margin:8px 0">Name
        <input id="item-name" value="${defaultName}" style="display:block;width:100%;margin-top:6px;padding:12px;border-radius:12px;border:1px solid var(--line);font:inherit;font-weight:700">
      </label>
      <div class="btn-row">
        <button type="button" class="primary pink" data-act="save" data-testid="add-confirm">Add to closet</button>
        <button type="button" class="ghost" data-act="edit">Edit cutout</button>
        <button type="button" class="ghost" data-act="improve">Improve cutout (downloads extra tools)</button>
        <button type="button" class="ghost" data-act="original">Use original photo</button>
      </div>`);
    let current = cutBlob;

    const setPreview = (blob, note) => {
      current = blob;
      const next = URL.createObjectURL(blob);
      $("#cut-preview").src = next;
      if (note) $("#cut-status").textContent = note;
    };

    body.querySelector("[data-act=save]").onclick = async () => {
      const name = ($("#item-name").value || defaultName).trim();
      const item = {
        id: uid("item"),
        category: state.pendingCat,
        name,
        blob: current,
        isDemo: false,
        fit: { ...DEFAULT_FIT[state.pendingCat] },
        createdAt: Date.now()
      };
      await ClosetDB.itemsPut(item);
      state.items.push(item);
      if (item.category === "dress") state.equipped.dress = item.id;
      else {
        if (item.category === "top" || item.category === "bottom") state.equipped.dress = null;
        state.equipped[item.category] = item.id;
      }
      await persistEquipped();
      renderLayers();
      closeSheet();
      toast(name + " added");
    };
    body.querySelector("[data-act=edit]").onclick = async () => {
      try {
        const edited = await ClosetBG.openCutoutEditor(current);
        setPreview(edited, "Edited by hand.");
      } catch (_) { /* cancelled */ }
    };
    body.querySelector("[data-act=improve]").onclick = async () => {
      $("#cut-status").textContent = "Downloading on-device cutout tools… this can take a bit on iPhone.";
      try {
        const enhanced = await ClosetBG.tryImgly(originalBlob, (key, cur, tot) => {
          $("#cut-status").textContent = `Improving… ${key} ${Math.round((cur / (tot || 1)) * 100)}%`;
        });
        setPreview(enhanced, "Enhanced cutout ready.");
      } catch (err) {
        $("#cut-status").textContent = "Couldn’t load the extra tools on this device. Edit by hand, or try a plainer background.";
        console.warn(err);
      }
    };
    body.querySelector("[data-act=original]").onclick = () => setPreview(originalBlob, "Using the original photo.");
  }

  async function handleItemFile(file) {
    if (!file) return;
    closeSheet();
    const body = openSheet("Adding piece", `<p class="progress">Preparing your photo…</p>`);
    try {
      const img = await ClosetBG.blobToImage(file);
      const resized = await resizeImage(img, 1200, "image/jpeg", 0.9);
      const { blob, method } = await ClosetBG.autoRemove(resized);
      openAddPreview(blob, resized, method);
    } catch (err) {
      console.warn(err);
      body.innerHTML = `<p class="hint">Couldn’t read that photo. Try another one.</p><button class="primary" data-close="1">OK</button>`;
      body.querySelector("[data-close]").onclick = closeSheet;
    }
  }

  async function handlePersonFile(file) {
    if (!file) return;
    try {
      const img = await ClosetBG.blobToImage(file);
      const blob = await resizeImage(img, 1600, "image/jpeg", 0.88);
      state.person = { blob, isDemo: false };
      await ClosetDB.kvSet("person", { blob, isDemo: false });
      loadPerson();
      closeSheet();
      toast("Photo added — swipe to dress yourself");
    } catch (err) {
      console.warn(err);
      toast("Couldn’t use that photo");
    }
  }

  function resizeImage(img, maxSide, mime, quality) {
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    c.getContext("2d").drawImage(img, 0, 0, w, h);
    return ClosetBG.canvasToBlob(c, mime, quality);
  }

  async function openSaved() {
    state.outfits = await ClosetDB.outfitsAll();
    const body = openSheet("Saved outfits", state.outfits.length ? `
      <div class="saved-grid" id="saved-list" data-testid="saved-list">
        ${state.outfits.map((o) => `
          <article class="card saved-card" data-id="${o.id}">
            <img src="${o.preview ? URL.createObjectURL(o.preview) : ""}" alt="${o.name}">
            <div class="meta">
              <span>${o.name}</span>
              <button type="button" class="icon-btn" data-del="${o.id}" aria-label="Delete" style="width:32px;height:32px">✕</button>
            </div>
          </article>`).join("")}
      </div>` : `<p class="hint">No saved looks yet. Mix something you like and tap Save.</p>`);
    body.querySelectorAll(".saved-card").forEach((card) => {
      card.onclick = (e) => {
        if (e.target.closest("[data-del]")) return;
        const o = state.outfits.find((x) => x.id === card.dataset.id);
        if (!o) return;
        state.equipped = { top: null, bottom: null, shoes: null, dress: null, outer: null, ...o.slots };
        persistEquipped();
        renderLayers();
        closeSheet();
        toast("Loaded " + o.name);
      };
    });
    body.querySelectorAll("[data-del]").forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        await ClosetDB.outfitsDelete(btn.dataset.del);
        openSaved();
      };
    });
  }

  async function compositeOutfit(outW = 1080) {
    const person = $("#person-img");
    await person.decode?.().catch(() => {});
    const iw = person.naturalWidth || 800;
    const ih = person.naturalHeight || 1600;
    const outH = Math.round(outW * (ih / iw));
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f6e9df";
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(person, 0, 0, outW, outH);
    const order = ["bottom", "top", "dress", "outer", "shoes"];
    for (const cat of order) {
      if ((cat === "top" || cat === "bottom") && state.equipped.dress) continue;
      const item = getItem(state.equipped[cat]);
      if (!item) continue;
      const fit = fitOf(item, cat);
      const src = urlOf(item);
      const g = await ClosetBG.loadImage(src);
      const displayW = outW * fit.scale;
      const displayH = displayW * ((g.naturalHeight || 1) / (g.naturalWidth || 1));
      const cx = fit.nx * outW;
      const cy = fit.ny * outH;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(((fit.rot || 0) * Math.PI) / 180);
      ctx.drawImage(g, -displayW / 2, -displayH / 2, displayW, displayH);
      ctx.restore();
    }
    return canvas;
  }

  async function saveOutfit() {
    try {
      const canvas = await compositeOutfit(720);
      const preview = await ClosetBG.canvasToBlob(canvas, "image/jpeg", 0.84);
      const n = (await ClosetDB.outfitsAll()).length + 1;
      const outfit = {
        id: uid("out"),
        name: "Look " + n,
        slots: { ...state.equipped },
        preview,
        createdAt: Date.now()
      };
      await ClosetDB.outfitsPut(outfit);
      toast("Outfit saved");
    } catch (err) {
      console.warn(err);
      toast("Couldn’t save that look");
    }
  }

  async function shareCurrent() {
    try {
      const canvas = await compositeOutfit(1080);
      const blob = await ClosetBG.canvasToBlob(canvas, "image/png");
      const file = new File([blob], "outfit.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "My outfit", text: "Mixed in Closet" });
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "outfit.png";
        a.click();
        toast("Downloaded outfit.png");
      }
    } catch (err) {
      if (err && err.name === "AbortError") return;
      console.warn(err);
      toast("Couldn’t share that look");
    }
  }

  function shuffle() {
    const pick = (cat) => {
      const list = state.items.filter((i) => i.category === cat);
      if (!list.length) return null;
      return list[Math.floor(Math.random() * list.length)].id;
    };
    const dresses = state.items.filter((i) => i.category === "dress");
    if (dresses.length && Math.random() < 0.2) {
      state.equipped.dress = dresses[Math.floor(Math.random() * dresses.length)].id;
    } else {
      state.equipped.dress = null;
      state.equipped.top = pick("top");
      state.equipped.bottom = pick("bottom");
    }
    state.equipped.shoes = pick("shoes");
    state.equipped.outer = Math.random() < 0.22 ? pick("outer") : null;
    renderLayers();
    persistEquipped();
    ["top", "bottom", "shoes"].forEach((c) => clearSwipePreview(c, "right"));
    toast("Fresh look");
  }

  function loadPerson() {
    const img = $("#person-img");
    if (state.person.blob) {
      if (state.urlCache.has("person")) URL.revokeObjectURL(state.urlCache.get("person"));
      const url = URL.createObjectURL(state.person.blob);
      state.urlCache.set("person", url);
      img.src = url;
    } else {
      img.src = state.person.src || "assets/demo/person.png";
    }
    img.onload = () => renderLayers();
  }

  async function ensureDemos() {
    const existing = await ClosetDB.itemsAll();
    const ids = new Set(existing.map((i) => i.id));
    for (const demo of DEMOS) {
      if (!ids.has(demo.id)) {
        const row = {
          id: demo.id,
          category: demo.category,
          name: demo.name,
          src: demo.src,
          isDemo: true,
          fit: { ...DEFAULT_FIT[demo.category] },
          createdAt: 0
        };
        await ClosetDB.itemsPut(row);
        existing.push(row);
      }
    }
    state.items = existing;
    let person = await ClosetDB.kvGet("person");
    if (!person) {
      person = { src: "assets/demo/person.png", isDemo: true };
      await ClosetDB.kvSet("person", person);
    }
    state.person = person;
    const equipped = await ClosetDB.kvGet("equipped");
    if (equipped) state.equipped = { top: null, bottom: null, shoes: null, dress: null, outer: null, ...equipped };
    else await persistEquipped();
  }

  async function maybeTip() {
    if (await ClosetDB.kvGet("seenTip")) return;
    toast("Swipe the top or bottom to mix pieces");
    await ClosetDB.kvSet("seenTip", 1);
  }

  function bindChrome() {
    $("#btn-photo").onclick = openPhotoSheet;
    $("#btn-closet").onclick = () => openCloset("top");
    $("#btn-shuffle").onclick = shuffle;
    $("#btn-save").onclick = saveOutfit;
    $("#btn-adjust").onclick = () => setAdjust(!state.adjust);
    $("#btn-saved").onclick = openSaved;
    $("#btn-share").onclick = shareCurrent;

    $("#file-person-camera").addEventListener("change", (e) => { handlePersonFile(e.target.files[0]); e.target.value = ""; });
    $("#file-person-lib").addEventListener("change", (e) => { handlePersonFile(e.target.files[0]); e.target.value = ""; });
    $("#file-item-camera").addEventListener("change", (e) => { handleItemFile(e.target.files[0]); e.target.value = ""; });
    $("#file-item-lib").addEventListener("change", (e) => { handleItemFile(e.target.files[0]); e.target.value = ""; });

    window.addEventListener("resize", () => renderLayers());
    window.addEventListener("orientationchange", () => setTimeout(renderLayers, 250));
  }

  async function init() {
    bindZones();
    bindAdjust();
    bindChrome();
    await ensureDemos();
    loadPerson();
    renderLayers();
    maybeTip();
    if ("serviceWorker" in navigator) {
      const reg = () => navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
      if (document.readyState === "complete") reg();
      else window.addEventListener("load", reg);
    }
  }

  init().catch((err) => {
    console.error(err);
    toast("Something went wrong loading Closet");
  });
})();
