declare module "hanzi-writer" {
  export type HanziWriterOptions = {
    width?: number;
    height?: number;
    padding?: number;

    showOutline?: boolean;
    showCharacter?: boolean;

    strokeAnimationSpeed?: number;
    strokeHighlightSpeed?: number;
    delayBetweenStrokes?: number;
    delayBetweenLoops?: number;

    strokeColor?: string;
    radicalColor?: string;
    highlightColor?: string;
    outlineColor?: string;
    drawingColor?: string;

    showHintAfterMisses?: number;
    highlightOnComplete?: boolean;
    leniency?: number;

    charDataLoader?: (
      character: string,
      onComplete?: (data: unknown) => void,
      onError?: (reason: unknown) => void,
    ) => unknown;
  };

  export type HanziWriterInstance = {
    animateCharacter: () => Promise<unknown> | void;
    quiz: (options?: unknown) => Promise<unknown> | void;
    showCharacter: () => Promise<unknown> | void;
    hideCharacter: () => Promise<unknown> | void;
    showOutline: () => Promise<unknown> | void;
    hideOutline: () => Promise<unknown> | void;
    updateColor: (...args: unknown[]) => Promise<unknown> | void;
  };

  const HanziWriter: {
    create: (
      element: string | HTMLElement,
      character: string,
      options?: HanziWriterOptions,
    ) => HanziWriterInstance;

    loadCharacterData: (character: string) => Promise<unknown>;
  };

  export default HanziWriter;
}
