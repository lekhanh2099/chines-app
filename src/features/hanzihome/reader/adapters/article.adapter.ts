import { deriveSegmentContentCapabilities } from "../model/reader-capabilities";
import type {
 ReaderDocumentModel,
 ReaderMetadataItem,
 ReaderSegment,
} from "../model/reader-document.types";

export type ReaderArticleParagraph = {
 id: string;
 order: number;
 zh: string;
 pinyin?: string;
 vi?: string;
};

export type ReaderArticleInput = {
 id: string;
 title: string;
 titlePinyin?: string;
 titleVi?: string;
 sourceLabel?: string;
 sourceHref?: string;
 metadata?: readonly ReaderMetadataItem[];
 paragraphs: readonly ReaderArticleParagraph[];
};

function optionalText(value: string | undefined): string | undefined {
 const normalized = value?.trim() ?? "";
 return normalized.length > 0 ? normalized : undefined;
}

export function articleToReaderDocument(input: ReaderArticleInput): ReaderDocumentModel {
 const segments: readonly ReaderSegment[] = input.paragraphs
  .slice()
  .sort((left, right) => left.order - right.order)
  .map<ReaderSegment>((paragraph) => ({
   id: paragraph.id,
   kind: "paragraph",
   zh: paragraph.zh.trim(),
   pinyin: optionalText(paragraph.pinyin),
   vi: optionalText(paragraph.vi),
   speechText: paragraph.zh.trim(),
  }))
  .filter((segment) => segment.zh.length > 0);

 return {
  id: input.id,
  language: "zh-CN",
  source: {
   kind: "article",
   sourceId: input.id,
   href: optionalText(input.sourceHref),
   label: optionalText(input.sourceLabel),
  },
  title: optionalText(input.title),
  titlePinyin: optionalText(input.titlePinyin),
  titleVi: optionalText(input.titleVi),
  sections: [],
  segments,
  metadata: input.metadata ?? [],
  capabilities: deriveSegmentContentCapabilities(segments),
 };
}
