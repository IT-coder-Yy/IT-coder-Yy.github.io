import type MatterType from 'matter-js';
import { onPageLoad } from '../lib/page-lifecycle';

const ICON_PATHS = {
  robot: '<rect x="5" y="8" width="14" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16.5h5"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  film: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 4v16M16 4v16M4 9h4M4 15h4M16 9h4M16 15h4"/>',
  git: '<circle cx="6" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="8" r="2"/><path d="M6 8v8M18 10c0 4-6 3.5-11 6.5"/>',
  term: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9l3 3-3 3M12 15h5"/>',
  head: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/>',
  spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  chip: '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4"/>',
} as const;

type IconKey = keyof typeof ICON_PATHS;

interface TileDef {
  size: number;
  cls: string;
  html: string;
  upright?: boolean;
}

interface TileItem {
  el: HTMLDivElement;
  body: MatterType.Body;
  size: number;
  protected: boolean;
}

type MatterMouseWithHandlers = MatterType.Mouse & {
  mousemove: (event: Event) => void;
  mousedown: (event: Event) => void;
  mouseup: (event: Event) => void;
  mousewheel: (event: Event) => void;
};

type StartDragEvent = MatterType.IEvent<MatterType.MouseConstraint> & {
  body?: MatterType.Body;
};

const NAME_CHARS = ['I', 'T', '-', 'C', 'o', 'd', 'e', 'r', '-', 'Y', 'y'] as const;
const SPAWN_CHARS = ['I', 'T', 'C', 'o', 'd', 'e', 'r', 'Y', 'y', '✦'] as const;
const ALL_ICONS: IconKey[] = ['robot', 'camera', 'film', 'git', 'term', 'head', 'spark', 'chip'];

const renderIcon = (key: IconKey) =>
  `<svg class="tile-icon" viewBox="0 0 24 24" aria-hidden="true">${ICON_PATHS[key]}</svg>`;

function buildTileSets(isCompact: boolean) {
  const compactCls = isCompact ? ' compact' : '';
  const letterSize = isCompact ? 48 : 84;
  const dashSize = isCompact ? 34 : 60;
  const iconSize = isCompact ? 44 : 78;
  const dropLetterSize = isCompact ? 42 : 60;
  const dropIconSize = isCompact ? 42 : 58;

  const makeLetter = (ch: string, extra = ''): TileDef => ({
    size: letterSize,
    cls: `l${compactCls}${extra ? ` ${extra}` : ''}`,
    html: ch,
  });

  const makeIcon = (key: IconKey, extra = ''): TileDef => ({
    size: iconSize,
    cls: `ic${compactCls}${extra ? ` ${extra}` : ''}`,
    html: renderIcon(key),
  });

  const nameSet: TileDef[] = NAME_CHARS.map((ch) =>
    ch === '-'
      ? { size: dashSize, cls: `l small${compactCls}`, html: '–', upright: true }
      : { ...makeLetter(ch), upright: true },
  );

  const leadIcons: TileDef[] = isCompact
    ? [makeIcon('robot', 'blue'), makeIcon('camera', 'peach'), makeIcon('git', 'acc')]
    : [
        makeIcon('robot', 'blue'),
        makeIcon('camera', 'peach'),
        makeIcon('film'),
        makeIcon('git', 'acc'),
        makeIcon('term'),
      ];

  const tailIcons: TileDef[] = isCompact
    ? [makeIcon('chip', 'blue')]
    : [makeIcon('head', 'peach'), makeIcon('spark'), makeIcon('chip', 'blue')];

  const spawnPool: TileDef[] = [
    ...SPAWN_CHARS.map((ch) => ({ size: dropLetterSize, cls: `l small${compactCls}`, html: ch })),
    ...ALL_ICONS.map((key) => ({ size: dropIconSize, cls: `ic${compactCls}`, html: renderIcon(key) })),
  ];

  return { nameSet, leadIcons, tailIcons, spawnPool };
}

