import type {
 AiVocabResponse,
 SentenceInsightResponse,
} from "@/types/database";

const offlineWordMap: Record<string, AiVocabResponse> = {
 我: {
  pinyin: "wǒ",
  sino_vietnamese: "NGÃ",
  radicals: [
   { char: "戈", pinyin: "gē", meaning: "qua, giáo" },
   { char: "扌", pinyin: "shǒu", meaning: "tay" },
  ],
  definitions: [
   {
    pos: "Đại từ",
    meaning: "Tôi, ta, mình",
    examples: [
     {
      cn: "我是越南人。",
      py: "Wǒ shì Yuènán rén.",
      vi: "Tôi là người Việt Nam.",
     },
    ],
   },
  ],
  confusion: "Thường đứng làm chủ ngữ để chỉ bản thân người nói.",
 },
 你: {
  pinyin: "nǐ",
  sino_vietnamese: "NHĨ",
  radicals: [{ char: "亻", pinyin: "rén", meaning: "người" }],
  definitions: [
   {
    pos: "Đại từ",
    meaning: "Bạn, cậu, anh/chị",
    examples: [{ cn: "你好吗？", py: "Nǐ hǎo ma?", vi: "Bạn khỏe không?" }],
   },
  ],
  confusion: "Không dùng trong ngữ cảnh cần kính ngữ, khi đó ưu tiên 您.",
 },
 好: {
  pinyin: "hǎo",
  sino_vietnamese: "HẢO",
  radicals: [{ char: "女", pinyin: "nǚ", meaning: "nữ" }],
  definitions: [
   {
    pos: "Tính từ",
    meaning: "Tốt, ổn, hay",
    examples: [
     { cn: "今天很好。", py: "Jīntiān hěn hǎo.", vi: "Hôm nay rất ổn." },
    ],
   },
  ],
 },
 人: {
  pinyin: "rén",
  sino_vietnamese: "NHÂN",
  radicals: [{ char: "人", pinyin: "rén", meaning: "người" }],
  definitions: [
   {
    pos: "Danh từ",
    meaning: "Người",
    examples: [
     {
      cn: "我是中国人。",
      py: "Wǒ shì Zhōngguó rén.",
      vi: "Tôi là người Trung Quốc.",
     },
    ],
   },
  ],
 },
 是: {
  pinyin: "shì",
  sino_vietnamese: "THỊ",
  radicals: [{ char: "日", pinyin: "rì", meaning: "mặt trời" }],
  definitions: [
   {
    pos: "Động từ",
    meaning: "Là",
    examples: [
     { cn: "我是学生。", py: "Wǒ shì xuéshēng.", vi: "Tôi là học sinh." },
    ],
   },
  ],
 },
 越南人: {
  pinyin: "Yuènán rén",
  sino_vietnamese: "VIỆT NAM NHÂN",
  radicals: [],
  definitions: [
   {
    pos: "Danh từ",
    meaning: "Người Việt Nam",
    examples: [
     {
      cn: "我是越南人。",
      py: "Wǒ shì Yuènán rén.",
      vi: "Tôi là người Việt Nam.",
     },
    ],
   },
  ],
 },
 你好: {
  pinyin: "nǐ hǎo",
  sino_vietnamese: "NHĨ HẢO",
  radicals: [],
  definitions: [
   {
    pos: "Câu chào",
    meaning: "Xin chào",
    examples: [{ cn: "你好！", py: "Nǐ hǎo!", vi: "Xin chào!" }],
   },
  ],
 },
 中文: {
  pinyin: "Zhōngwén",
  sino_vietnamese: "TRUNG VĂN",
  radicals: [],
  definitions: [
   {
    pos: "Danh từ",
    meaning: "Tiếng Trung",
    examples: [
     {
      cn: "我学习中文。",
      py: "Wǒ xuéxí Zhōngwén.",
      vi: "Tôi học tiếng Trung.",
     },
    ],
   },
  ],
 },
 学习: {
  pinyin: "xuéxí",
  sino_vietnamese: "HỌC TẬP",
  radicals: [],
  definitions: [
   {
    pos: "Động từ",
    meaning: "Học, học tập",
    examples: [
     {
      cn: "我想学习中文。",
      py: "Wǒ xiǎng xuéxí Zhōngwén.",
      vi: "Tôi muốn học tiếng Trung.",
     },
    ],
   },
  ],
 },
 今天: {
  pinyin: "jīntiān",
  sino_vietnamese: "KIM THIÊN",
  radicals: [],
  definitions: [
   {
    pos: "Danh từ thời gian",
    meaning: "Hôm nay",
    examples: [
     {
      cn: "我今天很忙。",
      py: "Wǒ jīntiān hěn máng.",
      vi: "Hôm nay tôi rất bận.",
     },
    ],
   },
  ],
 },
 想: {
  pinyin: "xiǎng",
  sino_vietnamese: "TƯỞNG",
  radicals: [],
  definitions: [
   {
    pos: "Động từ khuyết thiếu",
    meaning: "Muốn, định",
    examples: [
     {
      cn: "我想喝咖啡。",
      py: "Wǒ xiǎng hē kāfēi.",
      vi: "Tôi muốn uống cà phê.",
     },
    ],
   },
  ],
 },
 忙: {
  pinyin: "máng",
  sino_vietnamese: "MANG",
  radicals: [
   { char: "忄", pinyin: "xīn", meaning: "tâm, lòng" },
   { char: "亡", pinyin: "wáng", meaning: "mất, không còn" },
  ],
  definitions: [
   {
    pos: "Tính từ",
    meaning: "Bận, bận rộn",
    examples: [
     {
      cn: "我今天很忙。",
      py: "Wǒ jīntiān hěn máng.",
      vi: "Hôm nay tôi rất bận.",
     },
    ],
   },
  ],
  confusion: "Thường đi với 很 để diễn tả trạng thái bận rộn.",
 },
 越南: {
  pinyin: "Yuènán",
  sino_vietnamese: "VIỆT NAM",
  radicals: [],
  definitions: [
   {
    pos: "Danh từ riêng",
    meaning: "Việt Nam",
    examples: [
     {
      cn: "我是越南人。",
      py: "Wǒ shì Yuènán rén.",
      vi: "Tôi là người Việt Nam.",
     },
    ],
   },
  ],
 },
};

