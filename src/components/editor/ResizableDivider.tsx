/**
 * ResizableDivider — Draggable divider between split view panes.
 *
 * Resizes left/right panes on desktop and top/bottom panes on narrow screens.
 */
"use client";

import { useCallback, useEffect, useRef } from "react";

interface ResizableDividerProps {
 value: number;
 onResize: (leadingPercent: number) => void;
 containerRef: React.RefObject<HTMLDivElement | null>;
}

const narrowScreenQuery = "(max-width: 1023px)";

export function ResizableDivider({ value, onResize, containerRef }: ResizableDividerProps) {
 const activePointerId = useRef<number | null>(null);

 const stopDragging = useCallback(() => {
  activePointerId.current = null;
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
 }, []);

 const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
  event.preventDefault();
  activePointerId.current = event.pointerId;
  document.body.style.cursor = window.matchMedia(narrowScreenQuery).matches
   ? "row-resize"
   : "col-resize";
  document.body.style.userSelect = "none";
 }, []);

 useEffect(() => {
  const handlePointerMove = (event: PointerEvent) => {
   if (event.pointerId !== activePointerId.current || !containerRef.current) return;

   const rect = containerRef.current.getBoundingClientRect();
   const isNarrowScreen = window.matchMedia(narrowScreenQuery).matches;
   const offset = isNarrowScreen ? event.clientY - rect.top : event.clientX - rect.left;
   const size = isNarrowScreen ? rect.height : rect.width;
   const percent = (offset / size) * 100;
   const clamped = Math.min(70, Math.max(30, percent));
   onResize(clamped);
  };

  const handlePointerEnd = (event: PointerEvent) => {
   if (event.pointerId === activePointerId.current) stopDragging();
  };

  document.addEventListener("pointermove", handlePointerMove);
  document.addEventListener("pointerup", handlePointerEnd);
  document.addEventListener("pointercancel", handlePointerEnd);
  return () => {
   document.removeEventListener("pointermove", handlePointerMove);
   document.removeEventListener("pointerup", handlePointerEnd);
   document.removeEventListener("pointercancel", handlePointerEnd);
   stopDragging();
  };
 }, [containerRef, onResize, stopDragging]);

 const handleKeyDown = useCallback(
  (event: React.KeyboardEvent<HTMLDivElement>) => {
   const isNarrowScreen = window.matchMedia(narrowScreenQuery).matches;
   const decreaseKey = isNarrowScreen ? "ArrowUp" : "ArrowLeft";
   const increaseKey = isNarrowScreen ? "ArrowDown" : "ArrowRight";

   if (event.key !== decreaseKey && event.key !== increaseKey) return;
   event.preventDefault();
   onResize(Math.min(70, Math.max(30, value + (event.key === increaseKey ? 5 : -5))));
  },
  [onResize, value],
 );

 return (
  <div
   className="split-view-divider"
   role="separator"
   tabIndex={0}
   aria-label="Điều chỉnh kích thước hai vùng"
   aria-valuemin={30}
   aria-valuemax={70}
   aria-valuenow={Math.round(value)}
   onPointerDown={handlePointerDown}
   onKeyDown={handleKeyDown}
   title="Kéo để điều chỉnh tỷ lệ"
  >
   <div className="split-view-divider-handle" />
  </div>
 );
}
