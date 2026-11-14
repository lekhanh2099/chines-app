import rawNotebookDeepDiveOverrides from "./notebookDeepDiveOverrides.json";
import { z } from "zod";

import {
 NotebookDeepDiveSchema,
 type NotebookDeepDive,
 type NotebookDeepDiveSource,
 type NotebookItem,
} from "@/features/notebook/types";

const notebookDeepDiveOverrides = z
 .record(z.string(), NotebookDeepDiveSchema)
 .parse(rawNotebookDeepDiveOverrides);

const DEFAULT_SOURCES: Partial<Record<NotebookItem["sectionId"], NotebookDeepDiveSource[]>> = {
 adverbs: ["adverbs", "wordorder"],
 conjunctions: ["allset", "wordorder"],
 grammar_q2: ["grammar_q2", "textbook", "allset"],
 pronouns: ["pronouns", "wordorder"],
};

export const NOTEBOOK_DEEP_DIVE_SOURCE_LABELS: Record<NotebookDeepDiveSource, string> = {
 adverbs: "Phó từ & phạm vi tác động",
 allset: "Chinese Grammar Wiki / AllSet",
 choice: "Mẫu lựa chọn",
 condition: "Mẫu điều kiện",
 contrast: "Nhượng bộ & đối chiếu",
 discourse: "Ngữ khí & từ chuyển mạch",
 grammar_q2: "Hán ngữ Q2 + đối chiếu ngữ pháp",
 particles: "Trợ từ / 助词",
 phase4: "Cấu trúc lập luận nâng cao",
 prepositions: "Giới từ / 介词",
 pronouns: "Đại từ / từ hỏi",
 textbook: "Giáo trình + đề cương ôn thi",
 wordorder: "Trật tự câu / vị trí thành phần",
};

export function getNotebookDeepDive(item: NotebookItem): NotebookDeepDive {
 if (item.why || item.pos || item.decision || item.mistake) {
  return {
   why: item.why ?? item.essence,
   pos: item.pos ?? item.pattern,
   decision: item.decision ?? item.use,
   mistake: item.mistake ?? item.avoid,
   src: item.src ?? ["phase4", "textbook"],
  };
 }

 const override =
  notebookDeepDiveOverrides[item.term] ?? notebookDeepDiveOverrides[item.term.trim()];
 if (override) return override;

 return {
  why: `Nghĩa lõi của mục này là: ${item.essence}. Khi học, đừng chỉ nhớ bản dịch; hãy nhìn nó đang đánh dấu quan hệ gì trong câu.`,
  pos: `Mẫu cơ bản: ${item.pattern}. Vị trí trong câu thường quyết định đúng/sai nhiều hơn nghĩa tiếng Việt.`,
  decision: `Dùng khi: ${item.use}. Nếu phân vân, so với mục trong nhóm “Cặp dễ lẫn”.`,
  mistake: item.avoid || "Tránh dịch từng chữ sang tiếng Việt rồi đặt theo trật tự tiếng Việt.",
  src: DEFAULT_SOURCES[item.sectionId] ?? ["textbook"],
 };
}