const offlineSentenceMap: Record<string, SentenceInsightResponse> = {
 "你好，我是越南人": {
  text: "你好，我是越南人",
  pinyin: "Nǐ hǎo, wǒ shì Yuènán rén.",
  translation: "Xin chào, tôi là người Việt Nam.",
  grammar_points: [
   {
    structure: "A 是 B",
    explanation: "Mẫu câu cơ bản dùng để giới thiệu hoặc định nghĩa: A là B.",
   },
  ],
 },
 "我今天想认真学习中文。": {
  text: "我今天想认真学习中文。",
  pinyin: "Wǒ jīntiān xiǎng rènzhēn xuéxí Zhōngwén.",
  translation: "Hôm nay tôi muốn nghiêm túc học tiếng Trung.",
  grammar_points: [
   {
    structure: "想 + động từ",
    explanation: "Dùng để diễn tả mong muốn hoặc dự định làm gì.",
   },
  ],
 },
};

export function getOfflineWordAnalysis(word: string): AiVocabResponse | null {
 const direct = offlineWordMap[word];
 if (direct) {
  return {
   hanzi: word,
   ...direct,
  };
 }

 return null;
}

export function getOfflineSentenceInsight(
 sentence: string,
): SentenceInsightResponse | null {
 const trimmed = sentence.trim();
 const direct = offlineSentenceMap[trimmed];
 if (direct) {
  return direct;
 }

 const normalized = trimmed.replace(/[。！？!?]+$/u, "");
 if (normalized in offlineSentenceMap) {
  return offlineSentenceMap[normalized];
 }

 const matchNationality = normalized.match(
  /^我[是叫]([\u4e00-\u9fff]{1,6})人$/u,
 );
 if (matchNationality) {
  return {
   text: trimmed,
   translation: `Tôi là người ${matchNationality[1]}.`,
   grammar_points: [
    {
     structure: "A 是 B",
     explanation: "Mẫu câu giới thiệu thân phận hoặc quốc tịch: A là B.",
    },
   ],
  };
 }

 if (normalized.includes("想") && normalized.includes("学习中文")) {
  return {
   text: trimmed,
   translation: "Tôi muốn học tiếng Trung.",
   grammar_points: [
    {
     structure: "想 + động từ",
     explanation: "Dùng để diễn tả mong muốn hoặc dự định làm gì.",
    },
   ],
  };
 }

 return null;
}
