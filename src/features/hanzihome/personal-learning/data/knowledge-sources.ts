import { sourceReferenceSchema } from "../domain/personal-learning.schemas";

export const researchPackSource = sourceReferenceSchema.parse({
 id: "research-pack-v1",
 title: "HANZI_STUDIO_COLD_START_RESEARCH_PACK_V1",
 locator: "content-sources/personal-learning/HANZI_STUDIO_COLD_START_RESEARCH_PACK_V1",
 sourceType: "research-pack",
 noteVi:
  "Gói nghiên cứu bắt buộc; trạng thái hiện tại là source-checked, chưa thay thế corpus snapshot và native review còn thiếu.",
});

export const ross2024Source = sourceReferenceSchema.parse({
 id: "ross-2024",
 title: "Modern Mandarin Chinese Grammar: A Practical Guide",
 locator: "ISBN 9781032370507",
 sourceType: "reference",
 noteVi: "Ngữ pháp tham chiếu theo chức năng và cấu trúc.",
});

export const yip2016Source = sourceReferenceSchema.parse({
 id: "yip-2016",
 title: "Chinese: A Comprehensive Grammar",
 locator: "ISBN 9781138840164",
 sourceType: "reference",
 noteVi: "Ngữ pháp tham chiếu về cách dùng tiếng Hán hiện đại.",
});

export const nguyen2023Source = sourceReferenceSchema.parse({
 id: "nguyen-2023",
 title: "TOCFL learner-corpus study of Vietnamese learners",
 locator: "NTHU thesis repository",
 sourceType: "corpus",
 noteVi: "Dùng làm prior về nhóm lỗi; không tự gắn lỗi cho từng cá nhân.",
});

export const bccSource = sourceReferenceSchema.parse({
 id: "bcc",
 title: "BCC corpus",
 locator: "Beijing Language and Culture University corpus",
 sourceType: "corpus",
 noteVi: "Corpus channel cần snapshot lọc và manual review trước khi nâng trạng thái nội dung.",
});

export const aspectSource = sourceReferenceSchema.parse({
 id: "klein-2000",
 title: "Aspect and assertion in Mandarin Chinese",
 locator: "DOI 10.1023/A:1006411825993",
 sourceType: "peer-reviewed",
 noteVi: "Nền tảng cho phân biệt tense và viewpoint aspect.",
});

export const passiveSource = sourceReferenceSchema.parse({
 id: "law-hirschberg-2025",
 title: "Affectedness approach to Mandarin passives",
 locator: "DOI 10.1007/s10831-025-09295-3",
 sourceType: "peer-reviewed",
 noteVi: "Hỗ trợ cách giải thích 被 theo affectedness, không theo huyền thoại tiêu cực tuyệt đối.",
});

export const existentialSource = sourceReferenceSchema.parse({
 id: "nam-2022",
 title: "Information structure of Chinese existential sentences",
 locator: "DOI 10.14378/KACS.2022.80.80.11",
 sourceType: "peer-reviewed",
 noteVi: "Hỗ trợ phân tích frame, new information và presentational construction.",
});

export const conditionalSource = sourceReferenceSchema.parse({
 id: "wimmer-2022",
 title: "Compositional semantics of 只要 and 只有",
 locator: "DOI 10.1007/s10831-022-09243-5",
 sourceType: "peer-reviewed",
 noteVi: "Hỗ trợ phân biệt minimal sufficiency và necessity.",
});

export const officialChineseStandardSource = sourceReferenceSchema.parse({
 id: "moe-gf0025-2021",
 title: "国际中文教育中文水平等级标准 GF0025-2021",
 locator: "Ministry of Education of the PRC; grammar syllabus appendix",
 sourceType: "official",
 noteVi:
  "Chuẩn chính thức cho giáo dục tiếng Trung quốc tế; dùng để đối chiếu phạm vi và cấp độ, không thay thế mô tả ngôn ngữ học chi tiết.",
});

export const deHistorySource = sourceReferenceSchema.parse({
 id: "zhang-2023-de",
 title: "正确区分‘的、地、得’",
 locator: "2023 editorial-language study; structural particles and historical differentiation",
 sourceType: "reference",
 noteVi:
  "Dùng cho lịch sử quy ước chữ viết và nguyên tắc phân công trong văn viết hiện đại; không suy diễn thành ba âm khác nhau trong khẩu ngữ.",
});

