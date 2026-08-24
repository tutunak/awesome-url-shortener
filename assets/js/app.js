// Client-side filtering over the cards Hugo rendered from README.md, plus a
// theme toggle. No dependencies, no build-time data duplication.

const q = document.getElementById('q');
const clear = document.getElementById('clear');
const count = document.getElementById('count');
const empty = document.getElementById('empty');
const reset = document.getElementById('reset');
const sections = [...document.querySelectorAll('[data-section]')];

const cards = [...document.querySelectorAll('[data-card]')].map((el) => ({
  el,
  haystack: [el.dataset.name, el.dataset.host, el.dataset.desc].join(' '),
}));

const filter = (raw) => {
  const terms = raw.toLowerCase().split(/\s+/).filter(Boolean);
  let shown = 0;

  for (const card of cards) {
    const hit = terms.every((t) => card.haystack.includes(t));
    card.el.hidden = !hit;
    if (hit) shown += 1;
  }

  for (const section of sections) {
    const visible = section.querySelectorAll('[data-card]:not([hidden])').length;
    section.hidden = visible === 0;
    const tally = section.querySelector('[data-tally]');
    if (tally) {
      const total = section.querySelectorAll('[data-card]').length;
      tally.textContent = terms.length && visible !== total ? `${visible}/${total}` : total;
    }
  }

  if (empty) empty.hidden = shown !== 0;
  if (clear) clear.hidden = raw.length === 0;
  if (count) count.textContent = terms.length ? `${shown} of ${cards.length}` : '';

  if (history.replaceState) {
    const url = new URL(location.href);
    if (raw) url.searchParams.set('q', raw);
    else url.searchParams.delete('q');
    history.replaceState(null, '', url);
  }
};

const setQuery = (value) => {
  q.value = value;
  filter(value);
};

if (q) {
  q.addEventListener('input', () => filter(q.value));
  clear?.addEventListener('click', () => { setQuery(''); q.focus(); });
  reset?.addEventListener('click', () => { setQuery(''); q.focus(); });

  // "/" jumps to search, Escape clears it.
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== q) {
      e.preventDefault();
      q.focus();
      q.select();
    } else if (e.key === 'Escape' && document.activeElement === q) {
      setQuery('');
    }
  });

  // Shareable searches: /?q=analytics
  const initial = new URL(location.href).searchParams.get('q');
  if (initial) setQuery(initial);
}

// Theme: auto -> light -> dark, remembered per browser.
const root = document.documentElement;
const themeBtn = document.getElementById('theme');
const labels = {
  auto: 'Theme: follows your system',
  light: 'Theme: light',
  dark: 'Theme: dark',
};

const applyTheme = (mode) => {
  if (mode === 'auto') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', mode);
  if (themeBtn) themeBtn.title = labels[mode];
};

let stored = 'auto';
try {
  stored = localStorage.getItem('theme') || 'auto';
} catch (_) { /* private mode — stay on auto */ }
applyTheme(stored);

themeBtn?.addEventListener('click', () => {
  const order = ['auto', 'light', 'dark'];
  const next = order[(order.indexOf(stored) + 1) % order.length];
  stored = next;
  applyTheme(next);
  try {
    localStorage.setItem('theme', next);
  } catch (_) { /* ignore */ }
});
