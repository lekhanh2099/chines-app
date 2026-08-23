import type { HskGrammarDataset, HskGrammarLevel } from "./hsk-grammar.schemas";

const DEMO_HSK4_DATASET: HskGrammarDataset = {
 schema_version: "hsk_grammar_v1.0.0",
 schema_contract:
  "Cố định cho HSK1-HSK6: không đổi tên/kiểu các trường top-level và item; level/type/data được thay theo từng HSK.",
 dataset_id: "hsk-grammar-ui-demo-hsk4",
 level: "HSK4",
 language: "zh-CN",
 ui_language: "vi-VN",
 item_count: 1,
 level_basis:
  "Phân loại theo booklet Migii HSK 4 được người dùng cung cấp; không tuyên bố đây là danh mục ngữ pháp chính thức duy nhất của kỳ thi HSK.",
 primary_source: {
  title: "Tài liệu ngữ pháp HSK 4 - Migii HSK",
  file: "ebook-MigiiHSK_Ngữ pháp - HSK 4.pdf",
  pages: 149,
  coverage: "Grammar 279-439",
 },
 secondary_reference: [],
 editorial_policy: {
  source_examples: "UI demo dùng một mục thật đã biên tập từ corpus HSK4 của người dùng.",
  added_examples: "Giữ đủ các tier để kiểm tra renderer; corpus đầy đủ sẽ được nhập sau.",
  pinyin: "Pinyin giữ theo dữ liệu mẫu đã biên tập.",
  translation: "Dịch Việt giữ theo dữ liệu mẫu đã biên tập.",
 },
 example_tiers: ["source", "basic", "natural", "advanced", "contrast"],
 items: [
  {
   id: "hsk4-g001",
   type: "grammar_point",
   order: 1,
   source_no: 279,
   title: "BỔ NGỮ KHẢ NĂNG “得不得了”",
   title_vi: "Adj + 得不得了: bổ ngữ mức độ rất cao",
   focus: ["得不得了"],
   level: "HSK4",
   categories: ["degree", "aspect", "complement", "modal"],
   core:
    "得不得了 đứng sau tính từ/động từ tâm lý để nhấn mạnh mức độ cực cao: “... vô cùng / ... không chịu nổi”. Đây là bổ ngữ mức độ, không phải bổ ngữ khả năng dù tiêu đề nguồn gọi như vậy.",
   structures: ["Adj/V-tâm-lý + 得不得了"],
   usage_notes: [
    "得不得了 (de bùdéliǎo) có thể được sử dụng để nhấn mạnh mức độ cao hoặc thể hiện một tình huống nghiêm trọng.",
    "Trong mẫu này, trọng tâm là mức độ của trạng thái, không phải khả năng thực hiện hành động.",
   ],
   constraints: [],
   contrasts: [],
   common_errors: [
    {
     wrong: "Gọi 得不得了 là “bổ ngữ khả năng”.",
     right: "Xem nó là bổ ngữ mức độ.",
     explanation_vi:
      "Mẫu này không trả lời “có làm được hay không” mà khuếch đại mức độ của trạng thái.",
    },
   ],
   examples: {
    source: [
     {
      zh: "升职的事情让他高兴得不得了。",
      pinyin: "Shēng zhí de shìqíng ràng tā gāoxìng dé bùdéliǎo.",
      vi: "Việc anh được thăng chức khiến anh vô cùng hạnh phúc.",
      note_vi:
       "Ví dụ lấy từ tài liệu Migii HSK 4; đã chuẩn hóa OCR/dấu cách và giữ riêng với ví dụ biên tập.",
      origin: "source_normalized",
     },
     {
      zh: "爸爸气得不得了，你要倒霉啦。",
      pinyin: "Bàba qì dé bùdéliǎo, nǐ yào dǎoméi la.",
      vi: "Bố vô cùng tức giận. Bạn không may rồi.",
      note_vi:
       "Ví dụ lấy từ tài liệu Migii HSK 4; đã chuẩn hóa OCR/dấu cách và giữ riêng với ví dụ biên tập.",
      origin: "source_normalized",
     },
    ],
    basic: [
     {
      zh: "其实，升职的事情让他高兴得不得了。",
      pinyin: "qí shí， shēng zhí de shì qíng ràng tā gāo xìng dé bùdéliǎo.",
      vi: "Thực ra, việc anh được thăng chức khiến anh vô cùng hạnh phúc.",
      note_vi: "Ví dụ biên tập mức cơ bản, ưu tiên làm nổi bật trực tiếp cấu trúc đích.",
      origin: "editorial",
     },
    ],
    natural: [
     {
      zh: "说实话，他跟老总的关系好得不得了，你一定要小心！",
      pinyin: "shuō shí huà， tā gēn lǎo zǒng de guān xì hǎo dé bùdéliǎo， nǐ yī dìng yào xiǎo xīn！",
      vi: "Nói thật, quan hệ giữa anh ấy và sếp lớn tốt đến mức đáng kinh ngạc; bạn nhất định phải cẩn thận.",
      note_vi: "Ví dụ biên tập theo ngữ cảnh giao tiếp tự nhiên.",
      origin: "editorial",
     },
    ],
    advanced: [
     {
      zh: "听到项目终于通过审批，他高兴得不得了，连着给团队发了好几条消息。",
      pinyin:
       "tīng dào xiàng mù zhōng yú tōng guò shěn pī， tā gāo xìng dé bùdéliǎo， lián zhe gěi tuán duì fā le hǎo jǐ tiáo xiāo xī.",
      vi: "Nghe tin dự án cuối cùng được phê duyệt, anh ấy vui vô cùng, liên tục gửi mấy tin nhắn cho cả nhóm.",
      note_vi: "Ví dụ nâng cao: cấu trúc đích nằm trong ngữ cảnh câu phức dài hơn.",
      origin: "editorial",
     },
     {
      zh: "这几天工作忙得不得了，我每天回到家几乎连说话的力气都没有。",
      pinyin:
       "zhè jǐ tiān gōng zuò máng dé bùdéliǎo， wǒ měi tiān huí dào jiā jī hū lián shuō huà de lì qì dōu méi yǒu.",
      vi: "Mấy ngày nay công việc bận kinh khủng, ngày nào về nhà tôi gần như chẳng còn sức nói chuyện.",
      note_vi: "Ví dụ nâng cao: tăng độ dài nhưng vẫn giữ cấu trúc đích làm trọng tâm.",
      origin: "editorial",
     },
    ],
    contrast: [
     {
      zh: "升职的事情让他高兴得不得了。／爸爸气得不得了，你要倒霉啦。",
      pinyin:
       "Shēng zhí de shìqíng ràng tā gāoxìng dé bùdéliǎo. ／ Bàba qì dé bùdéliǎo, nǐ yào dǎoméi la.",
      vi: "Việc anh được thăng chức khiến anh vô cùng hạnh phúc. / Bố vô cùng tức giận, bạn sắp gặp rắc rối rồi.",
      note_vi: "Đặt hai ví dụ nguồn cạnh nhau để đối chiếu phạm vi/cách dùng.",
      origin: "editorial",
     },
    ],
   },
   source_ref: {
    primary: "Migii HSK - Tài liệu ngữ pháp HSK 4",
    pdf_page: 2,
    grammar_no: 279,
   },
   verification: {
    status: "editorially_reviewed",
    source_preserved: true,
    source_examples_normalized: true,
    notes:
     "Mục demo giữ cấu trúc dữ liệu thật để kiểm tra toàn bộ renderer trước khi nhập corpus HSK1-HSK6.",
   },
  },
 ],
};