export const baArgumentSource = sourceReferenceSchema.parse({
 id: "ba-argument-2021",
 title: "The argument structure of the ba construction in Mandarin Chinese",
 locator: "DOI 10.1080/07268602.2021.1971157",
 sourceType: "peer-reviewed",
 noteVi: "Hỗ trợ phân tích vai nghĩa, cấu trúc lập luận và constraint diễn ngôn của 把.",
});

export const baCorpusSource = sourceReferenceSchema.parse({
 id: "ba-corpus-2020",
 title: "A corpus-based study on the pragmatic use of the ba construction",
 locator: "DOI 10.3389/fpsyg.2020.607818",
 sourceType: "peer-reviewed",
 noteVi:
  "Hỗ trợ specificity, boundedness và tính phức hợp của vị ngữ sau 把; các mô tả tuyệt đối được hạ thành xu hướng khi corpus cho phép ngoại lệ.",
});

export const directionalGrammaticalizationSource = sourceReferenceSchema.parse({
 id: "huang-hsieh-2008",
 title: "Grammaticalization of Directional Complements in Mandarin Chinese",
 locator: "Language and Linguistics 9.1:49–68",
 sourceType: "peer-reviewed",
 noteVi:
  "Hỗ trợ cầu nối từ nghĩa không gian sang nghĩa thời gian/trạng thái của 上、下、起、出 và các bổ ngữ xu hướng đã ngữ pháp hóa.",
});

export const complementClassificationSource = sourceReferenceSchema.parse({
 id: "complement-classification-2008",
 title: "A review of complement classification in Modern Chinese",
 locator: "KCI ART001264920",
 sourceType: "peer-reviewed",
 noteVi:
  "Dùng để ghi rõ rằng số nhóm bổ ngữ thay đổi theo hệ phân loại; giáo án dùng hệ bảy nhóm thực dụng và tách những nhóm cần luyện ở trung cấp.",
});

export const existentialTriadSource = sourceReferenceSchema.parse({
 id: "lee-2026-existential",
 title: "A corpus-based study of the Chinese existential triad 有 / 是 / V着",
 locator: "DOI 10.15792/clsyn..101.202604.337",
 sourceType: "peer-reviewed",
 noteVi: "Nghiên cứu 4.500 mẫu BCC về phân công cú pháp-ngữ nghĩa-dụng học giữa 有、是、V着.",
});

export const mannerExistentialSource = sourceReferenceSchema.parse({
 id: "heo-2026-manner-existential",
 title: "Manner Existential Sentence in Chinese: Nature, Characteristics and Origin",
 locator: "DOI 10.35822/JCLLT.2026.01.58.473",
 sourceType: "peer-reviewed",
 noteVi:
  "Hỗ trợ giải thích Location + V着 + NP như cách tồn tại và giả thuyết lịch sử từ cấu trúc chủ đề nơi chốn; phần nguồn gốc được trình bày ở mức giả thuyết nghiên cứu.",
});

export const directionalResultSource = sourceReferenceSchema.parse({
 id: "directional-result-2019",
 title: "Resultativity and event structure of directional complements in Chinese",
 locator: "DOI 10.26586/chls.2019..96.002",
 sourceType: "peer-reviewed",
 noteVi:
  "Hỗ trợ phân tích nghĩa kết quả mở rộng của bổ ngữ xu hướng và giới hạn của quan hệ nhân-quả trong chuỗi V + directional complement.",
});

export const beiMovementSource = sourceReferenceSchema.parse({
 id: "bei-movement-2025",
 title: "Passivization and composite movement in the Mandarin bei-construction",
 locator: "DOI 10.1007/s11049-025-09669-1",
 sourceType: "peer-reviewed",
 noteVi:
  "Hỗ trợ cấu trúc canonical 被, agent hiển/ẩn và bằng chứng rằng non-adversative 被 đã có năng suất trong Mandarin hiện đại.",
});

export const hanDianShuowenSource = sourceReferenceSchema.parse({
 id: "han-dian-shuowen",
 title: "汉典《说文解字》与字源字形资料",
 locator: "https://www.zdic.net; entries for 完、好、到、见、清、得、了 and related characters",
 sourceType: "reference",
 noteVi:
  "Dùng để kiểm tra cấu tạo chữ, nghĩa cổ được ghi trong 《说文解字》 và lịch sử chữ. Không dùng chiết tự dân gian để suy ra quy tắc ngữ pháp hiện đại.",
});
