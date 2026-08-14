import {
 calibrationItemSchema,
 type CalibrationItem,
 type KnowledgeNodeId,
} from "../domain/personal-learning.schemas";

const items = calibrationItemSchema.array().parse([
 {
  id: "de-primary",
  version: "1.0.0",
  knowledgeNodeId: "de-di-de",
  dimension: "M1",
  promptVi: "Chọn câu diễn đạt: ‘Điều tôi muốn nói không phải là chuyện này.’",
  contextZh: "我想说___不是这个。",
  options: [
   { id: "a", textZh: "的" },
   { id: "b", textZh: "得" },
   { id: "c", textZh: "地" },
  ],
  correctOptionId: "a",
  decisionQuestionVi:
   "Cả cụm 我想说… đang biến thành một danh ngữ ‘điều tôi muốn nói’ hay đang bổ nghĩa cách nói?",
  explanationVi:
   "的 danh hóa mệnh đề 我想说, tạo thành chủ đề ‘điều tôi muốn nói’. Đây không phải bổ ngữ sau động từ.",
  selfCorrectionPromptVi: "Viết lại toàn câu bằng chữ de phù hợp.",
  parallelItemId: "de-parallel",
  opportunityRuleId: "de-relative-v1",
 },
 {
  id: "de-parallel",
  version: "1.0.0",
  knowledgeNodeId: "de-di-de",
  dimension: "M2",
  promptVi: "Chọn câu nói ‘Anh ấy nói rất nhanh’ theo nghĩa đánh giá tốc độ nói.",
  contextZh: "他说___很快。",
  options: [
   { id: "a", textZh: "的" },
   { id: "b", textZh: "得" },
   { id: "c", textZh: "地" },
  ],
  correctOptionId: "b",
  decisionQuestionVi: "很快 đứng sau 说 để đánh giá vị ngữ hay tạo một danh ngữ?",
  explanationVi:
   "得 nối 说 với phần bổ sung 很快 để đánh giá tốc độ nói. 的 chỉ hợp khi phía sau có một danh từ trung tâm được lược bỏ và ngữ cảnh cho phép khôi phục.",
  selfCorrectionPromptVi: "Viết câu hoàn chỉnh và ghi một câu ngắn giải thích trung tâm của cụm.",
  parallelItemId: null,
  opportunityRuleId: "de-relative-v1",
 },
 {
  id: "result-primary",
  version: "1.0.0",
  knowledgeNodeId: "result-potential",
  dimension: "M1",
  promptVi: "Hôm qua tôi nghe nhiều lần nhưng cuối cùng vẫn không hiểu.",
  contextZh: "昨天我听了好几遍，可是最后还是___。",
  options: [
   { id: "a", textZh: "听不懂" },
   { id: "b", textZh: "没听懂" },
  ],
  correctOptionId: "b",
  decisionQuestionVi:
   "Đây là một lần nghe đã xảy ra nhưng không đạt kết quả, hay là giới hạn khả năng nói chung?",
  explanationVi:
   "没听懂 phủ định kết quả của lần nghe cụ thể. 听不懂 cho biết trong điều kiện hoặc năng lực hiện tại, kết quả “hiểu” không thể đạt được.",
  selfCorrectionPromptVi:
   "Viết lại câu và thêm một câu dùng cấu trúc còn lại theo nghĩa khả năng.",
  parallelItemId: "result-parallel",
  opportunityRuleId: "rp-actual-failure-v1",
 },
 {
  id: "result-parallel",
  version: "1.0.0",
  knowledgeNodeId: "result-potential",
  dimension: "M2",
  promptVi: "Giọng này quá nặng nên tôi không thể nghe hiểu.",
  contextZh: "这个口音太重，我___。",
  options: [
   { id: "a", textZh: "没听懂" },
   { id: "b", textZh: "听不懂" },
  ],
  correctOptionId: "b",
  decisionQuestionVi:
   "Câu đang báo cáo kết quả của một lần đã xảy ra hay nêu giới hạn do điều kiện hiện tại?",
  explanationVi:
   "听不懂 ghép hành động 听 với kết quả 懂 và dùng 不 để cho biết kết quả ấy không thể đạt do giọng nói quá nặng.",
  selfCorrectionPromptVi:
   "Viết lại toàn câu và đổi thành một sự kiện cụ thể đã thử nhưng thất bại.",
  parallelItemId: null,
  opportunityRuleId: "rp-actual-failure-v1",
 },
 {
  id: "aspect-primary",
  version: "1.0.0",
  knowledgeNodeId: "aspect",
  dimension: "M1",
  promptVi: "Một người đang trong quá trình mở cửa.",
  contextZh: "有人___开门。",
  options: [
   { id: "a", textZh: "正在" },
   { id: "b", textZh: "着" },
  ],
  correctOptionId: "a",
  decisionQuestionVi: "Bạn muốn nhấn quá trình mở cửa đang diễn ra hay trạng thái cửa đang mở?",
  explanationVi:
   "正在 nhấn quá trình mở cửa đang diễn ra; 门开着 nhấn trạng thái cửa đang mở và được duy trì.",
  selfCorrectionPromptVi: "Viết một cặp câu: quá trình mở cửa và trạng thái cửa mở.",
  parallelItemId: "aspect-parallel",
  opportunityRuleId: "aspect-viewpoint-v1",
 },
 {
  id: "aspect-parallel",
  version: "1.0.0",
  knowledgeNodeId: "aspect",
  dimension: "M2",
  promptVi: "Tôi từng đến Bắc Kinh.",
  contextZh: "我___北京。",
  options: [
   { id: "a", textZh: "去了" },
   { id: "b", textZh: "去过" },
  ],
  correctOptionId: "b",
  decisionQuestionVi: "Câu kể một chuyến đi cụ thể hay nói về trải nghiệm từng đến đó?",
  explanationVi:
   "过 trình bày sự việc như một trải nghiệm đã từng có trước mốc đang nói; 了 phù hợp hơn khi kể một chuyến đi cụ thể đã xảy ra.",
  selfCorrectionPromptVi: "Viết hai câu đối lập: một chuyến đi cụ thể và một kinh nghiệm.",
  parallelItemId: null,
  opportunityRuleId: "aspect-viewpoint-v1",
 },
 {
  id: "ba-primary",
  version: "1.0.0",
  knowledgeNodeId: "ba-bei",
  dimension: "M1",
  promptVi: "Nhấn rằng bài tập cụ thể đã được tôi làm xong.",
  contextZh: "我___作业做完了。",
  options: [
   { id: "a", textZh: "把" },
   { id: "b", textZh: "被" },
  ],
  correctOptionId: "a",
  decisionQuestionVi:
   "Chủ ngữ là người thực hiện hành động lên tân ngữ, hay đối tượng chịu tác động đang được đưa lên làm chủ đề câu?",
  explanationVi:
   "把 đưa 作业 đã được xác định vào trọng tâm xử lý, rồi vị ngữ 做完了 nêu rõ kết quả bài tập đã được làm xong.",
  selfCorrectionPromptVi:
   "Viết lại cùng sự việc bằng câu chủ động thông thường và câu 被, rồi ghi rõ điểm nhìn khác nhau.",
  parallelItemId: "ba-parallel",
  opportunityRuleId: "ba-affected-v1",
 },
 {
  id: "ba-parallel",
  version: "1.0.0",
  knowledgeNodeId: "ba-bei",
  dimension: "M2",
  promptVi: "Chỉ mô tả điện thoại đã hỏng, không cần nêu ai làm.",
  contextZh: "手机___。",
  options: [
   { id: "a", textZh: "被弄坏了" },
   { id: "b", textZh: "坏了" },
  ],
  correctOptionId: "b",
  decisionQuestionVi:
   "Người hoặc nguyên nhân gây hỏng có quan trọng với điều muốn nói không, hay chỉ cần nêu trạng thái điện thoại đã hỏng?",
  explanationVi:
   "手机坏了 là cách kể trung tính, chỉ nêu điện thoại chuyển sang trạng thái hỏng. Câu 被 chỉ cần thiết khi người nói muốn đưa đối tượng bị tác động và người hoặc nguyên nhân gây hỏng vào trọng tâm.",
  selfCorrectionPromptVi: "Viết thêm một câu 被 hợp lý có nêu tác thể.",
  parallelItemId: null,
  opportunityRuleId: "bei-perspective-v1",
 },
 {
  id: "exist-primary",
  version: "1.0.0",
  knowledgeNodeId: "existential",
  dimension: "M1",
  promptVi: "Mô tả tĩnh: ở cửa có một người đang đứng.",
  contextZh: "门口___一个人。",
  options: [
   { id: "a", textZh: "站着" },
   { id: "b", textZh: "来了" },
   { id: "c", textZh: "在" },
  ],
  correctOptionId: "a",
  decisionQuestionVi:
   "Bạn đang mô tả tư thế/trạng thái tĩnh, kể sự xuất hiện hay định vị một đối tượng đã biết?",
  explanationVi:
   "Địa điểm + động từ + 着 + danh ngữ dùng để giới thiệu một đối tượng mới đồng thời mô tả tư thế hoặc trạng thái đang duy trì của đối tượng ấy.",
  selfCorrectionPromptVi: "Viết ba câu đối lập dùng 有, 站着 và 来了.",
  parallelItemId: "exist-parallel",
  opportunityRuleId: "exist-state-v1",
 },
 {
  id: "exist-parallel",
  version: "1.0.0",
  knowledgeNodeId: "existential",
  dimension: "M2",
  promptVi: "Cuốn sách đã được nhắc đến; hãy nói nó ở trên bàn.",
  contextZh: "一本书___桌上。",
  options: [
   { id: "a", textZh: "在" },
   { id: "b", textZh: "有" },
  ],
  correctOptionId: "a",
  decisionQuestionVi:
   "Đối tượng đã biết đang làm chủ đề câu, hay địa điểm đang làm khung để giới thiệu một đối tượng mới?",
  explanationVi:
   "Danh ngữ + 在 + địa điểm lấy cuốn sách làm chủ đề đã biết. 桌上有一本书 lấy địa điểm làm điểm xuất phát để giới thiệu cuốn sách như thông tin mới.",
  selfCorrectionPromptVi:
   "Viết lại theo kiểu bắt đầu từ địa điểm để giới thiệu cuốn sách như thông tin mới.",
  parallelItemId: null,
  opportunityRuleId: "exist-state-v1",
 },
 {
  id: "condition-primary",
  version: "1.0.0",
  knowledgeNodeId: "conditionals",
  dimension: "M1",
  promptVi: "Chỉ cần có hộ chiếu là đủ để làm thủ tục này.",
  contextZh: "___有护照，___能办这个手续。",
  options: [
   { id: "a", textZh: "只要 / 就" },
   { id: "b", textZh: "只有 / 才" },
  ],
  correctOptionId: "a",
  decisionQuestionVi:
   "Người nói xem việc có hộ chiếu là điều kiện tối thiểu đã đủ, hay là điều kiện bắt buộc nhưng chưa chắc đã đủ?",
  explanationVi:
   "只要…就… trình bày P như điều kiện tối thiểu đã đủ để Q xảy ra theo nhận định của người nói.",
  selfCorrectionPromptVi: "Viết lại thành quy định “chỉ khi có hộ chiếu mới làm được”.",
  parallelItemId: "condition-parallel",
  opportunityRuleId: "condition-policy-v1",
 },
 {
  id: "condition-parallel",
  version: "1.0.0",
  knowledgeNodeId: "conditionals",
  dimension: "M2",
  promptVi: "Không có giấy phép thì tuyệt đối không được vào; giấy phép là điều kiện bắt buộc.",
  contextZh: "___有许可证，___能进去。",
  options: [
   { id: "a", textZh: "只要 / 就" },
   { id: "b", textZh: "只有 / 才" },
  ],
  correctOptionId: "b",
  decisionQuestionVi:
   "Người nói xem P là điều kiện đã đủ, hay là ngưỡng bắt buộc mà thiếu nó thì Q không thể xảy ra?",
  explanationVi: "只有…才… đặt P thành điều kiện bắt buộc: nếu thiếu P thì Q không thể xảy ra.",
  selfCorrectionPromptVi:
   "Viết một câu 只要…就… với cùng chủ đề nhưng đổi sang nghĩa “đạt điều kiện này là đủ”.",
  parallelItemId: null,
  opportunityRuleId: "condition-policy-v1",
 },
]);

export const calibrationItems: readonly CalibrationItem[] = items;

export function getCalibrationItem(itemId: string): CalibrationItem | null {
 return calibrationItems.find((item) => item.id === itemId) ?? null;
}

export function getPrimaryCalibrationItemIds(skipNodeIds: readonly KnowledgeNodeId[]): string[] {
 return calibrationItems
  .filter((item) => item.id.endsWith("-primary") && !skipNodeIds.includes(item.knowledgeNodeId))
  .map((item) => item.id);
}
