/**
 * NodeHoverPlugin — Shows a floating tooltip when hovering over
 * InternalLinkNode elements in the editor.
 *
 * InlineNoteNode handles its own tooltip via React (DecoratorNode).
 * This plugin covers InternalLinkNode which uses raw DOM (TextNode subclass).
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { createPortal } from "react-dom";

type TooltipState = {
 noteTitle: string;
 rect: DOMRect;
};

export default function NodeHoverPlugin() {
 const [editor] = useLexicalComposerContext();
 const [tooltip, setTooltip] = useState<TooltipState>();
 const hideTimerRef = useRef<{ value?: ReturnType<typeof setTimeout> }>({});
 const showTimerRef = useRef<{ value?: ReturnType<typeof setTimeout> }>({});

 const clearTimers = useCallback(() => {
  if (hideTimerRef.current.value) {
   clearTimeout(hideTimerRef.current.value);
   delete hideTimerRef.current.value;
  }
  if (showTimerRef.current.value) {
   clearTimeout(showTimerRef.current.value);
   delete showTimerRef.current.value;
  }
 }, []);

 const hide = useCallback(() => {
  clearTimers();
  hideTimerRef.current.value = setTimeout(() => setTooltip(undefined), 150);
 }, [clearTimers]);

 useEffect(() => {
  const root = editor.getRootElement();
  if (!root) return;

  const handleMouseOver = (e: MouseEvent) => {
   if (!(e.target instanceof HTMLElement)) return;
   const target = e.target;
   const closestLink = target.closest("[data-internal-link]");
   const linkEl = closestLink instanceof HTMLElement ? closestLink : null;

   if (!linkEl) {
    hide();
    return;
   }

   clearTimers();
   showTimerRef.current.value = setTimeout(() => {
    const noteTitle = linkEl.title || linkEl.textContent || "";
    const rect = linkEl.getBoundingClientRect();
    setTooltip({ noteTitle, rect });
   }, 300);
  };

  const handleMouseOut = (e: MouseEvent) => {
   const related = e.relatedTarget instanceof HTMLElement ? e.relatedTarget : null;
   if (related?.closest("[data-internal-link]") || related?.closest("[data-link-tooltip]")) {
    return;
   }
   hide();
  };

  root.addEventListener("mouseover", handleMouseOver);
  root.addEventListener("mouseout", handleMouseOut);

  return () => {
   root.removeEventListener("mouseover", handleMouseOver);
   root.removeEventListener("mouseout", handleMouseOut);
   clearTimers();
  };
 }, [editor, clearTimers, hide]);

 if (!tooltip) return null;

 const top = tooltip.rect.top - 8;
 const left = tooltip.rect.left + tooltip.rect.width / 2;

 return createPortal(
  <div
   data-link-tooltip
   className="pointer-events-auto fixed z-[10000] -translate-x-1/2 -translate-y-full animate-in fade-in zoom-in-95 duration-150"
   style={{ top, left }}
   onMouseEnter={() => {
    clearTimers();
   }}
   onMouseLeave={() => {
    hide();
   }}
  >
   <div className="rounded-xl border border-border-default bg-bg-elevated px-3 py-2 shadow-theme-lg">
    <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-widest text-accent-text">
     Ghi chú liên kết
    </span>
    <span className="block max-w-52 truncate  font-medium text-text-secondary">
     {tooltip.noteTitle}
    </span>
    <span className="mt-1 block text-[10px] text-text-muted">Click để mở</span>
   </div>
   <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-bg-elevated" />
  </div>,
  document.body,
 );
}
