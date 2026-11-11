// Light/dark toggle. The pre-paint snippet in Head.astro sets data-theme before first paint;
// this script keeps it in sync with the toggle and with the system setting.
const KEY = 'el-theme';
const root = document.documentElement;
const system = matchMedia('(prefers-color-scheme: dark)');

function stored(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

function apply(theme: 'light' | 'dark'): void {
  root.dataset.theme = theme;
  for (const button of document.querySelectorAll('[data-el-theme-toggle]')) {
    button.setAttribute('aria-pressed', String(theme === 'dark'));
  }
}

system.addEventListener('change', () => {
  if (!stored()) apply(system.matches ? 'dark' : 'light');
});

document.addEventListener('click', (event) => {
  if (!(event.target as Element).closest?.('[data-el-theme-toggle]')) return;
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem(KEY, next);
  } catch {}
  apply(next);
});

apply(root.dataset.theme === 'dark' ? 'dark' : 'light');