function createEmptyDemoDataset(level: HskGrammarLevel): HskGrammarDataset {
 return {
  schema_version: "hsk_grammar_v1.0.0",
  schema_contract: "UI demo; corpus thật chưa được nhập cho cấp độ này.",
  dataset_id: `hsk-grammar-ui-demo-${level.toLowerCase()}`,
  level,
  language: "zh-CN",
  ui_language: "vi-VN",
  item_count: 0,
  level_basis: "Cấp độ này chưa có dữ liệu mẫu. UI sẽ dùng cùng renderer khi corpus thật được nhập.",
  primary_source: {
   title: "Chưa nhập dữ liệu",
   file: "",
   pages: 1,
   coverage: "Chưa nhập dữ liệu",
  },
  secondary_reference: [],
  editorial_policy: {
   source_examples: "Chưa nhập dữ liệu",
   added_examples: "Chưa nhập dữ liệu",
   pinyin: "Chưa nhập dữ liệu",
   translation: "Chưa nhập dữ liệu",
  },
  example_tiers: ["source", "basic", "natural", "advanced", "contrast"],
  items: [],
 };
}

export async function loadHskGrammarDataset(level: HskGrammarLevel): Promise<HskGrammarDataset> {
 return level === "HSK4" ? DEMO_HSK4_DATASET : createEmptyDemoDataset(level);
}
