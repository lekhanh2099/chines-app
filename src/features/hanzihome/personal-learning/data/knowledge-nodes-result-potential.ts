import { knowledgeNodeSchema } from "../domain/personal-learning.schemas";
import {
 complementClassificationSource,
 directionalGrammaticalizationSource,
 directionalResultSource,
 hanDianShuowenSource,
 nguyen2023Source,
 officialChineseStandardSource,
 researchPackSource,
 ross2024Source,
} from "./knowledge-sources";

export const resultPotentialNode = knowledgeNodeSchema.parse({
 id: "result-potential",
 version: "1.2.0",
 titleVi: "Hệ thống bổ ngữ: kết quả, xu hướng, khả năng, mức độ và số lượng",
 titleZh: "补语系统：结果、趋向、可能、程度与数量",
 shortLabelVi: "Toàn bộ hệ bổ ngữ",
 reviewStatus: "source-checked",
 contentChecksum: "cea5203aec2fc6b09b8ed24db50cc1eecf5168afc13774f1efb35f4a2f59db44",
 coreQuestionVi:
  "Phần đứng sau vị ngữ đang đóng góp kết quả, hướng/chuyển trạng thái, khả năng đạt, mức độ-trạng thái hay số lượng?",
 functionVi:
  "Bổ ngữ hoàn thiện cấu trúc vị ngữ bằng cách nêu kết quả, hướng, khả năng, mức độ/trạng thái hoặc lượng của hành động; mỗi nhóm có trật tự và điều kiện riêng.",
 whyVi:
  "“Bổ ngữ” là tên chung cho nhiều phần đứng sau vị ngữ. Trước hết phải hỏi phần đó đang nói kết quả đã đạt, hướng di chuyển, khả năng đạt kết quả, mức độ/trạng thái hay số lượng; nếu không, rất dễ trộn 得, 了, tân ngữ và 来/去.",
 decisionStepsVi: [
  "Xác định có một lần thử cụ thể hay không.",
  "Nếu kể một lần đã xảy ra nhưng kết quả không đạt: ưu tiên 没 + V + C.",
  "Nếu nói điều kiện hoặc năng lực khiến kết quả không thể đạt: dùng V不C.",
  "Nếu kết quả đã đạt: dùng VC; nếu nói khả năng đạt: dùng V得C hoặc 能VC tùy ý muốn nhấn.",
 ],
 frames: ["V + C", "没 + V + C", "V + 不 + C", "V + 得 + C", "V + C + 了"],
 competingNodeIds: ["de-di-de", "aspect"],
 markedCasesVi: [
  "终于看得懂了 có thể đúng khi năng lực vừa thay đổi.",
  "不能看清楚 không sai tuyệt đối; 能 phủ định khả năng của cả cụm động từ, còn 看不清楚 gắn trực tiếp hành động 看 với kết quả 清楚.",
  "Không ghép V得/不C máy móc với mọi cặp động từ–bổ ngữ.",
 ],
 errorSubtypes: [
  "RESULT_NEG_BU",
  "POTENTIAL_AS_RESULT",
  "RESULT_AS_ABILITY",
  "MODAL_FOR_POTENTIAL_MARKED",
  "INVALID_POTENTIAL_FORM",
  "COMPLEMENT_SELECTION",
 ],
 minimalContrasts: [
  {
   id: "rp-1",
   firstZh: "昨天我没听懂。",
   secondZh: "这个口音太重，我听不懂。",
   explanationVi:
    "Một câu kể lần nghe cụ thể nhưng không đạt kết quả hiểu; câu kia nói điều kiện hiện tại khiến không thể hiểu.",
  },
  {
   id: "rp-2",
   firstZh: "他解释以后，我终于听懂了。",
   secondZh: "你说慢一点，我听得懂。",
   explanationVi: "Một câu đạt kết quả cụ thể; câu kia xác nhận khả năng khi điều kiện phù hợp.",
  },
 ],
 anticipatedQuestions: [
  {
   id: "rp-q1",
   questionVi: "没看懂 là quá khứ còn 看不懂 là hiện tại hả?",
   answerVi:
    "Không. Mốc thời gian do ngữ cảnh quyết định; điểm khác chính là kết quả của một lần đã xảy ra và khả năng đạt kết quả.",
  },
  {
   id: "rp-q2",
   questionVi: "能看懂 và 看得懂 khác gì?",
   answerVi:
    "Đều có thể nói khả năng; 能 có phạm vi rộng hơn, còn V得C gắn trực tiếp hành động với trạng thái kết quả C.",
  },
  {
   id: "rp-q3",
   questionVi: "我终于看得懂这篇文章了 sai không?",
   answerVi:
    "Không nhất thiết. Nó hợp khi nhấn năng lực đã thay đổi; nếu kể lần đọc này hiểu được thì 看懂了 trực tiếp hơn.",
  },
 ],
 diagnosticTasks: [
  {
   id: "rp-m1",
   dimension: "M1",
   taskType: "choose",
   promptVi: "Phân biệt kết quả của một lần đã xảy ra với khả năng chung trong điều kiện đang nói.",
  },
  {
   id: "rp-m2",
   dimension: "M2",
   taskType: "explain",
   promptVi: "Giải thích vì sao dùng 没 hay 不.",
  },
  {
   id: "rp-m3",
   dimension: "M3",
   taskType: "transform",
   promptVi: "Biến một cặp động từ–bổ ngữ kết quả qua bốn cách diễn đạt.",
  },
  {
   id: "rp-m4",
   dimension: "M4",
   taskType: "timed",
   promptVi: "Kể nhanh một việc đã thử nhưng không xong và một việc vốn không làm nổi.",
  },
  {
   id: "rp-m5",
   dimension: "M5",
   taskType: "transfer",
   promptVi: "Dùng với một cặp động từ–bổ ngữ kết quả mới.",
  },
 ],
 opportunityRules: [
  {
   id: "rp-actual-failure-v1",
   opportunityType: "TYPE_1",
   ruleVi: "Đề bài ghi rõ đã thử trong một lần cụ thể nhưng kết quả không đạt.",
   humanReviewed: true,
   version: "1.0.0",
  },
  {
   id: "rp-ambiguous-v1",
   opportunityType: "TYPE_3",
   ruleVi: "‘Tôi không hiểu’ không cho biết đã thử hay nói năng lực.",
   humanReviewed: true,
   version: "1.0.0",
  },
 ],
 claims: [
  {
   id: "rp-c1",
   statementVi:
    "Điểm đối lập trung tâm là kết quả thực tế và khả năng đạt kết quả, không phải chỉ là quá khứ hay hiện tại.",
   sourceIds: ["research-pack-v1", "ross-2024"],
   confidence: "high",
  },
 ],
 sources: [
  researchPackSource,
  officialChineseStandardSource,
  complementClassificationSource,
  directionalGrammaticalizationSource,
  directionalResultSource,
  ross2024Source,
  nguyen2023Source,
  hanDianShuowenSource,
 ],
 researchGapsVi: [
  "Chưa có danh mục đã rà độc lập cho từng cặp động từ–bổ ngữ.",
  "Vị trí tân ngữ trong bổ ngữ xu hướng kép cần thêm ví dụ ngữ liệu đã rà.",
 ],
});
