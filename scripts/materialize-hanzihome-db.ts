import { createHash } from "node:crypto";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

type DatasetId = "q2" | "q3";

type DatasetConfig = {
  id: DatasetId;
  courseNumber: 2 | 3;
  filePrefix: string;
};

type JsonObject = Record<string, unknown>;

type RelationType =
  | "lesson_vocab_to_vocabulary_item"
  | "vocab_group_to_vocabulary_item"
  | "content_to_vocabulary_item"
  | "content_to_grammar";

type EvidenceSource =
  | "explicit_ref"
  | "hanzi_pinyin_match"
  | "hanzi_match"
  | "synthetic_from_lesson_vocab"
  | "lexical_scan"
  | "group_words";

type Confidence = "exact" | "high" | "medium" | "low";

type NodePointer = {
  id: string;
  kind: string;
  path: string;
};

type RelationEvidence = {
  source: EvidenceSource;
  ref_id?: string;
  matched_text?: string;
  text_offset?: number;
  json_path?: string;
  reason?: string;
};

type Relation = {
  id: string;
  type: RelationType;
  from: NodePointer;
  to: NodePointer;
  evidence: RelationEvidence;
  confidence: Confidence;
  check_needed: boolean;
};

type UnresolvedRecord = {
  id: string;
  type: RelationType;
  from: NodePointer;
  ref_id?: string;
  matched_text?: string;
  reason: string;
  evidence: RelationEvidence;
};

type WarningRecord = {
  id: string;
  type:
    | "ambiguous_hanzi"
    | "missing_group_word_target"
    | "ambiguous_group_word_target"
    | "skipped_single_char_scan"
    | "missing_vocab_source_file";
  owner?: NodePointer;
  term?: string;
  reason: string;
  candidates?: string[];
};

type ContentNode = {
  owner: NodePointer;
  zh: string;
  path: string;
};

type LessonVocabLinkMeta = {
  vocabItemId: string;
  source: EvidenceSource;
  confidence: Confidence;
  checkNeeded: boolean;
  reason?: string;
};

type MaterializedVocabResult = {
  vocabItems: JsonObject[];
  lessonVocabToVocabId: Map<string, string>;
  lessonVocabLinkMetaById: Map<string, LessonVocabLinkMeta>;
  syntheticCount: number;
  hanziOnlyMatchCount: number;
};

const DATASETS: DatasetConfig[] = [
  { id: "q2", courseNumber: 2, filePrefix: "hanyu_2_" },
  { id: "q3", courseNumber: 3, filePrefix: "hanyu_3_" },
];

const REF_KEYS = new Set(["vocab_refs", "grammar_refs"]);

const SKIP_CONTENT_SCAN_OWNER_TYPES = new Set([
  "vocabulary_item",
  "proper_noun",
  "deep_vocabulary_item",
  "materialized_vocabulary_item",
]);

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function objectValue(value: unknown): JsonObject {
  return isObject(value) ? value : {};
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function stringValue(object: JsonObject, key: string): string {
  const value = object[key];

  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);

  return "";
}

function numberValue(object: JsonObject, key: string): number {
  const value = object[key];

  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function booleanValue(object: JsonObject, key: string): boolean {
  return object[key] === true;
}

function readArg(name: string): string | undefined {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);

  return index >= 0 ? args[index + 1] : undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.slice(2).includes(name);
}

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, "utf8")) as unknown;
}

async function writeJson(filePath: string, data: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function stableId(input: unknown): string {
  return createHash("sha1").update(JSON.stringify(input)).digest("hex");
}

function relationId(input: Omit<Relation, "id">): string {
  return `rel_${stableId(input).slice(0, 24)}`;
}

function unresolvedId(input: Omit<UnresolvedRecord, "id">): string {
  return `unresolved_${stableId(input).slice(0, 24)}`;
}

function warningId(input: Omit<WarningRecord, "id">): string {
  return `warning_${stableId(input).slice(0, 24)}`;
}

function joinJsonPath(parent: string, child: string | number): string {
  return parent ? `${parent}.${child}` : String(child);
}

function makeAsciiSlug(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ü/g, "v")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normalizeHanzi(input: string): string {
  return input.replace(/\s+/g, "").trim();
}

function normalizePinyin(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9üv]+/g, "");
}

function makeFileId(id: string, fallback: unknown): string {
  return stableId(id || fallback).slice(0, 8);
}

function getNodeKind(node: JsonObject): string {
  return stringValue(node, "type") || "unknown";
}

