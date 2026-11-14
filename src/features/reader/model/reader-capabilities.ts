import type {
 ReaderContentCapability,
 ReaderDocumentModel,
 ReaderSegment,
} from "./reader-document.types";

const capabilityOrder: readonly ReaderContentCapability[] = [
 "pinyin",
 "translation",
 "vocabulary",
 "exercises",
 "analysis",
 "summary",
];

export function createReaderContentCapabilities(
 capabilities: Iterable<ReaderContentCapability>,
): readonly ReaderContentCapability[] {
 const requested = new Set(capabilities);
 return capabilityOrder.filter((capability) => requested.has(capability));
}

export function deriveSegmentContentCapabilities(
 segments: readonly ReaderSegment[],
): readonly ReaderContentCapability[] {
 const capabilities: ReaderContentCapability[] = [];
 if (segments.some((segment) => segment.pinyin !== undefined)) capabilities.push("pinyin");
 if (segments.some((segment) => segment.vi !== undefined)) capabilities.push("translation");
 return createReaderContentCapabilities(capabilities);
}

export function readerHasCapability(
 document: Pick<ReaderDocumentModel, "capabilities">,
 capability: ReaderContentCapability,
): boolean {
 return document.capabilities.includes(capability);
}
