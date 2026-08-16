"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useLayoutEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { updateAppScrollState } from "./app-scroll-state";

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
 const viewportRef = useRef<HTMLElement>(null);

 useLayoutEffect(() => {
  const viewport = viewportRef.current;
  if (viewport === null) return undefined;

  viewport.scrollTo({ behavior: "auto", left: 0, top: 0 });
  updateAppScrollState(viewport);

  let animationFrameId: number | null = null;
  function handleScroll(): void {
   if (animationFrameId !== null) return;
   animationFrameId = window.requestAnimationFrame(() => {
    updateAppScrollState(viewport);
    animationFrameId = null;
   });
  }

  viewport.addEventListener("scroll", handleScroll, { passive: true });
  return () => {
   viewport.removeEventListener("scroll", handleScroll);
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
   ref={viewportRef}
  >
   <div className="h-full min-h-full min-w-0" data-app-route-content="">
    {children}
   </div>
  </main>
 );
}
