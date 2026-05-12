/**
 * ResizableDivider — Draggable divider between split view panes.
 *
 * Allows resizing the left/right panes between 30% and 70%.
 */
"use client";

import { useCallback, useEffect, useRef } from "react";

interface ResizableDividerProps {
 onResize: (leftPercent: number) => void;
 containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ResizableDivider({
 onResize,
 containerRef,
}: ResizableDividerProps) {
 const isDragging = useRef(false);

 const handleMouseDown = useCallback((e: React.MouseEvent) => {
  e.preventDefault();
  isDragging.current = true;
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
 }, []);

 useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
   if (!isDragging.current || !containerRef.current) return;
   const rect = containerRef.current.getBoundingClientRect();
   const x = e.clientX - rect.left;
   const percent = (x / rect.width) * 100;
   const clamped = Math.min(70, Math.max(30, percent));
   onResize(clamped);
  };

  const handleMouseUp = () => {
   if (isDragging.current) {
    isDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
   }
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  return () => {
   document.removeEventListener("mousemove", handleMouseMove);
   document.removeEventListener("mouseup", handleMouseUp);
  };
 }, [onResize, containerRef]);

 return (
  <div
   className="split-view-divider"
   onMouseDown={handleMouseDown}
   title="Kéo để điều chỉnh tỷ lệ"
  >
   <div className="split-view-divider-handle" />
  </div>
 );
}
