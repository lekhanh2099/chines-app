import { knowledgeNodeSchema } from "../domain/personal-learning.schemas";
import {
 aspectSource,
 nguyen2023Source,
 researchPackSource,
 ross2024Source,
} from "./knowledge-sources";

export const aspectNode = knowledgeNodeSchema.parse({
 id: "aspect",
 version: "1.0.0",
 titleVi: "Góc nhìn sự kiện: 了 / 过 / 着 / 在",
 titleZh: "体标记：了、过、着、在",
 shortLabelVi: "Thể và trạng thái",
 reviewStatus: "source-checked",
 contentChecksum: "47f79f6771952c978594b5df24fc52ccbf255a338bb365efb31e377e2002f2a9",
 coreQuestionVi:
  "Bạn muốn nhìn sự việc như một sự kiện đã xảy ra, một trải nghiệm, một trạng thái đang duy trì hay một quá trình đang diễn ra?",
 functionVi:
  "Các dấu hiệu này cho biết người nói đang nhìn sự việc theo góc nào: một việc đã hoàn tất, một trải nghiệm, một trạng thái đang duy trì, một quá trình đang diễn ra hoặc một tình hình vừa thay đổi. Chúng không chia động từ theo thì như tiếng Anh.",
 whyVi:
  "Thời điểm thường đã được cho biết bằng trạng từ hoặc ngữ cảnh. 了、过、着、在/正在 không chỉ thời gian; chúng cho biết người nói muốn nhìn toàn bộ sự việc, kinh nghiệm từng có, trạng thái đang giữ hay quá trình đang diễn ra. Nghĩa vốn có của động từ cũng ảnh hưởng cách dùng.",
 decisionStepsVi: [
  "Trước hết xác định thời điểm từ trạng từ và ngữ cảnh; đừng coi 了 là dấu quá khứ.",
  "Nếu kể một sự việc cụ thể như một khối đã xảy ra hoặc đã tới ranh giới: xét 了 sau động từ.",
  "Nếu nhấn từng có trải nghiệm trước mốc đang nói: xét 过.",
  "Nếu mô tả trạng thái đang duy trì: xét 着; nếu nhấn hành động đang diễn ra: xét 在/正在.",
  "Nếu báo một tình hình mới hoặc sự thay đổi liên quan tới hiện tại: xét 了 ở cuối câu.",
 ],
 frames: ["V 了", "S ... 了", "V 过", "V 着", "在/正在 V"],
 competingNodeIds: ["result-potential", "existential"],
 markedCasesVi: [
  "昨天去过北京 không sai tuyệt đối; câu có thể nhấn trải nghiệm từng đến Bắc Kinh trong khoảng thời gian hôm qua.",
  "Trong 睡着, 着 là phần kết quả ‘ngủ thiếp đi’, không phải dấu trạng thái đang duy trì.",
  "Hai chữ 了 có thể cùng xuất hiện: một chữ gắn với động từ, một chữ báo tình hình mới ở cuối câu; ranh giới nghĩa cần xét cả câu.",
 ],
 errorSubtypes: [
  "LE_OMISSION_ACTUALIZED",
  "LE_OVERUSE_PAST",
  "SF_LE_CHANGE_MISSING",
  "GUO_EVENT_SUB",
  "ZHE_PROGRESSIVE_SUB",
  "ZAI_STATE_SUB",
  "ZHE_RESULTATIVE_MISCLASSIFIED",
  "DURATION_LE_ORDER",
 ],
 minimalContrasts: [
  {
   id: "as-1",
   firstZh: "昨天我去了北京。",
   secondZh: "我去过北京。",
   explanationVi: "Chuyến đi cụ thể đối lập với kinh nghiệm.",
  },
  {
   id: "as-2",
   firstZh: "他正在穿衣服。",
   secondZh: "他穿着一件黑衣服。",
   explanationVi: "Quá trình mặc vào đối lập với trạng thái đang mặc.",
  },
  {
   id: "as-3",
   firstZh: "有人正在开门。",
   secondZh: "门开着。",
   explanationVi:
    "Một bên là quá trình có người đang mở cửa; bên kia là trạng thái cánh cửa đang mở.",
  },
 ],
 anticipatedQuestions: [
  {
   id: "as-q1",
   questionVi: "Vì sao câu quá khứ không cần 了?",
   answerVi:
    "Vì 了 không phải đuôi chia thì quá khứ. Thời điểm có thể đã rõ nhờ trạng từ hoặc ngữ cảnh; 了 chủ yếu cho biết cách người nói nhìn sự việc.",
  },
  {
   id: "as-q2",
   questionVi: "门正在开着 sai tuyệt đối không?",
   answerVi:
    "Hai cách nhìn thường xung đột: 正在 nhấn quá trình đang mở, còn 着 nhấn trạng thái cửa đang mở. Phải xác định bạn muốn nói hành động đang diễn ra hay trạng thái đang duy trì.",
  },
  {
   id: "as-q3",
   questionVi: "我认识他三年了 sao không có V了?",
   answerVi:
    "认识 biểu thị một trạng thái. Khoảng thời gian + 了 cuối câu cho biết trạng thái ấy bắt đầu trước đây và vẫn còn liên quan tới hiện tại.",
  },
 ],
 diagnosticTasks: [
  {
   id: "as-m1",
   dimension: "M1",
   taskType: "choose",
   promptVi: "Chọn 了、过、着 hoặc 在/正在 theo góc nhìn được yêu cầu.",
  },
  {
   id: "as-m2",
   dimension: "M2",
   taskType: "explain",
   promptVi:
    "Giải thích sự việc cụ thể, trải nghiệm, trạng thái duy trì và quá trình đang diễn ra.",
  },
  {
   id: "as-m3",
   dimension: "M3",
   taskType: "transform",
   promptVi: "Mô tả cùng cảnh bằng 正在V và V着.",
  },
  { id: "as-m4", dimension: "M4", taskType: "timed", promptVi: "Kể nhanh sự kiện và mô tả ảnh." },
  {
   id: "as-m5",
   dimension: "M5",
   taskType: "transfer",
   promptVi: "Dùng dấu hiệu phù hợp trong một chủ đề mới.",
  },
 ],
 opportunityRules: [
  {
   id: "aspect-viewpoint-v1",
   opportunityType: "TYPE_1",
   ruleVi:
    "Đề bài nêu rõ một sự việc cụ thể đã xảy ra, trải nghiệm từng có, trạng thái đang duy trì, hành động đang diễn ra hoặc tình hình vừa thay đổi.",
   humanReviewed: true,
   version: "1.0.0",
  },
 ],
 claims: [
  {
   id: "as-c1",
   statementVi:
    "Các dấu hiệu thể trong tiếng Hán không chia động từ thành quá khứ, hiện tại và tương lai.",
   sourceIds: ["research-pack-v1", "klein-2000", "ross-2024"],
   confidence: "high",
  },
  {
   id: "as-c2",
   statementVi:
    "Có nhiều cách phân tích quan hệ giữa hai chữ 了; giao diện chỉ trình bày những chức năng đã có căn cứ rõ.",
   sourceIds: ["research-pack-v1", "klein-2000"],
   confidence: "medium",
  },
 ],
 sources: [researchPackSource, aspectSource, ross2024Source, nguyen2023Source],
 researchGapsVi: [
  "Cách giải thích lý thuyết về quan hệ giữa hai chữ 了 vẫn chưa hoàn toàn thống nhất.",
  "Cần thêm mẫu ngữ liệu đã lưu cho các khác biệt vùng miền và văn phong.",
 ],
});
