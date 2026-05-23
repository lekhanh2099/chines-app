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
 const [tooltip, setTooltip] = useState<TooltipState | null>(null);
 const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 const clearTimers = useCallback(() => {
  if (hideTimerRef.current) {
   clearTimeout(hideTimerRef.current);
   hideTimerRef.current = null;
  }
  if (showTimerRef.current) {
   clearTimeout(showTimerRef.current);
   showTimerRef.current = null;
  }
 }, []);

 const hide = useCallback(() => {
  clearTimers();
  hideTimerRef.current = setTimeout(() => setTooltip(null), 150);
 }, [clearTimers]);

 useEffect(() => {
  const root = editor.getRootElement();
  if (!root) return;

  const handleMouseOver = (e: MouseEvent) => {
   const target = e.target as HTMLElement;
   const linkEl = target.closest("[data-internal-link]") as HTMLElement | null;

   if (!linkEl) {
    hide();
    return;
   }

   clearTimers();
   showTimerRef.current = setTimeout(() => {
    const noteTitle = linkEl.title || linkEl.textContent || "";
    const rect = linkEl.getBoundingClientRect();
    setTooltip({ noteTitle, rect });
   }, 300);
  };

  const handleMouseOut = (e: MouseEvent) => {
   const related = e.relatedTarget as HTMLElement | null;
   if (
    related?.closest("[data-internal-link]") ||
    related?.closest("[data-link-tooltip]")
   ) {
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
   <div className="rounded-2xl -lg border border-indigo-200 bg-white px-3 py-2 shadow-lg">
    <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
     Ghi chú liên kết
    </span>
    <span className="block max-w-52 truncate text-sm font-medium text-slate-700">
     {tooltip.noteTitle}
    </span>
    <span className="mt-1 block text-[10px] text-slate-400">Click để mở</span>
   </div>
   <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white" />
  </div>,
  document.body,
 );
}
