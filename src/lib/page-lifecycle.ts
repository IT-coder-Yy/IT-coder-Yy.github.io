// Astro 保留页面脚本；每次导航重新绑定当前 DOM，离开时清理全局监听与动画。
export function onPageLoad(setup: (signal: AbortSignal) => void) {
  let controller: AbortController | undefined;
  document.addEventListener('astro:page-load', () => {
    controller?.abort();
    controller = new AbortController();
    setup(controller.signal);
  });
  document.addEventListener('astro:before-swap', () => controller?.abort());
}
