import { deriveSegmentContentCapabilities } from "../model/reader-capabilities";
import type { ReaderDocumentModel, ReaderSegment } from "../model/reader-document.types";

export type PlainTextReaderInput = {
 id: string;
 text: string;
 title?: string;
 sourceLabel?: string;
};

function splitPlainTextBlocks(text: string): readonly string[] {
 return text
  .replaceAll("\r\n", "\n")
  .split(/\n\s*\n/u)
  .map((block) => block.trim())
  .filter((block) => block.length > 0);
}

export function plainTextToReaderDocument(input: PlainTextReaderInput): ReaderDocumentModel {
 const segments: readonly ReaderSegment[] = splitPlainTextBlocks(input.text).map((zh, index) => ({
  id: `${input.id}:segment:${index + 1}`,
  kind: "paragraph",
  zh,
  speechText: zh,
 }));

 return {
  id: input.id,
  language: "zh-CN",
  source: {
   kind: "plain-text",
   sourceId: input.id,
   label: input.sourceLabel?.trim() || undefined,
  },
  title: input.title?.trim() || undefined,
  sections: [],
  segments,
  metadata: [],
  capabilities: deriveSegmentContentCapabilities(segments),
 };
}
