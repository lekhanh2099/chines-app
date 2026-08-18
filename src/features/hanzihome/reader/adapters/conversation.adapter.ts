import { deriveSegmentContentCapabilities } from "../model/reader-capabilities";
import type {
 ReaderDocumentModel,
 ReaderSegment,
 ReaderSpeaker,
} from "../model/reader-document.types";

export type ConversationReaderTurn = {
 id: string;
 order: number;
 zh: string;
 speaker: ReaderSpeaker;
 pinyin?: string;
 vi?: string;
};

export type ConversationReaderInput = {
 id: string;
 title?: string;
 turns: readonly ConversationReaderTurn[];
};

function optionalText(value: string | undefined): string | undefined {
 const normalized = value?.trim() ?? "";
 return normalized.length > 0 ? normalized : undefined;
}

export function conversationToReaderDocument(input: ConversationReaderInput): ReaderDocumentModel {
 const segments: readonly ReaderSegment[] = input.turns
  .slice()
  .sort((left, right) => left.order - right.order)
  .map((turn) => ({
   id: turn.id,
   kind: "dialogue-turn",
   zh: turn.zh.trim(),
   pinyin: optionalText(turn.pinyin),
   vi: optionalText(turn.vi),
   speaker: turn.speaker,
   speechText: turn.zh.trim(),
  }))
  .filter((segment) => segment.zh.length > 0);

 return {
  id: input.id,
  language: "zh-CN",
  source: { kind: "conversation", sourceId: input.id },
  title: optionalText(input.title),
  sections: [],
  segments,
  metadata: [],
  capabilities: deriveSegmentContentCapabilities(segments),
 };
}
