import { knowledgeNodeSchema } from "../domain/personal-learning.schemas";
import {
 baArgumentSource,
 baCorpusSource,
 beiMovementSource,
 nguyen2023Source,
 officialChineseStandardSource,
 passiveSource,
 researchPackSource,
 ross2024Source,
} from "./knowledge-sources";

export const baBeiNode = knowledgeNodeSchema.parse({
 id: "ba-bei",
 version: "1.1.0",
 titleVi: "Đóng gói sự kiện: câu thường / 把 / 被 / tự biến đổi",
 titleZh: "一般句、把字句、被字句与自变句",
 shortLabelVi: "把 / 被 và góc nhìn",
 reviewStatus: "source-checked",
 contentChecksum: "8152cae4dbc39f17911108f3ca673bc842cffdf38ee535d27c96b3c7040fb04d",
 coreQuestionVi:
  "Bạn muốn kể hành động một cách trung tính, đưa vật chịu tác động vào trung tâm, nhìn từ phía đối tượng chịu tác động hay chỉ nêu trạng thái đã thay đổi?",
 functionVi:
  "Câu chủ động thông thường chỉ kể ai làm gì. 把 đưa một tân ngữ đã biết vào trước để nói rõ nó bị xử lý ra sao. 被 lấy đối tượng chịu tác động làm trung tâm. Câu tự biến đổi chỉ nêu trạng thái đổi khi không cần nói nguyên nhân.",
 whyVi:
  "Nếu 把 chỉ là đưa tân ngữ lên trước thì mọi động từ có tân ngữ đều dùng được. Thực tế, tân ngữ thường phải đã xác định, thật sự chịu tác động, và vị ngữ phải nói đủ kết quả hoặc cách xử lý nó.",
 decisionStepsVi: [
  "Xác định người hoặc vật nào đang là trung tâm câu.",
  "Nếu chỉ kể ai làm gì: giữ câu chủ động thông thường.",
  "Nếu một tân ngữ cụ thể bị xử lý, biến đổi hoặc đặt vào vị trí: xét 把 và kiểm tra phần sau đã nói đủ chuyện gì xảy ra với nó chưa.",
  "Nếu cần nhìn từ phía đối tượng chịu tác động hoặc không cần nêu rõ người gây ra: xét 被.",
  "Nếu chỉ cần nói trạng thái đã thay đổi mà nguyên nhân không quan trọng: dùng câu tự biến đổi.",
 ],
 frames: [
  "chủ thể + động từ + tân ngữ",
  "chủ thể + 把 + tân ngữ + phần xử lý",
  "đối tượng + 被 + người gây ra + phần tác động",
  "đối tượng + động từ/tính từ + 了",
 ],
 competingNodeIds: ["result-potential", "aspect"],
 markedCasesVi: [
  "Sau 把 không bắt buộc phải có riêng chữ 了; phần sau phải nói đủ kết quả, vị trí, số lượng hoặc cách tân ngữ bị xử lý.",
  "被 không bắt buộc mang nghĩa tiêu cực; quan trọng là đối tượng chịu tác động và lý do người nói chọn nhìn sự việc từ phía đó.",
  "“Bị/được” trong tiếng Việt không tương ứng một–một với 被.",
 ],
 errorSubtypes: [
  "BA_NO_AFFECTEDNESS",
  "BA_INDEFINITE_OBJECT",
  "BA_WEAK_PREDICATE",
  "BA_OBJECT_ORDER",
  "BEI_NO_DISCOURSE_MOTIVATION",
  "BEI_AGENT_ROLE_ERROR",
  "VIETNAMESE_BI_DUOC_TRANSFER",
  "SELF_CHANGE_PREFERRED",
 ],
 minimalContrasts: [
  {
   id: "bb-1",
   firstZh: "我做完了作业。",
   secondZh: "我把作业做完了。",
   explanationVi: "Cả hai đúng; câu 把 đưa bài tập vào trung tâm và nhấn kết quả làm xong nó.",
  },
  {
   id: "bb-2",
   firstZh: "手机坏了。",
   secondZh: "手机被他弄坏了。",
   explanationVi:
    "Câu đầu chỉ nêu điện thoại đã hỏng; câu sau nói rõ ai làm nó hỏng và nhìn sự việc từ phía điện thoại.",
  },
  {
   id: "bb-3",
   firstZh: "他打开了门。",
   secondZh: "门被他打开了。",
   explanationVi: "Cùng một sự việc nhưng trung tâm câu và lý do lựa chọn cấu trúc khác nhau.",
  },
 ],
 anticipatedQuestions: [
  {
   id: "bb-q1",
   questionVi: "Sau 把 có bắt buộc phải có 了 không?",
   answerVi:
    "Không. Phần sau 把 phải nói đủ chuyện gì xảy ra với tân ngữ; không bắt buộc chứa một chữ cụ thể.",
  },
  {
   id: "bb-q2",
   questionVi: "Tân ngữ sau 把 có bắt buộc xác định không?",
   answerVi:
    "Thường phải là người hoặc vật người nghe có thể nhận ra trong ngữ cảnh; không nhất thiết lúc nào cũng có 这/那 nhưng không nên là một tân ngữ hoàn toàn mới và mơ hồ.",
  },
  {
   id: "bb-q3",
   questionVi: "被 có luôn mang nghĩa xấu không?",
   answerVi:
    "Không. Câu 被 có thể kể việc tốt, xấu hoặc trung tính; điểm chính là đưa đối tượng chịu tác động vào trung tâm câu.",
  },
 ],
 diagnosticTasks: [
  {
   id: "bb-m1",
   dimension: "M1",
   taskType: "choose",
   promptVi: "Chọn cách tổ chức câu phù hợp cho cùng một sự việc.",
  },
  {
   id: "bb-m2",
   dimension: "M2",
   taskType: "explain",
   promptVi: "Chỉ ra đối tượng bị tác động và lý do người nói đưa nó làm trung tâm.",
  },
  {
   id: "bb-m3",
   dimension: "M3",
   taskType: "transform",
   promptVi: "Viết cùng một sự việc theo bốn cách tổ chức câu.",
  },
  {
   id: "bb-m4",
   dimension: "M4",
   taskType: "timed",
   promptVi: "Kể nhanh việc làm mất và tìm lại đồ vật.",
  },
  {
   id: "bb-m5",
   dimension: "M5",
   taskType: "transfer",
   promptVi: "Dùng cách tổ chức câu tự nhiên trong đoạn mới.",
  },
 ],
 opportunityRules: [
  {
   id: "ba-affected-v1",
   opportunityType: "TYPE_1",
   ruleVi: "Đề bài yêu cầu đưa một tân ngữ cụ thể và kết quả xảy ra với nó vào trung tâm.",
   humanReviewed: true,
   version: "1.0.0",
  },
  {
   id: "bei-perspective-v1",
   opportunityType: "TYPE_1",
   ruleVi: "Đề bài yêu cầu nhìn từ phía đối tượng chịu tác động hoặc làm mờ người gây ra.",
   humanReviewed: true,
   version: "1.0.0",
  },
  {
   id: "transitive-option-v1",
   opportunityType: "TYPE_2",
   ruleVi: "Một câu có động từ và tân ngữ trung tính có thể dùng 把 nhưng không bắt buộc.",
   humanReviewed: true,
   version: "1.0.0",
  },
 ],
 claims: [
  {
   id: "bb-c1",
   statementVi:
    "Mức độ tân ngữ bị tác động và cách tổ chức thông tin là hai điều kiện cốt lõi của 把/被.",
   sourceIds: ["research-pack-v1", "law-hirschberg-2025", "ross-2024"],
   confidence: "high",
  },
  {
   id: "bb-c2",
   statementVi: "被 không chỉ dùng cho sự việc tiêu cực.",
   sourceIds: ["research-pack-v1", "law-hirschberg-2025"],
   confidence: "high",
  },
 ],
 sources: [
  researchPackSource,
  officialChineseStandardSource,
  baArgumentSource,
  baCorpusSource,
  passiveSource,
  beiMovementSource,
  ross2024Source,
  nguyen2023Source,
 ],
 researchGapsVi: [
  "Cần thêm cặp câu ngữ liệu theo từng văn phong.",
  "Các biến thể chấp nhận được với vị ngữ ngắn chưa được hai người rà độc lập.",
 ],
});
