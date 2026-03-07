export const WORD_PLACEHOLDER = "{WORD}";
export const SENTENCE_PLACEHOLDER = "{SENTENCE}";

export const DEFAULT_WORD_LOOKUP_PROMPT = `Bạn là chuyên gia ngôn ngữ Trung-Việt. Hãy phân tích từ vựng tiếng Trung sau đây: "{WORD}".

Yêu cầu trả về định dạng JSON CHUẨN (không có markdown), bao gồm các trường:
1. "pinyin": Phiên âm chuẩn có dấu.
2. "sino_vietnamese": Âm Hán Việt (viết hoa).
3. "radicals": Mảng các bộ thủ cấu thành. Mỗi phần tử gồm: "char", "pinyin", "meaning".
4. "definitions": Mảng các nghĩa, phân loại theo từ loại ("pos"). Mỗi nghĩa gồm:
   - "meaning": Nghĩa tiếng Việt ngắn gọn, tự nhiên.
   - "examples": Mảng ví dụ ngắn gọn, đời thường. Mỗi ví dụ gồm: "cn", "py", "vi".
5. "confusion": (Optional) Lưu ý ngắn nếu từ này dễ nhầm lẫn.

Schema JSON mẫu bắt buộc phải bám theo:
{
   "pinyin": "nǐ hǎo",
   "sino_vietnamese": "NHĨ HẢO",
   "radicals": [
      { "char": "亻", "pinyin": "rén", "meaning": "người" }
   ],
   "definitions": [
      {
         "pos": "Đại từ",
         "meaning": "Bạn, anh, chị",
         "examples": [
            { "cn": "你好！", "py": "Nǐ hǎo!", "vi": "Xin chào bạn!" }
         ]
      }
   ],
   "confusion": "Đừng nhầm với 您 trong ngữ cảnh kính ngữ"
}

Chỉ trả về JSON hợp lệ. Không giải thích thêm ngoài JSON.`;

export const DEFAULT_SENTENCE_LOOKUP_PROMPT = `Dịch và phân tích câu tiếng Trung sau sang tiếng Việt tự nhiên: "{SENTENCE}"

Yêu cầu JSON output:
1. "translation": Bản dịch tiếng Việt mượt mà, đúng ngữ cảnh.
2. "grammar_points": Mảng các điểm ngữ pháp đáng chú ý trong câu. Mỗi phần tử gồm:
   - "structure": Cấu trúc ngữ pháp.
   - "explanation": Giải thích ngắn gọn, thực dụng bằng tiếng Việt.

Schema JSON mẫu:
{
   "translation": "Hôm nay tôi muốn nghiêm túc học tiếng Trung.",
   "grammar_points": [
      {
         "structure": "想 + động từ",
         "explanation": "Dùng để diễn tả mong muốn hoặc dự định làm gì."
      }
   ]
}

Chỉ trả về JSON hợp lệ. Không giải thích thêm ngoài JSON.`;

function normalizeTemplate(
 template: string | null | undefined,
 fallback: string,
 placeholder: string,
): string {
 const trimmed = template?.trim();
 if (!trimmed) {
  return fallback;
 }

 return trimmed.includes(placeholder)
  ? trimmed
  : `${trimmed}\n\nNhớ dùng placeholder ${placeholder} trong prompt.`;
}

export function getWordLookupPromptTemplate(template?: string | null): string {
 return normalizeTemplate(
  template,
  DEFAULT_WORD_LOOKUP_PROMPT,
  WORD_PLACEHOLDER,
 );
}

export function getSentenceLookupPromptTemplate(
 template?: string | null,
): string {
 return normalizeTemplate(
  template,
  DEFAULT_SENTENCE_LOOKUP_PROMPT,
  SENTENCE_PLACEHOLDER,
 );
}

export function renderWordLookupPrompt(
 word: string,
 template?: string | null,
): string {
 return getWordLookupPromptTemplate(template).replaceAll(
  WORD_PLACEHOLDER,
  word,
 );
}

export function renderSentenceLookupPrompt(
 sentence: string,
 template?: string | null,
): string {
 return getSentenceLookupPromptTemplate(template).replaceAll(
  SENTENCE_PLACEHOLDER,
  sentence,
 );
}
