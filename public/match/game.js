(() => {
  'use strict';

  /* ───────────── Object catalogue ─────────────
     Every object has a unique key, a category, a readable name and a visual. */

  const EMOJI = [
    ['🔑','Key'],['⌚','Watch'],['📎','Paper clip'],['✏️','Pencil'],['💰','Money bag'],['🕯️','Candle'],
    ['🧭','Compass'],['🔦','Torch'],['🧵','Thread'],['🧷','Safety pin'],['✂️','Scissors'],['📏','Ruler'],
    ['🔋','Battery'],['💡','Light bulb'],['🔍','Magnifier'],['📌','Pin'],['🖊️','Pen'],['🎲','Die'],
    ['🧩','Puzzle piece'],['🪀','Yo-yo'],['🎈','Balloon'],['🧸','Teddy bear'],['🪁','Kite'],['🍎','Apple'],
    ['🍋','Lemon'],['🥕','Carrot'],['🍌','Banana'],['🧀','Cheese'],['🥚','Egg'],['🍄','Mushroom'],
    ['🌰','Chestnut'],['🐚','Shell'],['🌻','Sunflower'],['🍂','Leaf'],['🌸','Flower'],['🧱','Brick'],
    ['🥄','Spoon'],['🍴','Fork'],['☕','Cup'],['🔔','Bell'],['✉️','Envelope'],['📚','Books'],
    ['🧲','Magnet'],['🧹','Broom'],['🧼','Soap'],['🧽','Sponge'],['👓','Glasses'],['🧤','Gloves'],
    ['🧦','Socks'],['🎩','Top hat'],['🧣','Scarf'],['💍','Ring'],['🎀','Ribbon'],['⚽','Football'],
    ['🏀','Basketball'],['🎾','Tennis ball'],['🎯','Dart board'],['⏰','Alarm clock'],['📷','Camera'],['📱','Phone'],
    ['🎧','Headphones'],['🧺','Basket'],['🔨','Hammer'],['🧯','Extinguisher'],['🔧','Spanner'],['🧰','Toolbox'],
    ['🍕','Pizza'],['🌂','Umbrella'],['🎸','Guitar'],['🥁','Drum'],['🎺','Trumpet'],['🚲','Bicycle'],
    ['⚓','Anchor'],['🏆','Trophy'],['🎁','Gift'],['🧁','Cupcake'],['🍩','Doughnut'],['🐢','Tortoise'],
    ['🦋','Butterfly'],['🐝','Bee'],['🌵','Cactus'],['🧮','Abacus'],['☂️','Parasol'],['🐙','Octopus'],
  ];

  // colour-blind-safe palette (Okabe–Ito): the six colours stay distinct with red-green colour blindness
  const COLOURS = [
    ['Red', '#d55e00'], ['Orange', '#e69f00'], ['Yellow', '#f0e442'],
    ['Green', '#009e73'], ['Blue', '#0072b2'], ['Pink', '#cc79a7'],
  ];
  // SVG bodies drawn in a 100×100 box; {c} is replaced with the fill colour
  const SHAPES = {
    Circle:   '<circle cx="50" cy="50" r="42" fill="{c}"/>',
    Square:   '<rect x="12" y="12" width="76" height="76" rx="6" fill="{c}"/>',
    Triangle: '<polygon points="50,8 94,88 6,88" fill="{c}" stroke="{c}" stroke-width="4" stroke-linejoin="round"/>',
    Star:     '<polygon points="50,5 61,38 96,38 68,59 78,93 50,72 22,93 32,59 4,38 39,38" fill="{c}"/>',
    Heart:    '<path d="M50 90 C20 68 4 50 4 32 C4 16 16 6 30 6 C40 6 46 12 50 20 C54 12 60 6 70 6 C84 6 96 16 96 32 C96 50 80 68 50 90Z" fill="{c}"/>',
    Hexagon:  '<polygon points="50,4 90,27 90,73 50,96 10,73 10,27" fill="{c}"/>',
    Diamond:  '<polygon points="50,4 94,50 50,96 6,50" fill="{c}"/>',
    Moon:     '<path d="M64 6 A44 44 0 1 0 94 70 A36 36 0 1 1 64 6Z" fill="{c}"/>',
  };
  const SUITS = [['♠','spades',false],['♥','hearts',true],['♦','diamonds',true],['♣','clubs',false]];
  const RANKS = [['A','Ace'],['2','2'],['3','3'],['4','4'],['5','5'],['6','6'],['7','7'],['8','8'],['9','9'],['10','10'],['J','Jack'],['Q','Queen'],['K','King']];

  const CATEGORIES = [
    { id: 'emoji',  label: 'Pictures', icon: 'apple' },
    { id: 'shape',  label: 'Shapes',   icon: 'shapes' },
    { id: 'number', label: 'Numbers',  icon: 'number' },
    { id: 'letter', label: 'Letters',  icon: 'letter' },
    { id: 'card',   label: 'Playing cards', icon: 'cards' },
  ];

  const CATALOGUE = [];
  EMOJI.forEach(([e, name]) => CATALOGUE.push({ key: 'e:' + name, cat: 'emoji', name, html: `<span class="vis emoji">${e}</span>` }));
  for (const [shape, svg] of Object.entries(SHAPES)) {
    for (const [cname, hex] of COLOURS) {
      CATALOGUE.push({
        key: `s:${cname}:${shape}`, cat: 'shape', name: `${cname} ${shape.toLowerCase()}`,
        html: `<span class="vis shape"><svg viewBox="0 0 100 100" aria-hidden="true">${svg.replaceAll('{c}', hex)}</svg></span>`,
      });
    }
  }
  for (let n = 1; n <= 99; n++) CATALOGUE.push({ key: 'n:' + n, cat: 'number', name: 'Number ' + n, html: `<span class="vis number">${n}</span>` });
  for (const L of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') CATALOGUE.push({ key: 'l:' + L, cat: 'letter', name: 'Letter ' + L, html: `<span class="vis letter">${L}</span>` });
  for (const [sym, suit, red] of SUITS) {
    for (const [r, rname] of RANKS) {
      CATALOGUE.push({
        key: `c:${r}${sym}`, cat: 'card', name: `${rname} of ${suit}`,
        html: `<span class="vis card${red ? ' red' : ''}"><span>${r}</span><span class="suit">${sym}</span></span>`,
      });
    }
  }

  /* ───────────── Settings ───────────── */

  const SIZES = { '4x4': [4, 4], '5x5': [5, 5], '6x6': [6, 6], '7x7': [7, 7], '8x8': [8, 8] };
  const DIM_RANGE = [2, 8];          // custom rows and columns
  const MISMATCH_MS = 900;           // how long two cards that don't match stay face up
  const custom = { rows: 4, cols: 5 };

  /* ───────────── Helpers ───────────── */

  const $ = id => document.getElementById(id);
  const sections = { setup: $('setup'), play: $('play'), results: $('results') };
  const show = name => {
    Object.entries(sections).forEach(([k, el]) => el.hidden = k !== name);
    document.body.classList.toggle('playing', name === 'play');
    window.scrollTo(0, 0);
  };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const radio = name => document.querySelector(`input[name="${name}"]:checked`).value;
  const checkedCats = () => [...document.querySelectorAll('input[name="cat"]:checked')].map(i => i.value);
  const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
  const sizeLabel = (r, c) => `${r} × ${c}`;
  const fmt = ms => {
    const t = Math.max(0, Math.floor(ms / 100)); // tenths
    const m = Math.floor(t / 600), s = Math.floor(t / 10) % 60, d = t % 10;
    return `${m}:${String(s).padStart(2, '0')}.${d}`;
  };
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  // Picks n items spread evenly across categories (round-robin over shuffled groups).
  function pickBalanced(n, candidates) {
    const groups = new Map();
    for (const it of shuffle(candidates)) {
      if (!groups.has(it.cat)) groups.set(it.cat, []);
      groups.get(it.cat).push(it);
    }
    const lists = shuffle([...groups.values()]);
    const out = [];
    while (out.length < n && lists.some(l => l.length)) {
      for (const l of lists) if (l.length && out.length < n) out.push(l.pop());
    }
    return out;
  }

  /* ───────────── Setup screen ───────────── */

  const catSeg = $('catSeg');
  CATEGORIES.forEach(c => {
    catSeg.insertAdjacentHTML('beforeend',
      `<input type="checkbox" name="cat" id="cat-${c.id}" value="${c.id}" checked><label for="cat-${c.id}">${window.icon3d ? icon3d(c.icon) : ''}${c.label}</label>`);
  });

  const saved = store.get('match-settings');
  if (saved && typeof saved === 'object') {
    const el = [...document.querySelectorAll('input[name="size"]')].find(i => i.value === String(saved.size));
    if (el) el.checked = true;
    if (Array.isArray(saved.cats) && saved.cats.length) {
      document.querySelectorAll('input[name="cat"]').forEach(i => i.checked = saved.cats.includes(i.value));
    }
    const num = (v, fallback) => typeof v === 'number' && Number.isFinite(v) ? Math.min(DIM_RANGE[1], Math.max(DIM_RANGE[0], Math.round(v))) : fallback;
    if (saved.custom && typeof saved.custom === 'object') {
      custom.rows = num(saved.custom.rows, custom.rows);
      custom.cols = num(saved.custom.cols, custom.cols);
    }
  }

  function boardDims() {
    const size = radio('size');
    return size === 'custom' ? [custom.rows, custom.cols] : SIZES[size];
  }
  const bestKey = (r, c) => `match-best-${r}x${c}`;

  function setCustom(field, raw) {
    const n = String(raw).trim() === '' ? NaN : Number(raw);
    if (Number.isFinite(n)) custom[field] = Math.min(DIM_RANGE[1], Math.max(DIM_RANGE[0], Math.round(n)));
    renderCustom();
    updateSetup();
  }

  function renderCustom() {
    for (const field of ['rows', 'cols']) $('c-' + field).value = custom[field];
    document.querySelectorAll('#customField .step').forEach(b => {
      const v = custom[b.dataset.for.slice(2)];
      // aria-disabled rather than disabled, so a button that reaches its limit keeps keyboard focus
      b.setAttribute('aria-disabled', String(+b.dataset.step < 0 ? v <= DIM_RANGE[0] : v >= DIM_RANGE[1]));
    });
  }

  function updateSetup() {
    const [rows, cols] = boardDims(), cats = checkedCats();
    const spaces = rows * cols, pairs = Math.floor(spaces / 2), free = spaces % 2 === 1;
    $('customField').hidden = radio('size') !== 'custom';
    $('sizeHint').textContent = `${sizeLabel(rows, cols)}: ${pairs * 2} cards (${plural(pairs, 'pair')})` +
      (free ? ', plus a free space in the middle.' : '.');

    const available = CATALOGUE.filter(it => cats.includes(it.cat)).length;
    const hint = $('catHint');
    let ok = true;
    if (!cats.length) { hint.textContent = 'Choose at least one kind of object.'; ok = false; }
    else if (available < pairs) {
      hint.textContent = `Not enough different objects for ${plural(pairs, 'pair')}: ${cats.length === 1 ? 'the kind you chose has' : 'the kinds you chose have'} ${available}. Add another kind of object or choose a smaller board.`;
      ok = false;
    } else hint.textContent = `${available} different objects to deal from.` +
      (available >= 2 * pairs ? " Each round avoids the last round's objects." : ' Some will repeat from round to round.');
    hint.classList.toggle('warn', !ok);
    $('startBtn').disabled = !ok;

    const best = store.get(bestKey(rows, cols));
    $('bestLine').innerHTML = best && best.time
      ? `Your best on ${sizeLabel(rows, cols)}: <b>${fmt(best.time)}</b>` + (best.moves ? `, fewest moves <b>${best.moves}</b>` : '')
      : `No best time on ${sizeLabel(rows, cols)} yet.`;
  }

  document.querySelectorAll('#setup input[type="radio"], #setup input[type="checkbox"]').forEach(i =>
    i.addEventListener('change', updateSetup));
  document.querySelectorAll('#customField .step').forEach(b =>
    b.addEventListener('click', () => setCustom(b.dataset.for.slice(2), custom[b.dataset.for.slice(2)] + +b.dataset.step)));
  ['rows', 'cols'].forEach(field => $('c-' + field).addEventListener('change', e => setCustom(field, e.target.value)));
  renderCustom();
  updateSetup();

  /* ───────────── Game ───────────── */

  let game = null;
  let recent = new Set();   // objects dealt last round, avoided in the next one where possible
  const history = [];       // rounds played this visit
  let clockRaf = 0;
  const MIN_CS = 22, MAX_CS = 132;   // card size limits in CSS px

  const announce = text => { $('announcer').textContent = ''; requestAnimationFrame(() => { $('announcer').textContent = text; }); };

  function deal() {
    const [rows, cols] = boardDims(), cats = checkedCats();
    store.set('match-settings', { size: radio('size'), cats, custom });
    const spaces = rows * cols, pairs = Math.floor(spaces / 2);

    const pool = CATALOGUE.filter(it => cats.includes(it.cat));
    const chosen = pickBalanced(pairs, pool.filter(it => !recent.has(it.key)));
    if (chosen.length < pairs) {
      const taken = new Set(chosen.map(i => i.key));
      chosen.push(...pickBalanced(pairs - chosen.length, pool.filter(it => !taken.has(it.key))));
    }
    recent = new Set(chosen.map(i => i.key));

    if (game) { clearTimeout(game.resultsTimer); game.cards.forEach(c => clearTimeout(c.hideT)); }
    clearPending();
    stopClock();
    const keepFocus = sections.play.contains(document.activeElement) && !sections.play.hidden; // e.g. New deal
    game = {
      rows, cols, pairs, found: 0, moves: 0, misses: 0,
      cards: [], first: null, pending: null,
      started: false, running: false, paused: false, done: false,
      elapsed: 0, t0: 0, dispCols: null, resultsTimer: 0, lastFocus: null,
    };

    const deck = shuffle([...chosen, ...chosen]);
    const freeIdx = spaces % 2 === 1 ? Math.floor(spaces / 2) : -1;
    const board = $('board');
    board.replaceChildren();
    board.classList.remove('paused-hide');
    for (let i = 0; i < spaces; i++) {
      if (i === freeIdx) {
        const f = document.createElement('div');
        f.className = 'free';
        f.textContent = '★';
        f.setAttribute('aria-hidden', 'true');
        board.appendChild(f);
        continue;
      }
      const it = deck.pop();
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'mcard';
      el.tabIndex = game.cards.length === 0 ? 0 : -1; // one tab stop for the board; arrow keys move inside it
      // the face is filled in only while the card is face up, so it can't be read, printed or copied before then
      el.innerHTML = '<span class="inner" aria-hidden="true"><span class="side back"></span><span class="side face"></span></span>';
      const card = { key: it.key, name: it.name, html: it.html, el, face: el.querySelector('.face'), up: false, matched: false, pos: i, hideT: 0 };
      el.addEventListener('click', () => onCard(card));
      game.cards.push(card);
      board.appendChild(el);
    }

    $('hudTotal').textContent = pairs;
    $('pausedCover').hidden = true;
    $('pauseBtn').textContent = 'Pause';
    setStatus('The timer starts on your first tap.');
    updateHud();
    show('play');
    layout();
    game.cards.forEach(labelCard);
    $('hudTime').textContent = fmt(0);
    if (!keepFocus) game.cards[0].el.focus({ preventScroll: true });
  }

  function labelCard(c) {
    const dc = game.dispCols || game.cols;
    const where = `Row ${Math.floor(c.pos / dc) + 1}, column ${c.pos % dc + 1}`;
    c.el.setAttribute('aria-label', c.matched ? `${c.name}, matched` : c.up ? `${where}: ${c.name}` : `${where}: face down`);
    c.el.setAttribute('aria-disabled', String(c.matched));
  }

  function setStatus(text, kind = '') {
    const s = $('status');
    s.textContent = text;
    s.className = 'status' + (kind ? ' ' + kind : '');
  }

  function updateHud() {
    $('hudPairs').textContent = game.found;
    $('hudMoves').textContent = game.moves;
  }

  function showFace(c) {
    clearTimeout(c.hideT);
    if (!c.face.firstChild) c.face.innerHTML = c.html;
  }
  // empties the face once the card has finished turning back over
  function hideFaceLater(c) {
    clearTimeout(c.hideT);
    c.hideT = setTimeout(() => { if (!c.up && !c.matched) c.face.replaceChildren(); }, 360);
  }

  function setTabStop(el) {
    for (const c of game.cards) c.el.tabIndex = c.el === el ? 0 : -1;
  }

  function onCard(c) {
    if (!game || game.done || game.paused || c.matched) return;
    setTabStop(c.el);
    // tapping on while two non-matching cards are still showing turns them back at once
    if (game.pending) clearPending();
    if (c.up) return;
    if (!game.started) startClock();

    c.up = true;
    showFace(c);
    c.el.classList.add('up');
    labelCard(c);

    if (!game.first) { game.first = c; setStatus(c.name); return; }
    const a = game.first;
    game.first = null;
    game.moves++;
    if (a.key === c.key) {
      for (const x of [a, c]) {
        x.matched = true;
        x.el.classList.add('matched', 'just-matched');
        labelCard(x);
      }
      game.found++;
      setStatus(`Match: ${c.name}`, 'good');
      if (game.found === game.pairs) finish();
    } else {
      game.misses++;
      a.el.classList.add('miss');
      c.el.classList.add('miss');
      setStatus(`Not a match: ${a.name} and ${c.name}.`, 'bad');
      game.pending = { cards: [a, c], timer: setTimeout(clearPending, MISMATCH_MS) };
    }
    updateHud();
  }

  // Turns the two cards of a failed try face down again.
  function clearPending() {
    if (!game || !game.pending) return;
    clearTimeout(game.pending.timer);
    for (const x of game.pending.cards) {
      x.up = false;
      x.el.classList.remove('up', 'miss');
      labelCard(x);
      hideFaceLater(x);
    }
    game.pending = null;
  }

  /* ───────────── Clock ───────────── */

  const now = () => performance.now();
  const elapsed = () => game.elapsed + (game.running ? now() - game.t0 : 0);
  function startClock() {
    game.started = true;
    game.running = true;
    game.t0 = now();
    tick();
  }
  function tick() {
    if (!game || !game.running) return;
    $('hudTime').textContent = fmt(elapsed());
    clockRaf = requestAnimationFrame(tick);
  }
  function stopClock() {
    cancelAnimationFrame(clockRaf);
    if (game && game.running) { game.elapsed = elapsed(); game.running = false; }
  }

  function pause() {
    if (!game || game.done || game.paused) return;
    game.lastFocus = sections.play.contains(document.activeElement) ? document.activeElement : null;
    clearPending();
    stopClock();
    game.paused = true;
    $('board').classList.add('paused-hide');
    $('pausedCover').hidden = false;
    $('pauseBtn').textContent = 'Resume';
    $('resumeBtn').focus({ preventScroll: true });
    announce('Paused. The cards are hidden.');
  }
  function resume() {
    if (!game || !game.paused) return;
    game.paused = false;
    $('board').classList.remove('paused-hide');
    $('pausedCover').hidden = true;
    $('pauseBtn').textContent = 'Pause';
    if (game.started) { game.running = true; game.t0 = now(); tick(); }
    $('hudTime').textContent = fmt(elapsed());
    const f = game.lastFocus;
    const back = f && f.isConnected && !$('pausedCover').contains(f) ? f : (game.cards.find(c => c.el.tabIndex === 0) || game.cards[0]).el;
    back.focus({ preventScroll: true });
    announce('Resumed.');
  }
  // a timed game can't keep running while the player is in another app or tab
  document.addEventListener('visibilitychange', () => { if (document.hidden && game && game.started) pause(); });

  /* ───────────── Board layout ─────────────
     Cards are sized so the whole board fits on screen without scrolling. Before the first tap a
     rectangular board is turned to match the screen if that gives bigger cards; once play has
     started the orientation is kept, so turning the device only resizes the cards and every card
     stays where the player saw it. */

  const sideLayout = window.matchMedia('(max-height: 500px) and (orientation: landscape)');
  const px = (el, prop) => parseFloat(getComputedStyle(el)[prop]) || 0;

  function layout() {
    if (!game || sections.play.hidden) return;
    const vv = window.visualViewport;
    if (vv && vv.scale > 1.01) return; // the player is pinch-zooming: keep the cards as they are
    const board = $('board'), wrap = $('boardWrap'), panel = sections.play, actions = $('playActions');
    const viewH = vv ? vv.height : window.innerHeight;
    const W = wrap.clientWidth;
    const top = wrap.getBoundingClientRect().top + window.scrollY;
    const tail = px(panel, 'paddingBottom') + px(panel, 'borderBottomWidth') + px(document.querySelector('.wrap'), 'paddingBottom');
    // on a short landscape screen the buttons sit beside the board, not below it
    const below = sideLayout.matches ? tail : actions.offsetHeight + px(actions, 'marginTop') + tail;
    const H = Math.max(120, viewH - top - below - 1);
    const gap = px(board, 'columnGap') || 8;
    const fit = (cols, rows) => Math.max(MIN_CS, Math.min(MAX_CS,
      Math.floor(Math.min((W - gap * (cols - 1)) / cols, (H - gap * (rows - 1)) / rows))));

    if (!game.started || !game.dispCols) {
      const turn = game.rows !== game.cols && fit(game.rows, game.cols) > fit(game.cols, game.rows);
      const dispCols = turn ? game.rows : game.cols;
      if (dispCols !== game.dispCols) { game.dispCols = dispCols; game.cards.forEach(labelCard); }
    }
    const cols = game.dispCols, rows = cols === game.cols ? game.rows : game.cols;
    board.style.setProperty('--cols', cols);
    board.style.setProperty('--cs', fit(cols, rows) + 'px');
  }
  window.addEventListener('resize', layout);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);
  if (sideLayout.addEventListener) sideLayout.addEventListener('change', layout);
  else sideLayout.addListener(layout); // older Safari

  // Arrow keys move between cards on the board.
  $('board').addEventListener('keydown', e => {
    if (!game) return;
    const moves = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -game.dispCols, ArrowDown: game.dispCols };
    if (!(e.key in moves)) return;
    const cells = [...$('board').children];
    let i = cells.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    do { i += moves[e.key]; } while (cells[i] && !cells[i].matches('button'));
    if (cells[i]) { setTabStop(cells[i]); cells[i].focus(); }
  });
  // Esc pauses and resumes
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !game || game.done || sections.play.hidden) return;
    if (game.paused) resume();
    else pause();
  });

  /* ───────────── Finish ───────────── */

  const tenths = ms => Math.floor(ms / 100) * 100; // times are shown, compared and saved to the tenth

  function finish() {
    stopClock();
    game.done = true;
    const time = tenths(game.elapsed);
    $('hudTime').textContent = fmt(time);
    setStatus('All pairs found!', 'good');

    const key = bestKey(game.rows, game.cols);
    const prev = store.get(key) || {};
    const newBestTime = !prev.time || time < tenths(prev.time);
    const newBestMoves = !prev.moves || game.moves < prev.moves;
    store.set(key, { time: newBestTime ? time : prev.time, moves: newBestMoves ? game.moves : prev.moves });

    const acc = Math.round(100 * game.pairs / game.moves);
    history.push({ size: sizeLabel(game.rows, game.cols), time, moves: game.moves, acc, best: newBestTime });

    const g = game;
    const round = { rows: g.rows, cols: g.cols, moves: g.moves, misses: g.misses, pairs: g.pairs, time, newBestTime, newBestMoves, prev, acc };
    // a short pause to see the last pair; cancelled if the player deals again or quits first
    g.resultsTimer = setTimeout(() => { if (game === g) showResults(round); }, 750);
  }

  function showResults(r) {
    const size = sizeLabel(r.rows, r.cols);
    $('resultTitle').textContent = 'Table cleared!';
    $('finalTime').textContent = fmt(r.time);
    const msg = $('finalMsg');
    if (r.newBestTime && r.prev.time) { msg.textContent = `New best time on ${size}! Your previous best was ${fmt(r.prev.time)}.`; msg.className = 'best'; }
    else if (r.newBestTime) { msg.textContent = `Your first time on ${size}. Play again to beat it.`; msg.className = ''; }
    else { msg.textContent = `Your best on ${size} is ${fmt(r.prev.time)}.`; msg.className = ''; }

    $('finalStats').innerHTML = [
      ['Moves', r.moves + (r.newBestMoves && r.prev.moves ? ' ★' : '')],
      ['Misses', r.misses],
      ['Accuracy', r.acc + '%'],
      ['Pairs', r.pairs],
    ].map(([k, v]) => `<div class="stat"><div class="v">${v}</div><div class="k">${k}</div></div>`).join('');

    $('roundsTable').innerHTML = `
      <thead><tr><th>Round</th><th>Board</th><th>Time</th><th>Moves</th><th>Accuracy</th></tr></thead>
      <tbody>${history.map((h, i) => `<tr class="${i === history.length - 1 ? 'latest' : ''}"><td>${i + 1}</td><td>${h.size}</td><td class="${h.best ? 'best' : ''}">${fmt(h.time)}${h.best ? ' ★' : ''}</td><td>${h.moves}</td><td>${h.acc}%</td></tr>`).join('')}</tbody>`;
    show('results');
    updateSetup();
    $('resultTitle').focus({ preventScroll: true });
    announce(`Table cleared in ${fmt(r.time)} with ${plural(r.moves, 'move')}. ${msg.textContent}`);
  }

  function quit() {
    if (game) clearTimeout(game.resultsTimer);
    clearPending();
    stopClock();
    game = null;
    show('setup');
    updateSetup();
    $('startBtn').focus({ preventScroll: true });
  }

  $('startBtn').addEventListener('click', deal);
  $('pauseBtn').addEventListener('click', () => game && (game.paused ? resume() : pause()));
  $('resumeBtn').addEventListener('click', resume);
  $('restartBtn').addEventListener('click', deal);
  $('quitBtn').addEventListener('click', quit);
  $('againBtn').addEventListener('click', deal);
  $('setupBtn').addEventListener('click', () => { show('setup'); updateSetup(); $('startBtn').focus({ preventScroll: true }); });

  // exposed for automated tests only
  window.__match = { CATALOGUE, get game() { return game; } };
})();