function getLessonIndexFromFileName(fileName: string): number {
  const match = /lesson_(\d+)/.exec(fileName);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function getLessonIndex(document: unknown, fallback = 0): number {
  const root = objectValue(document);
  const source = objectValue(root.source);
  const lesson = objectValue(root.lesson);
  const metadata = objectValue(lesson.metadata);

  return (
    numberValue(source, "lesson_index") ||
    numberValue(metadata, "lesson_index") ||
    numberValue(lesson, "lesson_index") ||
    fallback
  );
}

function getVocabLessonIndex(document: unknown, fallback = 0): number {
  const root = objectValue(document);
  const source = objectValue(root.source);

  return numberValue(source, "lesson_index") || fallback;
}

function getLessonId(document: unknown): string {
  const root = objectValue(document);
  const lesson = objectValue(root.lesson);

  return stringValue(lesson, "id");
}

function getLessonTitle(document: unknown) {
  const root = objectValue(document);
  const lesson = objectValue(root.lesson);
  const title = objectValue(lesson.title);
  const metadata = objectValue(lesson.metadata);

  return {
    zh: stringValue(title, "zh") || stringValue(metadata, "lesson_title_cn"),
    pinyin: stringValue(title, "pinyin") || stringValue(metadata, "lesson_title_pinyin"),
    vi: stringValue(title, "vi") || stringValue(metadata, "lesson_title_vi"),
    en: stringValue(title, "en") || stringValue(metadata, "lesson_title_en"),
  };
}

function getSections(document: unknown): JsonObject[] {
  const root = objectValue(document);
  const lesson = objectValue(root.lesson);

  return arrayValue(lesson.sections).map(objectValue);
}

function getDeepVocabItems(document: unknown): JsonObject[] {
  const root = objectValue(document);

  return arrayValue(root.items)
    .map(objectValue)
    .filter((item) => stringValue(item, "id") && stringValue(item, "hanzi"));
}

function getDeepVocabGroups(document: unknown): JsonObject[] {
  const root = objectValue(document);
  const overview = objectValue(root.overview);

  return arrayValue(overview.groups).map(objectValue);
}

function buildNodeIndex(document: unknown): Map<string, NodePointer> {
  const index = new Map<string, NodePointer>();

  function visit(current: unknown, currentPath: string) {
    if (Array.isArray(current)) {
      current.forEach((item, itemIndex) => visit(item, joinJsonPath(currentPath, itemIndex)));
      return;
    }

    const node = objectValue(current);
    if (!Object.keys(node).length) return;

    const id = stringValue(node, "id");
    if (id) {
      index.set(id, {
        id,
        kind: getNodeKind(node),
        path: currentPath,
      });
    }

    for (const [key, child] of Object.entries(node)) {
      visit(child, joinJsonPath(currentPath, key));
    }
  }

  visit(document, "$");

  return index;
}

function collectLessonVocabItems(document: unknown): JsonObject[] {
  const itemsById = new Map<string, JsonObject>();

  function visit(current: unknown) {
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }

    const node = objectValue(current);
    if (!Object.keys(node).length) return;

    const type = stringValue(node, "type");
    const id = stringValue(node, "id");
    const hanzi = stringValue(node, "hanzi");

    if (id && hanzi && ["vocabulary_item", "proper_noun"].includes(type)) {
      itemsById.set(id, node);
    }

    for (const child of Object.values(node)) {
      visit(child);
    }
  }

  visit(document);

  return Array.from(itemsById.values());
}

function collectContentNodes(document: unknown): ContentNode[] {
  const nodes: ContentNode[] = [];

  function visit(current: unknown, currentPath: string, owner: NodePointer) {
    if (Array.isArray(current)) {
      current.forEach((item, itemIndex) =>
        visit(item, joinJsonPath(currentPath, itemIndex), owner),
      );
      return;
    }

    const node = objectValue(current);
    if (!Object.keys(node).length) return;

    const id = stringValue(node, "id");
    const nextOwner = id
      ? {
          id,
          kind: getNodeKind(node),
          path: currentPath,
        }
      : owner;

    const zh = stringValue(node, "zh");

    if (zh && nextOwner.id && !SKIP_CONTENT_SCAN_OWNER_TYPES.has(nextOwner.kind)) {
      nodes.push({
        owner: nextOwner,
        zh,
        path: joinJsonPath(currentPath, "zh"),
      });
    }

    for (const [key, child] of Object.entries(node)) {
      visit(child, joinJsonPath(currentPath, key), nextOwner);
    }
  }

  visit(document, "$", {
    id: "",
    kind: "root",
    path: "$",
  });

  return nodes;
}

function collectExplicitRefs(document: unknown) {
  const refs: Array<{
    refType: "vocab_refs" | "grammar_refs";
    refId: string;
    owner: NodePointer;
    path: string;
  }> = [];

  function visit(current: unknown, currentPath: string, owner: NodePointer) {
    if (Array.isArray(current)) {
      current.forEach((item, itemIndex) =>
        visit(item, joinJsonPath(currentPath, itemIndex), owner),
      );
      return;
    }

    const node = objectValue(current);
    if (!Object.keys(node).length) return;

    const id = stringValue(node, "id");
    const nextOwner = id
      ? {
          id,
          kind: getNodeKind(node),
          path: currentPath,
        }
      : owner;

    for (const [key, child] of Object.entries(node)) {
      if (REF_KEYS.has(key) && Array.isArray(child)) {
        child.forEach((ref, refIndex) => {
          if (typeof ref !== "string" || !ref.trim()) return;

          refs.push({
            refType: key as "vocab_refs" | "grammar_refs",
            refId: ref.trim(),
            owner: nextOwner,
            path: joinJsonPath(joinJsonPath(currentPath, key), refIndex),
          });
        });

        continue;
      }

      visit(child, joinJsonPath(currentPath, key), nextOwner);
    }
  }

  visit(document, "$", {
    id: "",
    kind: "root",
    path: "$",
  });

  return refs;
}

