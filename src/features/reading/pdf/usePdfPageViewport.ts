"use client";

import { useEffect, useRef, useState, type TouchEvent, type WheelEvent } from "react";

import { clampPdfZoom } from "@/features/reading/pdf/pdf-viewer-utils";

/** Owns zoom, fit-to-width, fullscreen and pinch/wheel gestures for one PDF page viewer. */
export function usePdfPageViewport() {
 const viewerRef = useRef<HTMLElement>(null);
 const pinchDistanceRef = useRef<number | null>(null);
 const pinchCenterRef = useRef({ x: 0, y: 0 });
 const [zoom, setZoom] = useState(100);
 const [fitToContainer, setFitToContainer] = useState(true);
 const [isFullscreen, setIsFullscreen] = useState(false);
 useEffect(() => {
  const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === viewerRef.current);
  document.addEventListener("fullscreenchange", syncFullscreen);
  return () => document.removeEventListener("fullscreenchange", syncFullscreen);
 }, []);

 const toggleFullscreen = async () => {
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
 const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
  if (!event.ctrlKey) return;
  event.preventDefault();
  setFitToContainer(false);
  setZoom((current) => clampPdfZoom(current + (event.deltaY < 0 ? 10 : -10)));
 };
 const touchDistance = (event: TouchEvent<HTMLDivElement>) => {
  const first = event.touches[0];
  const second = event.touches[1];
  if (!first || !second) return null;
  return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
 };
 const touchCenter = (event: TouchEvent<HTMLDivElement>) => {
  const first = event.touches[0];
  const second = event.touches[1];
  if (!first || !second) return pinchCenterRef.current;
  return { x: (first.clientX + second.clientX) / 2, y: (first.clientY + second.clientY) / 2 };
 };
 const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
  pinchDistanceRef.current = touchDistance(event);
  pinchCenterRef.current = touchCenter(event);
 };
 const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
  const distance = touchDistance(event);
  const previousDistance = pinchDistanceRef.current;
  const inkCapturesTouch =
   event.target instanceof Element && event.target.closest("[data-touch-ink]") !== null;
  if (inkCapturesTouch && distance !== null && previousDistance !== null) {
   // Finger ink disables native touch scrolling, so two fingers scroll here.
   const center = touchCenter(event);
   event.currentTarget.scrollBy(
    pinchCenterRef.current.x - center.x,
    pinchCenterRef.current.y - center.y,
   );
   pinchCenterRef.current = center;
  }
  if (distance === null || previousDistance === null || Math.abs(distance - previousDistance) < 2)
   return;
  event.preventDefault();
  pinchDistanceRef.current = distance;
  setFitToContainer(false);
  setZoom((current) => clampPdfZoom(current + (distance > previousDistance ? 4 : -4)));
 };
 const handleTouchEnd = () => {
  pinchDistanceRef.current = null;
 };

 return {
  viewerRef,
  zoom,
  setZoom,
  fitToContainer,
  setFitToContainer,
  isFullscreen,
  toggleFullscreen,
  handleWheel,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
 };
}
