import { HSK_GRAMMAR_LEVEL_META } from "./hsk-grammar.constants";
import {
 hskGrammarDatasetSchema,
 type HskGrammarDataset,
 type HskGrammarLevel,
} from "./hsk-grammar.schemas";

function getAssetPartPath(assetKey: string, partIndex: number) {
 return `/data/hsk-grammar/${assetKey}/part-${String(partIndex).padStart(3, "0")}.b64`;
}

async function fetchAssetPart(path: string) {
 const response = await fetch(path, { cache: "force-cache" });
 if (!response.ok) throw new Error(`Không tải được asset ${path}.`);
 return response.text();
}

async function decodeGzipBase64Json(encoded: string): Promise<unknown> {
 const binary = atob(encoded.replaceAll(/\s+/g, ""));
 const bytes = new Uint8Array(binary.length);
 for (let index = 0; index < binary.length; index += 1) {
  bytes[index] = binary.charCodeAt(index);
 }

 const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
 return new Response(stream).json();
}

export async function fetchHskGrammarDataset(level: HskGrammarLevel): Promise<HskGrammarDataset> {
 const meta = HSK_GRAMMAR_LEVEL_META[level];
 const parts = await Promise.all(
  Array.from({ length: meta.partCount }, (_, index) =>
   fetchAssetPart(getAssetPartPath(meta.assetKey, index + 1)),
  ),
 );
 const payload = await decodeGzipBase64Json(parts.join(""));
 const parsed = hskGrammarDatasetSchema.safeParse(payload);

 if (!parsed.success) {
  throw new Error(`Dữ liệu ${level} không đúng schema hsk_grammar_v1.0.0.`);
 }

 if (parsed.data.level !== level || parsed.data.item_count !== meta.itemCount) {
  throw new Error(`Dữ liệu ${level} không khớp metadata đã đăng ký.`);
 }

 return parsed.data;
}
