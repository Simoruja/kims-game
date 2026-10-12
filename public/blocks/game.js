(() => {
  'use strict';

  const COLS = 10, ROWS = 22, HIDDEN = 2;          // two rows above the top of the well, where pieces appear
  const LOCK_DELAY = 500, MAX_RESETS = 15;         // a piece on the ground locks after 0.5 s; moving it restarts that, 15 times at most
  const DAS = 170, ARR = 45;                       // holding left or right: wait, then repeat
  const CLEAR_TIME = 280;                          // how long full rows flash before they go
  const MAX_START = 10;

  const $ = id => document.getElementById(id);
  // older browsers (Safari before 16) can't draw rounded rectangles on a canvas
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      r = Math.min(r, w / 2, h / 2);
      this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r); this.arcTo(x + w, y + h, x, y + h, r);
      this.arcTo(x, y + h, x, y, r); this.arcTo(x, y, x + w, y, r); this.closePath();
    };
  }
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  /* ───────────── Pieces ───────────── */

  const SHAPES = {
    I: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    J: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    L: [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    O: [[1, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    T: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    Z: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  };
  const TYPES = Object.keys(SHAPES);
  const COLORS = { I: '#36b3d6', J: '#3f6fd8', L: '#ec8a2c', O: '#efbf2c', S: '#43ab66', T: '#9a5cc4', Z: '#e1513c' };
  const NAMES = { I: 'long', J: 'J', L: 'L', O: 'square', S: 'S', T: 'T', Z: 'Z' };

  // CELLS[type][rotation] lists the [x, y] blocks of the piece inside its box; each rotation is a quarter turn clockwise
  const turn = m => m[0].map((_, c) => m.map(row => row[c]).reverse());
  const CELLS = {};
  for (const t of TYPES) {
    CELLS[t] = [];
    let m = SHAPES[t];
    for (let r = 0; r < 4; r++) {
      const cells = [];
      m.forEach((row, y) => row.forEach((v, x) => { if (v) cells.push([x, y]); }));
      CELLS[t].push(cells);
      m = turn(m);
    }
  }

  // Wall kicks: places to try, in order, when a piece turns but doesn't fit where it is (x right, y up)
  const KICKS = {
    '0>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]], '1>0': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
    '1>2': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]], '2>1': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
    '2>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]], '3>2': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
    '3>0': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]], '0>3': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  };
  const KICKS_I = {
    '0>1': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]], '1>0': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    '1>2': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]], '2>1': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]],
    '2>3': [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]], '3>2': [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    '3>0': [[0, 0], [1, 0], [-2, 0], [1, -2], [-2, 1]], '0>3': [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
  };

  // Time for a piece to fall one row at each level, in ms (it gets very fast after level 15)
  const fallTime = lv => Math.pow(0.8 - (Math.min(lv, 20) - 1) * 0.007, Math.min(lv, 20) - 1) * 1000;
  const LINE_POINTS = [0, 100, 300, 500, 800];
  const TSPIN_POINTS = [400, 800, 1200, 1600];

  /* ───────────── State ───────────── */

  const settings = Object.assign({ ghost: true, pad: null, startLevel: 1 }, store.get('blocks-settings', {}));
  settings.startLevel = Math.max(1, Math.min(MAX_START, settings.startLevel | 0 || 1));
  const saveSettings = () => store.set('blocks-settings', settings);

  let grid = [];          // grid[y][x]: the type of the block there, or null
  let cur = null;         // the falling piece: { t, r, x, y }
  let queue = [], bag = [];
  let held = null, holdUsed = false;
  let score = 0, lines = 0, level = 1, combo = -1, b2b = false;
  let state = 'idle';     // 'idle' | 'play' | 'clear' | 'pause' | 'over'
  let fallAcc = 0, lockT = 0, resets = 0, lowest = 0, lastTurn = false;
  let clearing = null;    // { rows, t } while full rows flash
  const keys = { left: false, right: false, soft: false };
  let dasDir = null, dasT = 0, arrT = 0;
  let best = store.get('blocks-best', null);

  const emptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  // pieces come in shuffled sets of all seven, so no piece is ever far away
  function nextType() {
    while (queue.length < 6) {
      if (!bag.length) {
        bag = TYPES.slice();
        for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
      }
      queue.push(bag.pop());
    }
    return queue.shift();
  }

  function fits(t, r, x, y) {
    for (const [cx, cy] of CELLS[t][r]) {
      const gx = x + cx, gy = y + cy;
      if (gx < 0 || gx >= COLS || gy < 0 || gy >= ROWS || grid[gy][gx]) return false;
    }
    return true;
  }
  const onGround = () => !fits(cur.t, cur.r, cur.x, cur.y + 1);

  function spawn(t) {
    cur = { t, r: 0, x: t === 'O' ? 4 : 3, y: 0 };
    fallAcc = 0; lockT = 0; resets = 0; lastTurn = false;
    if (!fits(t, 0, cur.x, cur.y)) { cur = null; gameOver(); return false; }
    if (fits(t, 0, cur.x, cur.y + 1)) cur.y++;   // the new piece drops straight into view
    lowest = cur.y;
    return true;
  }

  // after a move or turn: a piece resting on the ground gets a little more time, up to MAX_RESETS times
  function moved() {
    lastTurn = false;
    if (cur.y > lowest) { lowest = cur.y; resets = 0; }
    if (onGround() && resets < MAX_RESETS) { lockT = 0; resets++; }
  }

  function shift(dx) {
    if (!cur || !fits(cur.t, cur.r, cur.x + dx, cur.y)) return false;
    cur.x += dx; moved(); return true;
  }

  function rotate(dir) {
    if (!cur || cur.t === 'O') return false;
    const to = (cur.r + dir + 4) % 4, table = cur.t === 'I' ? KICKS_I : KICKS;
    for (const [kx, ky] of table[`${cur.r}>${to}`]) {
      if (fits(cur.t, to, cur.x + kx, cur.y - ky)) {
        cur.r = to; cur.x += kx; cur.y -= ky;
        moved(); lastTurn = true;
        return true;
      }
    }
    return false;
  }

  function softStep() {
    if (!cur || onGround()) return false;
    cur.y++; score++; moved(); fallAcc = 0;
    return true;
  }

  function hardDrop() {
    if (!cur) return;
    let n = 0;
    while (!onGround()) { cur.y++; n++; }
    if (n) lastTurn = false;
    score += 2 * n;
    lock();
  }

  function hold() {
    if (!cur || holdUsed) return;
    holdUsed = true;
    const t = cur.t;
    if (held) { const h = held; held = t; spawn(h); } else { held = t; spawn(nextType()); }
    drawSide();
  }

  // a T piece that was turned into place with three of its four corners blocked
  function isTSpin() {
    if (cur.t !== 'T' || !lastTurn) return false;
    let n = 0;
    for (const [dx, dy] of [[0, 0], [2, 0], [0, 2], [2, 2]]) {
      const gx = cur.x + dx, gy = cur.y + dy;
      if (gx < 0 || gx >= COLS || gy >= ROWS || (gy >= 0 && grid[gy][gx])) n++;
    }
    return n >= 3;
  }

  function lock() {
    const tspin = isTSpin();
    let above = true;
    for (const [cx, cy] of CELLS[cur.t][cur.r]) {
      grid[cur.y + cy][cur.x + cx] = cur.t;
      if (cur.y + cy >= HIDDEN) above = false;
    }
    cur = null; holdUsed = false;
    if (above) { gameOver(); return; }   // the whole piece came to rest above the top of the well

    const full = [];
    for (let y = 0; y < ROWS; y++) if (grid[y].every(Boolean)) full.push(y);
    const n = full.length;
    let points = tspin ? TSPIN_POINTS[n] : LINE_POINTS[n];
    const msgs = [];
    if (tspin) msgs.push(n ? `T-spin ${['', 'single', 'double', 'triple'][n]}!` : 'T-spin!');
    if (n) {
      const hard = n === 4 || tspin;
      if (hard && b2b) { points *= 1.5; msgs.push('Back to back!'); }
      b2b = hard;
      combo++;
      if (combo > 0) { points += 50 * combo; msgs.push(`Combo ×${combo + 1}`); }
      if (n === 4 && !tspin) msgs.unshift('Four rows!');
    } else combo = -1;
    score += Math.round(points * level);

    if (n) {
      lines += n;
      const lv = settings.startLevel + Math.floor(lines / 10);
      const up = lv > level;
      level = lv;
      if (up) msgs.push(`Level ${level}`);
      announce(`${n === 1 ? 'One row' : n + ' rows'} cleared. Score ${score}.${up ? ` Level ${level}.` : ''}`);
      clearing = { rows: full, t: 0 };
      state = 'clear';
    } else spawn(nextType());
    msgs.forEach((m, i) => setTimeout(() => toast(m), i * 260));
    updateStats();
    drawSide();
  }

  function finishClear() {
    for (const y of clearing.rows) { grid.splice(y, 1); grid.unshift(Array(COLS).fill(null)); }
    clearing = null;
    state = 'play';
    if (spawn(nextType())) drawSide();
  }

  /* ───────────── Game flow ───────────── */

  function start() {
    grid = emptyGrid(); queue = []; bag = [];
    held = null; holdUsed = false;
    score = 0; lines = 0; level = settings.startLevel; combo = -1; b2b = false;
    clearing = null; dasDir = null; keys.left = keys.right = keys.soft = false;
    state = 'play';
    spawn(nextType());
    showOverlay(null);
    $('pauseBtn').disabled = false;
    updateStats(); drawSide();
    $('well').focus({ preventScroll: true });
    announce(`Game started at level ${level}.`);
    last = performance.now();
  }

  function pause() {
    if (state !== 'play' && state !== 'clear') return;
    state = state === 'clear' ? 'pause-clear' : 'pause';
    keys.left = keys.right = keys.soft = false; dasDir = null;
    document.querySelectorAll('.pbtn.down').forEach(b => b.classList.remove('down'));
    showOverlay('pause');
    announce('Paused.');
  }
  function resume() {
    if (state !== 'pause' && state !== 'pause-clear') return;
    state = state === 'pause-clear' ? 'clear' : 'play';
    showOverlay(null);
    last = performance.now();
    $('well').focus({ preventScroll: true });
  }

  function gameOver() {
    state = 'over';
    $('pauseBtn').disabled = true;
    const isBest = score > 0 && (!best || score > best.score);
    if (isBest) { best = { score, lines, level }; store.set('blocks-best', best); }
    const st = Object.assign({ games: 0, lines: 0 }, store.get('blocks-stats', {}));
    st.games++; st.lines += lines;
    store.set('blocks-stats', st);
    $('ovScore').textContent = score.toLocaleString();
    $('ovDetail').textContent = `${lines} ${lines === 1 ? 'row' : 'rows'} cleared · level ${level}`;
    $('ovNew').hidden = !isBest;
    showOverlay('over');
    updateStats();
    announce(`Game over. Score ${score}, ${lines} rows.${isBest ? ' New best score!' : ''}`);
  }

  function showOverlay(which) {
    $('overlay').hidden = !which;
    $('ovStart').hidden = which !== 'start';
    $('ovPause').hidden = which !== 'pause';
    $('ovOver').hidden = which !== 'over';
    if (which === 'start') {
      $('ovBest').hidden = !best;
      if (best) $('ovBest').textContent = `Your best: ${best.score.toLocaleString()} points`;
      renderStartLevel();
    }
    const focus = { start: 'playBtn', pause: 'resumeBtn', over: 'againBtn' }[which];
    if (focus && !document.querySelector('dialog[open]')) $(focus).focus({ preventScroll: true });
    draw();
  }
  function renderStartLevel() {
    $('startLevel').textContent = settings.startLevel;
    $('lvlDown').disabled = settings.startLevel <= 1;
    $('lvlUp').disabled = settings.startLevel >= MAX_START;
  }

  /* ───────────── Each frame ───────────── */

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(100, now - last);
    last = now;
    if (state === 'play' && cur) update(dt);
    else if (state === 'clear') { clearing.t += dt; if (clearing.t >= CLEAR_TIME) finishClear(); }
    if (state === 'play' || state === 'clear') draw();
    requestAnimationFrame(frame);
  }

  function update(dt) {
    // holding left or right: one step, a pause, then quick repeats
    if (dasDir) {
      dasT += dt;
      if (dasT >= DAS) {
        arrT += dt;
        while (arrT >= ARR) { arrT -= ARR; if (!shift(dasDir === 'left' ? -1 : 1)) { arrT = 0; break; } }
      }
    }
    if (!cur) return;
    const normal = fallTime(level), step = keys.soft ? Math.max(8, Math.min(50, normal / 20)) : normal;
    fallAcc += dt;
    while (fallAcc >= step) {
      fallAcc -= step;
      if (onGround()) { fallAcc = 0; break; }
      cur.y++;
      if (keys.soft) score++;
      if (cur.y > lowest) { lowest = cur.y; resets = 0; }
      lastTurn = false;
    }
    if (keys.soft) updateStats();
    if (onGround()) {
      lockT += dt;
      if (lockT >= LOCK_DELAY) lock();
    } else lockT = 0;
  }

  /* ───────────── Drawing ───────────── */

  const board = $('boardCv'), bctx = board.getContext('2d');
  const holdCv = $('holdCv'), hctx = holdCv.getContext('2d');
  const nextCv = $('nextCv'), nctx = nextCv.getContext('2d');
  let C = 24, M = 14, layout = 'side';
  const dpr = () => Math.min(3, window.devicePixelRatio || 1);

  function sizeCanvas(cv, ctx, w, h) {
    const r = dpr();
    cv.width = Math.round(w * r); cv.height = Math.round(h * r);
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
    ctx.setTransform(r, 0, 0, r, 0, 0);
  }

  const mix = (hex, to, a) => {
    const n = parseInt(hex.slice(1), 16), t = to === 'w' ? 255 : 0;
    const ch = s => Math.round(((n >> s) & 255) * (1 - a) + t * a);
    return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
  };
  // each block is drawn once per size and colour, then copied
  const sprites = new Map();
  function sprite(t, s) {
    const key = t + s + '@' + dpr();
    let cv = sprites.get(key);
    if (cv) return cv;
    const r = dpr(), px = Math.max(1, Math.round(s * r));
    cv = document.createElement('canvas'); cv.width = cv.height = px;
    const g = cv.getContext('2d'), c = COLORS[t], inset = Math.max(0.5, px * 0.04), rad = px * 0.17;
    const grad = g.createLinearGradient(0, 0, px, px);
    grad.addColorStop(0, mix(c, 'w', 0.28)); grad.addColorStop(0.55, c); grad.addColorStop(1, mix(c, 'b', 0.28));
    g.fillStyle = grad;
    g.beginPath(); g.roundRect(inset, inset, px - 2 * inset, px - 2 * inset, rad); g.fill();
    g.fillStyle = 'rgba(255,255,255,.38)';
    g.beginPath(); g.roundRect(px * 0.18, px * 0.12, px * 0.64, px * 0.16, px * 0.08); g.fill();
    g.strokeStyle = mix(c, 'b', 0.35); g.lineWidth = Math.max(1, px * 0.05);
    g.beginPath(); g.roundRect(inset, inset, px - 2 * inset, px - 2 * inset, rad); g.stroke();
    sprites.set(key, cv);
    return cv;
  }
  const block = (ctx, t, x, y, s) => ctx.drawImage(sprite(t, s), x, y, s, s);

  function draw() {
    const w = C * COLS, h = C * (ROWS - HIDDEN);
    bctx.clearRect(0, 0, w, h);
    bctx.strokeStyle = 'rgba(255,255,255,.055)'; bctx.lineWidth = 1;
    bctx.beginPath();
    for (let x = 1; x < COLS; x++) { bctx.moveTo(x * C + .5, 0); bctx.lineTo(x * C + .5, h); }
    for (let y = 1; y < ROWS - HIDDEN; y++) { bctx.moveTo(0, y * C + .5); bctx.lineTo(w, y * C + .5); }
    bctx.stroke();

    const over = state === 'over';
    bctx.globalAlpha = over ? 0.45 : 1;
    for (let y = HIDDEN; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (grid[y] && grid[y][x]) block(bctx, grid[y][x], x * C, (y - HIDDEN) * C, C);
    }
    bctx.globalAlpha = 1;
    if (cur) {
      const cells = CELLS[cur.t][cur.r];
      if (settings.ghost) {
        let gy = cur.y;
        while (fits(cur.t, cur.r, cur.x, gy + 1)) gy++;
        if (gy !== cur.y) {
          bctx.strokeStyle = COLORS[cur.t]; bctx.fillStyle = COLORS[cur.t];
          bctx.lineWidth = Math.max(1.5, C * 0.08);
          for (const [cx, cy] of cells) {
            const px = (cur.x + cx) * C, py = (gy + cy - HIDDEN) * C, i = Math.max(2, C * 0.12);
            bctx.globalAlpha = 0.16; bctx.beginPath(); bctx.roundRect(px + i, py + i, C - 2 * i, C - 2 * i, C * 0.14); bctx.fill();
            bctx.globalAlpha = 0.7; bctx.stroke();
          }
          bctx.globalAlpha = 1;
        }
      }
      for (const [cx, cy] of cells) block(bctx, cur.t, (cur.x + cx) * C, (cur.y + cy - HIDDEN) * C, C);
    }
    if (clearing) {
      const k = clearing.t / CLEAR_TIME;
      bctx.fillStyle = `rgba(255,250,235,${(0.9 * (1 - k)).toFixed(3)})`;
      for (const y of clearing.rows) {
        const shrink = w * k * 0.5;
        bctx.fillRect(shrink, (y - HIDDEN) * C, w - 2 * shrink, C);
      }
    }
  }

  // a small piece, centred in a box
  function mini(ctx, t, bx, by, bw, bh, s, alpha = 1) {
    const cells = CELLS[t][0];
    const xs = cells.map(c => c[0]), ys = cells.map(c => c[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const ox = bx + (bw - (maxX - minX + 1) * s) / 2 - minX * s, oy = by + (bh - (maxY - minY + 1) * s) / 2 - minY * s;
    ctx.globalAlpha = alpha;
    for (const [cx, cy] of cells) block(ctx, t, ox + cx * s, oy + cy * s, s);
    ctx.globalAlpha = 1;
  }
  const SLOT_W = 4.6, SLOT_H = 2.8;
  function drawSide() {
    const sw = SLOT_W * M, sh = SLOT_H * M;
    hctx.clearRect(0, 0, sw, sh);
    if (held) mini(hctx, held, 0, 0, sw, sh, M, holdUsed ? 0.35 : 1);
    const n = 3, vertical = layout === 'side';
    nctx.clearRect(0, 0, vertical ? sw : sw * n, vertical ? sh * n : sh);
    const upcoming = state === 'idle' ? [] : queue.slice(0, n);
    upcoming.forEach((t, i) => mini(nctx, t, vertical ? 0 : i * sw, vertical ? i * sh : 0, sw, sh, i ? M * 0.85 : M));
    $('holdCv').closest('.panel').setAttribute('aria-label', held ? `Held piece: ${NAMES[held]}` : 'Held piece: none');
    $('nextCv').closest('.panel').setAttribute('aria-label', upcoming.length ? `Next pieces: ${upcoming.map(t => NAMES[t]).join(', ')}` : 'Next pieces');
  }

  // The well is as big as the space allows. Phones in portrait get the hold, score and next boxes in a
  // strip above the well (so it can be wider); wider screens get them beside it.
  function layoutStage() {
    const area = $('stageArea'), W = area.clientWidth, H = area.clientHeight;
    if (!W || !H) return;
    const fit = test => { for (let c = 40; c >= 8; c--) if (test(c)) return c; return 8; };
    let sideM = 0, sideW = 0;
    const minSide = W < 420 ? 58 : 76;   // narrow side boxes when the well is squeezed (phones held sideways)
    const cSide = fit(c => {
      const m = Math.max(8, Math.round(c * 0.6)), sw = Math.max(minSide, Math.ceil(SLOT_W * m + 18));
      if (10 * c + 2 * sw + 26 <= W && 20 * c + 8 <= H) { sideM = m; sideW = sw; return true; }
      return false;
    });
    const stackM = Math.max(9, Math.min(15, Math.floor((W - 150) / (SLOT_W * 4))));
    const top = Math.ceil(SLOT_H * stackM) + 36;
    const cStack = fit(c => 10 * c + 8 <= W && 20 * c + 8 + 8 + top <= H);
    layout = cSide >= cStack ? 'side' : 'stacked';
    C = layout === 'side' ? cSide : cStack;
    M = layout === 'side' ? sideM || Math.max(9, Math.round(C * 0.6)) : stackM;
    const stage = $('stage');
    stage.className = 'stage ' + layout + (layout === 'side' && sideW < 70 ? ' narrow' : '');
    stage.style.setProperty('--c', C + 'px');
    stage.style.setProperty('--m', M + 'px');
    stage.style.setProperty('--sidew', (sideW || 76) + 'px');
    sizeCanvas(board, bctx, C * COLS, C * (ROWS - HIDDEN));
    sizeCanvas(holdCv, hctx, SLOT_W * M, SLOT_H * M);
    sizeCanvas(nextCv, nctx, layout === 'side' ? SLOT_W * M : SLOT_W * M * 3, layout === 'side' ? SLOT_H * M * 3 : SLOT_H * M);
    draw(); drawSide();
  }
  new ResizeObserver(layoutStage).observe($('stageArea'));

  /* ───────────── Score, messages ───────────── */

  function updateStats() {
    $('score').textContent = score.toLocaleString();
    $('level').textContent = level;
    $('lines').textContent = lines;
    $('best').textContent = Math.max(score, best ? best.score : 0).toLocaleString();
  }
  function toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    $('toasts').appendChild(el);
    setTimeout(() => el.remove(), 1250);
  }
  function announce(msg) { $('announcer').textContent = ''; setTimeout(() => { $('announcer').textContent = msg; }, 30); }

  /* ───────────── Controls ───────────── */

  function press(act) {
    if (act === 'pause') { if (state === 'pause' || state === 'pause-clear') resume(); else pause(); return; }
    if (state === 'clear' && act in keys) {   // rows are clearing: remember the key, it acts on the next piece
      keys[act] = true;
      if (act !== 'soft') { dasDir = act; dasT = 0; arrT = 0; }
      return;
    }
    if (state !== 'play' || !cur) return;
    switch (act) {
      case 'left': case 'right':
        keys[act] = true; dasDir = act; dasT = 0; arrT = 0;
        shift(act === 'left' ? -1 : 1); break;
      case 'soft': keys.soft = true; if (softStep()) updateStats(); break;
      case 'hard': hardDrop(); break;
      case 'cw': rotate(1); break;
      case 'ccw': rotate(-1); break;
      case 'hold': hold(); break;
    }
    draw();
  }
  function release(act) {
    if (!(act in keys)) return;
    keys[act] = false;
    if (dasDir === act) {
      const other = act === 'left' ? 'right' : 'left';
      dasDir = keys[other] ? other : null; dasT = 0; arrT = 0;
    }
  }

  const KEYMAP = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'soft', Space: 'hard', ArrowUp: 'cw', KeyX: 'cw',
    KeyZ: 'ccw', ControlLeft: 'ccw', ControlRight: 'ccw', KeyC: 'hold', ShiftLeft: 'hold', ShiftRight: 'hold',
    KeyP: 'pause', Escape: 'pause',
  };
  document.addEventListener('keydown', e => {
    if (e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
    const act = KEYMAP[e.code];
    const playing = state === 'play' || state === 'clear';
    if (!act) {
      if (e.key === 'Enter' && !(e.target.closest && e.target.closest('button, a'))) {
        if (state === 'idle' || state === 'over') { e.preventDefault(); start(); }
        else if (state === 'pause' || state === 'pause-clear') { e.preventDefault(); resume(); }
      }
      return;
    }
    if (e.ctrlKey && !/^Control/.test(e.code)) return;
    // an overlay button with focus answers to Space itself
    if (!playing && act === 'hard' && e.target.closest && e.target.closest('button')) return;
    if (act === 'pause' && !playing && state !== 'pause' && state !== 'pause-clear') return;
    if (playing || act === 'pause') e.preventDefault();
    if (e.repeat) return;   // holding a key repeats in update(), not here
    press(act);
  });
  document.addEventListener('keyup', e => { const act = KEYMAP[e.code]; if (act) release(act); });

  // on-screen buttons: act on touch down, so they feel instant
  document.querySelectorAll('.pbtn').forEach(btn => {
    const act = btn.dataset.act;
    const up = () => { btn.classList.remove('down'); release(act); };
    btn.addEventListener('pointerdown', e => {
      e.preventDefault();
      btn.classList.add('down');
      try { btn.setPointerCapture(e.pointerId); } catch {}
      press(act);
    });
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('lostpointercapture', up);
    btn.addEventListener('contextmenu', e => e.preventDefault());
    btn.addEventListener('click', e => { if (e.detail === 0) press(act); });   // keyboard or switch access
  });

  // touching the well: tap to turn, drag to move, flick down to drop
  let touch = null;
  $('well').addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' || state !== 'play' || e.target.closest('.overlay:not([hidden])')) return;
    touch = { id: e.pointerId, x0: e.clientX, y0: e.clientY, ax: e.clientX, ay: e.clientY, t0: e.timeStamp, mode: null, vy: 0, ly: e.clientY, lt: e.timeStamp };
    try { $('well').setPointerCapture(e.pointerId); } catch {}
  });
  $('well').addEventListener('pointermove', e => {
    if (!touch || e.pointerId !== touch.id || state !== 'play') return;
    const step = Math.max(14, C * 0.9);
    while (Math.abs(e.clientX - touch.ax) >= step && touch.mode !== 'v') {
      const dir = Math.sign(e.clientX - touch.ax);
      touch.ax += dir * step; touch.mode = 'h';
      shift(dir);
    }
    while (e.clientY - touch.ay >= C && touch.mode !== 'h') {
      touch.ay += C; touch.mode = 'v';
      softStep();
    }
    const dt = e.timeStamp - touch.lt;
    if (dt > 0) { touch.vy = 0.6 * ((e.clientY - touch.ly) / dt) + 0.4 * touch.vy; touch.ly = e.clientY; touch.lt = e.timeStamp; }
    updateStats(); draw();
  });
  const endTouch = e => {
    if (!touch || e.pointerId !== touch.id) return;
    const t = touch; touch = null;
    if (state !== 'play' || e.type === 'pointercancel') return;
    const dist = Math.hypot(e.clientX - t.x0, e.clientY - t.y0);
    if (!t.mode && dist < 12 && e.timeStamp - t.t0 < 300) rotate(1);
    else if (t.mode !== 'h' && e.clientY - t.y0 > C * 1.5 && (t.vy > 0.6 || (e.clientY - t.y0 > C * 3 && e.timeStamp - t.t0 < 300))) hardDrop();
    draw();
  };
  $('well').addEventListener('pointerup', endTouch);
  $('well').addEventListener('pointercancel', endTouch);
  document.querySelector('.panel.hold').addEventListener('click', () => { if (state === 'play') { hold(); draw(); } });

  // leaving the page or switching apps pauses the game
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('blur', () => pause());

  /* ───────────── Buttons, dialogs, settings ───────────── */

  $('playBtn').addEventListener('click', start);
  $('againBtn').addEventListener('click', start);
  $('resumeBtn').addEventListener('click', resume);
  function toStart() {
    state = 'idle'; cur = null; clearing = null; grid = emptyGrid(); queue = []; held = null;
    score = 0; lines = 0; level = settings.startLevel;
    $('pauseBtn').disabled = true;
    updateStats(); drawSide(); showOverlay('start');
  }
  $('quitBtn').addEventListener('click', toStart);
  $('levelBtn').addEventListener('click', toStart);
  $('lvlDown').addEventListener('click', () => { settings.startLevel = Math.max(1, settings.startLevel - 1); saveSettings(); renderStartLevel(); });
  $('lvlUp').addEventListener('click', () => { settings.startLevel = Math.min(MAX_START, settings.startLevel + 1); saveSettings(); renderStartLevel(); });
  $('pauseBtn').addEventListener('click', () => press('pause'));

  function openDialog(dlg) { pause(); dlg.showModal(); }
  document.querySelectorAll('dialog').forEach(dlg => {
    dlg.querySelector('[data-close]').addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });   // a tap outside the sheet closes it
    dlg.addEventListener('close', () => {
      const focus = { idle: 'playBtn', over: 'againBtn', pause: 'resumeBtn', 'pause-clear': 'resumeBtn' }[state];
      if (focus) $(focus).focus({ preventScroll: true });
    });
  });
  $('helpBtn').addEventListener('click', () => openDialog($('helpDlg')));
  $('settingsBtn').addEventListener('click', () => openDialog($('settingsDlg')));

  const coarse = window.matchMedia('(pointer: coarse)');
  function applySettings() {
    const pad = settings.pad == null ? coarse.matches : settings.pad;
    document.documentElement.classList.toggle('has-pad', pad);
    document.documentElement.classList.toggle('no-pad', !pad);
    $('ghostSet').checked = settings.ghost;
    $('padSet').checked = pad;
    layoutStage();
  }
  $('ghostSet').addEventListener('change', e => { settings.ghost = e.target.checked; saveSettings(); draw(); });
  $('padSet').addEventListener('change', e => { settings.pad = e.target.checked; saveSettings(); applySettings(); });
  coarse.addEventListener('change', applySettings);

  /* ───────────── Start ───────────── */

  $('well').setAttribute('tabindex', '-1');
  $('well').appendChild($('toasts'));
  grid = emptyGrid();
  applySettings();
  updateStats();
  showOverlay('start');
  requestAnimationFrame(frame);

  // exposed for automated tests only
  window.__blocks = {
    get state() { return state; }, get cur() { return cur && { ...cur }; }, get grid() { return grid; },
    get score() { return score; }, get lines() { return lines; }, get level() { return level; },
    get held() { return held; }, get queue() { return queue.slice(); }, get layout() { return layout; }, get cell() { return C; },
    start, press, release, fits,
    // put rows of blocks at the bottom of the well, and choose the next pieces
    setBottom(rows) { rows.slice().reverse().forEach((r, i) => { grid[ROWS - 1 - i] = [...r].map(ch => ch === '.' ? null : ch); }); draw(); },
    setNext(types) { queue = types.slice(); bag = []; },
    respawn(t) { spawn(t); draw(); },
    place(t, r, x, y, turned) { cur = { t, r, x, y }; lastTurn = !!turned; lowest = y; draw(); },
  };
})();
