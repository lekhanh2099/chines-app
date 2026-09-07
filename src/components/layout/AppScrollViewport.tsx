"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import {
 APP_SCROLL_COMPACT_EXIT_PX,
 resolveAppScrollChromeHidden,
 updateAppScrollState,
} from "./app-scroll-state";

type AppScrollViewportProps = {
 children: ReactNode;
 className?: string;
};

/**
 * The single application-level vertical scroll viewport.
 *
 * Ported from the Hanzi Studio shell contract. Global navigation remains
 * outside this component. Routes, sticky rails, keyboard navigation and
 * section navigation therefore share one DOM scroll owner.
 */
export function AppScrollViewport({ children, className }: AppScrollViewportProps) {
 const pathname = usePathname();
 const searchParams = useSearchParams();
 const routeKey = `${pathname}?${searchParams.toString()}`;
 const viewportRef = useRef<HTMLElement>(null);

 useLayoutEffect(() => {
  if (viewportRef.current) viewportRef.current.dataset.readerChrome = "visible";
 }, [routeKey]);

 useLayoutEffect(() => {
  const viewport = viewportRef.current;
  if (viewport === null) return undefined;

  viewport.scrollTo({ behavior: "auto", left: 0, top: 0 });
  updateAppScrollState(viewport);

  const scrollPositions = new WeakMap<HTMLElement, number>();
  let scrollTarget = viewport;
  let animationFrameId: number | null = null;
  const handleScroll = (event: Event): void => {
   if (!(event.target instanceof HTMLElement)) return;
   scrollTarget = event.target;
   if (animationFrameId !== null) return;
   animationFrameId = window.requestAnimationFrame(() => {
    updateAppScrollState(viewport);
    const previousScrollTop = scrollPositions.get(scrollTarget) ?? 0;
    const scrollTop = Math.max(0, scrollTarget.scrollTop);
    const hasReader = scrollTarget.querySelector("[data-reader-segment-id]") !== null;
    if (hasReader) {
     viewport.dataset.readerChrome = resolveAppScrollChromeHidden({
      scrollTop,
      previousScrollTop,
      hidden: viewport.dataset.readerChrome === "hidden",
     })
      ? "hidden"
      : "visible";
    }
    if (
     scrollTop <= APP_SCROLL_COMPACT_EXIT_PX ||
     Math.abs(scrollTop - previousScrollTop) >= APP_SCROLL_COMPACT_EXIT_PX
    ) {
     scrollPositions.set(scrollTarget, scrollTop);
    }
    animationFrameId = null;
   });
  };
  const revealChrome = () => {
   viewport.dataset.readerChrome = "visible";
  };

  viewport.addEventListener("scroll", handleScroll, { passive: true, capture: true });
  viewport.addEventListener("focusin", revealChrome);
  document.addEventListener("keydown", revealChrome);
  return () => {
   viewport.removeEventListener("scroll", handleScroll, { capture: true });
   viewport.removeEventListener("focusin", revealChrome);
   document.removeEventListener("keydown", revealChrome);
   if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
  };
 }, [pathname]);

 return (
  <main
   id="main-content"
   className={cn(
    "relative min-h-0 min-w-0 w-full flex-1 overflow-y-auto overscroll-y-contain",
    className,
   )}
   data-app-scroll-container=""
   data-app-scroll-viewport=""
   data-scroll-state="top"
   data-reader-chrome="visible"
   ref={viewportRef}
  >
   <div className="h-full min-h-full min-w-0" data-app-route-content="">
    {children}
   </div>
  </main>
 );
}
