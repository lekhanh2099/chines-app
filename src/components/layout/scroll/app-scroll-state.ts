export const APP_SCROLL_COMPACT_ENTER_PX = 96;
export const APP_SCROLL_COMPACT_EXIT_PX = 16;

export function resolveAppScrollChromeHidden({
 scrollTop,
 previousScrollTop,
 hidden,
}: {
 scrollTop: number;
 previousScrollTop: number;
 hidden: boolean;
}): boolean {
 if (scrollTop <= APP_SCROLL_COMPACT_EXIT_PX) return false;
 if (Math.abs(scrollTop - previousScrollTop) < APP_SCROLL_COMPACT_EXIT_PX) return hidden;
 return scrollTop > previousScrollTop && scrollTop >= APP_SCROLL_COMPACT_ENTER_PX;
}

/**
 * Mirrors the Hanzi Studio shell contract: the route scroll owner exposes a
 * hysteretic top/scrolled state so shared chrome can react without creating a
 * second scroll listener or guessing from window scroll.
 */
export function updateAppScrollState(viewport: HTMLElement | null): void {
 if (viewport === null) return;

 const isCompact = viewport.dataset.scrollState === "scrolled";
 const nextCompact = isCompact
  ? viewport.scrollTop > APP_SCROLL_COMPACT_EXIT_PX
  : viewport.scrollTop >= APP_SCROLL_COMPACT_ENTER_PX;

 viewport.dataset.scrollState = nextCompact ? "scrolled" : "top";
}
