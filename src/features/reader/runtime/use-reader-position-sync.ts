"use client";

import { useEffect, useRef } from "react";

import {
 getScrollContainerForTarget,
 scrollAppContentToElement,
} from "@/components/layout/app-scroll";

import { useReaderRegistry, useReaderSelector, useReaderStore } from "./reader-context";

export function useReaderContentPositionSync() {
 const registry = useReaderRegistry();
 const { actions } = useReaderStore();
 const ids = useReaderSelector((state) => state.content.segmentIds);
 const activeId = useReaderSelector((state) => state.navigation.activeSegmentId);
 const positionSource = useReaderSelector((state) => state.navigation.positionSource);
 const followingCommand = useRef(false);
 useEffect(() => {
  if (!activeId || (positionSource !== "command" && positionSource !== "playback")) return;
  const element = registry.get(activeId);
  if (!element) return;
  followingCommand.current = true;
  scrollAppContentToElement(element, { behavior: "smooth", block: "center", allowViewport: true });
 }, [activeId, positionSource, registry]);
 useEffect(() => {
  const first = ids[0];
  const element = first ? registry.get(first) : undefined;
  if (!element) return;
  const container = getScrollContainerForTarget(element);
  const target = container ?? window;
  let frame = 0;
  const release = () => {
   followingCommand.current = false;
  };
  const update = () => {
   cancelAnimationFrame(frame);
   frame = requestAnimationFrame(() => {
    if (followingCommand.current) return;
    const rect = container?.getBoundingClientRect();
    const top = rect?.top ?? 0;
    const height = rect?.height ?? window.innerHeight;
    const closest = findReaderSegmentAtReadingLine({
     segmentIds: ids,
     containerTop: top,
     containerHeight: height,
     getSegmentRect: (id) => registry.get(id)?.getBoundingClientRect() ?? null,
    });
    if (closest) actions.selectSegment(closest, "scroll");
   });
  };
  target.addEventListener("scroll", update, { passive: true });
  target.addEventListener("scrollend", release);
  target.addEventListener("wheel", release, { passive: true });
  target.addEventListener("touchstart", release, { passive: true });
  target.addEventListener("keydown", release);
  return () => {
   cancelAnimationFrame(frame);
   target.removeEventListener("scroll", update);
   target.removeEventListener("scrollend", release);
   target.removeEventListener("wheel", release);
   target.removeEventListener("touchstart", release);
   target.removeEventListener("keydown", release);
  };
 }, [ids, registry, actions]);
}

export function findReaderSegmentAtReadingLine(input: {
 segmentIds: readonly string[];
 containerTop: number;
 containerHeight: number;
 getSegmentRect: (segmentId: string) => { top: number; bottom: number } | null;
}): string | null {
 const readingLine = input.containerTop + Math.min(160, input.containerHeight * 0.25);
 let closestId: string | null = null;
 let closestDistance = Number.POSITIVE_INFINITY;

 for (const segmentId of input.segmentIds) {
  const rect = input.getSegmentRect(segmentId);
  if (
   !rect ||
   rect.bottom < input.containerTop ||
   rect.top > input.containerTop + input.containerHeight
  ) {
   continue;
  }
  const distance = Math.abs(rect.top - readingLine);
  if (distance < closestDistance) {
   closestDistance = distance;
   closestId = segmentId;
  }
 }

 return closestId;
}
