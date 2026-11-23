import { onPageLoad } from '../lib/page-lifecycle';

onPageLoad((signal) => {
  if (!document.querySelector('.portfolio-home')) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');
  const mobile = window.matchMedia('(max-width: 720px)');
  const english = document.documentElement.lang === 'en';
  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

  const views = Array.from(document.querySelectorAll<HTMLElement>('[data-view]'));
  const viewLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-view-link]'));
  const projectGroupElements = Array.from(
    document.querySelectorAll<HTMLElement>('[data-project-group]'),
  );
  const projectGroupByHash = new Map(
    projectGroupElements.map((group) => [group.id, group.dataset.projectGroup!]),
  );
  const hashByProjectGroup = new Map(
    projectGroupElements.map((group) => [group.dataset.projectGroup!, group.id]),
  );

  // 同页锚点不走 ClientRouter 的 pushState，交给原生 hashchange 驱动独立视图。
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    const target = new URL(link.href);
    if (
      target.origin === location.origin &&
      target.pathname === location.pathname &&
      target.search === location.search &&
      target.hash
    ) {
      link.dataset.astroReload = '';
    }
  });

  const syncLanguageLinks = (hash = location.hash) => {
    document.querySelectorAll<HTMLAnchorElement>('.language-switch a').forEach((link) => {
      const target = new URL(link.href);
      target.hash = hash;
      link.href = target.href;
    });
  };

  let currentView = '';
  const viewPositions = new Map<string, number>();

  const showView = (initial = false) => {
    const hash = location.hash.slice(1) || 'top';
    const nextView =
      hash === 'content'
        ? currentView || 'top'
        : hash === 'projects' || projectGroupByHash.has(hash)
          ? 'projects'
          : ['about', 'method', 'contact'].includes(hash)
            ? 'about'
            : 'top';

    if (currentView && nextView !== currentView) {
      viewPositions.set(currentView, window.scrollY);
    }

    views.forEach((view) => {
      view.hidden = view.dataset.view !== nextView;
    });

    viewLinks.forEach((link) => {
      if (link.dataset.viewLink === nextView) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });

    document.body.dataset.activeView = nextView;
    syncLanguageLinks(location.hash);

    if (initial || nextView !== currentView) {
      window.scrollTo({
        top: initial ? 0 : viewPositions.get(nextView) || 0,
        behavior: 'instant',
      });
    }

    if (hash === 'contact') {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'instant' });
    }

    if (!initial && nextView !== currentView) {
      const heading = views
        .find((view) => view.dataset.view === nextView)
        ?.querySelector<HTMLElement>('h1, h2');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus({ preventScroll: true });
    }

    currentView = nextView;
    document.dispatchEvent(
      new CustomEvent('portfolio:view-change', { detail: { view: nextView } }),
    );
  };

  showView(true);
  window.addEventListener('hashchange', () => showView(), { signal });

  // 原生模态框：从等距画布或实体卡片打开快速预览，关闭后焦点返回原入口。
  const preview = document.querySelector<HTMLDialogElement>('[data-project-preview]');
  if (preview) {
    const entries = Array.from(preview.querySelectorAll<HTMLElement>('[data-preview-project]'));
    let current = 0;
    let opener: HTMLElement | null = null;

    const pausePreview = () => preview.querySelectorAll('video').forEach((video) => video.pause());

    const renderPreview = (index: number) => {
      pausePreview();
      current = (index + entries.length) % entries.length;
      entries.forEach((entry, i) => {
        entry.hidden = i !== current;
      });
      const heading = entries[current]?.querySelector('h2');
      if (heading) {
        heading.id = `preview-title-${entries[current].dataset.previewProject}`;
        preview.setAttribute('aria-labelledby', heading.id);
      }
      const count = preview.querySelector('[data-preview-count]');
      if (count) {
        count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(entries.length).padStart(2, '0')}`;
      }
      preview.scrollTop = 0;
    };

    document.querySelectorAll<HTMLAnchorElement>('[data-preview-open]').forEach((link) => {
      link.addEventListener(
        'click',
        (event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          opener = link;
          const idx = entries.findIndex(
            (entry) => entry.dataset.previewProject === link.dataset.previewOpen,
          );
          renderPreview(idx >= 0 ? idx : 0);
          preview.showModal();
          document.body.classList.add('preview-is-open');
          document.dispatchEvent(new Event('portfolio:preview-open'));
        },
        { signal },
      );
    });

    preview.querySelector('[data-preview-close]')?.addEventListener(
      'click',
      () => preview.close(),
      { signal },
    );
    preview.querySelector('[data-preview-prev]')?.addEventListener(
      'click',
      () => renderPreview(current - 1),
      { signal },
    );
    preview.querySelector('[data-preview-next]')?.addEventListener(
      'click',
      () => renderPreview(current + 1),
      { signal },
    );
    preview.addEventListener(
      'click',
      (event) => {
        if (event.target === preview) {
          const box = preview.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          ) {
            preview.close();
          }
        }
      },
      { signal },
    );
    preview.addEventListener(
      'close',
      () => {
        pausePreview();
        document.body.classList.remove('preview-is-open');
        opener?.focus({ preventScroll: true });
      },
      { signal },
    );
    signal.addEventListener(
      'abort',
      () => {
        pausePreview();
        document.body.classList.remove('preview-is-open');
      },
      { once: true },
    );
  }

  // 开放式实体画布：三视角切换（flat / tilt / iso）、柔和指针微视差与随机抽卡联动预览。
  const worksCanvasStage = document.querySelector<HTMLElement>('[data-works-canvas]');
  const canvas = document.querySelector<HTMLElement>('[data-isometric-canvas]');
  const deskStatus = document.querySelector<HTMLElement>('[data-desk-status]');
  if (worksCanvasStage && canvas) {
    const viewButtons = Array.from(
      worksCanvasStage.querySelectorAll<HTMLButtonElement>('[data-canvas-view]'),
    );
    const randomBtn = worksCanvasStage.querySelector<HTMLButtonElement>('[data-canvas-random]');
    const canvasCards = Array.from(
      canvas.querySelectorAll<HTMLAnchorElement>('.canvas-project[data-preview-open]'),
    );

    let frame = 0;
    let randomTimer = 0;
    let lastRandomIndex = -1;

    const resetView = () => {
      cancelAnimationFrame(frame);
      canvas.style.removeProperty('--pointer-yaw');
      canvas.style.removeProperty('--pointer-pitch');
    };

    const clearRandomHighlight = () => {
      window.clearTimeout(randomTimer);
      randomTimer = 0;
      canvasCards.forEach((card) => card.removeAttribute('data-random-picked'));
    };

    const modeLabels: Record<string, string> = english
      ? { flat: 'Flat 0°', tilt: 'Tilt 2.5D', iso: 'Isometric' }
      : { flat: '正视 0°', tilt: '轻透视 2.5D', iso: '等距俯瞰' };

    const setCanvasMode = (mode: string, announce = false) => {
      worksCanvasStage.dataset.canvasMode = mode;
      viewButtons.forEach((button) => {
        const active = button.dataset.canvasView === mode;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      if (mode === 'flat') resetView();
      if (announce && deskStatus) {
        const label = modeLabels[mode] ?? mode;
        deskStatus.textContent = english
          ? `Canvas perspective switched to ${label}.`
          : `画布视角已切换为「${label}」。`;
      }
    };

    if (reducedMotion.matches) {
      setCanvasMode('flat');
    }

    viewButtons.forEach((button) => {
      button.addEventListener(
        'click',
        () => {
          const mode = button.dataset.canvasView;
          if (mode) setCanvasMode(mode, true);
        },
        { signal },
      );
    });

    randomBtn?.addEventListener(
      'click',
      () => {
        if (!canvasCards.length) return;
        clearRandomHighlight();
        let nextIndex = Math.floor(Math.random() * canvasCards.length);
        if (canvasCards.length > 1 && nextIndex === lastRandomIndex) {
          nextIndex = (nextIndex + 1 + Math.floor(Math.random() * (canvasCards.length - 1))) % canvasCards.length;
        }
        lastRandomIndex = nextIndex;
        const picked = canvasCards[nextIndex];
        if (!picked) return;

        if (reducedMotion.matches) {
          picked.click();
          return;
        }

        picked.dataset.randomPicked = 'true';
        randomTimer = window.setTimeout(() => {
          picked.removeAttribute('data-random-picked');
          randomTimer = 0;
          picked.click();
        }, 340);
      },
      { signal },
    );

    const worksCanvasScene = worksCanvasStage.querySelector<HTMLElement>('.works-canvas-scene');
    worksCanvasStage.addEventListener(
      'pointermove',
      (event) => {
        if (
          reducedMotion.matches ||
          coarsePointer.matches ||
          mobile.matches ||
          worksCanvasStage.dataset.canvasMode === 'flat'
        ) {
          return;
        }
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const bounds = (worksCanvasScene ?? worksCanvasStage).getBoundingClientRect();
          if (bounds.width <= 0 || bounds.height <= 0) return;
          const x = clamp((event.clientX - bounds.left) / bounds.width - 0.5, -0.5, 0.5);
          const y = clamp((event.clientY - bounds.top) / bounds.height - 0.5, -0.5, 0.5);
          canvas.style.setProperty('--pointer-yaw', `${(x * 1.4).toFixed(2)}deg`);
          canvas.style.setProperty('--pointer-pitch', `${(y * -1.1).toFixed(2)}deg`);
        });
      },
      { signal },
    );
    worksCanvasStage.addEventListener('pointerleave', resetView, { signal });
    reducedMotion.addEventListener(
      'change',
      () => {
        resetView();
        if (reducedMotion.matches) setCanvasMode('flat');
      },
      { signal },
    );
    mobile.addEventListener('change', resetView, { signal });
    signal.addEventListener(
      'abort',
      () => {
        resetView();
        clearRandomHighlight();
      },
      { once: true },
    );
  }

  // 作品集：滑块胶囊页签 + 等距画布 / 实体卡片桌面互斥切换 + 卡片拖拽。
  const desk = document.querySelector<HTMLElement>('[data-project-desk]');
  if (desk) {
    const status = desk.querySelector<HTMLElement>('[data-desk-status]');
    const chipGroup = desk.querySelector<HTMLElement>('[data-chip-group]');
    const chipInd = desk.querySelector<HTMLElement>('[data-chip-ind]');
    const filters = Array.from(desk.querySelectorAll<HTMLButtonElement>('[data-project-filter]'));
    const groups = Array.from(desk.querySelectorAll<HTMLElement>('[data-project-group]'));
    const worksCanvas = desk.querySelector<HTMLElement>('[data-works-canvas]');
    const worksGroups = desk.querySelector<HTMLElement>('[data-works-groups]');
    const resetBtn = desk.querySelector<HTMLButtonElement>('[data-reset-cards]');
    const canvasHint = desk.querySelector<HTMLElement>('[data-desk-hint-canvas]');
    const cardsHint = desk.querySelector<HTMLElement>('[data-desk-hint-cards]');

    let activeFilter = 'all';

    const moveChipInd = (button: HTMLButtonElement | null) => {
      if (!chipInd || !button) return;
      if (button.offsetWidth === 0 || button.offsetHeight === 0) return;
      chipInd.style.left = `${button.offsetLeft}px`;
      chipInd.style.top = `${button.offsetTop}px`;
      chipInd.style.width = `${button.offsetWidth}px`;
      chipInd.style.height = `${button.offsetHeight}px`;
      chipInd.style.opacity = '1';
    };

    const syncChipInd = () => {
      const activeButton =
        filters.find((button) => button.dataset.projectFilter === activeFilter) ?? filters[0] ?? null;
      moveChipInd(activeButton);
    };

    const selectGroup = (kind: string, syncHash = false) => {
      activeFilter = kind;
      let activeButton: HTMLButtonElement | null = null;

      filters.forEach((button) => {
        const isActive = button.dataset.projectFilter === kind;
        button.setAttribute('aria-pressed', String(isActive));
        button.classList.toggle('is-active', isActive);
        if (isActive) activeButton = button;
      });

      const showCanvas = kind === 'all';
      if (worksCanvas) worksCanvas.hidden = !showCanvas;
      if (worksGroups) worksGroups.hidden = showCanvas;
      if (resetBtn) resetBtn.hidden = showCanvas;
      if (canvasHint) canvasHint.hidden = !showCanvas;
      if (cardsHint) cardsHint.hidden = showCanvas;

      groups.forEach((group) => {
        group.hidden = showCanvas || group.dataset.projectGroup !== kind;
      });

      if (syncHash) {
        const nextHash = showCanvas ? '#projects' : `#${hashByProjectGroup.get(kind) ?? 'projects'}`;
        if (location.hash !== nextHash) {
          history.replaceState(history.state, '', nextHash);
          syncLanguageLinks(nextHash);
        }
      }

      moveChipInd(activeButton);

      if (status) {
        if (showCanvas) {
          const total = desk.querySelectorAll('[data-project-card]').length;
          status.textContent = english
            ? `Showing all ${total} projects on the showcase canvas.`
            : `已在作品画布显示全部 ${total} 个作品。`;
        } else {
          const count = groups
            .filter((group) => !group.hidden)
            .reduce((total, group) => total + group.querySelectorAll('[data-project-card]').length, 0);
          status.textContent = english ? `${count} projects shown.` : `显示 ${count} 个作品。`;
        }
      }
    };

    filters.forEach((button) => {
      button.addEventListener(
        'click',
        () => selectGroup(button.dataset.projectFilter!, true),
        { signal },
      );
    });

    const revealHashTarget = () => {
      const hash = location.hash.slice(1);
      const group = projectGroupByHash.get(hash);
      if (group) {
        selectGroup(group);
      } else if (hash === 'projects' || hash === '') {
        selectGroup('all');
      }
      requestAnimationFrame(syncChipInd);
    };

    document.querySelectorAll<HTMLAnchorElement>('a[href*="#"]').forEach((link) => {
      link.addEventListener(
        'click',
        () => {
          const hash = link.hash.slice(1);
          const group = projectGroupByHash.get(hash);
          if (group) selectGroup(group);
          else if (hash === 'projects') selectGroup('all');
        },
        { signal },
      );
    });

    window.addEventListener('hashchange', revealHashTarget, { signal });
    window.addEventListener('resize', syncChipInd, { signal });
    document.addEventListener(
      'portfolio:view-change',
      (event) => {
        const detail = (event as CustomEvent<{ view?: string }>).detail;
        if (detail?.view === 'projects') {
          requestAnimationFrame(syncChipInd);
        }
      },
      { signal },
    );

    if (chipGroup && 'ResizeObserver' in window) {
      const chipResizeObserver = new ResizeObserver(() => syncChipInd());
      chipResizeObserver.observe(chipGroup);
      signal.addEventListener('abort', () => chipResizeObserver.disconnect(), { once: true });
    }

    document.fonts?.ready.then(() => {
      if (!signal.aborted) syncChipInd();
    });

    revealHashTarget();

    // 实体卡片拖拽与弹簧阻尼归位
    const resets: (() => void)[] = [];
    desk.querySelectorAll<HTMLElement>('[data-project-card]').forEach((card) => {
      const handle = card.querySelector<HTMLButtonElement>('[data-card-handle]');
      if (!handle) return;

      let x = 0;
      let y = 0;
      let vx = 0;
      let vy = 0;
      let startX = 0;
      let startY = 0;
      let previousX = 0;
      let previousY = 0;
      let previousTime = 0;
      let pointerId: number | null = null;
      let animation = 0;

      const render = () => {
        card.style.setProperty('--drag-x', `${x}px`);
        card.style.setProperty('--drag-y', `${y}px`);
      };

      const stop = () => {
        cancelAnimationFrame(animation);
        animation = 0;
      };

      const settle = (targetX: number, targetY: number, velocityX = 0, velocityY = 0) => {
        stop();
        if (reducedMotion.matches) {
          x = targetX;
          y = targetY;
          render();
          return;
        }
        let last = performance.now();
        const velocity = { x: velocityX, y: velocityY };
        const tick = (now: number) => {
          const dt = Math.min((now - last) / 1000, 0.032);
          last = now;
          velocity.x += ((targetX - x) * 250 - velocity.x * 32) * dt;
          velocity.y += ((targetY - y) * 250 - velocity.y * 32) * dt;
          x = clamp(x + velocity.x * dt, -72, 72);
          y = clamp(y + velocity.y * dt, -54, 54);
          render();
          if (
            Math.abs(targetX - x) + Math.abs(targetY - y) < 0.2 &&
            Math.abs(velocity.x) + Math.abs(velocity.y) < 2
          ) {
            x = targetX;
            y = targetY;
            render();
            animation = 0;
          } else {
            animation = requestAnimationFrame(tick);
          }
        };
        animation = requestAnimationFrame(tick);
      };

      const announcePosition = () => {
        if (status) {
          status.textContent = english
            ? `${handle.getAttribute('aria-label')} moved. Use Home to reset.`
            : `${handle.getAttribute('aria-label')}已移动，按 Home 键可归位。`;
        }
      };

      handle.addEventListener(
        'pointerdown',
        (event) => {
          if (mobile.matches || event.button !== 0) return;
          stop();
          pointerId = event.pointerId;
          startX = event.clientX - x;
          startY = event.clientY - y;
          previousX = event.clientX;
          previousY = event.clientY;
          previousTime = performance.now();
          vx = 0;
          vy = 0;
          handle.setPointerCapture(event.pointerId);
          card.dataset.dragging = 'true';
        },
        { signal },
      );

      handle.addEventListener(
        'pointermove',
        (event) => {
          if (pointerId !== event.pointerId) return;
          const now = performance.now();
          const elapsed = Math.max(8, now - previousTime) / 1000;
          vx = vx * 0.5 + ((event.clientX - previousX) / elapsed) * 0.5;
          vy = vy * 0.5 + ((event.clientY - previousY) / elapsed) * 0.5;
          previousX = event.clientX;
          previousY = event.clientY;
          previousTime = now;
          x = clamp(event.clientX - startX, -72, 72);
          y = clamp(event.clientY - startY, -54, 54);
          render();
        },
        { signal },
      );

      const release = (event: PointerEvent) => {
        if (pointerId !== event.pointerId) return;
        pointerId = null;
        card.removeAttribute('data-dragging');
        if (handle.hasPointerCapture(event.pointerId)) {
          handle.releasePointerCapture(event.pointerId);
        }
        if (performance.now() - previousTime > 90 || event.type === 'pointercancel') {
          vx = 0;
          vy = 0;
        }
        settle(clamp(x + vx * 0.08, -72, 72), clamp(y + vy * 0.08, -54, 54), vx, vy);
        announcePosition();
      };

      handle.addEventListener('pointerup', release, { signal });
      handle.addEventListener('pointercancel', release, { signal });
      handle.addEventListener(
        'lostpointercapture',
        () => {
          pointerId = null;
          card.removeAttribute('data-dragging');
        },
        { signal },
      );

      handle.addEventListener(
        'keydown',
        (event) => {
          if (mobile.matches) return;
          const moves: Record<string, [number, number]> = {
            ArrowLeft: [-12, 0],
            ArrowRight: [12, 0],
            ArrowUp: [0, -12],
            ArrowDown: [0, 12],
          };
          if (event.key === 'Home') {
            event.preventDefault();
            settle(0, 0);
            return;
          }
          const move = moves[event.key];
          if (!move) return;
          event.preventDefault();
          stop();
          x = clamp(x + move[0], -72, 72);
          y = clamp(y + move[1], -54, 54);
          render();
          announcePosition();
        },
        { signal },
      );

      const reset = () => {
        vx = 0;
        vy = 0;
        settle(0, 0);
      };
      resets.push(reset);

      mobile.addEventListener(
        'change',
        () => {
          if (mobile.matches) {
            stop();
            x = 0;
            y = 0;
            render();
          }
        },
        { signal },
      );
      reducedMotion.addEventListener(
        'change',
        () => {
          stop();
          vx = 0;
          vy = 0;
        },
        { signal },
      );
      signal.addEventListener('abort', stop, { once: true });
    });

    resetBtn?.addEventListener(
      'click',
      () => {
        resets.forEach((reset) => reset());
        if (status) {
          status.textContent = english
            ? 'Cards returned to their original positions.'
            : '作品卡片已归位。';
        }
      },
      { signal },
    );
  }

  // 邮箱一键复制
  const copy = document.querySelector<HTMLButtonElement>('[data-copy-email]');
  const copyStatus = document.querySelector<HTMLElement>('[data-copy-status]');
  if (copy) {
    let resetTimer = 0;
    signal.addEventListener('abort', () => clearTimeout(resetTimer), { once: true });
    copy.addEventListener(
      'click',
      async () => {
        try {
          await navigator.clipboard.writeText('coder.yy521@gmail.com');
          copy.textContent = copy.dataset.copiedLabel!;
          if (copyStatus) copyStatus.textContent = copy.dataset.copiedLabel!;
          window.clearTimeout(resetTimer);
          resetTimer = window.setTimeout(() => {
            copy.textContent = copy.dataset.copyLabel!;
          }, 2200);
        } catch {
          if (copyStatus) copyStatus.textContent = copy.dataset.errorLabel!;
        }
      },
      { signal },
    );
  }
});
