export const WORD_PLACEHOLDER = "{WORD}";
export const SENTENCE_PLACEHOLDER = "{SENTENCE}";

export const DEFAULT_WORD_LOOKUP_PROMPT = `Bạn là chuyên gia ngôn ngữ và từ điển tiếng Trung.
Hãy phân tích sâu từ/cụm từ sau: "{WORD}"

YÊU CẦU OUTPUT:
1. Trả về duy nhất 1 JSON object hợp lệ.
2. Không markdown, không giải thích ngoài JSON.
3. "etymology": Cực kỳ quan trọng. Hãy giải thích cấu tạo chữ cái (lục thư) hoặc kể một câu chuyện gợi nhớ (mnemonic) dựa trên các bộ thủ thành phần để người học dễ nhớ mặt chữ. Ngắn gọn, súc tích.
4. "related_compounds": Liệt kê 3 từ ghép thông dụng nhất chứa từ này (HSK 1-4).
5. "radicals": Liệt kê các bộ thủ cấu thành.
6. "sino_vietnamese": Viết HOA.

JSON SCHEMA STRICT MODE:
{
  "hanzi": "string",
  "pinyin": "string (có dấu chuẩn)",
  "sino_vietnamese": "string (UPPERCASE)",
  "radicals": [
    { "char": "string", "pinyin": "string", "meaning": "string" }
  ],
  "etymology": {
    "type": "string (Ví dụ: Hình thanh, Hội ý, Tượng hình... hoặc 'Không xác định')",
    "explanation": "string (Giải thích logic cấu tạo hoặc câu chuyện gợi nhớ ngắn gọn)"
  },
  "definitions": [
    {
      "pos": "string (từ loại)",
      "meaning": "string (nghĩa tiếng Việt)",
      "examples": [
        { "cn": "string", "py": "string", "vi": "string" }
      ]
    }
  ],
  "related_compounds": [
    { "word": "string (Hanzi)", "pinyin": "string", "meaning": "string (Việt)" }
  ],
  "confusion": "string (Lưu ý các lỗi sai thường gặp, nếu không có để trống)"
}

Nếu không xác định được:
- Vẫn phải trả về JSON hợp lệ.
- Dùng chuỗi rỗng hoặc mảng rỗng cho trường không chắc chắn.

Chỉ trả về JSON hợp lệ.`;

export const DEFAULT_WORD_LOOKUP_BASIC_PROMPT = `Bạn là engine tra từ tiếng Trung siêu nhanh cho người học tiếng Việt.

Hãy tra nhanh từ/cụm từ sau: "{WORD}"

Mục tiêu:
- Chỉ trả về thông tin đủ để đọc hiểu sơ bộ trong lần tải đầu.
- Ưu tiên tốc độ, ngắn gọn, chính xác.

Yêu cầu:
- Chỉ trả về duy nhất 1 JSON object hợp lệ.
- Không markdown, không code block, không giải thích ngoài JSON.
- Chỉ điền các field sau: "pinyin", "sino_vietnamese", "meaning_summary".
- "pinyin" phải là pinyin chuẩn có dấu.
- "sino_vietnamese" phải viết HOA toàn bộ.
- "meaning_summary" phải rất ngắn, tự nhiên, dễ hiểu với người học tiếng Việt.

Schema JSON:
{
  "pinyin": "string (phiên âm chuẩn có dấu)",
  "sino_vietnamese": "string (Âm Hán Việt viết HOA)",
  "meaning_summary": "string (nghĩa chính ngắn gọn bằng tiếng Việt)"
}

Nếu không chắc:
- Vẫn phải trả về JSON hợp lệ.
- Dùng chuỗi rỗng cho field không chắc chắn.

Chỉ trả về JSON hợp lệ.`;