onPageLoad((signal) => {
  const heroSection = document.querySelector<HTMLElement>('[data-gravity-hero]');
  const stage = heroSection?.querySelector<HTMLElement>('[data-hero-stage]');
  if (!heroSection || !stage) return;

  const staticStage = stage.querySelector<HTMLElement>('[data-hero-static]');

  // 减少动效偏好下保持静态堆叠可见，不加载 matter-js。
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('in');
    if (staticStage) staticStage.hidden = false;
    return;
  }

  let booted = false;
  let booting = false;
  let paused = false;
  let rafId = 0;
  let retryBootRaf = 0;

  let matterApi: typeof MatterType | null = null;
  let engine: MatterType.Engine | null = null;
  let runner: MatterType.Runner | null = null;
  let floor: MatterType.Body | null = null;
  let wallL: MatterType.Body | null = null;
  let wallR: MatterType.Body | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let cleanupInteraction: (() => void) | null = null;

  const timers = new Set<number>();
  const pendingSpawns: Array<() => void> = [];
  const items: TileItem[] = [];
  const originalInertia = new WeakMap<MatterType.Body, number>();

  const schedule = (fn: () => void, delayMs: number) => {
    const id = window.setTimeout(() => {
      timers.delete(id);
      if (signal.aborted) return;
      if (paused) {
        pendingSpawns.push(fn);
        return;
      }
      fn();
    }, delayMs);
    timers.add(id);
  };

  const flushPendingSpawns = () => {
    if (!pendingSpawns.length) return;
    const queue = pendingSpawns.splice(0, pendingSpawns.length);
    queue.forEach((fn, idx) => schedule(fn, idx * 90));
  };

  const renderFrame = () => {
    if (signal.aborted || paused) {
      rafId = 0;
      return;
    }
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    for (const item of items) {
      let { x, y } = item.body.position;
      // 防止极端挤压或高速落块穿透底板/侧墙导致下方方块意外消失。
      if (matterApi && width > 0 && height > 0) {
        const half = item.size / 2;
        const maxY = height - half + 2;
        const minX = half - 2;
        const maxX = Math.max(minX, width - half + 2);
        let corrected = false;
        if (y > maxY) {
          y = maxY;
          corrected = true;
        }
        if (x < minX) {
          x = minX;
          corrected = true;
        } else if (x > maxX) {
          x = maxX;
          corrected = true;
        }
        if (corrected) {
          matterApi.Body.setPosition(item.body, { x, y });
          matterApi.Body.setVelocity(item.body, {
            x: item.body.velocity.x * 0.4,
            y: Math.min(0, item.body.velocity.y * -0.2),
          });
        }
      }
      item.el.style.transform = `translate(${x - item.size / 2}px,${y - item.size / 2}px) rotate(${item.body.angle}rad)`;
    }
    rafId = requestAnimationFrame(renderFrame);
  };

  const startLoop = () => {
    if (!rafId && !paused && !signal.aborted) {
      rafId = requestAnimationFrame(renderFrame);
    }
  };

  const stopLoop = () => {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  const syncBounds = () => {
    if (!matterApi || !floor || !wallL || !wallR) return;
    const width = stage.clientWidth;
    const height = stage.clientHeight;
    if (width <= 0 || height <= 0) return;

    const { Body } = matterApi;
    Body.setPosition(floor, { x: width / 2, y: height + 120 });
    Body.setPosition(wallL, { x: -120, y: height / 2 - 600 });
    Body.setPosition(wallR, { x: width + 120, y: height / 2 - 600 });

    // 窗口缩窄或变矮时将贴边方块温和收回到舞台内，防止穿墙悬空。
    for (const item of items) {
      const half = item.size / 2;
      const clampedX = Math.min(Math.max(item.body.position.x, half), Math.max(half, width - half));
      const clampedY = Math.min(item.body.position.y, Math.max(half, height - half));
      if (clampedX !== item.body.position.x || clampedY !== item.body.position.y) {
        Body.setPosition(item.body, { x: clampedX, y: clampedY });
      }
    }
  };

  const pausePhysics = () => {
    if (!booted || paused || !matterApi || !runner) return;
    paused = true;
    matterApi.Runner.stop(runner);
    stopLoop();
  };

  const resumePhysics = () => {
    if (!booted || !paused || !matterApi || !runner || !engine) return;
    paused = false;
    syncBounds();
    matterApi.Runner.run(runner, engine);
    startLoop();
    flushPendingSpawns();
  };

  const unlockInertia = (body: MatterType.Body) => {
    if (!matterApi) return;
    const saved = originalInertia.get(body);
    if (saved !== undefined) {
      matterApi.Body.setInertia(body, saved);
      originalInertia.delete(body);
    }
  };

  const bootPhysics = async () => {
    if (booted || booting || signal.aborted) return;
    booting = true;

    try {
      const matterMod = await import('matter-js');
      if (signal.aborted) return;

      // 异步加载完成后再次确认首屏仍可见且具备有效尺寸。
      if (heroSection.hidden || stage.clientWidth <= 0) return;

      const Matter =
        (matterMod as unknown as { default?: typeof MatterType }).default ??
        (matterMod as unknown as typeof MatterType);
      matterApi = Matter;

      const { Engine, Runner, Bodies, Composite, Mouse, MouseConstraint, Query, Events, Body } = Matter;
      const isCompact = window.matchMedia('(pointer: coarse)').matches || stage.clientWidth < 680;
      const maxTiles = isCompact ? 48 : 90;

      const { nameSet, leadIcons, tailIcons, spawnPool } = buildTileSets(isCompact);

      engine = Engine.create({ positionIterations: 10, velocityIterations: 8 });
      engine.gravity.y = 1.15;

      const width = stage.clientWidth;
      const height = stage.clientHeight || 360;

      floor = Bodies.rectangle(width / 2, height + 120, Math.max(width * 3, 2800), 240, { isStatic: true });
      wallL = Bodies.rectangle(-120, height / 2 - 600, 240, Math.max(height * 4, 2800), { isStatic: true });
      wallR = Bodies.rectangle(width + 120, height / 2 - 600, 240, Math.max(height * 4, 2800), { isStatic: true });
      Composite.add(engine.world, [floor, wallL, wallR]);

      const activeEngine = engine;

      const addTile = (def: TileDef, x: number, y: number, angle?: number, isProtected = false) => {
        if (signal.aborted) return;
        const size = def.size;
        const initialAngle = angle ?? (Math.random() - 0.5) * 1.2;

        const el = document.createElement('div');
        el.className = `tile ${def.cls}`;
        el.innerHTML = def.html;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        el.style.transform = `translate(${x - size / 2}px,${y - size / 2}px) rotate(${initialAngle}rad)`;
        stage.appendChild(el);

        const body = Bodies.rectangle(x, y, size, size, {
          chamfer: { radius: size * 0.2 },
          restitution: def.upright ? 0.08 : 0.28,
          friction: 0.5,
          frictionAir: 0.012,
          density: 0.0016,
          angle: initialAngle,
        });

        // 名字方块保持初始不翻滚（仅微倾），确保落地可读；被拖拽或点弹后恢复正常翻滚。
        if (def.upright) {
          originalInertia.set(body, body.inertia);
          Body.setInertia(body, Infinity);
        }

        Composite.add(activeEngine.world, body);
        items.push({ el, body, size, protected: isProtected });

        // 仅在极端数量下回收最早的“用户手动生成方块”，绝不误删初始 IT-Coder-Yy 与初始图标。
        if (items.length > maxTiles) {
          const removeAt = items.findIndex((it) => !it.protected);
          if (removeAt !== -1) {
            const [old] = items.splice(removeAt, 1);
            if (old) {
              Composite.remove(activeEngine.world, old.body);
              old.el.remove();
            }
          }
        }
      };

      const spawnAtPoint = (point: { x: number; y: number }, liftOffset = 0) => {
        const def = spawnPool[Math.floor(Math.random() * spawnPool.length)];
        const half = def.size / 2;
        const dropX = Math.min(Math.max(point.x, half + 6), Math.max(half + 6, stage.clientWidth - half - 6));
        const dropY = Math.min(Math.max(point.y - liftOffset, half), Math.max(half, stage.clientHeight - half - 6));
        addTile(def, dropX, dropY, undefined, false);
      };

      if (isCompact) {
        // 触屏 / 移动端：不绑定 MouseConstraint，保持 touch-action: pan-y，轻点方块弹起、点空白处掉落。
        const onStageClick = (event: MouseEvent) => {
          if (paused) return;
          const rect = stage.getBoundingClientRect();
          const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
          const hit = Query.point(
            items.map((item) => item.body),
            point,
          );
          if (hit.length > 0) {
            const target = hit[0];
            unlockInertia(target);
            Body.setVelocity(target, { x: (Math.random() - 0.5) * 6, y: -11 });
            Body.setAngularVelocity(target, (Math.random() - 0.5) * 0.18);
          } else {
            spawnAtPoint(point, 20);
          }
        };
        stage.addEventListener('click', onStageClick, { signal });
      } else {
        // 非触屏桌面端：MouseConstraint 负责拖拽，原生 DOM mousedown 负责点击空白稳定掉落（避免 Matter.js 吞掉快速轻点）。
        const mouse = Mouse.create(stage) as MatterMouseWithHandlers;
        (['mousewheel', 'DOMMouseScroll', 'wheel'] as const).forEach((name) => {
          stage.removeEventListener(name, mouse.mousewheel);
        });

        const mc = MouseConstraint.create(activeEngine, {
          mouse,
          constraint: { stiffness: 0.18, damping: 0.1, render: { visible: false } },
        });
        Composite.add(activeEngine.world, mc);

        window.addEventListener(
          'mousemove',
          (event) => {
            if (mc.body) mouse.mousemove(event);
          },
          { signal },
        );
        window.addEventListener('mouseup', (event) => mouse.mouseup(event), { signal });

        Events.on(mc, 'startdrag', (event) => {
          const dragBody = (event as StartDragEvent).body;
          if (dragBody) unlockInertia(dragBody);
        });

        const onStageMouseDown = (event: MouseEvent) => {
          if (paused || event.button !== 0) return;
          const rect = stage.getBoundingClientRect();
          const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
          const hit = Query.point(
            items.map((item) => item.body),
            point,
          );
          if (!hit.length) {
            // 同步清除鼠标按键态，避免刚生成的新方块被 MouseConstraint 意外黏住。
            mouse.button = -1;
            spawnAtPoint(point, 0);
          }
        };
        stage.addEventListener('mousedown', onStageMouseDown, { signal });

        cleanupInteraction = () => {
          Events.off(mc, 'startdrag');
          stage.removeEventListener('mousemove', mouse.mousemove);
          stage.removeEventListener('mousedown', mouse.mousedown);
          stage.removeEventListener('mouseup', mouse.mouseup);
          stage.removeEventListener('touchmove', mouse.mousemove);
          stage.removeEventListener('touchstart', mouse.mousedown);
          stage.removeEventListener('touchend', mouse.mouseup);
        };
      }

      if (staticStage) staticStage.hidden = true;
      document.body.classList.add('in');

      runner = Runner.create();
      Runner.run(runner, activeEngine);
      booted = true;
      paused = false;

      // 先撒地形图标，再从左到右落 IT-Coder-Yy 名字方块，最后落顶部点缀图标。
      const left = width * (isCompact ? 0.08 : 0.1);
      const span = width * (isCompact ? 0.84 : 0.8);
      const gap = span / (nameSet.length - 1);

      leadIcons.forEach((def, idx) => {
        const jitter = (Math.random() - 0.5) * (isCompact ? 24 : 60);
        const x = left + ((idx + 0.5) * span) / leadIcons.length + jitter;
        const y = (isCompact ? -320 : -360) - Math.random() * 60;
        schedule(() => addTile(def, x, y, undefined, true), 350 + idx * 90);
      });

      nameSet.forEach((def, idx) => {
        const x = left + idx * gap + (Math.random() - 0.5) * gap * (isCompact ? 0.25 : 0.5);
        const y = -340 - Math.random() * 90;
        const angle = (Math.random() - 0.5) * (isCompact ? 0.45 : 0.7);
        schedule(() => addTile(def, x, y, angle, true), 950 + idx * 105);
      });

      tailIcons.forEach((def, idx) => {
        const x = width * 0.2 + Math.random() * width * 0.6;
        schedule(() => addTile(def, x, -420, undefined, true), 2350 + idx * 140);
      });

      resizeObserver = new ResizeObserver(() => {
        if (!paused && !heroSection.hidden) syncBounds();
      });
      resizeObserver.observe(stage);

      startLoop();
    } finally {
      booting = false;
    }
  };

  const tryBoot = () => {
    if (signal.aborted || booted || booting) return;
    if (document.documentElement.dataset.introDone !== 'true') return;
    document.body.classList.add('in');
    if (heroSection.hidden) return;
    if (stage.clientWidth <= 0) {
      if (!retryBootRaf) {
        retryBootRaf = requestAnimationFrame(() => {
          retryBootRaf = 0;
          tryBoot();
        });
      }
      return;
    }
    void bootPhysics();
  };

  const handleViewChange = (event: Event) => {
    const detail = (event as CustomEvent<{ view?: string } | string | null>).detail;
    const nextView =
      typeof detail === 'string'
        ? detail
        : detail && typeof detail === 'object' && typeof detail.view === 'string'
          ? detail.view
          : heroSection.hidden
            ? 'other'
            : 'top';

    const isTop = nextView === 'top' && !heroSection.hidden;
    if (isTop) {
      if (booted) {
        resumePhysics();
      } else {
        tryBoot();
      }
    } else {
      pausePhysics();
    }
  };

  document.addEventListener('site:intro-done', tryBoot, { signal });
  document.addEventListener('portfolio:view-change', handleViewChange, { signal });

  // 离开页面或路由切换时彻底销毁定时器、动画帧、物理引擎与监听器。
  signal.addEventListener(
    'abort',
    () => {
      if (retryBootRaf) {
        cancelAnimationFrame(retryBootRaf);
        retryBootRaf = 0;
      }
      timers.forEach((id) => window.clearTimeout(id));
      timers.clear();
      pendingSpawns.length = 0;
      stopLoop();
      resizeObserver?.disconnect();
      resizeObserver = null;
      cleanupInteraction?.();
      cleanupInteraction = null;
      if (matterApi && runner) {
        matterApi.Runner.stop(runner);
      }
      if (matterApi && engine) {
        matterApi.Composite.clear(engine.world, false);
        matterApi.Engine.clear(engine);
      }
      for (const item of items) {
        item.el.remove();
      }
      items.length = 0;
    },
    { once: true },
  );

  tryBoot();
});
