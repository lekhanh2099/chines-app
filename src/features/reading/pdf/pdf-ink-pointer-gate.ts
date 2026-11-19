import type { PointerEvent } from "react";

type InkPointer = Pick<
 PointerEvent,
 "pointerId" | "pointerType" | "isPrimary" | "clientX" | "clientY" | "timeStamp"
>;

/** A tap is quick and still: fingers land together, barely move, and lift soon. */
const TAP_MAX_DURATION_MS = 400;
const TAP_MAX_LANDING_SPREAD_MS = 200;
const TAP_MAX_TRAVEL_PX = 12;
/** Touches this soon after the pen are a hand settling between strokes, not a tap. */
const TAP_QUIET_AFTER_PEN_MS = 600;

/**
 * Decides what each pointer on a PDF ink layer does while a drawing tool is
 * active. The layer captures every touch (iPad Safari also applies
 * `touch-action` to Apple Pencil, so letting fingers pan natively would make
 * the pencil scroll too), and this gate splits them:
 * - one pointer inks at a time;
 * - a finger inks only with finger ink on, otherwise it pans the page;
 * - a second finger turns a touch stroke or pan into a pinch;
 * - while a pen is down, or the moment one lands, touches are a resting palm:
 *   they neither ink nor pan, and a palm stroke in progress is taken back;
 * - a quick two- or three-finger tap (as in GoodNotes) is reported when the
 *   last finger lifts, for undo and redo.
 */
export function createPdfInkPointerGate() {
 const touches = new Set<number>();
 let inkPointerId = -1;
 let inkIsTouch = false;
 let panPointerId = -1;
 // The touch sequence in progress, for tap detection.
 const origins = new Map<number, { x: number; y: number }>();
 let sequence = { start: 0, lastLanding: 0, fingers: 0, still: true, pen: false };
 let lastPenAt = -Infinity;

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
   if (isPen) {
    lastPenAt = pointer.timeStamp;
    sequence.pen = true;
   }
   if (isTouch) {
    // A primary pointer starts a new touch sequence: forget fingers whose
    // pointerup never reached the layer.
    if (pointer.isPrimary) touches.clear();
    if (!touches.size) {
     origins.clear();
     sequence = {
      start: pointer.timeStamp,
      lastLanding: pointer.timeStamp,
      fingers: 0,
      still: true,
      pen: pointer.timeStamp - lastPenAt < TAP_QUIET_AFTER_PEN_MS,
     };
    }
    touches.add(pointer.pointerId);
    origins.set(pointer.pointerId, { x: pointer.clientX, y: pointer.clientY });
    sequence.fingers = Math.max(sequence.fingers, touches.size);
    sequence.lastLanding = pointer.timeStamp;
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
  /** Notes a move, so a finger that travels is not counted as a tap. */
  track(pointer: InkPointer) {
   if (pointer.pointerType === "pen") lastPenAt = pointer.timeStamp;
   const origin = origins.get(pointer.pointerId);
   if (!origin) return;
   if (Math.hypot(pointer.clientX - origin.x, pointer.clientY - origin.y) > TAP_MAX_TRAVEL_PX) {
    sequence.still = false;
   }
  },
  /** Whether a move continues the stroke this pointer started. */
  inks(pointer: InkPointer) {
   return inkPointerId !== -1 && pointer.pointerId === inkPointerId;
  },
  /** Whether a move continues this finger's pan. */
  pans(pointer: InkPointer) {
   return panPointerId !== -1 && pointer.pointerId === panPointerId;
  },
  /** `tapFingers`: 2 or 3 when this lift ends a quick multi-finger tap, else 0. */
  up(pointer: InkPointer) {
   if (pointer.pointerType === "pen") lastPenAt = pointer.timeStamp;
   const wasTouch = touches.delete(pointer.pointerId);
   if (pointer.pointerId === inkPointerId) releaseInk();
   if (pointer.pointerId === panPointerId) panPointerId = -1;
   if (!wasTouch || touches.size) return { tapFingers: 0 };
   const { start, lastLanding, fingers, still, pen } = sequence;
   const tapped =
    still &&
    !pen &&
    (fingers === 2 || fingers === 3) &&
    lastLanding - start <= TAP_MAX_LANDING_SPREAD_MS &&
    pointer.timeStamp - start <= TAP_MAX_DURATION_MS;
   return { tapFingers: tapped ? fingers : 0 };
  },
 };
}
