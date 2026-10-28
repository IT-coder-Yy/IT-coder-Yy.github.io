import { onPageLoad } from '../lib/page-lifecycle';

onPageLoad((signal) => {
if (!document.querySelector('.portfolio-home')) return;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointer = window.matchMedia('(pointer: coarse)');
const mobile = window.matchMedia('(max-width: 600px)');
const english = document.documentElement.lang === 'en';
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// 三个独立浏览空间。地址栏、浏览器前进后退与旧分类锚点共享同一状态。
const views = Array.from(document.querySelectorAll<HTMLElement>('[data-view]'));
const viewLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-view-link]'));
const projectGroupByHash = new Map(Array.from(document.querySelectorAll<HTMLElement>('[data-project-group]')).map(group => [group.id, group.dataset.projectGroup!]));
// 首页视图依赖原生 hashchange；同页锚点不经过 ClientRouter 的 pushState。
document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link => {
  const target = new URL(link.href);
  if (target.origin === location.origin && target.pathname === location.pathname && target.search === location.search && target.hash) {
    link.dataset.astroReload = '';
  }
});
let currentView = '';
const viewPositions = new Map<string, number>();
const showView = (initial = false) => {
  const hash = location.hash.slice(1) || 'top';
  const nextView = hash === 'content' ? (currentView || 'top') : hash === 'projects' || projectGroupByHash.has(hash) ? 'projects' : ['about', 'method', 'contact'].includes(hash) ? 'about' : 'top';
  if (currentView && nextView !== currentView) viewPositions.set(currentView, window.scrollY);
  views.forEach(view => view.hidden = view.dataset.view !== nextView);
  viewLinks.forEach(link => {
    if (link.dataset.viewLink === nextView) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.body.dataset.activeView = nextView;
  document.querySelectorAll<HTMLAnchorElement>('.language-switch a').forEach(link => {
    const target = new URL(link.href); target.hash = location.hash; link.href = target.href;
  });
  if (initial || nextView !== currentView) window.scrollTo({ top: initial ? 0 : viewPositions.get(nextView) || 0, behavior: 'instant' });
  if (hash === 'method' || hash === 'contact') document.getElementById(hash)?.scrollIntoView({ behavior: 'instant' });
  if (!initial && nextView !== currentView) {
    const heading = views.find(view => view.dataset.view === nextView)?.querySelector<HTMLElement>('h1,h2');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  }
  currentView = nextView;
};
showView(true);
window.addEventListener('hashchange', () => showView(), { signal });

// 原生模态框保留作品桌面的位置和筛选；关闭后焦点返回原入口。
const preview = document.querySelector<HTMLDialogElement>('[data-project-preview]');
if (preview) {
  const entries = Array.from(preview.querySelectorAll<HTMLElement>('[data-preview-project]'));
  let current = 0;
  let opener: HTMLElement | null = null;
  const pausePreview = () => preview.querySelectorAll('video').forEach(video => video.pause());
  const renderPreview = (index: number) => {
    pausePreview();
    current = (index + entries.length) % entries.length;
    entries.forEach((entry, i) => entry.hidden = i !== current);
    const heading = entries[current].querySelector('h2');
    if (heading) { heading.id = `preview-title-${entries[current].dataset.previewProject}`; preview.setAttribute('aria-labelledby', heading.id); }
    const count = preview.querySelector('[data-preview-count]');
    if (count) count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(entries.length).padStart(2, '0')}`;
    preview.scrollTop = 0;
  };
  document.querySelectorAll<HTMLAnchorElement>('[data-preview-open]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      opener = link;
      renderPreview(entries.findIndex(entry => entry.dataset.previewProject === link.dataset.previewOpen));
      preview.showModal();
      document.body.classList.add('preview-is-open');
      document.dispatchEvent(new Event('portfolio:preview-open'));
    });
  });
  preview.querySelector('[data-preview-close]')?.addEventListener('click', () => preview.close());
  preview.querySelector('[data-preview-prev]')?.addEventListener('click', () => renderPreview(current - 1));
  preview.querySelector('[data-preview-next]')?.addEventListener('click', () => renderPreview(current + 1));
  preview.addEventListener('click', event => { if (event.target === preview) { const box = preview.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) preview.close(); } });
  preview.addEventListener('close', () => { pausePreview(); document.body.classList.remove('preview-is-open'); opener?.focus({ preventScroll: true }); });
  signal.addEventListener('abort', () => { pausePreview(); document.body.classList.remove('preview-is-open'); }, { once: true });
}

// 视角只响应画布中的指针；静止时不运行帧循环。
const cover = document.querySelector<HTMLElement>('[data-spatial-cover]');
const canvas = document.querySelector<HTMLElement>('[data-isometric-canvas]');
if (cover && canvas) {
  let frame = 0;
  cover.addEventListener('pointermove', event => {
    if (reducedMotion.matches || coarsePointer.matches) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const bounds = cover.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      canvas.style.setProperty('--pointer-yaw', `${x * 2.5}deg`);
      canvas.style.setProperty('--pointer-pitch', `${y * -2}deg`);
    });
  });
  const resetView = () => {
    cancelAnimationFrame(frame);
    canvas.style.removeProperty('--pointer-yaw');
    canvas.style.removeProperty('--pointer-pitch');
  };
  cover.addEventListener('pointerleave', resetView);
  reducedMotion.addEventListener('change', resetView, { signal });
  signal.addEventListener('abort', resetView, { once: true });
}

const desk = document.querySelector<HTMLElement>('[data-project-desk]');
if (desk) {
  const status = desk.querySelector<HTMLElement>('[data-desk-status]');
  const filters = Array.from(desk.querySelectorAll<HTMLButtonElement>('[data-project-filter]'));
  const groups = Array.from(desk.querySelectorAll<HTMLElement>('[data-project-group]'));
  const selectGroup = (kind: string) => {
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.projectFilter === kind)));
    groups.forEach(group => group.hidden = kind !== 'all' && group.dataset.projectGroup !== kind);
    const count = groups.filter(group => !group.hidden).reduce((total, group) => total + group.querySelectorAll('[data-project-card]').length, 0);
    if (status) status.textContent = english ? `${count} projects shown.` : `显示 ${count} 个作品。`;
  };
  filters.forEach(button => button.addEventListener('click', () => selectGroup(button.dataset.projectFilter!)));
  const revealHashTarget = () => {
    const group = projectGroupByHash.get(location.hash.slice(1));
    if (group) selectGroup(group);
    if (location.hash === '#projects') selectGroup('all');
  };
  document.querySelectorAll<HTMLAnchorElement>('a[href*="#"]').forEach(link => link.addEventListener('click', () => {
    const group = projectGroupByHash.get(link.hash.slice(1));
    if (group) selectGroup(group);
    if (link.hash === '#projects') selectGroup('all');
  }));
  window.addEventListener('hashchange', revealHashTarget, { signal });
  revealHashTarget();

  const resets: (() => void)[] = [];
  desk.querySelectorAll<HTMLElement>('[data-project-card]').forEach(card => {
    const handle = card.querySelector<HTMLButtonElement>('[data-card-handle]');
    if (!handle) return;
    let x = 0, y = 0, vx = 0, vy = 0;
    let startX = 0, startY = 0, previousX = 0, previousY = 0, previousTime = 0;
    let pointerId: number | null = null;
    let animation = 0;
    const render = () => {
      card.style.setProperty('--drag-x', `${x}px`);
      card.style.setProperty('--drag-y', `${y}px`);
    };
    const stop = () => { cancelAnimationFrame(animation); animation = 0; };
    const settle = (targetX: number, targetY: number, velocityX = 0, velocityY = 0) => {
      stop();
      if (reducedMotion.matches) { x = targetX; y = targetY; render(); return; }
      let last = performance.now();
      let velocity = { x: velocityX, y: velocityY };
      const tick = (now: number) => {
        const dt = Math.min((now - last) / 1000, 0.032);
        last = now;
        velocity.x += ((targetX - x) * 250 - velocity.x * 32) * dt;
        velocity.y += ((targetY - y) * 250 - velocity.y * 32) * dt;
        x = clamp(x + velocity.x * dt, -72, 72);
        y = clamp(y + velocity.y * dt, -54, 54);
        render();
        if (Math.abs(targetX - x) + Math.abs(targetY - y) < 0.2 && Math.abs(velocity.x) + Math.abs(velocity.y) < 2) {
          x = targetX; y = targetY; render(); animation = 0;
        } else animation = requestAnimationFrame(tick);
      };
      animation = requestAnimationFrame(tick);
    };
    const announcePosition = () => {
      if (status) status.textContent = english ? `${handle.getAttribute('aria-label')} moved. Use Home to reset.` : `${handle.getAttribute('aria-label')}已移动，按 Home 键可归位。`;
    };
    handle.addEventListener('pointerdown', event => {
      if (mobile.matches || event.button !== 0) return;
      stop();
      pointerId = event.pointerId;
      startX = event.clientX - x; startY = event.clientY - y;
      previousX = event.clientX; previousY = event.clientY; previousTime = performance.now();
      vx = 0; vy = 0;
      handle.setPointerCapture(event.pointerId);
      card.dataset.dragging = 'true';
    });
    handle.addEventListener('pointermove', event => {
      if (pointerId !== event.pointerId) return;
      const now = performance.now();
      const elapsed = Math.max(8, now - previousTime) / 1000;
      vx = vx * 0.5 + ((event.clientX - previousX) / elapsed) * 0.5;
      vy = vy * 0.5 + ((event.clientY - previousY) / elapsed) * 0.5;
      previousX = event.clientX; previousY = event.clientY; previousTime = now;
      x = clamp(event.clientX - startX, -72, 72);
      y = clamp(event.clientY - startY, -54, 54);
      render();
    });
    const release = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      card.removeAttribute('data-dragging');
      if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId);
      if (performance.now() - previousTime > 90 || event.type === 'pointercancel') vx = vy = 0;
      settle(clamp(x + vx * 0.08, -72, 72), clamp(y + vy * 0.08, -54, 54), vx, vy);
      announcePosition();
    };
    handle.addEventListener('pointerup', release);
    handle.addEventListener('pointercancel', release);
    handle.addEventListener('lostpointercapture', () => { pointerId = null; card.removeAttribute('data-dragging'); });
    handle.addEventListener('keydown', event => {
      if (mobile.matches) return;
      const moves: Record<string, [number, number]> = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] };
      if (event.key === 'Home') { event.preventDefault(); settle(0, 0); return; }
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault(); stop();
      x = clamp(x + move[0], -72, 72); y = clamp(y + move[1], -54, 54); render(); announcePosition();
    });
    const reset = () => { vx = vy = 0; settle(0, 0); };
    resets.push(reset);
    mobile.addEventListener('change', () => { if (mobile.matches) { stop(); x = y = 0; render(); } }, { signal });
    reducedMotion.addEventListener('change', () => { stop(); vx = vy = 0; }, { signal });
    signal.addEventListener('abort', stop, { once: true });
  });
  desk.querySelector('[data-reset-cards]')?.addEventListener('click', () => {
    resets.forEach(reset => reset());
    if (status) status.textContent = english ? 'Cards returned to their original positions.' : '作品卡片已归位。';
  });
}

const copy = document.querySelector<HTMLButtonElement>('[data-copy-email]');
const copyStatus = document.querySelector<HTMLElement>('[data-copy-status]');
if (copy) {
  let resetTimer = 0;
  signal.addEventListener('abort', () => clearTimeout(resetTimer), { once: true });
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('yuyang24@mails.ucas.ac.cn');
      copy.textContent = copy.dataset.copiedLabel!;
      if (copyStatus) copyStatus.textContent = copy.dataset.copiedLabel!;
      window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => { copy.textContent = copy.dataset.copyLabel!; }, 2200);
    } catch {
      if (copyStatus) copyStatus.textContent = copy.dataset.errorLabel!;
    }
  });
}

});
