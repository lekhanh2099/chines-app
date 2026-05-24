"use client";

import { useEffect, useId, useRef } from "react";
import { PenLine, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

type HanziWriterInstance = {
 animateCharacter: () => Promise<unknown> | void;
 quiz: () => Promise<unknown> | void;
 showCharacter: () => Promise<unknown> | void;
 showOutline: () => Promise<unknown> | void;
};

type HanziStrokeWriterProps = {
 character: string;
 size?: number;
 autoPlay?: boolean;
 onRelay?: () => void;
 showActions?: boolean;
 className?: string;
};

export function HanziStrokeWriter({
 character,
 size = 180,
 autoPlay = false,
 showActions = true,
 className = "",
 onRelay,
}: HanziStrokeWriterProps) {
 const reactId = useId();
 const targetId = `hanzi-writer-${reactId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
 const writerRef = useRef<HanziWriterInstance | null>(null);

 useEffect(() => {
  let mounted = true;

  async function setupWriter() {
   const target = document.getElementById(targetId);
   if (!target) return;

   target.innerHTML = "";

   const hanziWriterModule = await import("hanzi-writer");
   if (!mounted) return;

   const HanziWriter = hanziWriterModule.default;

   const writer = HanziWriter.create(targetId, character, {
    width: size,
    height: size,
    padding: 10,
    showOutline: true,
    showCharacter: true,
    strokeAnimationSpeed: 1,
    strokeHighlightSpeed: 1,
    delayBetweenStrokes: 90,
    delayBetweenLoops: 700,
    strokeColor: "#1f2937",
    radicalColor: "#2563eb",
    outlineColor: "#e5e7eb",
    highlightColor: "#ef4444",
    drawingColor: "#ef4444",
    showHintAfterMisses: 1,
    highlightOnComplete: true,
   }) as HanziWriterInstance;

   writerRef.current = writer;

   if (autoPlay) {
    window.setTimeout(() => {
     void writer.animateCharacter();
    }, 150);
   }
  }

  setupWriter();

  return () => {
   mounted = false;
   const target = document.getElementById(targetId);
   if (target) target.innerHTML = "";
   writerRef.current = null;
  };
 }, [autoPlay, character, size, targetId]);

 return (
  <div
   className={["grid w-fit gap-3", className].join(" ")}
   onClick={(event) => event.stopPropagation()}
   onMouseDown={(event) => event.stopPropagation()}
   onTouchStart={(event) => event.stopPropagation()}
  >
   <div className="rounded-lg border border-border-default bg-bg-primary relative w-fit h-fit">
    <div
     id={targetId}
     style={{ width: size, height: size }}
     aria-label={`Nét viết chữ ${character}`}
    />
    <button
     type="button"
     onClick={onRelay}
     className="absolute top-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-bg-subtle text-text-muted transition-colors hover:bg-accent-subtle hover:text-text-primary"
     aria-label="Phát lại nét viết"
    >
     <RotateCcw className="h-4 w-4" />
    </button>
   </div>

   {showActions && (
    <div className="grid grid-cols-2 gap-2">
     <Button
      type="button"
      variant="outline"
      onClick={() => writerRef.current?.animateCharacter()}
     >
      <Play className="h-4 w-4" />
      Nét viết
     </Button>

     <Button
      type="button"
      variant="outline"
      onClick={() => writerRef.current?.quiz()}
     >
      <PenLine className="h-4 w-4" />
      Tập viết
     </Button>
    </div>
   )}

   {!showActions && (
    <button
     type="button"
     className="hidden"
     data-hanzi-quiz-trigger
     onClick={() => writerRef.current?.quiz()}
    />
   )}
  </div>
 );
}