function buildVocabIndexes(items: JsonObject[]) {
  const byId = new Map<string, JsonObject>();
  const byHanzi = new Map<string, JsonObject[]>();
  const byHanziPinyin = new Map<string, JsonObject[]>();

  for (const item of items) {
    const id = stringValue(item, "id");
    const hanzi = normalizeHanzi(stringValue(item, "hanzi"));
    const pinyin = normalizePinyin(stringValue(item, "pinyin"));

    if (!id || !hanzi) continue;

    byId.set(id, item);

    byHanzi.set(hanzi, [...(byHanzi.get(hanzi) ?? []), item]);
    byHanziPinyin.set(`${hanzi}::${pinyin}`, [
      ...(byHanziPinyin.get(`${hanzi}::${pinyin}`) ?? []),
      item,
    ]);
  }

  return {
    byId,
    byHanzi,
    byHanziPinyin,
  };
}

function makeRelation(input: Omit<Relation, "id">): Relation {
  return {
    id: relationId(input),
    ...input,
  };
}

function makeUnresolved(input: Omit<UnresolvedRecord, "id">): UnresolvedRecord {
  return {
    id: unresolvedId(input),
    ...input,
  };
}

function makeWarning(input: Omit<WarningRecord, "id">): WarningRecord {
  return {
    id: warningId(input),
    ...input,
  };
}

function getVocabKind(item: JsonObject): string {
  return stringValue(item, "type") || "materialized_vocabulary_item";
}

function makeVocabPointer(item: JsonObject, filePathById: Map<string, string>): NodePointer {
  const id = stringValue(item, "id");

  return {
    id,
    kind: getVocabKind(item),
    path: filePathById.get(id) || "",
  };
}

function makeVocabItemFileName(item: JsonObject, index: number): string {
  const id = stringValue(item, "id");
  const pinyin = stringValue(item, "pinyin");
  const hanzi = stringValue(item, "hanzi");

  const readable = makeAsciiSlug(pinyin) || makeAsciiSlug(hanzi) || "vocab";
  const fileId = makeFileId(id, item);

  return `${String(index + 1).padStart(3, "0")}-${readable}-${fileId}.json`;
}

function makeSectionFileName(section: JsonObject, index: number): string {
  const type = stringValue(section, "type") || "section";
  const title = stringValue(section, "title") || type;
  const readable = makeAsciiSlug(type) || makeAsciiSlug(title) || "section";

  return `${String(index + 1).padStart(2, "0")}-${readable}.json`;
}

function createMaterializedVocabItems(params: {
  lessonId: string;
  lessonVocabItems: JsonObject[];
  deepItems: JsonObject[];
}): MaterializedVocabResult {
  const vocabItems: JsonObject[] = [];
  const lessonVocabToVocabId = new Map<string, string>();
  const lessonVocabLinkMetaById = new Map<string, LessonVocabLinkMeta>();
  const syntheticByHanziPinyin = new Map<string, JsonObject>();

  let syntheticCount = 0;
  let hanziOnlyMatchCount = 0;

  for (const deepItem of params.deepItems) {
    const sourceDeepId = stringValue(deepItem, "id");

    vocabItems.push({
      ...deepItem,
      materialized: {
        kind: "source_deep_vocab",
        source_deep_vocab_id: sourceDeepId,
        source_lesson_vocab_id: null,
      },
      check_needed: booleanValue(deepItem, "check_needed"),
    });
  }

  const deepIndexes = buildVocabIndexes(vocabItems);

  for (const lessonItem of params.lessonVocabItems) {
    const lessonVocabId = stringValue(lessonItem, "id");
    const hanziRaw = stringValue(lessonItem, "hanzi");
    const pinyinRaw = stringValue(lessonItem, "pinyin");
    const hanzi = normalizeHanzi(hanziRaw);
    const pinyin = normalizePinyin(pinyinRaw);
    const hpKey = `${hanzi}::${pinyin}`;

    const hpMatches = deepIndexes.byHanziPinyin.get(hpKey) ?? [];
    const hanziMatches = deepIndexes.byHanzi.get(hanzi) ?? [];

    if (hpMatches.length === 1) {
      const vocabId = stringValue(hpMatches[0], "id");

      lessonVocabToVocabId.set(lessonVocabId, vocabId);
      lessonVocabLinkMetaById.set(lessonVocabId, {
        vocabItemId: vocabId,
        source: "hanzi_pinyin_match",
        confidence: "exact",
        checkNeeded: false,
      });

      continue;
    }

    if (hpMatches.length === 0 && hanziMatches.length === 1) {
      const vocabId = stringValue(hanziMatches[0], "id");
      hanziOnlyMatchCount += 1;

      lessonVocabToVocabId.set(lessonVocabId, vocabId);
      lessonVocabLinkMetaById.set(lessonVocabId, {
        vocabItemId: vocabId,
        source: "hanzi_match",
        confidence: "medium",
        checkNeeded: true,
        reason: "Matched by hanzi only because pinyin did not exactly match.",
      });

      continue;
    }

    const syntheticKey = hpKey || `${hanzi}::${lessonVocabId}`;
    let syntheticItem = syntheticByHanziPinyin.get(syntheticKey);

    if (!syntheticItem) {
      const syntheticId = `synthetic_vocab_${stableId({
        lessonId: params.lessonId,
        hanzi: hanziRaw,
        pinyin: pinyinRaw,
      }).slice(0, 16)}`;

      const reason =
        hpMatches.length > 1 || hanziMatches.length > 1
          ? "Created synthetic item because source vocab match is ambiguous."
          : "Created synthetic item because no source deep vocab item matched.";

      syntheticItem = {
        id: syntheticId,
        type: "materialized_vocabulary_item",
        hanzi: hanziRaw,
        pinyin: pinyinRaw,
        meaning_vi:
          stringValue(lessonItem, "meaning_vi") ||
          stringValue(lessonItem, "vi") ||
          stringValue(lessonItem, "meaning") ||
          "",
        pos: stringValue(lessonItem, "pos"),
        pos_detail: objectValue(lessonItem.pos_detail),
        materialized: {
          kind: "synthetic_from_lesson_vocab",
          source_deep_vocab_id: null,
          source_lesson_vocab_id: lessonVocabId,
          reason,
        },
        original_lesson_vocab_item: lessonItem,
        check_needed: true,
        check_reason: reason,
      };

      syntheticByHanziPinyin.set(syntheticKey, syntheticItem);
      vocabItems.push(syntheticItem);
      syntheticCount += 1;
    }

    const syntheticId = stringValue(syntheticItem, "id");

    lessonVocabToVocabId.set(lessonVocabId, syntheticId);
    lessonVocabLinkMetaById.set(lessonVocabId, {
      vocabItemId: syntheticId,
      source: "synthetic_from_lesson_vocab",
      confidence: "medium",
      checkNeeded: true,
      reason: stringValue(objectValue(syntheticItem.materialized), "reason"),
    });
  }

  return {
    vocabItems,
    lessonVocabToVocabId,
    lessonVocabLinkMetaById,
    syntheticCount,
    hanziOnlyMatchCount,
  };
}

