// Regenerates the terminal header, the contribution snake and the auto sections of README.md.
// Runs on GitHub Actions (.github/workflows/update.yml). It reads only what any visitor can
// already see: the public contribution calendar page and the list of public repositories.
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const USER = 'KimDaeHyun00';
const EXCLUDE = new Set(['KimDaeHyun00', 'KimDaeHyun00.github.io']);
const MAX_REPOS = 6;
const C = {
  bg: '#0A0A0B', bar: '#161B22', frame: '#30363D', text: '#E6EDF3', soft: '#B9BDC5',
  muted: '#8B9099', red: '#FF3B3B', redDeep: '#E5222B', green: '#22E39B',
};
const FONT = "'JetBrains Mono','SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace";

const fmt = (n) => Number(n).toLocaleString('en-US');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function computeStats(days) {
  const total = days.reduce((s, d) => s + d.count, 0);
  const active = days.filter((d) => d.count > 0).length;
  let longest = 0, run = 0;
  for (const d of days) { run = d.count > 0 ? run + 1 : 0; if (run > longest) longest = run; }
  let i = days.length - 1;
  if (i >= 0 && days[i].count === 0) i--;
  let current = 0;
  while (i >= 0 && days[i].count > 0) { current++; i--; }
  const best = days.reduce((b, d) => (d.count > b.count ? d : b), { count: 0, date: null });
  return { total, active, longest, current, best };
}

function shortDesc(desc) {
  return String(desc || '').split(/\s+[\u2014\u2013-]\s+/)[0].trim();
}

