"use client";

import { useEffect, useRef, useState } from "react";
import { PenTool, Play } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { HanziWriterInstance } from "@/features/dictionary/types";

const writerContainerClassName =
 "relative flex aspect-square h-auto w-full max-w-40 items-center justify-center rounded-2xl border border-border-default bg-bg-card text-8xl font-bold text-text-primary";

function getThemeColor(name: string) {
 return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

type CharacterWriterCardProps = {
 character: string;
};

function CharacterWriterCard({ character }: CharacterWriterCardProps) {
 const containerRef = useRef<HTMLDivElement>(null);
 const writerRef = useRef<HanziWriterInstance | null>(null);
 const [quizMode, setQuizMode] = useState(false);

 useEffect(() => {
  if (!containerRef.current || typeof window === "undefined") {
   return;
  }

  const container = containerRef.current;
  let isActive = true;

  writerRef.current?.cancelQuiz?.();
  writerRef.current = null;
  setQuizMode(false);
  container.className = writerContainerClassName;
  container.innerHTML = "";

  const drawGrid = () => {
   if (container.querySelector(".hanzi-grid-bg")) {
    return;
   }

   const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
   svg.setAttribute("class", "hanzi-grid-bg");
   svg.setAttribute("width", "160");
   svg.setAttribute("height", "160");
   svg.style.position = "absolute";
   svg.style.top = "0";
   svg.style.left = "0";
   svg.style.zIndex = "0";
   svg.style.pointerEvents = "none";
   svg.style.opacity = "0.15";
   svg.style.color = getThemeColor("--border");
   svg.innerHTML = `
    <rect width="160" height="160" fill="none" stroke="currentColor" stroke-width="1.5"/>
    <line x1="80" y1="0" x2="80" y2="160" stroke="currentColor" stroke-width="0.8" stroke-dasharray="4,3"/>
    <line x1="0" y1="80" x2="160" y2="80" stroke="currentColor" stroke-width="0.8" stroke-dasharray="4,3"/>
    <line x1="0" y1="0" x2="160" y2="160" stroke="currentColor" stroke-width="0.5" stroke-dasharray="4,3"/>
    <line x1="160" y1="0" x2="0" y2="160" stroke="currentColor" stroke-width="0.5" stroke-dasharray="4,3"/>
   `;
   container.insertBefore(svg, container.firstChild);
  };

  const renderStaticCharacter = () => {
   container.className = writerContainerClassName;
   container.innerHTML = "";
   container.textContent = character;
  };

  void import("hanzi-writer")
   .then(async (HanziWriterModule) => {
    if (!isActive) {
     return;
    }

    const HanziWriter = HanziWriterModule.default;
    const strokeColor = getThemeColor("--foreground");
    const radicalColor = getThemeColor("--primary");
    const outlineColor = getThemeColor("--border");
    const drawingColor = getThemeColor("--destructive");

    try {
     const charData = await HanziWriter.loadCharacterData(character);

     if (!isActive) {
      return;
     }

     drawGrid();
     const writer = HanziWriter.create(container, character, {
      width: 160,
      height: 160,
      padding: 10,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 200,
      strokeColor,
      radicalColor,
      outlineColor,
      drawingColor,
      showOutline: true,
      showCharacter: true,
      charDataLoader: () => charData,
     }) as HanziWriterInstance;

     writerRef.current = writer;
     requestAnimationFrame(() => {
      if (!isActive) {
       return;
      }

      void writer
       .hideCharacter?.({ duration: 0 })
       ?.then(() => writer.animateCharacter?.());
     });
    } catch {
     renderStaticCharacter();
    }
   })
   .catch(() => {
    if (!isActive) {
     return;
    }

    renderStaticCharacter();
   });

  return () => {
   isActive = false;
   writerRef.current?.cancelQuiz?.();
   writerRef.current = null;
   container.innerHTML = "";
  };
 }, [character]);

 const handlePlayAnimation = () => {
  void writerRef.current?.animateCharacter?.();
 };

 const handleQuizMode = () => {
  if (!writerRef.current?.quiz) {
   return;
  }

  setQuizMode(true);
  void writerRef.current.quiz({
   onComplete: () => {
    toast.success("Viết đúng rồi!");
    setQuizMode(false);
   },
  });
 };

 return (
  <div className="flex w-full max-w-full min-w-0 flex-col items-center gap-3 overflow-hidden rounded-2xl border border-border-default bg-bg-primary p-4">
   <div ref={containerRef} className={writerContainerClassName} />

   <div className="flex flex-wrap items-center justify-center gap-2">
    <Button
     variant="outline"
     size="sm"
     className="min-w-0 px-3"
     onClick={handlePlayAnimation}
    >
     <Play className="h-3.5 w-3.5" />
     Nét viết
    </Button>
    <Button
     variant="ghost"
     size="sm"
     className="min-w-0 px-3"
     onClick={handleQuizMode}
     disabled={quizMode}
    >
     <PenTool className="h-3.5 w-3.5" />
     Tập viết
    </Button>
   </div>
  </div>
 );
}

export { CharacterWriterCard };
