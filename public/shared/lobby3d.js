/* Lobby screen: 3D-style icons and the moving 3D scene at the top of the setup screen.
   Each icon is an SVG <symbol> lit from the top left: gradients for form, a highlight for gloss and a
   soft contact shadow underneath. The sprite is added to the page once; an icon is used with
   <svg class="ico3d"><use href="#i3-NAME"/></svg>. Set --i3sh: 0 on an icon to hide its shadow. */
(() => {
  'use strict';

  const pts = a => a.map(p => p.map(n => +n.toFixed(2)).join(',')).join(' ');
  const shadow = (cx = 32, cy = 58, rx = 20) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${(rx * 0.2).toFixed(1)}" fill="url(#i3g-shadow)" style="opacity:var(--i3sh,1)"/>`;

  // Isometric cube: (x, y) is the top corner, s the edge length; colours for top, left and right faces.
  function cube(x, y, s, [top, left, right]) {
    const h = s / 2;
    return `<polygon points="${pts([[x, y], [x + s, y + h], [x, y + s], [x - s, y + h]])}" fill="${top}"/>` +
      `<polygon points="${pts([[x - s, y + h], [x, y + s], [x, y + 2 * s], [x - s, y + s + h]])}" fill="${left}"/>` +
      `<polygon points="${pts([[x, y + s], [x + s, y + h], [x + s, y + s + h], [x, y + 2 * s]])}" fill="${right}"/>` +
      `<polyline points="${pts([[x - s, y + h], [x, y + s], [x + s, y + h]])}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1"/>`;
  }
  const GREEN = ['#9ff0c0', '#34b874', '#1f8452'];
  const AMBER = ['#ffe08f', '#f2a91f', '#bf7a0d'];
  const AMBER_DARK = ['#f5c96a', '#d9900f', '#a3660a'];
  const RED   = ['#ffb3a3', '#e8573f', '#ad3422'];
  const BLUE  = ['#9fd3ff', '#3a8fe0', '#2160a6'];

  // Gear outline with n teeth, used for "Custom".
  function gear(cx, cy, n, rOut, rIn) {
    const p = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, w = Math.PI / n;
      for (const [ang, r] of [[a - w * 0.62, rIn], [a - w * 0.38, rOut], [a + w * 0.38, rOut], [a + w * 0.62, rIn]]) {
        p.push([cx + r * Math.cos(ang), cy + r * Math.sin(ang)]);
      }
    }
    return `M${p.map(q => q.map(n => n.toFixed(2)).join(' ')).join(' L')}Z`;
  }

  // Isometric game board with n × n face-down cards and a couple turned over (board size icons).
  function board(n) {
    const T = [32, 12], R = [59, 25.5], B = [32, 39], L = [5, 25.5], d = 6;
    const u = [(R[0] - T[0]) / n, (R[1] - T[1]) / n], v = [(L[0] - T[0]) / n, (L[1] - T[1]) / n];
    const at = (i, j) => [T[0] + i * u[0] + j * v[0], T[1] + i * u[1] + j * v[1]];
    const g = 0.14; // gap between cards, as a share of a cell
    let tiles = '';
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const c = (a, b) => at(i + a, j + b);
      const up = (i === 1 && j === n - 2) || (i === n - 2 && j === 1);
      const odd = n % 2 === 1 && i === (n - 1) / 2 && j === (n - 1) / 2;
      const fill = odd ? 'none' : up ? 'url(#i3g-cardface)' : 'url(#i3g-cardback)';
      tiles += `<polygon points="${pts([c(g, g), c(1 - g, g), c(1 - g, 1 - g), c(g, 1 - g)])}" fill="${fill}"` +
        (odd ? ' stroke="#c49030" stroke-width=".7" stroke-dasharray="1.2 1"' : '') + '/>';
    }
    return shadow(32, 55, 25) +
      `<polygon points="${pts([L, B, [B[0], B[1] + d], [L[0], L[1] + d]])}" fill="#b58a45"/>` +
      `<polygon points="${pts([B, R, [R[0], R[1] + d], [B[0], B[1] + d]])}" fill="#8f6a2e"/>` +
      `<polygon points="${pts([T, R, B, L])}" fill="url(#i3g-wood)"/>` + tiles +
      `<polyline points="${pts([L, B, R])}" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="1"/>`;
  }

  // Rounded 3D tile with a character on it (numbers and letters).
  const charTile = (ch, grad, side, font) =>
    shadow(32, 58, 21) +
    `<rect x="10" y="15" width="44" height="40" rx="11" fill="${side}"/>` +
    `<rect x="10" y="9" width="44" height="40" rx="11" fill="url(#${grad})"/>` +
    `<rect x="15" y="12" width="34" height="11" rx="5.5" fill="#fff" opacity=".28"/>` +
    `<text x="32" y="${font === 'serif' ? 42 : 41}" text-anchor="middle" font-size="${font === 'serif' ? 31 : 28}" font-weight="700" ` +
    `font-family="${font === 'serif' ? "'Cormorant Garamond', Georgia, serif" : "'DM Sans', Arial, sans-serif"}" fill="#000" opacity=".22" transform="translate(1 2)">${ch}</text>` +
    `<text x="32" y="${font === 'serif' ? 42 : 41}" text-anchor="middle" font-size="${font === 'serif' ? 31 : 28}" font-weight="700" ` +
    `font-family="${font === 'serif' ? "'Cormorant Garamond', Georgia, serif" : "'DM Sans', Arial, sans-serif"}" fill="#fff">${ch}</text>`;

  const ICONS = {
    // ── object kinds ──
    apple: shadow() +
      `<path d="M32 19c-6-4.5-17-3.5-20.5 7-3.4 11 3 26 12 29.5 3 1.2 5.5.2 8.5-1 3 1.2 5.5 2.2 8.5 1 9-3.5 15.4-18.5 12-29.5C49 15.5 38 14.5 32 19z" fill="url(#i3g-apple)"/>` +
      `<path d="M32 19c-1 9 1 26 0 35" stroke="#000" stroke-opacity=".08" stroke-width="5" fill="none"/>` +
      `<ellipse cx="21.5" cy="29" rx="4.6" ry="7.5" fill="#fff" opacity=".5" transform="rotate(-22 21.5 29)"/>` +
      `<path d="M32 20c-.4-5 .8-8.6 3.6-11.5" stroke="#6b3e1d" stroke-width="3" stroke-linecap="round" fill="none"/>` +
      `<path d="M35.5 12.5c3.5-6.5 11.5-7.2 15.5-4-3 5.6-10.5 8-15.5 4z" fill="url(#i3g-leaf)"/>`,

    shapes: shadow(33, 58, 23) +
      cube(24, 17, 13, BLUE) +
      `<circle cx="44" cy="42" r="12" fill="url(#i3g-ball)"/>` +
      `<ellipse cx="40" cy="37" rx="4" ry="2.8" fill="#fff" opacity=".7" transform="rotate(-30 40 37)"/>`,

    number: charTile('7', 'i3g-teal', '#11725f', 'sans'),
    letter: charTile('A', 'i3g-coral', '#a8401f', 'serif'),

    cards: shadow(32, 58, 21) +
      `<g transform="rotate(-14 26 36)"><rect x="12.5" y="13.5" width="26" height="37" rx="4" fill="#0f1420"/>` +
      `<rect x="11" y="12" width="26" height="37" rx="4" fill="url(#i3g-navy)"/>` +
      `<rect x="14" y="15" width="20" height="31" rx="2.5" fill="none" stroke="#c49030" stroke-width="1.2"/>` +
      `<path d="M14 15l20 31M34 15L14 46" stroke="#c49030" stroke-opacity=".45" stroke-width="1"/></g>` +
      `<g transform="rotate(10 38 36)"><rect x="27.5" y="13.5" width="26" height="37" rx="4" fill="#c9c2b4"/>` +
      `<rect x="26" y="12" width="26" height="37" rx="4" fill="url(#i3g-paper)"/>` +
      `<text x="30" y="22" font-size="8" font-weight="700" font-family="'DM Sans', Arial, sans-serif" fill="#c0392b">A</text>` +
      `<path d="M39 42c-5-3.6-8-6.4-8-9.6 0-2.2 1.7-3.8 3.8-3.8 1.8 0 3.2 1 4.2 2.4 1-1.4 2.4-2.4 4.2-2.4 2.1 0 3.8 1.6 3.8 3.8 0 3.2-3 6-8 9.6z" fill="url(#i3g-heart)"/>` +
      `<ellipse cx="35.6" cy="32.5" rx="1.6" ry="1" fill="#fff" opacity=".6"/></g>`,

    // ── Asita's Game: modes ──
    magnifier: shadow(32, 58, 19) +
      `<path d="M37.5 37.5l13 13" stroke="#1c2233" stroke-width="9" stroke-linecap="round"/>` +
      `<path d="M37.5 37.5l13 13" stroke="url(#i3g-handle)" stroke-width="7" stroke-linecap="round"/>` +
      `<circle cx="27" cy="27" r="16.5" fill="url(#i3g-glass)"/>` +
      `<circle cx="27" cy="27" r="16.5" fill="none" stroke="url(#i3g-rim)" stroke-width="4.5"/>` +
      `<path d="M17.5 24a10.5 10.5 0 0 1 9-9" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".85"/>` +
      `<circle cx="31" cy="31" r="2" fill="#fff" opacity=".5"/>`,

    bulb: shadow(32, 59, 15) +
      `<circle cx="32" cy="25" r="20" fill="url(#i3g-glow)"/>` +
      `<path d="M32 7c-9.4 0-16 7-16 15.6 0 6 3.2 9.6 5.8 12.6 1.8 2 2.8 4 2.8 6.4h14.8c0-2.4 1-4.4 2.8-6.4 2.6-3 5.8-6.6 5.8-12.6C48 14 41.4 7 32 7z" fill="url(#i3g-bulb)"/>` +
      `<path d="M28 41.6c0-6 1.5-10 4-14 2.5 4 4 8 4 14" stroke="#c77700" stroke-width="1.6" fill="none" opacity=".7"/>` +
      `<ellipse cx="25" cy="17" rx="3.6" ry="6" fill="#fff" opacity=".65" transform="rotate(30 25 17)"/>` +
      `<rect x="24" y="41.6" width="16" height="11" rx="2.5" fill="url(#i3g-metal)"/>` +
      `<path d="M24.5 45.4h15M24.5 49h15" stroke="#6f7787" stroke-width="1.4"/>` +
      `<path d="M28 52.6h8l-1.6 3h-4.8z" fill="#4a5162"/>`,

    // ── difficulty ──
    easy: shadow(32, 57, 17) + cube(32, 15, 15, GREEN),
    medium: shadow(32, 58, 16) + cube(32, 29, 12, AMBER_DARK) + cube(32, 15, 12, AMBER) +
      `<polyline points="20,35 32,41 44,35" fill="none" stroke="#6b3f05" stroke-opacity=".45" stroke-width="1.2"/>`,
    hard: shadow(32, 58, 24) + cube(21.5, 30, 10.5, RED) + cube(42.5, 30, 10.5, RED) + cube(32, 19.5, 10.5, RED),

    custom: shadow(32, 58, 19) +
      `<path d="${gear(33.5, 34.5, 9, 21, 16)}" fill="#6b5320"/>` +
      `<path d="${gear(32, 31, 9, 21, 16)}" fill="url(#i3g-gold)"/>` +
      `<circle cx="32" cy="31" r="8.5" fill="#6b5320"/>` +
      `<circle cx="32" cy="31" r="7" fill="url(#i3g-hole)"/>` +
      `<path d="M20.7 26.9a12 12 0 0 1 7.2-7.2" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".6"/>`,

    // ── Asita's Match ──
    stopwatch: shadow(32, 59, 18) +
      `<rect x="30.5" y="9" width="3" height="4" fill="#7a8293"/>` +
      `<rect x="28" y="4.5" width="8" height="6" rx="2" fill="url(#i3g-metal)"/>` +
      `<path d="M44 15.5l4.5-4.5" stroke="#7a8293" stroke-width="4" stroke-linecap="round"/>` +
      `<circle cx="32.8" cy="34.8" r="21" fill="#7b8292"/>` +
      `<circle cx="32" cy="33" r="21" fill="url(#i3g-metal)"/>` +
      `<circle cx="32" cy="33" r="16.5" fill="url(#i3g-paper)"/>` +
      `<path d="M32 19.5v3M45.5 33h-3M32 46.5v-3M18.5 33h3" stroke="#1c2233" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M32 33l8.5-7.5" stroke="#d63c2f" stroke-width="2.6" stroke-linecap="round"/>` +
      `<circle cx="32" cy="33" r="2.6" fill="#1c2233"/>` +
      `<path d="M19 26a14 14 0 0 1 9-8" stroke="#fff" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".75"/>`,
    star: shadow(32, 58, 17) +
      `<polygon points="33.5,10.5 39.6,24.4 54.7,25.8 43.3,35.8 46.6,50.6 33.5,42.9 20.4,50.6 23.7,35.8 12.3,25.8 27.4,24.4" fill="#a8740c"/>` +
      `<polygon points="32,8 38.1,21.9 53.2,23.3 41.8,33.3 45.1,48.1 32,40.4 18.9,48.1 22.2,33.3 10.8,23.3 25.9,21.9" fill="url(#i3g-gold)"/>` +
      `<path d="M32 13l4.4 10.2" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>`,
    board4: board(4), board5: board(5), board6: board(6), board7: board(7), board8: board(8),
  };

  const lin = (id, stops, x2 = 0, y2 = 1) =>
    `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
  const rad = (id, stops, cx = 0.35, cy = 0.3, r = 0.75) =>
    `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;

  const DEFS = [
    rad('i3g-shadow', [[0, '#000', 0.32], [1, '#000', 0]], 0.5, 0.5, 0.5),
    rad('i3g-apple', [[0, '#ff9c8f'], [0.45, '#e8402f'], [1, '#8f1913']]),
    lin('i3g-leaf', [[0, '#8fe07a'], [1, '#2f8f3a']], 1, 1),
    rad('i3g-ball', [[0, '#fff3b0'], [0.5, '#f5c518'], [1, '#b8860b']]),
    lin('i3g-teal', [[0, '#5fe0c2'], [1, '#169a7e']]),
    lin('i3g-coral', [[0, '#ffa27f'], [1, '#e0532c']]),
    lin('i3g-navy', [[0, '#3a4766'], [1, '#1c2233']]),
    lin('i3g-paper', [[0, '#ffffff'], [1, '#e9e3d6']]),
    rad('i3g-heart', [[0, '#ff8a80'], [1, '#c62828']], 0.35, 0.3, 0.8),
    lin('i3g-handle', [[0, '#5a6785'], [1, '#232b40']], 1, 1),
    rad('i3g-glass', [[0, '#ffffff', 0.95], [0.6, '#bfe6ff', 0.75], [1, '#7cc4ff', 0.6]], 0.35, 0.3, 0.8),
    lin('i3g-rim', [[0, '#ffe08f'], [0.5, '#c49030'], [1, '#7a5512']], 1, 1),
    rad('i3g-glow', [[0, '#ffe680', 0.55], [1, '#ffe680', 0]], 0.5, 0.5, 0.5),
    rad('i3g-bulb', [[0, '#fffbe0'], [0.45, '#ffd84a'], [1, '#e89a0c']], 0.4, 0.3, 0.8),
    lin('i3g-metal', [[0, '#eef1f6'], [0.5, '#aab2c0'], [1, '#6f7787']], 1, 1),
    lin('i3g-gold', [[0, '#ffe39a'], [0.55, '#e0a83a'], [1, '#a8740c']], 1, 1),
    rad('i3g-hole', [[0, '#3b2d10'], [1, '#1c1608']], 0.6, 0.65, 0.7),
    lin('i3g-wood', [[0, '#f6e7c8'], [1, '#d9b778']], 1, 1),
    lin('i3g-cardback', [[0, '#3a4766'], [1, '#1c2233']], 1, 1),
    lin('i3g-cardface', [[0, '#ffffff'], [1, '#f1d48e']], 1, 1),
  ].join('');

  const sprite =
    `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">` +
    `<defs>${DEFS}</defs>` +
    Object.entries(ICONS).map(([id, body]) => `<symbol id="i3-${id}" viewBox="0 0 64 64">${body}</symbol>`).join('') +
    `</svg>`;
  document.body.insertAdjacentHTML('afterbegin', sprite);

  window.icon3d = (name, cls = '') => `<svg class="ico3d${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#i3-${name}"></use></svg>`;

  // The 3D scene tilts a little towards a mouse pointer. Touch screens and reduced motion keep it still
  // (it still sways gently on its own unless reduced motion is on).
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0;
  window.addEventListener('pointermove', e => {
    if (!fine.matches || still.matches || raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      for (const scene of document.querySelectorAll('.hero3d .scene')) {
        const r = scene.getBoundingClientRect();
        if (!r.width) continue; // hidden
        const dx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)));
        const dy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
        scene.style.setProperty('--ry', (dx * 9).toFixed(2) + 'deg');
        scene.style.setProperty('--rx', Math.max(-2, Math.min(4, -dy * 4)).toFixed(2) + 'deg');
      }
    });
  }, { passive: true });
  const level = () => document.querySelectorAll('.hero3d .scene').forEach(s => { s.style.setProperty('--rx', '0deg'); s.style.setProperty('--ry', '0deg'); });
  document.documentElement.addEventListener('pointerleave', level);
  window.addEventListener('blur', level);

  // Save battery: a scene that is scrolled out of view stops animating.
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => e.target.classList.toggle('idle', !e.isIntersecting)));
    document.querySelectorAll('.hero3d').forEach(h => io.observe(h));
  }

  // Keyboard: bring a tile into view when its (visually hidden) option gets focus.
  document.addEventListener('focusin', e => {
    const label = e.target.matches && e.target.matches('.seg.tiles input') && e.target.labels && e.target.labels[0];
    if (label) label.scrollIntoView({ block: 'nearest' });
  });
})();