function createLessonVocabRelations(params: {
  lessonVocabItems: JsonObject[];
  lessonNodeIndex: Map<string, NodePointer>;
  vocabItems: JsonObject[];
  vocabItemFilePathById: Map<string, string>;
  lessonVocabToVocabId: Map<string, string>;
  lessonVocabLinkMetaById: Map<string, LessonVocabLinkMeta>;
}): Relation[] {
  const vocabById = buildVocabIndexes(params.vocabItems).byId;
  const relations: Relation[] = [];

  for (const lessonItem of params.lessonVocabItems) {
    const lessonVocabId = stringValue(lessonItem, "id");
    const vocabId = params.lessonVocabToVocabId.get(lessonVocabId);
    const vocabItem = vocabId ? vocabById.get(vocabId) : undefined;
    const meta = params.lessonVocabLinkMetaById.get(lessonVocabId);

    if (!vocabId || !vocabItem || !meta) continue;

    const from =
      params.lessonNodeIndex.get(lessonVocabId) ??
      ({
        id: lessonVocabId,
        kind: "vocabulary_item",
        path: "",
      } satisfies NodePointer);

    relations.push(
      makeRelation({
        type: "lesson_vocab_to_vocabulary_item",
        from,
        to: makeVocabPointer(vocabItem, params.vocabItemFilePathById),
        evidence: {
          source: meta.source,
          matched_text: stringValue(lessonItem, "hanzi"),
          reason: meta.reason,
        },
        confidence: meta.confidence,
        check_needed: meta.checkNeeded,
      }),
    );
  }

  return relations;
}

function createGroupRelations(params: {
  groups: JsonObject[];
  vocabItems: JsonObject[];
  lessonId: string;
  vocabItemFilePathById: Map<string, string>;
}) {
  const indexes = buildVocabIndexes(params.vocabItems);
  const relations: Relation[] = [];
  const warnings: WarningRecord[] = [];

  params.groups.forEach((group, groupIndex) => {
    const groupId =
      stringValue(group, "id") ||
      `vocab_group_${stableId({
        lessonId: params.lessonId,
        groupIndex,
        title: stringValue(group, "title_vi") || stringValue(group, "title"),
      }).slice(0, 16)}`;

    const groupPointer: NodePointer = {
      id: groupId,
      kind: "vocab_group",
      path: `$.overview.groups.${groupIndex}`,
    };

    const words = arrayValue(group.words).filter(
      (word): word is string => typeof word === "string",
    );

    for (const word of words) {
      const hanzi = normalizeHanzi(word);
      const matches = indexes.byHanzi.get(hanzi) ?? [];

      if (matches.length === 1) {
        relations.push(
          makeRelation({
            type: "vocab_group_to_vocabulary_item",
            from: groupPointer,
            to: makeVocabPointer(matches[0], params.vocabItemFilePathById),
            evidence: {
              source: "group_words",
              matched_text: word,
            },
            confidence: "high",
            check_needed: false,
          }),
        );

        continue;
      }

      warnings.push(
        makeWarning({
          type: matches.length > 1 ? "ambiguous_group_word_target" : "missing_group_word_target",
          owner: groupPointer,
          term: word,
          reason:
            matches.length > 1
              ? "Group word matched multiple vocabulary items by hanzi."
              : "Group word did not match any materialized vocabulary item.",
          candidates: matches.map((item) => stringValue(item, "id")),
        }),
      );
    }
  });

  return {
    relations,
    warnings,
  };
}

