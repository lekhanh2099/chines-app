export type ReaderSourceKind =
 | "reader-resource"
 | "lesson"
 | "article"
 | "plain-text"
 | "conversation";

export type ReaderSegmentKind = "paragraph" | "sentence" | "dialogue-turn" | "quote" | "heading";

export type ReaderContentCapability =
 | "pinyin"
 | "translation"
 | "vocabulary"
 | "exercises"
 | "analysis"
 | "summary";

export type ReaderDocumentSource = {
 kind: ReaderSourceKind;
 sourceId?: string;
 href?: string;
 label?: string;
};

export type ReaderSpeaker = {
 id?: string;
 label: string;
};

export type ReaderSegment = {
 id: string;
 kind: ReaderSegmentKind;
 sectionId?: string;
 zh: string;
 pinyin?: string;
 vi?: string;
 role?: string;
 speaker?: ReaderSpeaker;
 speechText?: string;
};

export type ReaderSection = {
 id: string;
 title: string;
 segmentIds: readonly string[];
};

export type ReaderMetadataItem = {
 id: string;
 label: string;
 value: string;
};

export type ReaderDocumentModel = {
 id: string;
 language: "zh-CN";
 source: ReaderDocumentSource;
 title?: string;
 titlePinyin?: string;
 titleVi?: string;
 sections: readonly ReaderSection[];
 segments: readonly ReaderSegment[];
 metadata: readonly ReaderMetadataItem[];
 capabilities: readonly ReaderContentCapability[];
};

export type ReaderSelectionAnchor = {
 documentId: string;
 segmentId: string;
 startOffset: number;
 endOffset: number;
};
