"use client";

import { useSelector } from "@tanstack/react-store";
import { Brush, Eraser, Highlighter, Pen, Redo2, Undo2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/actions/button";
import { PEN_COLORS, type usePdfPageInk } from "@/features/reading/pdf/usePdfPageInk";

type PdfPageInk = ReturnType<typeof usePdfPageInk>;

/** Distance from the pen tip to the middle of the action arc, in pixels. */
const ARC_RADIUS = 104;
/** The colour arc sits outside the action arc. */
const COLOR_ARC_RADIUS = 162;
/** Angle between neighbouring buttons on an arc, in degrees. */
const STEP_DEGREES = 24;
/** Thickness of the dark band behind the buttons. */
const BAND_PX = 52;
/** Close to the page's left edge the arc opens to the right of the pen instead. */
const OPEN_RIGHT_X_SHARE = 0.3;
/** The arc blooms out of the pen tip this fast. */
const BLOOM_MS = 260;
/** Half the side of the square box (centred on the pen tip) that holds both arcs. */
const REACH = COLOR_ARC_RADIUS + BAND_PX;

type ArcItem = {
 key: string;
 label: string;
 pressed: boolean;
 disabled: boolean;
 onSelect: () => void;
 content: ReactNode;
};

function polar(radius: number, degrees: number) {
 const radians = (degrees * Math.PI) / 180;
 return { x: radius * Math.cos(radians), y: radius * Math.sin(radians) };
}

/** Angles for `count` buttons spread evenly around `center`. */
function arcAngles(count: number, center: number) {
 return Array.from(
  { length: count },
  (_, index) => center + (index - (count - 1) / 2) * STEP_DEGREES,
 );
}

/** An SVG arc path (centred on 0,0) through the given angles. */
function arcPath(radius: number, from: number, to: number) {
 const start = polar(radius, from);
 const end = polar(radius, to);
 const large = Math.abs(to - from) > 180 ? 1 : 0;
 return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${large} 1 ${end.x} ${end.y}`;
}

function Arc({ items, radius, center }: { items: ArcItem[]; radius: number; center: number }) {
 const angles = arcAngles(items.length, center);
 const first = angles[0] ?? center;
 const last = angles.at(-1) ?? center;
 return (
  <>
   <svg
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 size-full text-surface-raised drop-shadow-lg"
    viewBox={`${-REACH} ${-REACH} ${REACH * 2} ${REACH * 2}`}
   >
    <path
     d={arcPath(radius, first, last)}
     fill="none"
     stroke="currentColor"
     strokeWidth={BAND_PX}
     strokeLinecap="round"
    />
   </svg>
   {items.map((item, index) => {
    const { x, y } = polar(radius, angles[index] ?? center);
    return (
     <Button
      key={item.key}
      type="button"
      size="icon-round"
      variant={item.pressed ? "active" : "ghost"}
      aria-label={item.label}
      aria-pressed={item.pressed}
      disabled={item.disabled}
      className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: REACH + x, top: REACH + y }}
      onClick={item.onSelect}
     >
      {item.content}
     </Button>
    );
   })}
  </>
 );
}

/**
 * The quick-action arc opened by holding the pen still on a page, curved
 * around the pen tip: tools, the current colour (opening a colour arc),
 * undo and redo. It sits over the page box, like the ink layer; a press
 * anywhere else or Escape closes it.
 */
export function PdfInkQuickActions({ ink }: { ink: PdfPageInk }) {
 const t = useTranslations("Reader.pdf");
 const menu = useSelector(ink.liveInk, (state) => state.menu);
 const menuRef = useRef<HTMLDivElement>(null);
 const [colorsOpen, setColorsOpen] = useState(false);
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
  // Bubbling, so a press on the page reaches the ink layer first: it sees the
  // arc open and only closes it instead of drawing.
  document.addEventListener("pointerdown", closeOutside);
  document.addEventListener("keydown", closeOnEscape);
  return () => {
   document.removeEventListener("pointerdown", closeOutside);
   document.removeEventListener("keydown", closeOnEscape);
   setColorsOpen(false);
  };
 }, [menu.open, closeQuickActions]);

 // One short circular reveal out of the pen tip when the arc opens; nothing
 // animates while it stays open, and reduced motion skips it.
 useLayoutEffect(() => {
  const arc = menuRef.current;
  if (!menu.open || !arc || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const bloom = arc.animate(
   [
    {
     clipPath: "circle(0% at 50% 50%)",
     transform: "scale(0.6)",
     opacity: 0.3,
    },
    { clipPath: "circle(71% at 50% 50%)", transform: "scale(1)", opacity: 1 },
   ],
   { duration: BLOOM_MS, easing: "cubic-bezier(0.2, 0.9, 0.3, 1.12)" },
  );
  return () => bloom.cancel();
 }, [menu.open, menu.x, menu.y]);

 if (!menu.open) return null;
 const center = menu.x < OPEN_RIGHT_X_SHARE ? 0 : 180;
 const act = (action: () => void) => () => {
  action();
  closeQuickActions();
 };
 const tool = (
  drawingTool: Parameters<PdfPageInk["setDrawingTool"]>[0],
  label: string,
  icon: ReactNode,
 ): ArcItem => ({
  key: label,
  label,
  pressed: ink.drawingTool === drawingTool,
  disabled: false,
  onSelect: act(() => ink.setDrawingTool(drawingTool)),
  content: icon,
 });
 const swatch = (color: string) => (
  <span
   aria-hidden="true"
   className="size-6 rounded-full border border-border-strong"
   style={{ backgroundColor: color }}
  />
 );
 const actions: ArcItem[] = [
  {
   key: "undo",
   label: t("undo"),
   pressed: false,
   disabled: !ink.past.length,
   onSelect: act(ink.undo),
   content: <Undo2 />,
  },
  tool("pen", t("pen"), <Pen />),
  tool("brush", t("brush"), <Brush />),
  {
   key: "color",
   label: t("color"),
   pressed: colorsOpen,
   disabled: false,
   onSelect: () => setColorsOpen((open) => !open),
   content: swatch(ink.color),
  },
  tool("highlighter", t("highlighter"), <Highlighter />),
  tool("eraser", t("eraser"), <Eraser />),
  {
   key: "redo",
   label: t("redo"),
   pressed: false,
   disabled: !ink.future.length,
   onSelect: act(ink.redo),
   content: <Redo2 />,
  },
 ];
 const colorNames = [
  t("colors.red"),
  t("colors.blue"),
  t("colors.green"),
  t("colors.orange"),
  t("colors.black"),
 ];
 const colors: ArcItem[] = PEN_COLORS.map((preset, index) => ({
  key: preset,
  label: colorNames[index] ?? preset,
  pressed: ink.color === preset,
  disabled: false,
  onSelect: act(() => {
   ink.setColor(preset);
   // A colour is for writing: leave the eraser or highlighter for the pen.
   if (ink.drawingTool !== "pen" && ink.drawingTool !== "brush") ink.setDrawingTool("pen");
  }),
  content: swatch(preset),
 }));
 const colorCenter = arcAngles(actions.length, center)[3] ?? center;

 return (
  <div
   ref={menuRef}
   role="toolbar"
   aria-label={t("quickActions")}
   className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 text-foreground"
   style={{
    left: `${menu.x * 100}%`,
    top: `${menu.y * 100}%`,
    width: REACH * 2,
    height: REACH * 2,
   }}
  >
   <Arc items={actions} radius={ARC_RADIUS} center={center} />
   {colorsOpen ? <Arc items={colors} radius={COLOR_ARC_RADIUS} center={colorCenter} /> : null}
  </div>
 );
}
