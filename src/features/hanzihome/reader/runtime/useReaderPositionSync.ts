"use client";

import { useEffect } from "react";

import {
 getScrollContainerForTarget,
 scrollAppContentToElement,
} from "@/components/layout/app-scroll";

import type { ReaderDocumentModel, ReaderSegment } from "../model/reader-document.types";
import { useReaderRuntimeActions, useReaderRuntimeSelector } from "./ReaderRuntimeProvider";

export function findReaderSegmentAtReadingLine(input: {
 segments: readonly ReaderSegment[];
 containerTop: number;
 containerHeight: number;
 getSegmentRect: (segmentId: string) => { top: number; bottom: number } | null;
}): string | null {
 const readingLine = input.containerTop + Math.min(160, input.containerHeight * 0.25);
 let closestId: string | null = null;
 let closestDistance = Number.POSITIVE_INFINITY;

 for (const segment of input.segments) {
  const rect = input.getSegmentRect(segment.id);
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
   closestId = segment.id;
  }
 }

 return closestId;
}

export function useReaderPositionSync({
 document,
 getSegmentElement,
}: {
 document: ReaderDocumentModel;
 getSegmentElement: (segmentId: string) => HTMLElement | null;
}) {
 const actions = useReaderRuntimeActions();
 const activeIndex = useReaderRuntimeSelector((state) => state.activeIndex);
 const positionSource = useReaderRuntimeSelector((state) => state.positionSource);

 useEffect(() => {
  if (positionSource !== "command" && positionSource !== "playback") return;
  const segment = document.segments[activeIndex];
  if (!segment) return;
  scrollAppContentToElement(getSegmentElement(segment.id), {
   behavior: "smooth",
   block: "center",
  });
 }, [activeIndex, document.segments, getSegmentElement, positionSource]);

 useEffect(() => {
  const firstSegment = document.segments[0];
  const firstElement = firstSegment ? getSegmentElement(firstSegment.id) : null;
  const container = getScrollContainerForTarget(firstElement);
  if (!container || document.segments.length === 0) return;
  let animationFrame = 0;
  const updatePosition = () => {
   cancelAnimationFrame(animationFrame);
   animationFrame = requestAnimationFrame(() => {
    const containerRect = container.getBoundingClientRect();
    const closestId = findReaderSegmentAtReadingLine({
     segments: document.segments,
     containerTop: containerRect.top,
     containerHeight: containerRect.height,
     getSegmentRect: (segmentId) => getSegmentElement(segmentId)?.getBoundingClientRect() ?? null,
    });
    if (closestId) actions.selectSegment(closestId, "scroll");
   });
  };
  container.addEventListener("scroll", updatePosition, { passive: true });
  updatePosition();
  return () => {
   cancelAnimationFrame(animationFrame);
   container.removeEventListener("scroll", updatePosition);
  };
 }, [actions, document.segments, getSegmentElement]);
}
