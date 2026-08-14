import { knowledgeNodeSchema } from "../domain/personal-learning.schemas";
import {
 bccSource,
 deHistorySource,
 nguyen2023Source,
 officialChineseStandardSource,
 researchPackSource,
 ross2024Source,
 yip2016Source,
} from "./knowledge-sources";

export const deDiDeNode = knowledgeNodeSchema.parse({
 id: "de-di-de",
 version: "1.1.0",
 titleVi: "的 / 地 / 得: cấu trúc, lịch sử và cách dùng",
 titleZh: "的、地、得",
 shortLabelVi: "Ba chữ de",
 reviewStatus: "source-checked",
 contentChecksum: "9b4b5bdcd692890ccb3e0eebdc9f2b41e33b93de4dfa87949fbfc514080bbd4d",
 coreQuestionVi:
  "Thành phần này đang bổ nghĩa cho danh từ, mô tả cách hành động, hay đánh giá kết quả sau vị ngữ?",
 functionVi:
  "Ba chữ thường cùng đọc nhẹ là de, nhưng khi viết chúng cho biết ba quan hệ khác nhau: phần mô tả–danh từ, cách thực hiện–hành động và vị ngữ–phần bổ sung phía sau.",
 whyVi:
  "Phân biệt này không phải ba nghĩa dịch cố định. Nó giúp người đọc nhìn thấy thành phần nào phụ thuộc vào thành phần nào, kể cả khi lời nói không phân biệt âm.",
 decisionStepsVi: [
  "Tìm trung tâm của cụm: danh từ hay vị ngữ.",
  "Đứng trước danh từ hoặc danh hóa cả mệnh đề: xét 的.",
  "Đứng trước động từ để nêu cách thức: xét 地 hoặc trường hợp không cần chữ nối.",
  "Đứng sau vị ngữ để nêu mức độ, hệ quả hoặc khả năng: xét 得 và xác định subtype.",
 ],
 frames: [
  "thành phần bổ nghĩa + 的 + danh từ",
  "mệnh đề + 的",
  "thành phần chỉ cách thức + 地 + động từ",
  "động từ + 得 + phần bổ sung",
  "động từ + 得/不 + kết quả",
 ],
 competingNodeIds: ["result-potential"],
 markedCasesVi: [
  "认真学习、努力工作、慢慢说 có thể tự nhiên không cần 地; thiếu 地 không tự động là lỗi.",
  "的 có thể được lược khi phần mô tả gắn rất chặt với danh từ; không dùng mẹo chỉ dựa vào độ dài.",
  "他说的很快 có thể chứa danh từ bị lược hoặc có cách ngắt khác; phải hỏi người nói muốn diễn đạt gì.",
 ],
 errorSubtypes: [
  "DE_ATTR_OMISSION",
  "DE_DI_SUB",
  "DI_DE_SUB",
  "DE_COMPLEMENT_SUB",
  "NOMINALIZER_OMISSION",
  "HEAD_ELLIPSIS_MISREAD",
 ],
 minimalContrasts: [
  {
   id: "de-1",
   firstZh: "我买的书很贵。",
   secondZh: "我买书很贵。",
   explanationVi:
    "Câu đầu tạo danh ngữ ‘cuốn sách tôi mua’; câu sau dễ thành ‘việc mua sách tốn kém’.",
  },
  {
   id: "de-2",
   firstZh: "我认真学习汉语。",
   secondZh: "我认真地学习汉语。",
   explanationVi: "Cả hai có thể đúng; câu có 地 đánh dấu trạng ngữ rõ hơn.",
  },
  {
   id: "de-3",
   firstZh: "他说得很快。",
   secondZh: "他说的很快。",
   explanationVi:
    "得 nối hành động nói với đánh giá tốc độ; 的 chỉ hợp khi phần 他说的 được hiểu là “điều anh ấy nói” hoặc có danh từ bị lược.",
  },
 ],
 anticipatedQuestions: [
  {
   id: "de-q1",
   questionVi: "认真学习 đúng thì tại sao sách bắt dùng 地?",
   answerVi:
    "Sách thường dùng dạng đầy đủ để làm rõ quan hệ. Nhiều trạng ngữ ngắn hoặc tổ hợp đã quen dùng có thể đứng trực tiếp trước động từ mà không cần 地.",
  },
  {
   id: "de-q2",
   questionVi: "得 trong 看得懂 và 说得很好 có giống nhau không?",
   answerVi:
    "Cùng đứng sau động từ nhưng làm hai việc khác nhau: 看得懂 nói khả năng đạt kết quả “hiểu”, còn 说得很好 đánh giá mức độ hoặc chất lượng của hành động nói.",
  },
  {
   id: "de-q3",
   questionVi: "Trong nói không nghe ra ba chữ thì luyện để làm gì?",
   answerVi:
    "Mục tiêu là hiểu cấu trúc; chính tả đúng là hệ quả của việc xác định quan hệ cú pháp.",
  },
 ],
 diagnosticTasks: [
  { id: "de-m1", dimension: "M1", taskType: "choose", promptVi: "Chọn chữ de theo vai trò cấu trúc." },
  { id: "de-m2", dimension: "M2", taskType: "explain", promptVi: "Chỉ ra từ chính, phần mô tả và phần bổ sung phía sau." },
  { id: "de-m3", dimension: "M3", taskType: "transform", promptVi: "Biến cùng một ý thành định ngữ, trạng ngữ và bổ ngữ." },
  { id: "de-m4", dimension: "M4", taskType: "timed", promptVi: "Sửa câu dài trong thời gian giới hạn." },
  { id: "de-m5", dimension: "M5", taskType: "transfer", promptVi: "Dùng trong đoạn viết mới, không báo trước cấu trúc." },
 ],
 opportunityRules: [
  { id: "de-relative-v1", opportunityType: "TYPE_1", ruleVi: "Prompt khóa nghĩa ‘danh từ mà mệnh đề X xác định’.", humanReviewed: true, version: "1.0.0" },
  { id: "de-zero-v1", opportunityType: "TYPE_2", ruleVi: "Trạng ngữ ngắn mà zero-marking hoàn toàn tự nhiên.", humanReviewed: true, version: "1.0.0" },
 ],
 claims: [
  { id: "de-c1", statementVi: "Phân biệt 的/地/得 dựa trên quan hệ cấu trúc, không phải ba bản dịch cố định.", sourceIds: ["research-pack-v1", "ross-2024", "yip-2016"], confidence: "high" },
  { id: "de-c2", statementVi: "Có trường hợp lược 地; phải xét độ dài, nhịp câu và tổ hợp thường dùng.", sourceIds: ["research-pack-v1", "bcc"], confidence: "medium" },
 ],
 sources: [researchPackSource, officialChineseStandardSource, deHistorySource, ross2024Source, yip2016Source, nguyen2023Source, bccSource],
 researchGapsVi: [
  "Chưa có tập ví dụ ngữ liệu đã lọc cho toàn bộ trường hợp lược 地.",
  "Các cách nói chấp nhận được chưa được hai người bản ngữ rà độc lập.",
 ],
});