function createExplicitRelations(params: {
  lessonDocument: unknown;
  lessonNodeIndex: Map<string, NodePointer>;
  vocabItems: JsonObject[];
  vocabItemFilePathById: Map<string, string>;
  lessonVocabToVocabId: Map<string, string>;
}) {
  const indexes = buildVocabIndexes(params.vocabItems);
  const relations: Relation[] = [];
  const unresolved: UnresolvedRecord[] = [];

  for (const ref of collectExplicitRefs(params.lessonDocument)) {
    if (!ref.owner.id) continue;

    if (ref.refType === "grammar_refs") {
      const grammarTarget = params.lessonNodeIndex.get(ref.refId);

      if (!grammarTarget) {
        unresolved.push(
          makeUnresolved({
            type: "content_to_grammar",
            from: ref.owner,
            ref_id: ref.refId,
            reason: "grammar_refs target id was not found in the lesson document.",
            evidence: {
              source: "explicit_ref",
              ref_id: ref.refId,
              json_path: ref.path,
            },
          }),
        );

        continue;
      }

      relations.push(
        makeRelation({
          type: "content_to_grammar",
          from: ref.owner,
          to: grammarTarget,
          evidence: {
            source: "explicit_ref",
            ref_id: ref.refId,
            json_path: ref.path,
          },
          confidence: "exact",
          check_needed: false,
        }),
      );

      continue;
    }

    const mappedVocabId = params.lessonVocabToVocabId.get(ref.refId);
    const directVocabItem = indexes.byId.get(ref.refId);
    const mappedVocabItem = mappedVocabId ? indexes.byId.get(mappedVocabId) : undefined;
    const targetVocabItem = directVocabItem ?? mappedVocabItem;

    if (!targetVocabItem) {
      unresolved.push(
        makeUnresolved({
          type: "content_to_vocabulary_item",
          from: ref.owner,
          ref_id: ref.refId,
          reason:
            "vocab_refs target was not found in lesson vocab mapping or materialized vocabulary items.",
          evidence: {
            source: "explicit_ref",
            ref_id: ref.refId,
            json_path: ref.path,
          },
        }),
      );

      continue;
    }

    relations.push(
      makeRelation({
        type: "content_to_vocabulary_item",
        from: ref.owner,
        to: makeVocabPointer(targetVocabItem, params.vocabItemFilePathById),
        evidence: {
          source: "explicit_ref",
          ref_id: ref.refId,
          json_path: ref.path,
        },
        confidence: "exact",
        check_needed: false,
      }),
    );
  }

  return {
    relations,
    unresolved,
  };
}

function rangesOverlap(range: [number, number], existingRanges: Array<[number, number]>): boolean {
  return existingRanges.some(([start, end]) => range[0] < end && range[1] > start);
}

function buildLexicalCandidates(params: {
  vocabItems: JsonObject[];
  includeSingleCharScan: boolean;
}) {
  const indexes = buildVocabIndexes(params.vocabItems);
  const candidates: Array<{ hanzi: string; item: JsonObject }> = [];
  const skippedAmbiguousTerms: Array<{ hanzi: string; items: JsonObject[] }> = [];
  const skippedSingleCharTerms: string[] = [];

  for (const [hanzi, items] of indexes.byHanzi.entries()) {
    if (!hanzi) continue;

    if (!params.includeSingleCharScan && hanzi.length < 2) {
      skippedSingleCharTerms.push(hanzi);
      continue;
    }

    if (items.length !== 1) {
      skippedAmbiguousTerms.push({ hanzi, items });
      continue;
    }

    candidates.push({ hanzi, item: items[0] });
  }

  candidates.sort((a, b) => b.hanzi.length - a.hanzi.length || a.hanzi.localeCompare(b.hanzi));

  return {
    candidates,
    skippedAmbiguousTerms,
    skippedSingleCharTerms,
  };
}

function createLexicalScanRelations(params: {
  lessonDocument: unknown;
  vocabItems: JsonObject[];
  vocabItemFilePathById: Map<string, string>;
  existingContentToVocabRelations: Relation[];
  includeSingleCharScan: boolean;
}) {
  const relations: Relation[] = [];
  const warnings: WarningRecord[] = [];

  const existingOwnerTargetPairs = new Set(
    params.existingContentToVocabRelations
      .filter((relation) => relation.type === "content_to_vocabulary_item")
      .map((relation) => `${relation.from.id}::${relation.to.id}`),
  );

  const lexical = buildLexicalCandidates({
    vocabItems: params.vocabItems,
    includeSingleCharScan: params.includeSingleCharScan,
  });

  if (lexical.skippedSingleCharTerms.length > 0) {
    warnings.push(
      makeWarning({
        type: "skipped_single_char_scan",
        reason:
          "Single-character vocabulary terms were skipped during lexical scan to avoid noisy false-positive matches. Pass --include-single-char-scan to include them.",
        candidates: lexical.skippedSingleCharTerms.slice(0, 200),
      }),
    );
  }

  for (const skipped of lexical.skippedAmbiguousTerms) {
    warnings.push(
      makeWarning({
        type: "ambiguous_hanzi",
        term: skipped.hanzi,
        reason: "Lexical scan skipped this hanzi because it maps to multiple vocabulary items.",
        candidates: skipped.items.map((item) => stringValue(item, "id")),
      }),
    );
  }

  for (const contentNode of collectContentNodes(params.lessonDocument)) {
    const occupiedRanges: Array<[number, number]> = [];

    for (const candidate of lexical.candidates) {
      const term = candidate.hanzi;
      let offset = contentNode.zh.indexOf(term);

      while (offset >= 0) {
        const range: [number, number] = [offset, offset + term.length];

        if (!rangesOverlap(range, occupiedRanges)) {
          occupiedRanges.push(range);

          const vocabId = stringValue(candidate.item, "id");
          const pairKey = `${contentNode.owner.id}::${vocabId}`;

          if (!existingOwnerTargetPairs.has(pairKey)) {
            relations.push(
              makeRelation({
                type: "content_to_vocabulary_item",
                from: contentNode.owner,
                to: makeVocabPointer(candidate.item, params.vocabItemFilePathById),
                evidence: {
                  source: "lexical_scan",
                  matched_text: term,
                  text_offset: offset,
                  json_path: contentNode.path,
                },
                confidence: "high",
                check_needed: false,
              }),
            );
          }
        }

        offset = contentNode.zh.indexOf(term, offset + term.length);
      }
    }
  }

  return {
    relations,
    warnings,
  };
}

