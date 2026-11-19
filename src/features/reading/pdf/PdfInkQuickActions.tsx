"use client";

import { useSelector } from "@tanstack/react-store";
import { Brush, Eraser, Highlighter, Pen, Redo2, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/actions/button";
import { Card } from "@/components/ui/layout/card";
import { PEN_COLORS, type usePdfPageInk } from "@/features/reading/pdf/usePdfPageInk";

type PdfPageInk = ReturnType<typeof usePdfPageInk>;

/** Near the top of the page the menu opens below the pen instead of above it. */
const OPEN_BELOW_TOP_SHARE = 0.2;

/**
 * The quick-action menu opened by holding the pen still on a page: switch
 * tool, pick a colour, undo or redo, right where the pen is. It sits over the
 * page box, like the ink layer; a press anywhere else or Escape closes it.
 */
export function PdfInkQuickActions({ ink }: { ink: PdfPageInk }) {
 const t = useTranslations("Reader.pdf");
 const menu = useSelector(ink.liveInk, (state) => state.menu);
 const menuRef = useRef<HTMLDivElement>(null);
 const { closeQuickActions } = ink;

 useEffect(() => {
  if (!menu.open) return;
  const closeOutside = (event: PointerEvent) => {
   if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
   closeQuickActions();
  };
  const closeOnEscape = (event: KeyboardEvent) => {
   if (event.key === "Escape") closeQuickActions();
  };
  document.addEventListener("pointerdown", closeOutside, true);
  document.addEventListener("keydown", closeOnEscape);
  return () => {
   document.removeEventListener("pointerdown", closeOutside, true);
   document.removeEventListener("keydown", closeOnEscape);
  };
 }, [menu.open, closeQuickActions]);

 if (!menu.open) return null;
 const colorNames = [
  t("colors.red"),
  t("colors.blue"),
  t("colors.green"),
  t("colors.orange"),
  t("colors.black"),
 ];
 const tools: { tool: PdfPageInk["drawingTool"]; label: string; icon: ReactNode }[] = [
  { tool: "pen", label: t("pen"), icon: <Pen /> },
  { tool: "highlighter", label: t("highlighter"), icon: <Highlighter /> },
  { tool: "brush", label: t("brush"), icon: <Brush /> },
  { tool: "eraser", label: t("eraser"), icon: <Eraser /> },
 ];
 const below = menu.y < OPEN_BELOW_TOP_SHARE;
 const act = (action: () => void) => {
  action();
  closeQuickActions();
 };

 return (
  <div
   ref={menuRef}
   className="absolute z-30"
   style={{
    left: `${menu.x * 100}%`,
    top: `${menu.y * 100}%`,
    transform: below ? "translate(-50%, 1rem)" : "translate(-50%, calc(-100% - 1rem))",
   }}
  >
   <Card variant="elevated" padding="sm" role="menu" aria-label={t("quickActions")}>
    <div className="grid gap-2">
     <div className="flex items-center gap-1">
      {tools.map(({ tool, label, icon }) => (
       <Button
        key={label}
        type="button"
        size="icon-toolbar"
        variant={ink.drawingTool === tool ? "active" : "ghost"}
        aria-label={label}
        aria-pressed={ink.drawingTool === tool}
        onClick={() => act(() => ink.setDrawingTool(tool))}
       >
        {icon}
       </Button>
      ))}
     </div>
     <div className="flex items-center gap-1">
      {PEN_COLORS.map((preset, index) => (
       <Button
        key={preset}
        type="button"
        size="icon-toolbar"
        variant={ink.color === preset ? "active" : "ghost"}
        aria-label={colorNames[index] ?? preset}
        aria-pressed={ink.color === preset}
        onClick={() =>
         act(() => {
          ink.setColor(preset);
          // A colour is for writing: leave the eraser or highlighter for the pen.
          if (ink.drawingTool !== "pen" && ink.drawingTool !== "brush") ink.setDrawingTool("pen");
         })
        }
       >
        <span
         aria-hidden="true"
         className="size-5 rounded-full border border-border-strong"
         style={{ backgroundColor: preset }}
        />
       </Button>
      ))}
     </div>
     <div className="flex items-center gap-1">
      <Button
       type="button"
       size="icon-toolbar"
       variant="ghost"
       aria-label={t("undo")}
       disabled={!ink.past.length}
       onClick={() => act(ink.undo)}
      >
       <Undo2 />
      </Button>
      <Button
       type="button"
       size="icon-toolbar"
       variant="ghost"
       aria-label={t("redo")}
       disabled={!ink.future.length}
       onClick={() => act(ink.redo)}
      >
       <Redo2 />
      </Button>
     </div>
    </div>
   </Card>
  </div>
 );
}