function renderHero({ name, login, since, stats, repos }) {
  const W = 860, padX = 30, lineH = 27, gapH = 13, top = 74;
  const lines = [];
  lines.push({ kind: 'cmd', text: 'whoami' });
  lines.push({ kind: 'out', segs: [[name, C.text, 700], ['  @' + login, C.soft], ['  \u00b7  on GitHub since ' + since, C.muted]] });
  lines.push({ kind: 'gap' });
  lines.push({ kind: 'cmd', text: 'gh contributions --last-year' });
  lines.push({ kind: 'out', bullet: true, segs: [[fmt(stats.total), C.red, 700], [' contributions', C.soft], ['  \u00b7  ', C.muted], [fmt(stats.active), C.text, 700], [' active days', C.soft]] });
  lines.push({ kind: 'out', bullet: true, segs: [['longest streak ', C.soft], [stats.longest + 'd', C.text, 700], ['  \u00b7  ', C.muted], ['best day ', C.soft], [fmt(stats.best.count), C.text, 700]] });
  if (repos.length) {
    lines.push({ kind: 'gap' });
    lines.push({ kind: 'cmd', text: 'ls ~/public' });
    for (const r of repos.slice(0, 3)) {
      const d = shortDesc(r.description);
      lines.push({ kind: 'out', segs: [[r.name + '/', C.text, 700], [r.language ? '  ' + r.language : '', C.muted], [d ? '  ' + d : '', C.soft]] });
    }
  }
  lines.push({ kind: 'gap' });
  lines.push({ kind: 'prompt' });

  let y = top, t = 0.35;
  const parts = [];
  for (const ln of lines) {
    if (ln.kind === 'gap') { y += gapH; continue; }
    if (ln.kind === 'cmd') {
      const dur = Math.max(0.45, ln.text.length * 0.045);
      parts.push('<text class="t type" x="' + padX + '" y="' + y + '" style="animation-duration:' + dur.toFixed(2) + 's;animation-delay:' + t.toFixed(2) + 's">' +
        '<tspan fill="' + C.green + '" font-weight="700">$</tspan><tspan fill="' + C.text + '"> ' + esc(ln.text) + '</tspan></text>');
      t += dur + 0.25;
    } else if (ln.kind === 'out') {
      const x = padX + (ln.bullet ? 20 : 0);
      const segs = ln.segs.filter((s) => s[0]).map((s) => '<tspan fill="' + s[1] + '"' + (s[2] ? ' font-weight="' + s[2] + '"' : '') + '>' + esc(s[0]) + '</tspan>').join('');
      parts.push('<g class="show" style="animation-delay:' + t.toFixed(2) + 's">' +
        (ln.bullet ? '<rect x="' + padX + '" y="' + (y - 11) + '" width="9" height="11" rx="1.5" fill="' + C.redDeep + '"/>' : '') +
        '<text class="t" x="' + x + '" y="' + y + '" xml:space="preserve">' + segs + '</text></g>');
      t += 0.18;
    } else if (ln.kind === 'prompt') {
      parts.push('<g class="show" style="animation-delay:' + t.toFixed(2) + 's"><text class="t" x="' + padX + '" y="' + y + '"><tspan fill="' + C.green + '" font-weight="700">$</tspan></text></g>' +
        '<rect class="cursor" x="' + (padX + 20) + '" y="' + (y - 14) + '" width="10" height="18" fill="' + C.red + '" style="animation-delay:' + t.toFixed(2) + 's,' + t.toFixed(2) + 's"/>');
    }
    y += lineH;
  }
  const H = y + 4;
  const title = login.toLowerCase() + '@github: ~';
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(name) + ' terminal">' +
    '<style>' +
    '.t{font-family:' + FONT + ';font-size:15px;white-space:pre}' +
    '.type{clip-path:inset(0 100% 0 0);animation-name:type;animation-timing-function:steps(24,end);animation-fill-mode:forwards}' +
    '.show{opacity:0;animation:show .3s ease-out forwards}' +
    '.cursor{opacity:0;animation:show .01s forwards,blink 1.1s step-end infinite}' +
    '@keyframes type{to{clip-path:inset(0 0 0 0)}}' +
    '@keyframes show{to{opacity:1}}' +
    '@keyframes blink{50%{opacity:0}}' +
    '@media (prefers-reduced-motion:reduce){.type,.show,.cursor{animation:none;clip-path:none;opacity:1}}' +
    '</style>' +
    '<rect x="1" y="1" width="' + (W - 2) + '" height="' + (H - 2) + '" rx="12" fill="' + C.bg + '" stroke="' + C.frame + '"/>' +
    '<path d="M1 13a12 12 0 0 1 12-12h' + (W - 26) + 'a12 12 0 0 1 12 12v25H1z" fill="' + C.bar + '"/>' +
    '<line x1="1" y1="38" x2="' + (W - 1) + '" y2="38" stroke="' + C.frame + '"/>' +
    '<circle cx="24" cy="19.5" r="6" fill="#FF5F57"/><circle cx="44" cy="19.5" r="6" fill="#FEBC2E"/><circle cx="64" cy="19.5" r="6" fill="#28C840"/>' +
    '<text x="' + W / 2 + '" y="24" text-anchor="middle" font-family="' + FONT.replace(/'/g, '&apos;') + '" font-size="13" fill="' + C.muted + '">' + esc(title) + '</text>' +
    parts.join('') +
    '</svg>';
}

function badge(label, color) {
  return 'https://img.shields.io/badge/-' + encodeURIComponent(label.replace(/-/g, '--').replace(/_/g, '__')) + '-' + color + '?style=flat';
}

function renderRepos(repos) {
  if (!repos.length) return '<p align="center"><sub>public repos will show up here automatically</sub></p>';
  const cell = (r, w) => {
    const bits = ['<a href="' + r.url + '"><b>' + esc(r.name) + '</b></a>'];
    if (r.language) bits.push('<img src="' + badge(r.language, '161B22') + '" alt="' + esc(r.language) + '" />');
    if (r.stars > 0) bits.push('<img src="' + badge('\u2605 ' + fmt(r.stars), 'E5222B') + '" alt="stars" />');
    return '    <td width="' + w + '" valign="top">\n      ' + bits.join('&nbsp;') + '<br/>\n      <sub>' + esc(r.description || '') + '</sub>\n    </td>';
  };
  const rows = [];
  const w = repos.length === 1 ? '100%' : '50%';
  for (let i = 0; i < repos.length; i += 2) {
    rows.push('  <tr>\n' + repos.slice(i, i + 2).map((r) => cell(r, w)).join('\n') + '\n  </tr>');
  }
  return '<table>\n' + rows.join('\n') + '\n</table>';
}

function renderSync(dateStr) {
  return '<p align="center"><sub>terminal, snake &amp; repo list refresh every 6h via GitHub Actions \u00b7 last update: <code>' + dateStr + '</code></sub></p>';
}

function replaceBetween(md, key, body) {
  const re = new RegExp('(<!-- ' + key + ':START -->)[\\s\\S]*?(<!-- ' + key + ':END -->)');
  return md.replace(re, (_, a, b) => a + '\n' + body + '\n' + b);
}

const GLYPHS = {
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
};
const SHADES = ['#7A1D20', '#B3262B', '#E5222B', '#FF3B3B'];
function renderMonogram(text, x0, y0, startT) {
  const cell = 12, step = 15;
  const cols = [];
  text.split('').forEach((ch, i) => {
    const g = GLYPHS[ch];
    for (let c = 0; c < 5; c++) cols.push(g.map((row) => row[c] === '1'));
    if (i < text.length - 1) cols.push(new Array(7).fill(false));
  });
  const out = [];
  cols.forEach((col, ci) => {
    col.forEach((on, ri) => {
      const x = x0 + ci * step, y = y0 + ri * step;
      const shade = SHADES[(ci * 3 + ri * 5) % SHADES.length];
      out.push('<rect x="' + x + '" y="' + y + '" width="' + cell + '" height="' + cell + '" rx="2.5" fill="#1A1D23"/>');
      if (on) out.push('<rect class="pix" x="' + x + '" y="' + y + '" width="' + cell + '" height="' + cell + '" rx="2.5" fill="' + shade + '" style="animation-delay:' + (startT + ci * 0.07 + ri * 0.02).toFixed(2) + 's"/>');
    });
  });
  return { svg: out.join(''), width: cols.length * step - (step - cell), height: 7 * step - (step - cell) };
}

function renderHeroFull(opts) {
  let svg = renderHero(opts);
  const W = 860;
  const H = Number(svg.match(/height="(\d+(?:\.\d+)?)"/)[1]);
  const m = renderMonogram('DH', 0, 0, 0);
  const x0 = W - 44 - m.width;
  const y0 = Math.round(38 + (H - 38 - m.height) / 2);
  const mono = renderMonogram('DH', x0, y0, 0.4);
  svg = svg.replace('</style>', '.pix{opacity:0;animation:show .25s ease-out forwards}@media (prefers-reduced-motion:reduce){.pix{animation:none;opacity:1}}</style>');
  return svg.replace('</svg>', '<g>' + mono.svg + '</g></svg>');
}

const PALETTES = {
  dark: { empty: '#161B22', levels: ['#161B22', '#0E4429', '#006D32', '#26A641', '#39D353'], snake: '#FF3B3B' },
  light: { empty: '#EBEDF0', levels: ['#EBEDF0', '#9BE9A8', '#40C463', '#30A14E', '#216E39'], snake: '#E5222B' },
};

function gridOf(days) {
  const offset = new Date(days[0].date + 'T00:00:00Z').getUTCDay();
  return days.map((d, i) => ({ ...d, col: Math.floor((i + offset) / 7), row: (i + offset) % 7 }));
}

function snakePath(cells) {
  const key = (c, r) => c + ':' + r;
  const targets = cells.filter((c) => c.level > 0);
  const cols = new Map();
  for (const t of targets) { if (!cols.has(t.col)) cols.set(t.col, []); cols.get(t.col).push(t); }
  let pos = { col: cells[0].col, row: cells[0].row };
  const steps = [{ ...pos }];
  const eatenAt = new Map();
  const want = new Set(targets.map((t) => key(t.col, t.row)));
  const tryEat = () => {
    const k = key(pos.col, pos.row);
    if (want.has(k) && !eatenAt.has(k)) eatenAt.set(k, steps.length - 1);
  };
  tryEat();
  for (const col of [...cols.keys()].sort((a, b) => a - b)) {
    const rows = cols.get(col).map((t) => t.row).sort((a, b) => a - b);
    const down = Math.abs(pos.row - rows[0]) <= Math.abs(pos.row - rows[rows.length - 1]);
    for (const row of down ? rows : rows.slice().reverse()) {
      while (pos.col !== col) { pos = { col: pos.col + Math.sign(col - pos.col), row: pos.row }; steps.push({ ...pos }); tryEat(); }
      while (pos.row !== row) { pos = { col: pos.col, row: pos.row + Math.sign(row - pos.row) }; steps.push({ ...pos }); tryEat(); }
    }
  }
  return { steps, eatenAt };
}

function renderSnake(days, theme) {
  const P = PALETTES[theme];
  const cells = gridOf(days);
  const { steps, eatenAt } = snakePath(cells);
  const STEP = 16, CELL = 12, PAD = 16;
  const cols = Math.max(...cells.map((c) => c.col)) + 1;
  const W = PAD * 2 + cols * STEP - (STEP - CELL);
  const H = PAD * 2 + 7 * STEP - (STEP - CELL);
  const moves = Math.max(1, steps.length - 1);
  const stepDur = Math.min(0.09, Math.max(0.03, 20 / moves));
  const Tmove = moves * stepDur;
  const T = Tmove + 2.2;
  const cx = (c) => PAD + c * STEP + CELL / 2;
  const cy = (r) => PAD + r * STEP + CELL / 2;
  const css = [], rects = [];
  cells.forEach((c, i) => {
    const x = PAD + c.col * STEP, y = PAD + c.row * STEP;
    const k = c.col + ':' + c.row;
    if (c.level > 0 && eatenAt.has(k)) {
      const p = (eatenAt.get(k) * stepDur) / T * 100;
      const col = P.levels[c.level];
      css.push('@keyframes k' + i + '{0%,' + p.toFixed(2) + '%{fill:' + col + '}' + (p + 0.05).toFixed(2) + '%,99.7%{fill:' + P.empty + '}100%{fill:' + col + '}}' +
        '.k' + i + '{animation:k' + i + ' ' + T.toFixed(2) + 's linear infinite}');
      rects.push('<rect class="k' + i + '" x="' + x + '" y="' + y + '" width="' + CELL + '" height="' + CELL + '" rx="2.5" fill="' + col + '"/>');
    } else {
      rects.push('<rect x="' + x + '" y="' + y + '" width="' + CELL + '" height="' + CELL + '" rx="2.5" fill="' + P.empty + '"/>');
    }
  });
  const d = 'M' + steps.map((s) => cx(s.col) + ' ' + cy(s.row)).join('L');
  const segs = [];
  const N = 5;
  for (let k = N - 1; k >= 0; k--) {
    const size = CELL - k * 1.5;
    const lag = k * stepDur;
    const kt = ['0', (lag / T).toFixed(4), ((Tmove + lag) / T).toFixed(4), '1'].join(';');
    segs.push('<rect x="' + (-size / 2) + '" y="' + (-size / 2) + '" width="' + size + '" height="' + size + '" rx="' + (k === 0 ? 4 : 3) + '" fill="' + P.snake + '" opacity="' + (1 - k * 0.13).toFixed(2) + '">' +
      '<animateMotion dur="' + T.toFixed(2) + 's" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="' + kt + '"><mpath href="#sp"/></animateMotion></rect>');
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="contribution snake">' +
    '<style>' + css.join('') + '</style>' +
    '<path id="sp" d="' + d + '" fill="none" stroke="none"/>' +
    rects.join('') + segs.join('') + '</svg>';
}

function parseCalendarHtml(html) {
  const idToDay = new Map();
  for (const m of html.matchAll(/<td\b[^>]*>/g)) {
    const tag = m[0];
    const date = (tag.match(/data-date="(\d{4}-\d{2}-\d{2})"/) || [])[1];
    const id = (tag.match(/\bid="([^"]+)"/) || [])[1];
    const level = Number((tag.match(/data-level="(\d)"/) || [])[1] || 0);
    if (date && id) idToDay.set(id, { date, level, count: 0 });
  }
  for (const m of html.matchAll(/<tool-tip\b[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const day = idToDay.get(m[1]);
    if (!day) continue;
    const n = m[2].trim().match(/^([\d,]+)\s+contribution/);
    day.count = n ? Number(n[1].replace(/,/g, '')) : 0;
  }
  const days = [...idToDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  const totalM = html.match(/([\d,]+)\s+contributions?\s+in the last year/);
  const total = totalM ? Number(totalM[1].replace(/,/g, '')) : days.reduce((s, d) => s + d.count, 0);
  return { days, total };
}

const QUERY = `query($login: String!) {
  user(login: $login) {
    name
    login
    createdAt
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel } }
      }
    }
    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false, orderBy: {field: PUSHED_AT, direction: DESC}) {
      nodes { name description url stargazerCount pushedAt primaryLanguage { name } }
    }
  }
}`;
const LEVEL = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };

async function gql(query, variables) {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: 'bearer ' + process.env.GH_TOKEN,
      'Content-Type': 'application/json',
      'User-Agent': USER + '-profile-readme',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error('GraphQL error: ' + JSON.stringify(json.errors || json));
  return json.data;
}

// The public calendar page is exactly what visitors see on the profile (private repos only
// appear there as anonymized daily counts, and only because Private contributions is on).
async function publicCalendar() {
  const res = await fetch('https://github.com/users/' + USER + '/contributions', { headers: { 'User-Agent': USER + '-profile-readme' } });
  if (!res.ok) throw new Error('calendar HTTP ' + res.status);
  const cal = parseCalendarHtml(await res.text());
  if (cal.days.length < 300) throw new Error('calendar parse failed: ' + cal.days.length + ' days');
  return cal;
}

const hash8 = (s) => createHash('sha1').update(s).digest('hex').slice(0, 8);
function readOr(file, fallback) {
  try { return readFileSync(file, 'utf8'); } catch { return fallback; }
}

async function main() {
  const { user } = await gql(QUERY, { login: USER });
  let cal;
  try {
    cal = await publicCalendar();
    console.log('calendar: public profile page,', cal.total, 'contributions');
  } catch (e) {
    console.log('calendar: falling back to GraphQL:', e.message);
    const g = user.contributionsCollection.contributionCalendar;
    const days = g.weeks
      .flatMap((w) => w.contributionDays)
      .map((d) => ({ date: d.date, count: d.contributionCount, level: LEVEL[d.contributionLevel] || 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));
    cal = { days, total: g.totalContributions };
  }
  const stats = computeStats(cal.days);
  stats.total = cal.total;
  const repos = user.repositories.nodes
    .filter((r) => !EXCLUDE.has(r.name))
    .sort((a, b) => b.stargazerCount - a.stargazerCount || b.pushedAt.localeCompare(a.pushedAt))
    .slice(0, MAX_REPOS)
    .map((r) => ({
      name: r.name,
      url: r.url,
      description: r.description || '',
      stars: r.stargazerCount,
      language: r.primaryLanguage ? r.primaryLanguage.name : '',
    }));

  const files = {
    'assets/hero.svg': renderHeroFull({ name: user.name || USER, login: user.login, since: user.createdAt.slice(0, 4), stats, repos }),
    'assets/snake-dark.svg': renderSnake(cal.days, 'dark'),
    'assets/snake-light.svg': renderSnake(cal.days, 'light'),
  };
  const oldMd = readFileSync('README.md', 'utf8');
  let md = replaceBetween(oldMd, 'REPOS', renderRepos(repos));
  for (const [file, svg] of Object.entries(files)) {
    const base = file.split('/').pop();
    md = md.replace(new RegExp(base.replace('.', '\\.') + '\\?v=[0-9a-f]+', 'g'), base + '?v=' + hash8(svg));
  }
  const changed = md !== oldMd || Object.entries(files).some(([f, s]) => readOr(f, '') !== s);
  if (!changed) {
    console.log('no changes', JSON.stringify(stats));
    return;
  }
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  md = replaceBetween(md, 'SYNC', renderSync(today));
  for (const [f, s] of Object.entries(files)) writeFileSync(f, s);
  writeFileSync('README.md', md);
  console.log('updated', JSON.stringify(stats), repos.map((r) => r.name).join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