function dedupeRelations(relations: Relation[]): Relation[] {
  const map = new Map<string, Relation>();

  for (const relation of relations) {
    map.set(relation.id, relation);
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.from.path !== b.from.path) return a.from.path.localeCompare(b.from.path);
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return a.id.localeCompare(b.id);
  });
}

function dedupeUnresolved(items: UnresolvedRecord[]): UnresolvedRecord[] {
  const map = new Map<string, UnresolvedRecord>();

  for (const item of items) {
    map.set(item.id, item);
  }

  return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
}

function dedupeWarnings(items: WarningRecord[]): WarningRecord[] {
  const map = new Map<string, WarningRecord>();

  for (const item of items) {
    map.set(item.id, item);
  }

  return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
}

function countBy<T extends string>(items: T[]): Record<T, number> {
  const result = {} as Record<T, number>;

  for (const item of items) {
    result[item] = (result[item] ?? 0) + 1;
  }

  return result;
}

function relationCountsByType(relations: Relation[]) {
  return countBy(relations.map((relation) => relation.type));
}

async function findJsonFiles(dir: string, prefix: string): Promise<string[]> {
  const files = await readdir(dir);

  return files.filter((file) => file.endsWith(".json") && file.startsWith(prefix)).sort();
}

async function materializeDataset(
  config: DatasetConfig,
  options: {
    outputRoot: string;
    clean: boolean;
    includeSingleCharScan: boolean;
    lexicalScan: boolean;
  },
) {
  const inputRoot = path.join(process.cwd(), "data/hanzihome", config.id);
  const lessonDir = path.join(inputRoot, "lessons");
  const vocabDir = path.join(inputRoot, "vocab");
  const outputDatasetRoot = path.join(process.cwd(), options.outputRoot, config.id);

  if (options.clean) {
    await rm(outputDatasetRoot, { recursive: true, force: true });
  }

  const lessonFiles = await findJsonFiles(lessonDir, config.filePrefix);
  const vocabFiles = await findJsonFiles(vocabDir, config.filePrefix);
  const vocabByLessonIndex = new Map<number, { fileName: string; document: unknown }>();

  for (const fileName of vocabFiles) {
    const document = await readJson(path.join(vocabDir, fileName));
    const lessonIndex = getVocabLessonIndex(document, getLessonIndexFromFileName(fileName));

    if (lessonIndex) {
      vocabByLessonIndex.set(lessonIndex, { fileName, document });
    }
  }

  const manifestLessons: unknown[] = [];

  const datasetTotals = {
    lessons: 0,
    sections: 0,
    lessonVocabItems: 0,
    sourceDeepVocabItems: 0,
    materializedVocabItems: 0,
    syntheticVocabItems: 0,
    relations: 0,
    checkNeededRelations: 0,
    checkNeededVocabItems: 0,
    unresolved: 0,
    warnings: 0,
  };

  for (const lessonFileName of lessonFiles) {
    const lessonDocument = await readJson(path.join(lessonDir, lessonFileName));
    const lessonIndex = getLessonIndex(lessonDocument, getLessonIndexFromFileName(lessonFileName));
    const lessonId = getLessonId(lessonDocument);
    const lessonTitle = getLessonTitle(lessonDocument);
    const lessonFolderName = `lesson_${String(lessonIndex).padStart(2, "0")}`;
    const lessonOutputRoot = path.join(outputDatasetRoot, "lessons", lessonFolderName);

    const vocabSource = vocabByLessonIndex.get(lessonIndex);
    const deepVocabDocument = vocabSource?.document ?? null;
    const deepItems = deepVocabDocument ? getDeepVocabItems(deepVocabDocument) : [];
    const groups = deepVocabDocument ? getDeepVocabGroups(deepVocabDocument) : [];

    const sections = getSections(lessonDocument);
    const lessonNodeIndex = buildNodeIndex(lessonDocument);
    const lessonVocabItems = collectLessonVocabItems(lessonDocument);

    const materialized = createMaterializedVocabItems({
      lessonId,
      lessonVocabItems,
      deepItems,
    });

    const vocabItems = materialized.vocabItems;
    const vocabItemFilePathById = new Map<string, string>();

    vocabItems.forEach((item, itemIndex) => {
      const id = stringValue(item, "id");
      const fileName = makeVocabItemFileName(item, itemIndex);

      vocabItemFilePathById.set(id, `vocabulary/items/${fileName}`);
    });

    const warnings: WarningRecord[] = [];

    if (!vocabSource) {
      warnings.push(
        makeWarning({
          type: "missing_vocab_source_file",
          reason: "No matching deep vocab source file was found for this lesson index.",
        }),
      );
    }

    const lessonVocabRelations = createLessonVocabRelations({
      lessonVocabItems,
      lessonNodeIndex,
      vocabItems,
      vocabItemFilePathById,
      lessonVocabToVocabId: materialized.lessonVocabToVocabId,
      lessonVocabLinkMetaById: materialized.lessonVocabLinkMetaById,
    });

    const groupResult = createGroupRelations({
      groups,
      vocabItems,
      lessonId,
      vocabItemFilePathById,
    });

    warnings.push(...groupResult.warnings);

    const explicitResult = createExplicitRelations({
      lessonDocument,
      lessonNodeIndex,
      vocabItems,
      vocabItemFilePathById,
      lessonVocabToVocabId: materialized.lessonVocabToVocabId,
    });

    let lexicalResult: { relations: Relation[]; warnings: WarningRecord[] } = {
      relations: [],
      warnings: [],
    };

    if (options.lexicalScan) {
      lexicalResult = createLexicalScanRelations({
        lessonDocument,
        vocabItems,
        vocabItemFilePathById,
        existingContentToVocabRelations: explicitResult.relations,
        includeSingleCharScan: options.includeSingleCharScan,
      });

      warnings.push(...lexicalResult.warnings);
    }

    const contentToGrammar = dedupeRelations(
      explicitResult.relations.filter((relation) => relation.type === "content_to_grammar"),
    );

    const contentToVocab = dedupeRelations([
      ...explicitResult.relations.filter(
        (relation) => relation.type === "content_to_vocabulary_item",
      ),
      ...lexicalResult.relations,
    ]);

    const lessonVocabToVocab = dedupeRelations(lessonVocabRelations);
    const vocabGroupToVocab = dedupeRelations(groupResult.relations);

    const allRelations = dedupeRelations([
      ...lessonVocabToVocab,
      ...vocabGroupToVocab,
      ...contentToGrammar,
      ...contentToVocab,
    ]);

    const unresolved = dedupeUnresolved(explicitResult.unresolved);
    const finalWarnings = dedupeWarnings(warnings);

    const checkNeededVocabItems = vocabItems.filter((item) =>
      booleanValue(item, "check_needed"),
    ).length;
    const checkNeededRelations = allRelations.filter((relation) => relation.check_needed).length;

    await writeJson(path.join(lessonOutputRoot, "lesson.json"), {
      schemaVersion: "hanzihome-db-lesson-v3",
      dataset: config.id,
      lessonIndex,
      id: lessonId,
      title: lessonTitle,
      sourceRefs: {
        lessonFile: `data/hanzihome/${config.id}/lessons/${lessonFileName}`,
        vocabFile: vocabSource ? `data/hanzihome/${config.id}/vocab/${vocabSource.fileName}` : null,
      },
      counts: {
        sections: sections.length,
        lessonVocabItems: lessonVocabItems.length,
        sourceDeepVocabItems: deepItems.length,
        materializedVocabItems: vocabItems.length,
        syntheticVocabItems: materialized.syntheticCount,
        hanziOnlyVocabMatches: materialized.hanziOnlyMatchCount,
        relations: allRelations.length,
        checkNeededRelations,
        checkNeededVocabItems,
        unresolved: unresolved.length,
        warnings: finalWarnings.length,
      },
    });

    await writeJson(
      path.join(lessonOutputRoot, "sections", "index.json"),
      sections.map((section, sectionIndex) => {
        const fileName = makeSectionFileName(section, sectionIndex);

        return {
          id: stringValue(section, "id"),
          type: stringValue(section, "type"),
          order: numberValue(section, "order") || sectionIndex + 1,
          title: stringValue(section, "title"),
          title_vi: stringValue(section, "title_vi"),
          file: fileName,
        };
      }),
    );

    for (const [sectionIndex, section] of sections.entries()) {
      await writeJson(
        path.join(lessonOutputRoot, "sections", makeSectionFileName(section, sectionIndex)),
        section,
      );
    }

    await writeJson(
      path.join(lessonOutputRoot, "vocabulary", "index.json"),
      vocabItems.map((item, itemIndex) => {
        const id = stringValue(item, "id");
        const materializedInfo = objectValue(item.materialized);

        return {
          id,
          order: numberValue(item, "order") || itemIndex + 1,
          type: stringValue(item, "type"),
          materialized_kind: stringValue(materializedInfo, "kind"),
          source_deep_vocab_id: stringValue(materializedInfo, "source_deep_vocab_id") || null,
          source_lesson_vocab_id: stringValue(materializedInfo, "source_lesson_vocab_id") || null,
          check_needed: booleanValue(item, "check_needed"),
          file: vocabItemFilePathById.get(id),
        };
      }),
    );

    await writeJson(
      path.join(lessonOutputRoot, "vocabulary", "groups.json"),
      groups.map((group, groupIndex) => {
        const id =
          stringValue(group, "id") ||
          `vocab_group_${stableId({
            lessonId,
            groupIndex,
            title: stringValue(group, "title_vi") || stringValue(group, "title"),
          }).slice(0, 16)}`;

        return {
          ...group,
          id,
        };
      }),
    );

    for (const [itemIndex, item] of vocabItems.entries()) {
      await writeJson(
        path.join(lessonOutputRoot, "vocabulary", "items", makeVocabItemFileName(item, itemIndex)),
        item,
      );
    }

    await writeJson(
      path.join(lessonOutputRoot, "relations", "lesson-vocab-to-vocabulary-item.json"),
      lessonVocabToVocab,
    );
    await writeJson(
      path.join(lessonOutputRoot, "relations", "vocab-group-to-vocabulary-item.json"),
      vocabGroupToVocab,
    );
    await writeJson(
      path.join(lessonOutputRoot, "relations", "content-to-vocabulary-item.json"),
      contentToVocab,
    );
    await writeJson(
      path.join(lessonOutputRoot, "relations", "content-to-grammar.json"),
      contentToGrammar,
    );
    await writeJson(path.join(lessonOutputRoot, "relations", "all.json"), allRelations);
    await writeJson(path.join(lessonOutputRoot, "relations", "unresolved.json"), unresolved);
    await writeJson(path.join(lessonOutputRoot, "relations", "warnings.json"), finalWarnings);
    await writeJson(path.join(lessonOutputRoot, "relations", "index.json"), {
      schemaVersion: "hanzihome-db-relations-index-v3",
      dataset: config.id,
      lessonIndex,
      lessonId,
      counts: {
        byType: relationCountsByType(allRelations),
        all: allRelations.length,
        checkNeededRelations,
        unresolved: unresolved.length,
        warnings: finalWarnings.length,
      },
    });

    const lessonSummary = {
      lessonIndex,
      id: lessonId,
      title: lessonTitle,
      folder: `lessons/${lessonFolderName}`,
      sourceRefs: {
        lessonFile: `data/hanzihome/${config.id}/lessons/${lessonFileName}`,
        vocabFile: vocabSource ? `data/hanzihome/${config.id}/vocab/${vocabSource.fileName}` : null,
      },
      counts: {
        sections: sections.length,
        lessonVocabItems: lessonVocabItems.length,
        sourceDeepVocabItems: deepItems.length,
        materializedVocabItems: vocabItems.length,
        syntheticVocabItems: materialized.syntheticCount,
        hanziOnlyVocabMatches: materialized.hanziOnlyMatchCount,
        relations: allRelations.length,
        relationTypes: relationCountsByType(allRelations),
        checkNeededRelations,
        checkNeededVocabItems,
        unresolved: unresolved.length,
        warnings: finalWarnings.length,
      },
    };

    manifestLessons.push(lessonSummary);

    datasetTotals.lessons += 1;
    datasetTotals.sections += sections.length;
    datasetTotals.lessonVocabItems += lessonVocabItems.length;
    datasetTotals.sourceDeepVocabItems += deepItems.length;
    datasetTotals.materializedVocabItems += vocabItems.length;
    datasetTotals.syntheticVocabItems += materialized.syntheticCount;
    datasetTotals.relations += allRelations.length;
    datasetTotals.checkNeededRelations += checkNeededRelations;
    datasetTotals.checkNeededVocabItems += checkNeededVocabItems;
    datasetTotals.unresolved += unresolved.length;
    datasetTotals.warnings += finalWarnings.length;
  }

  const datasetManifest = {
    schemaVersion: "hanzihome-db-manifest-v3",
    dataset: config.id,
    source: `data/hanzihome/${config.id}`,
    generatedAt: new Date().toISOString(),
    options: {
      lexicalScan: options.lexicalScan,
      includeSingleCharScan: options.includeSingleCharScan,
      sourceCopied: false,
      indexMode: "slim",
    },
    counts: datasetTotals,
    lessons: manifestLessons,
  };

  await writeJson(path.join(outputDatasetRoot, "manifest.json"), datasetManifest);

  return {
    dataset: config.id,
    output: path.relative(process.cwd(), outputDatasetRoot),
    counts: datasetTotals,
  };
}

