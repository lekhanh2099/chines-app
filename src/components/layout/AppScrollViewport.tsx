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
  const viewport = viewportRef.current;
  if (viewport === null) return undefined;

  viewport.dataset.readerChrome = "visible";
  viewport.scrollTo({ behavior: "auto", left: 0, top: 0 });
  updateAppScrollState(viewport);

  const scrollPositions = new WeakMap<HTMLElement, number>();
  let scrollTarget = viewport;
  let inputDirection = 0;
  let touchY = 0;
  let animationFrameId: number | null = null;
  const handleScroll = (event: Event): void => {
   if (!(event.target instanceof HTMLElement)) return;
   scrollTarget = event.target;
   if (animationFrameId !== null) return;
   animationFrameId = window.requestAnimationFrame(() => {
    updateAppScrollState(viewport);
    const previousScrollTop = scrollPositions.get(scrollTarget) ?? 0;
    const scrollTop = Math.max(
     0,
     Math.min(scrollTarget.scrollTop, scrollTarget.scrollHeight - scrollTarget.clientHeight),
    );
    const hasReader = scrollTarget.querySelector("[data-reader-segment-id]") !== null;
    if (
     hasReader &&
     inputDirection !== 0 &&
     Math.sign(scrollTop - previousScrollTop) === inputDirection
    ) {
     const hidden = resolveAppScrollChromeHidden({
      scrollTop,
      previousScrollTop,
      hidden: viewport.dataset.readerChrome === "hidden",
     });
     if (hidden !== (viewport.dataset.readerChrome === "hidden")) {
      viewport.dataset.readerChrome = hidden ? "hidden" : "visible";
      // The chrome resize can itself emit scroll events; require fresh input
      // before interpreting those events as another change of direction.
      inputDirection = 0;
     }
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
   inputDirection = 0;
   viewport.dataset.readerChrome = "visible";
  };
  const handleWheel = (event: WheelEvent) => {
   if (event.deltaY !== 0) inputDirection = Math.sign(event.deltaY);
  };
  const handleTouchStart = (event: TouchEvent) => {
   touchY = event.touches[0]?.clientY ?? 0;
   inputDirection = 0;
  };
  const handleTouchMove = (event: TouchEvent) => {
   const nextY = event.touches[0]?.clientY;
   if (nextY === undefined) return;
   if (nextY !== touchY) inputDirection = Math.sign(touchY - nextY);
   touchY = nextY;
  };

  viewport.addEventListener("scroll", handleScroll, { passive: true, capture: true });
  viewport.addEventListener("wheel", handleWheel, { passive: true });
  viewport.addEventListener("touchstart", handleTouchStart, { passive: true });
  viewport.addEventListener("touchmove", handleTouchMove, { passive: true });
  viewport.addEventListener("focusin", revealChrome);
  document.addEventListener("keydown", revealChrome);
  return () => {
   viewport.removeEventListener("scroll", handleScroll, { capture: true });
   viewport.removeEventListener("wheel", handleWheel);
   viewport.removeEventListener("touchstart", handleTouchStart);
   viewport.removeEventListener("touchmove", handleTouchMove);
   viewport.removeEventListener("focusin", revealChrome);
   document.removeEventListener("keydown", revealChrome);
   if (animationFrameId !== null) window.cancelAnimationFrame(animationFrameId);
  };
 }, [routeKey]);

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
