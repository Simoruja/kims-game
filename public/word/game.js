(() => {
  'use strict';

  const LEN = 6, TRIES = 6;
  const { answers: ANSWERS, guesses: GUESSES } = window.WORDS;
  const VALID = new Set([...ANSWERS, ...GUESSES]);
  const FIRST_DAY = [2026, 9, 11];  // daily word #1 (11 October 2026), counted in the player's own time zone
  const PRAISE = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'];
  const RANK = { absent: 1, present: 2, correct: 3 };

  const $ = id => document.getElementById(id);
  const store = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  /* ───────────── Words ───────────── */

  // The daily words follow a fixed shuffled order, so everyone gets the same word on the same day.
  function seeded(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const DAILY_ORDER = (() => {
    const a = ANSWERS.slice(), rnd = seeded(20261011);
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  })();
  const today = () => {
    const d = new Date();
    return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(...FIRST_DAY)) / 864e5) + 1;
  };
  const dailyWord = n => DAILY_ORDER[((n - 1) % DAILY_ORDER.length + DAILY_ORDER.length) % DAILY_ORDER.length];

  // Colours for one guess. Letters in the right place are marked first; the rest are marked "present"
  // only while the answer still has that letter left over, so repeated letters are handled correctly.
  function evaluate(guess, answer) {
    const res = Array(LEN).fill('absent'), left = {};
    for (let i = 0; i < LEN; i++) {
      if (guess[i] === answer[i]) res[i] = 'correct';
      else left[answer[i]] = (left[answer[i]] || 0) + 1;
    }
    for (let i = 0; i < LEN; i++) {
      if (res[i] !== 'correct' && left[guess[i]] > 0) { res[i] = 'present'; left[guess[i]]--; }
    }
    return res;
  }

  // Hard mode: every letter already found must be used again (green ones in the same place).
  function hardModeProblem(guess) {
    const ord = n => ['1st', '2nd', '3rd', '4th', '5th', '6th'][n];
    for (const g of game.guesses) {
      const res = evaluate(g, game.answer), need = {};
      for (let i = 0; i < LEN; i++) {
        if (res[i] === 'correct' && guess[i] !== g[i]) return `${ord(i)} letter must be ${g[i].toUpperCase()}`;
        if (res[i] !== 'absent') need[g[i]] = (need[g[i]] || 0) + 1;
      }
      for (const [ch, n] of Object.entries(need)) {
        if (guess.split(ch).length - 1 < n) return `Guess must contain ${ch.toUpperCase()}${n > 1 ? ` ${n} times` : ''}`;
      }
    }
    return '';
  }

  /* ───────────── State ───────────── */

  const settings = Object.assign({ hard: false, contrast: false }, store.get('word-settings', {}));
  let game = null;      // { mode, day, answer, guesses: [], hard, status: 'playing' | 'won' | 'lost' }
  let current = '';     // letters typed for the next guess
  let busy = false;     // true while a guess is being revealed

  const emptyStats = () => ({ played: 0, won: 0, streak: 0, maxStreak: 0, dist: [0, 0, 0, 0, 0, 0], lastDay: null });
  const statsKey = mode => `word-stats-${mode}`;

  function loadGame(mode) {
    if (mode === 'daily') {
      const day = today(), saved = store.get('word-daily', null);
      if (saved && saved.day === day && saved.answer === dailyWord(day)) return { mode, ...saved };
      return { mode, day, answer: dailyWord(day), guesses: [], hard: settings.hard, status: 'playing' };
    }
    const saved = store.get('word-practice', null);
    if (saved && saved.status === 'playing' && ANSWERS.includes(saved.answer)) return { mode, ...saved };
    return newPractice();
  }
  function newPractice() {
    const recent = store.get('word-practice-recent', []);
    let answer;
    do { answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)]; } while (recent.includes(answer));
    store.set('word-practice-recent', [answer, ...recent].slice(0, 200));
    return { mode: 'practice', answer, guesses: [], hard: settings.hard, status: 'playing' };
  }
  function saveGame() {
    const { mode, ...rest } = game;
    store.set(mode === 'daily' ? 'word-daily' : 'word-practice', rest);
  }

  function recordResult() {
    const s = Object.assign(emptyStats(), store.get(statsKey(game.mode), {}));
    s.played++;
    if (game.status === 'won') {
      s.won++;
      s.dist[game.guesses.length - 1]++;
      // a daily streak only continues from yesterday's word
      s.streak = game.mode === 'daily' && s.lastDay != null && s.lastDay !== game.day - 1 ? 1 : s.streak + 1;
      s.maxStreak = Math.max(s.maxStreak, s.streak);
    } else s.streak = 0;
    if (game.mode === 'daily') s.lastDay = game.day;
    store.set(statsKey(game.mode), s);
  }

  /* ───────────── Board and keyboard ───────────── */

  // Tiles are as big as the space between the header and the keyboard allows (up to 62px).
  function sizeBoard() {
    const area = document.querySelector('.board-area'), gap = 6;
    const w = area.clientWidth, h = area.clientHeight - 12;
    const tile = Math.max(24, Math.min(62, Math.floor((w - 5 * gap) / LEN), Math.floor((h - 5 * gap) / TRIES)));
    $('board').style.setProperty('--tile', tile + 'px');
  }
  new ResizeObserver(sizeBoard).observe(document.querySelector('.board-area'));

  const rows = [];
  function buildBoard() {
    const board = $('board');
    for (let r = 0; r < TRIES; r++) {
      const row = document.createElement('div');
      row.className = 'row';
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', `Guess ${r + 1}`);
      const tiles = [];
      for (let c = 0; c < LEN; c++) {
        const t = document.createElement('div');
        t.className = 'tile';
        row.appendChild(t);
        tiles.push(t);
      }
      board.appendChild(row);
      rows.push({ el: row, tiles });
    }
  }

  const KEYS = ['qwertyuiop', 'asdfghjkl', '+zxcvbnm-'];
  const keyEls = {};
  function buildKeyboard() {
    const kb = $('keyboard');
    KEYS.forEach((line, i) => {
      const row = document.createElement('div');
      row.className = 'krow';
      if (i === 1) row.insertAdjacentHTML('beforeend', '<span class="spacer"></span>');
      for (const ch of line) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'key';
        if (ch === '+') { b.classList.add('wide'); b.textContent = 'Enter'; b.dataset.key = 'Enter'; }
        else if (ch === '-') { b.classList.add('wide'); b.innerHTML = '<span aria-hidden="true">⌫</span>'; b.setAttribute('aria-label', 'Delete letter'); b.dataset.key = 'Backspace'; }
        else { b.textContent = ch; b.dataset.key = ch; keyEls[ch] = b; }
        b.addEventListener('click', () => { press(b.dataset.key); b.blur(); });
        row.appendChild(b);
      }
      if (i === 1) row.insertAdjacentHTML('beforeend', '<span class="spacer"></span>');
      kb.appendChild(row);
    });
  }

  function paintRow(r, word, res) {
    rows[r].tiles.forEach((t, i) => {
      t.textContent = word[i] || '';
      t.className = 'tile' + (word[i] ? ' filled' : '') + (res ? ' ' + res[i] : '');
    });
    const said = res ? word.split('').map((ch, i) => `${ch.toUpperCase()} ${res[i] === 'correct' ? 'correct' : res[i] === 'present' ? 'in the word, wrong place' : 'not in the word'}`).join(', ') : 'empty';
    rows[r].el.setAttribute('aria-label', `Guess ${r + 1}: ${said}`);
  }

  function paintKeys() {
    const best = {};
    for (const g of game.guesses) {
      evaluate(g, game.answer).forEach((r, i) => { if (!best[g[i]] || RANK[r] > RANK[best[g[i]]]) best[g[i]] = r; });
    }
    for (const [ch, el] of Object.entries(keyEls)) {
      el.className = 'key' + (best[ch] ? ' ' + best[ch] : '');
      el.setAttribute('aria-label', ch.toUpperCase() + (best[ch] ? `, ${best[ch] === 'correct' ? 'correct' : best[ch] === 'present' ? 'in the word' : 'not in the word'}` : ''));
    }
  }

  function render() {
    for (let r = 0; r < TRIES; r++) {
      const g = game.guesses[r];
      if (g) paintRow(r, g, evaluate(g, game.answer));
      else paintRow(r, r === game.guesses.length && game.status === 'playing' ? current : '', null);
    }
    paintKeys();
    $('newBtn').hidden = game.mode !== 'practice';
    $('modeInfo').textContent = game.mode === 'daily'
      ? `Word #${game.day}${game.hard ? ' · Hard mode' : ''}`
      : `Practice${game.hard ? ' · Hard mode' : ''}`;
  }

  /* ───────────── Messages ───────────── */

  function toast(text, ms = 1400) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = text;
    $('toasts').prepend(t);
    if (ms) setTimeout(() => t.remove(), ms);
  }
  const announce = text => { $('announcer').textContent = ''; requestAnimationFrame(() => { $('announcer').textContent = text; }); };
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ───────────── Playing ───────────── */

  function press(key) {
    if (!game || busy || game.status !== 'playing' || document.querySelector('dialog[open]')) return;
    const r = game.guesses.length;
    if (key === 'Enter') return submit();
    if (key === 'Backspace') { current = current.slice(0, -1); paintRow(r, current, null); return; }
    if (/^[a-z]$/.test(key) && current.length < LEN) { current += key; paintRow(r, current, null); }
  }

  function reject(text) {
    const row = rows[game.guesses.length].el;
    row.classList.remove('shake'); void row.offsetWidth; row.classList.add('shake');
    toast(text);
    announce(text);
  }

  function submit() {
    if (current.length < LEN) return reject('Not enough letters');
    if (!VALID.has(current)) return reject('Not in word list');
    if (game.hard) { const p = hardModeProblem(current); if (p) return reject(p); }

    const guess = current, r = game.guesses.length, res = evaluate(guess, game.answer);
    current = '';
    game.guesses.push(guess);
    if (guess === game.answer) game.status = 'won';
    else if (game.guesses.length === TRIES) game.status = 'lost';
    saveGame();
    if (game.status !== 'playing') recordResult();

    // reveal the tiles one by one, then colour the keyboard
    busy = true;
    const step = reduced() ? 0 : 300;
    rows[r].tiles.forEach((t, i) => {
      setTimeout(() => {
        t.classList.add('flip');
        setTimeout(() => { t.classList.add(res[i]); }, step ? 250 : 0);
      }, i * step);
    });
    setTimeout(() => {
      paintRow(r, guess, res);
      paintKeys();
      busy = false;
      announce(rows[r].el.getAttribute('aria-label'));
      finishTurn(r);
    }, LEN * step + (step ? 300 : 0));
  }

  function finishTurn(r) {
    if (game.status === 'won') {
      const msg = PRAISE[r];
      toast(msg, 1800);
      announce(`${msg} You found the word in ${r + 1} ${r === 0 ? 'try' : 'tries'}.`);
      if (!reduced()) rows[r].tiles.forEach((t, i) => setTimeout(() => t.classList.add('win'), i * 90));
      setTimeout(() => openStats(), 1700);
    } else if (game.status === 'lost') {
      toast(game.answer.toUpperCase(), 2600);
      announce(`Out of tries. The word was ${game.answer.toUpperCase()}.`);
      setTimeout(() => openStats(), 1700);
    }
  }

  function start(mode) {
    game = loadGame(mode);
    current = '';
    render();
  }

  /* ───────────── Dialogs ───────────── */

  function openDialog(d) {
    if (typeof d.showModal === 'function') d.showModal(); else d.setAttribute('open', '');
  }
  document.querySelectorAll('dialog').forEach(d => {
    d.querySelector('[data-close]').addEventListener('click', () => d.close());
    // back on the board, Enter submits a guess (it would otherwise press the button that opened the dialog)
    d.addEventListener('close', () => $('board').focus({ preventScroll: true }));
    // a click on the dimmed backdrop closes the dialog
    d.addEventListener('click', e => { if (e.target === d) d.close(); });
  });

  let countdown = 0;
  function openStats() {
    const s = Object.assign(emptyStats(), store.get(statsKey(game.mode), {}));
    const done = game.status !== 'playing';
    $('statsTitle').textContent = game.mode === 'daily' ? 'Daily word statistics' : 'Practice statistics';
    const msg = $('resultMsg');
    msg.hidden = !done;
    if (done) msg.innerHTML = game.status === 'won'
      ? `You found <b>${game.answer}</b> in ${game.guesses.length} ${game.guesses.length === 1 ? 'try' : 'tries'}.`
      : `The word was <b>${game.answer}</b>.`;
    $('statRow').innerHTML = [
      ['Played', s.played], ['Win %', s.played ? Math.round(100 * s.won / s.played) : 0],
      ['Current streak', s.streak], ['Best streak', s.maxStreak],
    ].map(([k, v]) => `<div><div class="v">${v}</div><div class="k">${k}</div></div>`).join('');
    const max = Math.max(1, ...s.dist);
    $('dist').innerHTML = s.dist.map((n, i) =>
      `<div class="bar${done && game.status === 'won' && game.guesses.length === i + 1 ? ' now' : ''}"><span>${i + 1}</span><i style="--w:${Math.max(7, Math.round(100 * n / max))}%">${n}</i></div>`).join('');
    $('shareBtn').hidden = !done;
    $('practiceBtn').hidden = !done;
    $('nextDaily').hidden = !(done && game.mode === 'daily');
    clearInterval(countdown);
    if (done && game.mode === 'daily') { tickCountdown(); countdown = setInterval(tickCountdown, 1000); }
    openDialog($('statsDlg'));
  }
  $('statsDlg').addEventListener('close', () => clearInterval(countdown));
  function tickCountdown() {
    const now = new Date(), next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const s = Math.max(0, Math.floor((next - now) / 1000));
    const p = n => String(n).padStart(2, '0');
    $('nextDaily').innerHTML = `Next daily word in <b>${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}</b>`;
    if (s === 0 && game.mode === 'daily') { $('statsDlg').close(); start('daily'); }
  }

  async function share() {
    const sq = { correct: settings.contrast ? '🟧' : '🟩', present: settings.contrast ? '🟦' : '🟨', absent: '⬜' };
    const head = `Asita's Word ${game.mode === 'daily' ? '#' + game.day : '(practice)'} ${game.status === 'won' ? game.guesses.length : 'X'}/${TRIES}${game.hard ? '*' : ''}`;
    const grid = game.guesses.map(g => evaluate(g, game.answer).map(r => sq[r]).join('')).join('\n');
    const text = `${head}\n\n${grid}\n${location.origin}/word`;
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
      toast('Result copied');
    } catch (e) {
      if (e && e.name === 'AbortError') return;
      toast('Couldn’t copy the result');
    }
  }

  /* ───────────── Settings ───────────── */

  function applySettings() {
    document.documentElement.classList.toggle('contrast', settings.contrast);
    $('hardMode').checked = settings.hard;
    $('contrastMode').checked = settings.contrast;
  }
  $('hardMode').addEventListener('change', e => {
    if (game.guesses.length && game.status === 'playing') {
      e.target.checked = settings.hard;
      toast('Hard mode can only be changed at the start of a word');
      return;
    }
    settings.hard = e.target.checked;
    store.set('word-settings', settings);
    if (game.status === 'playing') { game.hard = settings.hard; saveGame(); render(); }
  });
  $('contrastMode').addEventListener('change', e => {
    settings.contrast = e.target.checked;
    store.set('word-settings', settings);
    applySettings();
  });

  /* ───────────── Wiring ───────────── */

  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest && e.target.closest('input, dialog')) return;
    const k = e.key === 'Enter' ? 'Enter' : e.key === 'Backspace' ? 'Backspace' : e.key.toLowerCase();
    if (k === 'Enter' && e.target.closest && e.target.closest('button, a')) return; // Enter on a focused button presses that button
    if (k === 'Enter' || k === 'Backspace' || /^[a-z]$/.test(k)) { e.preventDefault(); press(k); }
  });
  document.querySelectorAll('input[name="mode"]').forEach(i => i.addEventListener('change', () => {
    store.set('word-mode', i.value);
    start(i.value);
    $('board').focus({ preventScroll: true });
  }));
  $('newBtn').addEventListener('click', () => { game = newPractice(); current = ''; saveGame(); render(); $('board').focus({ preventScroll: true }); });
  $('practiceBtn').addEventListener('click', () => {
    $('statsDlg').close();
    $('m-practice').checked = true;
    store.set('word-mode', 'practice');
    game = newPractice(); current = ''; saveGame(); render();
  });
  $('shareBtn').addEventListener('click', share);
  $('helpBtn').addEventListener('click', () => openDialog($('helpDlg')));
  $('statsBtn').addEventListener('click', openStats);
  $('settingsBtn').addEventListener('click', () => openDialog($('settingsDlg')));

  buildBoard();
  buildKeyboard();
  applySettings();
  const mode = store.get('word-mode', 'daily') === 'practice' ? 'practice' : 'daily';
  $('m-' + mode).checked = true;
  start(mode);
  if (!store.get('word-seen-help', false)) { store.set('word-seen-help', true); openDialog($('helpDlg')); }

  // exposed for automated tests only
  window.__word = { evaluate, get game() { return game; }, dailyWord, today };
})();