async function main() {
  const datasetArg = readArg("--dataset") || "all";
  const outputRoot = readArg("--out") || "data/hanzihome-db";
  const clean = hasFlag("--clean");
  const includeSingleCharScan = hasFlag("--include-single-char-scan");
  const lexicalScan = !hasFlag("--no-lexical-scan");

  const selected =
    datasetArg === "all" ? DATASETS : DATASETS.filter((dataset) => dataset.id === datasetArg);

  if (selected.length === 0) {
    throw new Error(`Unknown dataset "${datasetArg}". Use --dataset q2, q3, or all.`);
  }

  const results = [];

  for (const dataset of selected) {
    results.push(
      await materializeDataset(dataset, {
        outputRoot,
        clean,
        includeSingleCharScan,
        lexicalScan,
      }),
    );
  }

  const rootManifest = {
    schemaVersion: "hanzihome-db-root-manifest-v3",
    generatedAt: new Date().toISOString(),
    outputRoot,
    options: {
      clean,
      lexicalScan,
      includeSingleCharScan,
      sourceCopied: false,
      indexMode: "slim",
    },
    datasets: results,
    counts: {
      datasets: results.length,
      lessons: results.reduce((sum, item) => sum + item.counts.lessons, 0),
      relations: results.reduce((sum, item) => sum + item.counts.relations, 0),
      unresolved: results.reduce((sum, item) => sum + item.counts.unresolved, 0),
      warnings: results.reduce((sum, item) => sum + item.counts.warnings, 0),
      syntheticVocabItems: results.reduce((sum, item) => sum + item.counts.syntheticVocabItems, 0),
      checkNeededRelations: results.reduce(
        (sum, item) => sum + item.counts.checkNeededRelations,
        0,
      ),
      checkNeededVocabItems: results.reduce(
        (sum, item) => sum + item.counts.checkNeededVocabItems,
        0,
      ),
    },
  };

  await writeJson(path.join(process.cwd(), outputRoot, "manifest.json"), rootManifest);

  console.log(JSON.stringify(rootManifest, null, 2));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