export const DEFAULT_SENTENCE_LOOKUP_PROMPT = `Dịch và phân tích câu tiếng Trung sau sang tiếng Việt tự nhiên: "{SENTENCE}"

Yêu cầu:
- Chỉ trả về duy nhất 1 JSON object hợp lệ.
- Không markdown, không code block, không giải thích ngoài JSON.
- "translation" phải là bản dịch tiếng Việt mượt mà, đúng ngữ cảnh.
- "grammar_points" chỉ nêu các điểm ngữ pháp thật sự đáng chú ý.
- "explanation" phải ngắn gọn, thực dụng, dễ áp dụng.

Schema JSON:
{
  "translation": "string (bản dịch tiếng Việt mượt mà, đúng ngữ cảnh)",
  "grammar_points": [
    {
      "structure": "string (cấu trúc ngữ pháp)",
      "explanation": "string (giải thích ngắn gọn, thực dụng bằng tiếng Việt)"
    }
  ]
}

Nếu không xác định được:
- Vẫn phải trả về JSON hợp lệ.
- Dùng "translation" là thông báo lỗi ngắn gọn, phù hợp.
- Dùng "grammar_points": [].
- Có thể thêm field "error" với thông báo ngắn gọn, phù hợp.

Chỉ trả về JSON hợp lệ.`;

const LEGACY_WORD_LOOKUP_PROMPTS = [
 `Bạn là engine tra từ tiếng Trung cho người học tiếng Việt.

Hãy phân tích từ/cụm từ sau: "{WORD}"

Yêu cầu:
- Chỉ trả về duy nhất 1 JSON object hợp lệ.
- Không markdown, không code block, không giải thích ngoài JSON.
- Nội dung giải thích phải bằng tiếng Việt tự nhiên, ngắn gọn, rõ nghĩa.
- "pinyin" phải là pinyin chuẩn có dấu.
- "sino_vietnamese" phải viết HOA toàn bộ.
- "radicals" chỉ liệt kê bộ thủ/thành phần thật sự hữu ích; nếu không chắc thì trả mảng rỗng.
- "definitions" chỉ chứa nghĩa phổ biến, tự nhiên, đúng ngữ cảnh học tập.
- "examples" ưu tiên ví dụ ngắn, dễ hiểu, dịch tiếng Việt mượt mà.
- "confusion" chỉ điền khi có lưu ý dễ nhầm lẫn thật sự; nếu không có thì để chuỗi rỗng.

Schema JSON:
{
  "pinyin": "string (phiên âm chuẩn có dấu)",
  "sino_vietnamese": "string (Âm Hán Việt viết hoa)",
  "radicals": [
    { "char": "string", "pinyin": "string", "meaning": "string" }
  ],
  "definitions": [
    {
      "pos": "string (từ loại)",
      "meaning": "string (nghĩa tiếng Việt ngắn gọn, tự nhiên)",
      "examples": [
        { "cn": "string", "py": "string", "vi": "string" }
      ]
    }
  ],
  "confusion": "string (tùy chọn, nếu có lưu ý về từ dễ nhầm lẫn)"
}

Nếu không xác định được:
- Vẫn phải trả về JSON hợp lệ.
- Dùng chuỗi rỗng hoặc mảng rỗng cho trường không chắc chắn.
- Có thể thêm field "error" với thông báo ngắn gọn, phù hợp.

Chỉ trả về JSON hợp lệ.`,
 `Bạn là chuyên gia ngôn ngữ học và chiết tự Hán Nôm hàng đầu (PhD Level).
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
- Chỉ trả về JSON hợp lệ. Không giải thích thêm ngoài JSON.`,
];

const LEGACY_SENTENCE_LOOKUP_PROMPTS = [
 `Dịch và phân tích câu tiếng Trung sau sang tiếng Việt tự nhiên: "{SENTENCE}"

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

Chỉ trả về JSON hợp lệ. Không giải thích thêm ngoài JSON.`,
];

function isLegacyDefaultTemplate(
 template: string,
 placeholder: string,
): boolean {
 const legacyTemplates =
  placeholder === WORD_PLACEHOLDER
   ? LEGACY_WORD_LOOKUP_PROMPTS
   : LEGACY_SENTENCE_LOOKUP_PROMPTS;

 return legacyTemplates.some(
  (legacyTemplate) => legacyTemplate.trim() === template,
 );
}

function normalizeTemplate(
 template: string | null | undefined,
 fallback: string,
 placeholder: string,
): string {
 const trimmed = template?.trim();
 if (!trimmed) {
  return fallback;
 }

 if (isLegacyDefaultTemplate(trimmed, placeholder)) {
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

export function renderWordLookupBasicPrompt(word: string): string {
 return DEFAULT_WORD_LOOKUP_BASIC_PROMPT.replaceAll(WORD_PLACEHOLDER, word);
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
