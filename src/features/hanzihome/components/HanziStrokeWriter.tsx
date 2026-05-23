"use client";

import { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";

type HanziWriterInstance = {
  animateCharacter: () => Promise<void> | void;
  quiz: () => void;
  showCharacter: () => Promise<void> | void;
  showOutline: () => Promise<void> | void;
};

type HanziStrokeWriterProps = {
  character: string;
  size?: number;
};

export function HanziStrokeWriter({
  character,
  size = 96,
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

      writerRef.current = HanziWriter.create(targetId, character, {
        width: size,
        height: size,
        padding: 6,
        showOutline: true,
        showCharacter: true,
        delayBetweenStrokes: 80,
        strokeAnimationSpeed: 1,
      }) as HanziWriterInstance;
    }

    setupWriter();

    return () => {
      mounted = false;
      const target = document.getElementById(targetId);
      if (target) target.innerHTML = "";
      writerRef.current = null;
    };
  }, [character, size, targetId]);

  return (
    <div
      className="grid w-fit gap-2 rounded-2xl border border-border-default bg-bg-card p-3"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
    >
      <div
        id={targetId}
        className="rounded-xl bg-bg-primary"
        style={{ width: size, height: size }}
        aria-label={`Nét viết chữ ${character}`}
      />

      <div className="flex flex-wrap justify-center gap-1.5">
        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={() => writerRef.current?.animateCharacter()}
        >
          Vẽ nét
        </Button>

        <Button
          type="button"
          size="xs"
          variant="outline"
          onClick={() => writerRef.current?.quiz()}
        >
          Tập viết
        </Button>
      </div>
    </div>
  );
}
