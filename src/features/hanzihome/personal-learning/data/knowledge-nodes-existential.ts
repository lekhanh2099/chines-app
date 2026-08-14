import { knowledgeNodeSchema } from "../domain/personal-learning.schemas";
import { bccSource, existentialSource, existentialTriadSource, mannerExistentialSource, officialChineseStandardSource, researchPackSource, ross2024Source } from "./knowledge-sources";

export const existentialNode = knowledgeNodeSchema.parse({
 id: "existential",
 version: "1.1.0",
 titleVi: "Câu tồn hiện và cách đưa sự vật mới vào lời nói",
 titleZh: "存现句",
 shortLabelVi: "Tồn hiện",
 reviewStatus: "source-checked",
 contentChecksum: "46f9dc892e2cb33f03f2faad1bd8f32bbf46c803dd31fcc07e618784fb310d37",
 coreQuestionVi: "Bạn đang giới thiệu một người hoặc vật mới trong khung cảnh, mô tả tư thế/trạng thái, kể sự xuất hiện hay định vị một đối tượng đã biết?",
 functionVi: "Câu tồn hiện thường dựng vị trí làm khung cảnh trước, rồi mới đưa sự vật hoặc người mới vào lời nói.",
 whyVi: "桌上有一本书 và 一本书在桌上 có thể mô tả cùng một cảnh nhưng tổ chức thông tin khác: câu đầu dựng “trên bàn” làm khung rồi giới thiệu sách; câu sau lấy quyển sách đã biết làm chủ đề rồi nói nó ở đâu.",
 decisionStepsVi: ["Xác định vị trí làm khung cảnh hay sự vật nào đã được nhắc tới.", "Chỉ khẳng định có sự vật hoặc người: 地点 + 有 + cụm danh từ.", "Mô tả tư thế hoặc trạng thái tồn tại: 地点 + V着 + cụm danh từ.", "Kể sự vật hoặc người vừa xuất hiện/đến: 地点 + 来了/出现了 + cụm danh từ.", "Đối tượng đã biết là chủ đề: cụm danh từ + 在 + địa điểm."],
 frames: ["địa điểm + 有 + cụm danh từ", "địa điểm + động từ + 着 + cụm danh từ", "địa điểm + 来了/出现了 + cụm danh từ", "cụm danh từ + 在 + địa điểm"],
 competingNodeIds: ["aspect"],
 markedCasesVi: ["Cụm danh từ sau câu tồn hiện thường giới thiệu thông tin mới và chưa xác định, nhưng đây là xu hướng tổ chức thông tin chứ không phải lệnh cấm tuyệt đối.", "地点 + 是 có thể dùng khi đang nhận diện hoặc liệt kê “ở đó là cái gì/ai”.", "桌上放了一本书 có thể kể việc một quyển sách được đặt lên bàn; nó chỉ không hợp khi đề bài khóa nghĩa là trạng thái tĩnh đang duy trì."],
 errorSubtypes: ["EXIST_PREDICATE_OMISSION", "YOU_SHI_SUB", "YOU_VZHE_BLEND", "STATIC_DYNAMIC_CONFUSION", "ZHE_LE_SUB", "LOCATION_FRAME_ERROR", "TOPIC_PRESENTATIONAL_CONFUSION"],
 minimalContrasts: [
  { id: "ex-1", firstZh: "墙上有一张照片。", secondZh: "墙上挂着一张照片。", explanationVi: "Một câu chỉ nói có một bức ảnh; câu kia còn nói bức ảnh đang ở trạng thái treo." },
  { id: "ex-2", firstZh: "门口来了一个人。", secondZh: "门口站着一个人。", explanationVi: "Một câu kể một người vừa đến; câu kia mô tả người đó đang đứng ở cửa." },
  { id: "ex-3", firstZh: "桌上有一本书。", secondZh: "一本书在桌上。", explanationVi: "Câu đầu dựng vị trí rồi giới thiệu quyển sách mới; câu sau lấy quyển sách đã biết làm chủ đề rồi định vị nó." },
 ],
 anticipatedQuestions: [
  { id: "ex-q1", questionVi: "桌上有一本书 và 一本书在桌上 khác gì?", answerVi: "Câu đầu dựng “trên bàn” làm khung rồi giới thiệu sách; câu sau lấy sách làm chủ đề rồi nói nó ở đâu." },
  { id: "ex-q2", questionVi: "桌上是一本书 luôn sai hả?", answerVi: "Không. Nó có thể hợp khi trả lời câu hỏi nhận diện hoặc liệt kê, chẳng hạn “trên bàn là gì?”." },
  { id: "ex-q3", questionVi: "Sau câu tồn hiện luôn phải có 一 + lượng từ không?", answerVi: "Không. Cụm danh từ mới và chưa xác định là xu hướng mạnh do cách tổ chức thông tin, không phải quy tắc bề mặt tuyệt đối." },
 ],
 diagnosticTasks: [
  { id: "ex-m1", dimension: "M1", taskType: "choose", promptVi: "Chọn mẫu câu theo ý muốn nói: có mặt, trạng thái, sự xuất hiện hay định vị đối tượng đã biết." },
  { id: "ex-m2", dimension: "M2", taskType: "explain", promptVi: "Chỉ ra khung cảnh và sự vật hoặc người mới được giới thiệu." },
  { id: "ex-m3", dimension: "M3", taskType: "transform", promptVi: "Mô tả cùng một bức ảnh bằng bốn mẫu câu." },
  { id: "ex-m4", dimension: "M4", taskType: "timed", promptVi: "Mô tả phòng trong thời gian giới hạn." },
  { id: "ex-m5", dimension: "M5", taskType: "transfer", promptVi: "Giới thiệu một khung cảnh mới mà không được báo trước cấu trúc." },
 ],
 opportunityRules: [
  { id: "exist-state-v1", opportunityType: "TYPE_1", ruleVi: "Đề bài nêu rõ ý muốn nói: có sự vật, tư thế/trạng thái, sự xuất hiện hoặc vị trí của đối tượng đã biết.", humanReviewed: true, version: "1.0.0" },
  { id: "exist-free-v1", opportunityType: "TYPE_2", ruleVi: "Ngữ cảnh cho phép nhiều cách diễn đạt tự nhiên và đề bài không buộc người học phải chọn một cách tổ chức thông tin duy nhất.", humanReviewed: true, version: "1.0.0" },
 ],
 claims: [{ id: "ex-c1", statementVi: "Câu tồn hiện liên hệ chặt với cách dựng khung cảnh và đưa thông tin mới vào lời nói.", sourceIds: ["research-pack-v1", "nam-2022", "ross-2024"], confidence: "high" }],
 sources: [researchPackSource, officialChineseStandardSource, existentialSource, existentialTriadSource, mannerExistentialSource, ross2024Source, bccSource],
 researchGapsVi: ["Chưa có đầy đủ luận văn người học và các mẫu ngữ liệu đã lưu.", "Ranh giới chức năng giữa 有、是 và động từ + 着 cần thêm rà soát thủ công."],
});
