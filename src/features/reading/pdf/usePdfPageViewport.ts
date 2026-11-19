"use client";

import { useCallback, useEffect, useRef, useState, type RefCallback } from "react";

import { clampPdfZoom } from "@/features/reading/pdf/pdf-viewer-utils";

type Point = { x: number; y: number };

function touchDistance(touches: TouchList) {
 const first = touches[0];
 const second = touches[1];
 if (!first || !second) return 0;
 return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
}

function touchCenter(touches: TouchList, fallback: Point): Point {
 const first = touches[0];
 const second = touches[1];
 if (!first || !second) return fallback;
 return { x: (first.clientX + second.clientX) / 2, y: (first.clientY + second.clientY) / 2 };
}

/**
 * Owns zoom, fit-to-width, fullscreen and pinch/wheel gestures for one PDF page viewer.
 *
 * Gestures are native, non-passive listeners on the scroll area (`scrollAreaRef`):
 * React registers wheel and touchmove as passive, so its `preventDefault()` is
 * ignored and Ctrl+wheel, trackpad pinch or a two-finger pinch would zoom the
 * whole browser page together with the PDF.
 */
export function usePdfPageViewport({
 expandInPage = false,
}: {
 /** Expand by covering the app (header, toolbars) inside the page instead of browser fullscreen. */
 expandInPage?: boolean;
} = {}) {
 const viewerRef = useRef<HTMLElement>(null);
 const [scrollArea, setScrollArea] = useState<HTMLDivElement>();
 const [zoom, setZoom] = useState(100);
 const [fitToContainer, setFitToContainer] = useState(true);
 const [isFullscreen, setIsFullscreen] = useState(false);

 useEffect(() => {
  const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === viewerRef.current);
  document.addEventListener("fullscreenchange", syncFullscreen);
  return () => document.removeEventListener("fullscreenchange", syncFullscreen);
 }, []);

 useEffect(() => {
  if (!scrollArea) return;
  let pinchDistance = 0;
  let pinchCenter: Point = { x: 0, y: 0 };
  const zoomBy = (step: number) => {
   setFitToContainer(false);
   setZoom((current) => clampPdfZoom(current + step));
  };

  // Ctrl+wheel is also what a trackpad pinch sends in Chromium and Firefox.
  const onWheel = (event: WheelEvent) => {
   if (!event.ctrlKey) return;
   event.preventDefault();
   zoomBy(event.deltaY < 0 ? 10 : -10);
  };
  const onTouchStart = (event: TouchEvent) => {
   pinchDistance = touchDistance(event.touches);
   pinchCenter = touchCenter(event.touches, pinchCenter);
  };
  const onTouchMove = (event: TouchEvent) => {
   if (event.touches.length < 2 || pinchDistance === 0) return;
   event.preventDefault();
   const distance = touchDistance(event.touches);
   const center = touchCenter(event.touches, pinchCenter);
   const inkCapturesTouch =
    event.target instanceof Element && event.target.closest("[data-touch-ink]") !== null;
   if (inkCapturesTouch) {
    // Finger ink disables native touch scrolling, so two fingers scroll here.
    scrollArea.scrollBy(pinchCenter.x - center.x, pinchCenter.y - center.y);
   }
   pinchCenter = center;
   if (Math.abs(distance - pinchDistance) < 2) return;
   zoomBy(distance > pinchDistance ? 4 : -4);
   pinchDistance = distance;
  };
  const onTouchEnd = (event: TouchEvent) => {
   pinchDistance = event.touches.length >= 2 ? touchDistance(event.touches) : 0;
  };
  // Safari also turns a pinch into gesture events that zoom the page; the
  // touch handlers above already zoom the PDF, so these are only cancelled.
  const cancelPageZoom = (event: Event) => event.preventDefault();

  const active = { passive: false };
  scrollArea.addEventListener("wheel", onWheel, active);
  scrollArea.addEventListener("touchstart", onTouchStart, { passive: true });
  scrollArea.addEventListener("touchmove", onTouchMove, active);
  scrollArea.addEventListener("touchend", onTouchEnd);
  scrollArea.addEventListener("touchcancel", onTouchEnd);
  scrollArea.addEventListener("gesturestart", cancelPageZoom, active);
  scrollArea.addEventListener("gesturechange", cancelPageZoom, active);
  return () => {
   scrollArea.removeEventListener("wheel", onWheel);
   scrollArea.removeEventListener("touchstart", onTouchStart);
   scrollArea.removeEventListener("touchmove", onTouchMove);
   scrollArea.removeEventListener("touchend", onTouchEnd);
   scrollArea.removeEventListener("touchcancel", onTouchEnd);
   scrollArea.removeEventListener("gesturestart", cancelPageZoom);
   scrollArea.removeEventListener("gesturechange", cancelPageZoom);
  };
 }, [scrollArea]);

 useEffect(() => {
  if (!expandInPage || !isFullscreen) return;
  const closeOnEscape = (event: KeyboardEvent) => {
   if (event.key === "Escape") setIsFullscreen(false);
  };
  window.addEventListener("keydown", closeOnEscape);
  return () => window.removeEventListener("keydown", closeOnEscape);
 }, [expandInPage, isFullscreen]);

 const toggleFullscreen = async () => {
  if (expandInPage) {
   setIsFullscreen((current) => !current);
   return;
  }
  const element = viewerRef.current;
  if (!element) return;
  if (document.fullscreenElement === element) {
   await document.exitFullscreen();
   return;
  }
  if (document.fullscreenEnabled) {
   try {
    await element.requestFullscreen();
    return;
   } catch {
    setIsFullscreen(true);
    return;
   }
  }
  setIsFullscreen((current) => !current);
 };

 /** Callback ref for the element that scrolls the page; gestures attach to it. */
 const scrollAreaRef: RefCallback<HTMLDivElement> = useCallback((element) => {
  setScrollArea(element ?? undefined);
 }, []);

 return {
  viewerRef,
  scrollAreaRef,
  zoom,
  setZoom,
  fitToContainer,
  setFitToContainer,
  isFullscreen,
  toggleFullscreen,
 };
}
