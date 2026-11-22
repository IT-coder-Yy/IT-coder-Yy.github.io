// 首次访问会先后触发两个加载事件，同一页只初始化一次。
export function onPageLoad(setup: (signal: AbortSignal) => void) {
  let controller: AbortController | undefined;

  const start = () => {
    if (controller && !controller.signal.aborted) return;
    controller = new AbortController();
    setup(controller.signal);
  };

  document.addEventListener('DOMContentLoaded', start, { once: true });
  document.addEventListener('astro:page-load', start);
  document.addEventListener('astro:before-swap', () => controller?.abort());
}
