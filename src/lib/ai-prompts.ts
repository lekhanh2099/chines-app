export const WORD_PLACEHOLDER = "{WORD}";
export const SENTENCE_PLACEHOLDER = "{SENTENCE}";

export const DEFAULT_WORD_LOOKUP_PROMPT = `Bạn là chuyên gia ngôn ngữ học và chiết tự Hán Nôm hàng đầu (PhD Level).
Nhiệm vụ: Phân tích sâu chữ Hán/Từ vựng sau đây theo phong cách "Học 1 hiểu 10": "{WORD}".

QUY ĐỊNH OUTPUT:
1. Trả về duy nhất 1 JSON object.
2. Tuyệt đối KHÔNG dùng Markdown, KHÔNG code blocks, KHÔNG giải thích thêm.
3. Ngôn ngữ giải thích: Tiếng Việt tự nhiên, dễ nhớ.

CẤU TRÚC JSON BẮT BUỘC:
{
   "pinyin": "Phiên âm chuẩn có dấu (VD: róng)",
   "sino_vietnamese": "Âm Hán Việt VIẾT HOA (VD: VINH)",
   "meaning_summary": "Nghĩa gốc ngắn gọn (VD: Cỏ cây, hoa lá tốt tươi)",
   "components": [
      { "part": "Ký tự bộ thủ (VD: 艹)", "name": "Tên Hán Việt VIẾT HOA (VD: THẢO)", "meaning": "Nghĩa tiếng Việt (VD: Cỏ cây, hoa lá)" }
   ],
   "etymology": "Giải thích nguồn gốc/hình tượng chữ. Mô tả hình ảnh tượng hình gốc, giải thích tại sao chữ này có cấu tạo như vậy. Viết thành đoạn văn ngắn bằng tiếng Việt.",
   "mnemonic_story": "Câu chuyện gợi nhớ: Dùng CÁC BỘ THỦ trong components để kể một câu chuyện vui, logic, dễ nhớ. Bôi đậm tên bộ thủ trong câu. VD: VINH dự khi được trùm lên đầu vòng nguyệt quế làm bằng CỎ và CÂY.",
   "radicals": [
      { "char": "Ký tự bộ thủ", "pinyin": "phiên âm", "meaning": "nghĩa tiếng Việt" }
   ],
   "definitions": [
      {
         "pos": "Từ loại (Tính từ, Động từ, Danh từ...)",
         "meaning": "Nghĩa tiếng Việt ngắn gọn, tự nhiên",
         "examples": [
            { "cn": "Từ ghép/Câu ví dụ tiếng Trung", "py": "Phiên âm pinyin", "vi": "Dịch nghĩa tiếng Việt" }
         ]
      }
   ],
   "confusion": "Lưu ý nếu từ này dễ nhầm lẫn với từ khác (optional, viết bằng tiếng Việt)"
}

QUY TẮC QUAN TRỌNG:
- "components" phải liệt kê TẤT CẢ các bộ thủ/thành phần cấu tạo nên chữ. Trường "name" PHẢI VIẾT HOA.
- "etymology" giải thích nguồn gốc hình tượng (tượng hình, hội ý, hình thanh...).
- "mnemonic_story" là phần QUAN TRỌNG NHẤT: câu chuyện phải sáng tạo, hài hước, liên kết logic TẤT CẢ bộ thủ trong "components".
- "radicals" giữ nguyên format để tương thích hệ thống cũ.
- Toàn bộ nội dung phải bằng tiếng Việt.
- Chỉ trả về JSON hợp lệ. Không giải thích thêm ngoài JSON.`;

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
