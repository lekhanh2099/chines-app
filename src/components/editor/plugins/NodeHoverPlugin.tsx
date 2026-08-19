"use client";

import { Typography } from "@/components/ui/typography";
/**
 * NodeHoverPlugin — Shows a floating tooltip when hovering over
 * InternalLinkNode elements in the editor.
 *
 * InlineNoteNode handles its own tooltip via React (DecoratorNode).
 * This plugin covers InternalLinkNode which uses raw DOM (TextNode subclass).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { createPortal } from "react-dom";
import { FloatingLayer } from "@/components/ui/floating-layer";

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
  <FloatingLayer
   data-link-tooltip
   variant="editorControls"
   style={{ top, left }}
   onMouseEnter={() => {
    clearTimers();
   }}
   onMouseLeave={() => {
    hide();
   }}
  >
   <Typography
    variant="overline"
    tone="accent"
    weight="semibold"
    scale="micro"
    transform="uppercase"
    tracking="widest"
    className="block"
   >
    Ghi chú liên kết
   </Typography>
   <Typography tone="secondary" weight="medium" clamp="one" className="block max-w-52">
    {tooltip.noteTitle}
   </Typography>
   <Typography variant="caption" tone="muted" scale="micro" className="block">
    Click để mở
   </Typography>
   <span className="absolute left-1/2 top-full size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-border-default bg-bg-elevated" />
  </FloatingLayer>,
  document.body,
 );
}
