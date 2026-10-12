// Home page: shows the player's best results, read from what each game saves on this device.
(() => {
  'use strict';
  const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } };
  const keys = prefix => { try { return Object.keys(localStorage).filter(k => k.startsWith(prefix)); } catch { return []; } };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  // Asita's Game saves its best score per setup as kims-best-<mode>-<level>-<rounds>-<kinds>.
  let top = null;
  for (const k of keys('kims-best-')) {
    const score = read(k);
    if (typeof score !== 'number' || !(score > 0)) continue;
    const [mode, level, rounds] = k.slice('kims-best-'.length).split('-');
    if (!top || score > top.score) top = { score, mode, level, rounds };
  }
  if (top) {
    const mode = top.mode === 'recall' ? 'Recall the tray' : "What's missing?";
    const level = /^custom/.test(top.level) ? 'Custom' : top.level.charAt(0).toUpperCase() + top.level.slice(1);
    document.getElementById('bestGame').innerHTML =
      `Your best: <b>${top.score} ${top.score === 1 ? 'point' : 'points'}</b> · ${esc(mode)}, ${esc(level)}, ${esc(top.rounds)} rounds`;
  }

  // Asita's Match saves the best time per board as match-best-<rows>x<cols>.
  const fmt = ms => { const t = Math.floor(ms / 100); return `${Math.floor(t / 600)}:${String(Math.floor(t / 10) % 60).padStart(2, '0')}.${t % 10}`; };
  const boards = [];
  for (const k of keys('match-best-')) {
    const m = /^match-best-(\d+)x(\d+)$/.exec(k), rec = read(k);
    if (m && rec && typeof rec.time === 'number' && rec.time > 0) boards.push({ r: +m[1], c: +m[2], time: rec.time });
  }
  if (boards.length) {
    boards.sort((a, b) => a.r * a.c - b.r * b.c);
    const shown = boards.slice(0, 3).map(b => `${b.r} × ${b.c} <b>${fmt(b.time)}</b>`).join(' · ');
    document.getElementById('bestMatch').innerHTML = `Your best ${boards.length === 1 ? 'time' : 'times'}: ${shown}${boards.length > 3 ? ' …' : ''}`;
  }
  // Asita's Word saves its statistics per mode; the daily word is the one with a streak.
  const w = read('word-stats-daily'), wp = read('word-stats-practice');
  const played = (w && w.played || 0) + (wp && wp.played || 0);
  if (played > 0) {
    const won = (w && w.won || 0) + (wp && wp.won || 0);
    const streak = w && w.streak > 0 ? ` · daily streak <b>${w.streak}</b>` : '';
    document.getElementById('bestWord').innerHTML =
      `Words found: <b>${won}</b> of ${played}${streak}`;
  }
  // Asita's Blocks saves its best game as blocks-best.
  const bb = read('blocks-best');
  if (bb && typeof bb.score === 'number' && bb.score > 0) {
    document.getElementById('bestBlocks').innerHTML =
      `Your best: <b>${bb.score.toLocaleString()} points</b> · ${+bb.lines || 0} rows · level ${+bb.level || 1}`;
  }
})();
