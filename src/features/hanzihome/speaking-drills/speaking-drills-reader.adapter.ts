import type {
 ReaderDocumentModel,
 ReaderSegment,
} from "@/features/reader/model/reader-document.types";

import type { SpeakingDrillVersion } from "./speaking-drills.schemas";
import type { SpeakingDrillSelection } from "./speaking-drills.types";

/** Maps the selected dialogue version onto Reader dialogue turns so the shared Reader owns playback. */
export function buildSpeakingDrillReaderDocument(
 selection: SpeakingDrillSelection,
 version: SpeakingDrillVersion,
): ReaderDocumentModel {
 const { topic } = selection;
 const sectionId = `${topic.id}:${version}`;
 const lines = version === "v1" ? topic.v1Lines : topic.v2Lines;
 const segments: ReaderSegment[] = lines.map((line) => ({
  id: `${sectionId}:${line.n}`,
  kind: "dialogue-turn",
  sectionId,
  zh: line.zh,
  pinyin: line.pinyin,
  vi: line.vi,
  speaker: { id: line.role, label: line.role },
 }));

 return {
  id: sectionId,
  language: "zh-CN",
  source: { kind: "conversation", sourceId: topic.id, label: topic.titleVi },
  sections: [{ id: sectionId, title: "", segmentIds: segments.map((segment) => segment.id) }],
  segments,
  metadata: [],
  capabilities: ["pinyin", "translation"],
 };
}
