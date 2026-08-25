export type AppScrollBlock = "start" | "center" | "end" | "nearest";

type ScrollRect = {
 top: number;
 bottom: number;
 height: number;
};

export function resolveAppScrollTargetTop({
 block,
 containerClientHeight,
 containerScrollTop,
 containerRect,
 targetRect,
}: {
 block: AppScrollBlock;
 containerClientHeight: number;
 containerScrollTop: number;
 containerRect: ScrollRect;
 targetRect: ScrollRect;
}): number {
 const targetTop = containerScrollTop + targetRect.top - containerRect.top;
 const targetBottom = containerScrollTop + targetRect.bottom - containerRect.top;

 switch (block) {
  case "center":
   return Math.max(0, targetTop - (containerClientHeight - targetRect.height) / 2);
  case "end":
   return Math.max(0, targetBottom - containerClientHeight);
  case "nearest": {
   const visibleTop = containerScrollTop;
   const visibleBottom = containerScrollTop + containerClientHeight;
   if (targetTop >= visibleTop && targetBottom <= visibleBottom) return containerScrollTop;
   if (targetTop < visibleTop) return Math.max(0, targetTop);
   return Math.max(0, targetBottom - containerClientHeight);
  }
  case "start":
  default:
   return Math.max(0, targetTop);
 }
}

export function getAppScrollContainer(): HTMLElement | null {
 if (typeof document === "undefined") return null;
 return document.querySelector<HTMLElement>("[data-app-scroll-viewport]");
}

function isScrollable(element: HTMLElement): boolean {
 if (typeof window === "undefined") return false;
 const overflowY = window.getComputedStyle(element).overflowY;
 return (
  (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") &&
  element.scrollHeight > element.clientHeight
 );
}

export function getScrollContainerForTarget(target: HTMLElement | null): HTMLElement | null {
 if (target === null) return null;
 const appContainer = getAppScrollContainer();
 let current = target.parentElement;

 while (current && current !== appContainer) {
  if (isScrollable(current)) return current;
  current = current.parentElement;
 }

 if (appContainer?.contains(target)) return appContainer;
 return null;
}

export function scrollAppContentToElement(
 target: HTMLElement | null,
 options: { behavior?: ScrollBehavior; block?: AppScrollBlock } = {},
): void {
 if (target === null) return;
 const container = getScrollContainerForTarget(target);
 if (container === null) return;

 const containerRect = container.getBoundingClientRect();
 const targetRect = target.getBoundingClientRect();
 const top = resolveAppScrollTargetTop({
  block: options.block ?? "nearest",
  containerClientHeight: container.clientHeight,
  containerScrollTop: container.scrollTop,
  containerRect: {
   top: containerRect.top,
   bottom: containerRect.bottom,
   height: containerRect.height,
  },
  targetRect: {
   top: targetRect.top,
   bottom: targetRect.bottom,
   height: targetRect.height,
  },
 });

 container.scrollTo({ behavior: options.behavior ?? "smooth", left: 0, top });
}
