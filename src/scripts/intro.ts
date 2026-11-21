import { onPageLoad } from '../lib/page-lifecycle';

const STORAGE_KEY = 'site-intro-seen';
const SKIP_HASHES = new Set([
  '#projects',
  '#about',
  '#ai-agent',
  '#media',
  '#tools',
  '#cv',
  '#contact',
]);
const SCREEN_TEXT = '> IT-Coder-Yy';
const LOAD_DURATION_MS = 2200;

function readSeen(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // 隐私模式或禁用存储时忽略持久化失败
  }
}

function shouldShowIntro(): boolean {
  const param = new URLSearchParams(location.search).get('intro');
  if (param === 'none') return false;
  if (param === 'a' || param === 'force') return true;
  if (SKIP_HASHES.has(location.hash)) return false;
  if (readSeen()) return false;
  return true;
}

function shuffleIndices(length: number): number[] {
  const order = Array.from({ length }, (_, index) => index);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

onPageLoad((signal) => {
  const el = document.querySelector<HTMLElement>('[data-intro-keypad]');
  if (!el) return;

  const root = document.documentElement;

  // 适配 ClientRouter 软导航场景（内联脚本不会重跑时补做一次可见性判断）
  if (el.dataset.introDecided !== '1') {
    el.dataset.introDecided = '1';
    if (shouldShowIntro()) {
      el.hidden = false;
      root.dataset.introDone = 'false';
      root.classList.add('intro-locking');
    } else {
      el.hidden = true;
      root.dataset.introDone = 'true';
      root.classList.remove('intro-locking');
      document.body.classList.add('in');
    }
  }

  if (el.hidden) {
    root.classList.remove('intro-locking');
    root.dataset.introDone = 'true';
    document.body.classList.add('in');
    document.dispatchEvent(new CustomEvent('site:intro-done'));
    return;
  }

  const kp = el.querySelector<HTMLElement>('[data-intro-pad]');
  const enterBtn = el.querySelector<HTMLButtonElement>('[data-intro-enter]');
  const skipBtn = el.querySelector<HTMLButtonElement>('[data-intro-skip]');
  const bar = el.querySelector<HTMLElement>('[data-intro-bar]');
  const num = el.querySelector<HTMLElement>('[data-intro-num]');
  const typeEl = el.querySelector<HTMLElement>('[data-intro-type]');
  const statEl = el.querySelector<HTMLElement>('[data-intro-stat]');

  if (!kp || !enterBtn) {
    root.classList.remove('intro-locking');
    root.dataset.introDone = 'true';
    document.body.classList.add('in');
    el.hidden = true;
    document.dispatchEvent(new CustomEvent('site:intro-done'));
    return;
  }

  root.dataset.introDone = 'false';
  root.classList.add('intro-locking');

  const parts = Array.from(kp.querySelectorAll<HTMLElement>('.kp-el'));
  const plainKeys = Array.from(kp.querySelectorAll<HTMLElement>('.key:not(.enter)'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const timeouts = new Set<number>();
  const intervals = new Set<number>();
  let rafId = 0;
  let exiting = false;
  let finished = false;

  const scheduleTimeout = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timeouts.delete(id);
      if (!signal.aborted) fn();
    }, ms);
    timeouts.add(id);
    return id;
  };

  const scheduleInterval = (fn: () => void, ms: number) => {
    const id = window.setInterval(() => {
      if (!signal.aborted) fn();
    }, ms);
    intervals.add(id);
    return id;
  };

  const clearTimers = () => {
    timeouts.forEach((id) => window.clearTimeout(id));
    timeouts.clear();
    intervals.forEach((id) => window.clearInterval(id));
    intervals.clear();
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  signal.addEventListener(
    'abort',
    () => {
      clearTimers();
      root.classList.remove('intro-locking');
    },
    { once: true },
  );

  // 重置状态（防御重复进入）
  el.classList.remove('gone', 'ready');
  kp.classList.remove('fade');
  enterBtn.classList.remove('pressed');
  parts.forEach((part) => {
    part.classList.remove('fly', 'tap');
    part.style.removeProperty('--r');
    part.style.transitionDelay = '';
  });

  const finishIntro = () => {
    if (finished) return;
    finished = true;
    clearTimers();
    root.classList.remove('intro-locking');
    el.classList.add('gone');
    root.dataset.introDone = 'true';
    document.body.classList.add('in');
    document.dispatchEvent(new CustomEvent('site:intro-done'));
    scheduleTimeout(() => {
      el.hidden = true;
    }, 700);
  };

  const ripple = () => {
    if (exiting || finished || signal.aborted || plainKeys.length === 0) return;
    const origin = plainKeys[Math.floor(Math.random() * plainKeys.length)].getBoundingClientRect();
    plainKeys.forEach((key) => {
      const rect = key.getBoundingClientRect();
      const distance = Math.hypot(rect.x - origin.x, rect.y - origin.y);
      scheduleTimeout(() => {
        if (exiting || finished) return;
        key.classList.add('tap');
        scheduleTimeout(() => {
          key.classList.remove('tap');
        }, 140);
      }, distance * 1.6);
    });
  };

  const startRipple = () => {
    if (exiting || finished || signal.aborted) return;
    ripple();
    scheduleInterval(ripple, 2600);
  };

  const enterIntro = () => {
    if (exiting || finished) return;
    exiting = true;
    clearTimers();
    markSeen();

    // 在同步用户手势回调内立即派发，确保浏览器允许播放音频
    document.dispatchEvent(new CustomEvent('site:bgm-start'));

    if (reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finishIntro();
      return;
    }

    parts.forEach((part) => part.classList.remove('pre'));
    if (bar) bar.style.width = '100%';
    if (num) num.textContent = '100%';
    if (typeEl) typeEl.textContent = SCREEN_TEXT;
    el.classList.add('ready');

    enterBtn.classList.add('pressed');
    if (statEl) statEl.textContent = 'welcome ✦';

    scheduleTimeout(() => {
      enterBtn.classList.remove('pressed');
      parts.forEach((part) => {
        part.style.setProperty('--r', `${(Math.random() - 0.5) * 90}deg`);
        part.style.transitionDelay = `${Math.random() * 0.28}s`;
        part.classList.add('fly');
      });

      scheduleTimeout(() => {
        kp.classList.add('fade');
      }, 420);

      scheduleTimeout(() => {
        finishIntro();
      }, 660);
    }, 240);
  };

  const skipIntro = () => {
    if (exiting || finished) return;
    exiting = true;
    clearTimers();
    markSeen();
    finishIntro();
  };

  enterBtn.addEventListener('click', enterIntro, { signal });
  skipBtn?.addEventListener('click', skipIntro, { signal });

  window.addEventListener(
    'keydown',
    (event) => {
      if (el.hidden || exiting || finished) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        skipIntro();
        return;
      }

      if (event.key === 'Enter') {
        const target = event.target;
        // 焦点位于跳过按钮时尊重按钮原生语义，避免误开启音频
        if (skipBtn && target instanceof Node && skipBtn.contains(target)) return;
        event.preventDefault();
        enterIntro();
      }
    },
    { signal },
  );

  if (reducedMotion) {
    parts.forEach((part) => part.classList.remove('pre'));
    if (bar) bar.style.width = '100%';
    if (num) num.textContent = '100%';
    if (typeEl) typeEl.textContent = SCREEN_TEXT;
    if (statEl) statEl.textContent = 'ready — press ENTER ↵';
    el.classList.add('ready');
    return;
  }

  parts.forEach((part) => part.classList.add('pre'));
  const order = shuffleIndices(parts.length);
  const startTime = performance.now();

  const stepLoad = (now: number) => {
    if (exiting || finished || signal.aborted) {
      rafId = 0;
      return;
    }

    const k = Math.min(1, (now - startTime) / LOAD_DURATION_MS);
    const eased = 1 - Math.pow(1 - k, 2.4);
    const percent = Math.round(eased * 100);

    if (bar) bar.style.width = `${eased * 100}%`;
    if (num) num.textContent = `${percent}%`;

    const revealCount = Math.min(order.length, Math.ceil(eased * parts.length * 1.15));
    for (let i = 0; i < revealCount; i++) {
      parts[order[i]].classList.remove('pre');
    }

    if (typeEl) {
      const chars = Math.round(Math.min(1, k * 1.3) * SCREEN_TEXT.length);
      typeEl.textContent = SCREEN_TEXT.slice(0, chars);
    }

    if (statEl) {
      statEl.textContent = k < 1 ? `loading modules · ${percent}%` : 'ready — press ENTER ↵';
    }

    if (k < 1) {
      rafId = window.requestAnimationFrame(stepLoad);
    } else {
      rafId = 0;
      el.classList.add('ready');
      startRipple();
    }
  };

  rafId = window.requestAnimationFrame(stepLoad);
});
