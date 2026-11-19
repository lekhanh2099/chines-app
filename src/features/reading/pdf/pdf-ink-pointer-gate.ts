import type { PointerEvent } from "react";

type InkPointer = Pick<PointerEvent, "pointerId" | "pointerType" | "isPrimary">;

/**
 * Decides what each pointer on a PDF ink layer does while a drawing tool is
 * active. The layer captures every touch (iPad Safari also applies
 * `touch-action` to Apple Pencil, so letting fingers pan natively would make
 * the pencil scroll too), and this gate splits them:
 * - one pointer inks at a time;
 * - a finger inks only with finger ink on, otherwise it pans the page;
 * - a second finger turns a touch stroke or pan into a pinch;
 * - while a pen is down, or the moment one lands, touches are a resting palm:
 *   they neither ink nor pan, and a palm stroke in progress is taken back.
 */
export function createPdfInkPointerGate() {
 const touches = new Set<number>();
 let inkPointerId = -1;
 let inkIsTouch = false;
 let panPointerId = -1;

 const releaseInk = () => {
  inkPointerId = -1;
  inkIsTouch = false;
 };

 return {
  /**
   * `draws`: this pointer starts a stroke. `pans`: this finger scrolls the
   * page. `discardActive`: the touch stroke in progress must be taken back.
   * `penArrived`: a stylus touched the page.
   */
  down(pointer: InkPointer, { canInk, touchInk }: { canInk: boolean; touchInk: boolean }) {
   const isTouch = pointer.pointerType === "touch";
   const isPen = pointer.pointerType === "pen";
   if (isTouch) {
    // A primary pointer starts a new touch sequence: forget fingers whose
    // pointerup never reached the layer.
    if (pointer.isPrimary) touches.clear();
    touches.add(pointer.pointerId);
   }
   const discardActive = inkPointerId !== -1 && inkIsTouch && (isPen || touches.size > 1);
   if (discardActive) releaseInk();
   if (isPen || touches.size > 1) panPointerId = -1;
   const penIsInking = inkPointerId !== -1 && !inkIsTouch;
   const singleTouch = isTouch && touches.size === 1 && !penIsInking;
   const draws = canInk && (isTouch ? singleTouch && touchInk : inkPointerId === -1);
   const pans = singleTouch && !draws;
   if (draws) {
    inkPointerId = pointer.pointerId;
    inkIsTouch = isTouch;
   }
   if (pans) panPointerId = pointer.pointerId;
   return { draws, pans, discardActive, penArrived: isPen };
  },
  /** Whether a move continues the stroke this pointer started. */
  inks(pointer: InkPointer) {
   return inkPointerId !== -1 && pointer.pointerId === inkPointerId;
  },
  /** Whether a move continues this finger's pan. */
  pans(pointer: InkPointer) {
   return panPointerId !== -1 && pointer.pointerId === panPointerId;
  },
  up(pointer: InkPointer) {
   touches.delete(pointer.pointerId);
   if (pointer.pointerId === inkPointerId) releaseInk();
   if (pointer.pointerId === panPointerId) panPointerId = -1;
  },
 };
}
