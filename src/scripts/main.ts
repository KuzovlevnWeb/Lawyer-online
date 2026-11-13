// Общие интерактивные эффекты сайта. Лёгкие, без библиотек.
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Появление при скролле ---------- */
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        io.unobserve(e.target);
      }
    }
  },
  { rootMargin: '0px 0px -10% 0px', threshold: 0.12 },
);
document.querySelectorAll('.reveal, [data-reveal], .iso-reveal').forEach((el) => io.observe(el));

/* ---------- Шапка: прозрачная над тёмным героем, «стекло» при прокрутке ---------- */
const header = document.querySelector<HTMLElement>('.site-header');
const mobileBar = document.querySelector<HTMLElement>('[data-mobile-bar]');
const hero = document.querySelector<HTMLElement>('[data-hero]');
let ticking = false;
function onScroll() {
  const y = window.scrollY;
  const heroH = hero ? hero.offsetHeight - 80 : 200;
  header?.setAttribute('data-solid', y > heroH ? 'true' : y > 30 ? 'dark' : 'false');
  mobileBar?.classList.toggle('show', y > 420);
  updateSteps();
  ticking = false;
}
window.addEventListener('scroll', () => {
  if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });

/* ---------- Мобильное меню ---------- */
const toggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
const menu = document.getElementById('mobile-menu');
toggle?.addEventListener('click', () => {
  if (!menu) return;
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  toggle.setAttribute('aria-label', open ? 'Открыть меню' : 'Закрыть меню');
  if (open) {
    menu.classList.remove('open');
    document.body.style.overflow = '';
    header?.setAttribute('data-menu', 'false');
    setTimeout(() => (menu.hidden = true), 400);
  } else {
    menu.hidden = false;
    requestAnimationFrame(() => menu.classList.add('open'));
    document.body.style.overflow = 'hidden';
    header?.setAttribute('data-menu', 'true');
  }
});
menu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => toggle?.click()));

/* ---------- Ротатор слов в заголовке ---------- */
document.querySelectorAll<HTMLElement>('.rotator').forEach((rot) => {
  const words = Array.from(rot.children) as HTMLElement[];
  const fit = (el: HTMLElement) => { rot.style.width = el.offsetWidth + 'px'; };
  fit(words[0]);
  document.fonts?.ready.then(() => fit(words.find((w) => w.classList.contains('on')) ?? words[0]));
  window.addEventListener('resize', () => fit(words.find((w) => w.classList.contains('on')) ?? words[0]));
  if (words.length < 2 || reduce) return;
  let i = 0;
  setInterval(() => {
    const cur = words[i];
    i = (i + 1) % words.length;
    const next = words[i];
    cur.classList.remove('on');
    cur.classList.add('off');
    next.classList.remove('off');
    next.classList.add('on');
    fit(next);
    setTimeout(() => cur.classList.remove('off'), 650);
  }, 2600);
});

/* ---------- Подсветка карточек за курсором ---------- */
document.querySelectorAll<HTMLElement>('.spot').forEach((el) => {
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

/* ---------- Параллакс визуала в герое ---------- */
const par = document.querySelector<HTMLElement>('[data-parallax]');
if (par && !reduce && window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('pointermove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 2;
    const y = (e.clientY / window.innerHeight - 0.5) * 2;
    par.style.setProperty('--rx', `${(-y * 5).toFixed(2)}deg`);
    par.style.setProperty('--ry', `${(x * 7).toFixed(2)}deg`);
  });
}

/* ---------- Линия прогресса в шагах ---------- */
const stepsWrap = document.querySelector<HTMLElement>('[data-steps]');
function updateSteps() {
  if (!stepsWrap) return;
  const r = stepsWrap.getBoundingClientRect();
  const vh = window.innerHeight;
  const p = Math.min(1, Math.max(0, (vh * 0.6 - r.top) / r.height));
  stepsWrap.style.setProperty('--p', p.toFixed(3));
  stepsWrap.querySelectorAll<HTMLElement>('[data-step]').forEach((s) => {
    const sr = s.getBoundingClientRect();
    s.classList.toggle('active', sr.top < vh * 0.6);
  });
}

/* ---------- Цели Яндекс.Метрики ---------- */
declare global {
  interface Window { ym?: (...args: unknown[]) => void; __YM_ID?: string; reachGoal?: (g: string) => void }
}
window.reachGoal = (goal: string) => {
  if (window.ym && window.__YM_ID) window.ym(Number(window.__YM_ID), 'reachGoal', goal);
};
document.addEventListener('click', (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>('[data-goal]');
  if (el?.dataset.goal) window.reachGoal?.(el.dataset.goal);
});

onScroll();
