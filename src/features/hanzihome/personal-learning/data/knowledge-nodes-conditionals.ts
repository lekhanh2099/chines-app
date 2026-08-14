import { knowledgeNodeSchema } from "../domain/personal-learning.schemas";
import {
 bccSource,
 conditionalSource,
 researchPackSource,
 ross2024Source,
} from "./knowledge-sources";

export const conditionalsNode = knowledgeNodeSchema.parse({
 id: "conditionals",
 version: "1.0.0",
 titleVi: "Chỉ cần hay chỉ khi: 只要 / 只有",
 titleZh: "只要、只有与条件逻辑",
 shortLabelVi: "Điều kiện đủ ↔ cần",
 reviewStatus: "source-checked",
 contentChecksum: "5b7c856762fa32924c861481b0b69e679803908a2f0c27783bc3a06040c7e5ae",
 coreQuestionVi:
  "Người nói muốn nói chỉ cần có P thì Q có thể xảy ra, hay chỉ khi có P thì Q mới được phép hoặc mới có thể xảy ra?",
 functionVi:
  "只要 P，就 Q trình bày P như ngưỡng tối thiểu đã đủ để Q xảy ra; 只有 P，才 Q trình bày P như điều kiện bắt buộc, thiếu P thì Q không xảy ra.",
 whyVi:
  "Cùng một tình huống có thể dùng cả hai nếu người nói thay đổi điều mình muốn khẳng định. Quan hệ đủ–cần là lõi quyết định, nhưng sắc thái khả năng, kỳ vọng, phương án khác và ngữ cảnh vẫn ảnh hưởng độ tự nhiên.",
 decisionStepsVi: [
  "Viết rõ điều muốn khẳng định: P đã đủ cho Q hay P là điều kiện bắt buộc của Q.",
  "Nếu P được nêu như ngưỡng tối thiểu đủ cho Q: dùng 只要…就….",
  "Nếu không có P thì Q không xảy ra/không được phép: dùng 只有…才….",
  "Kiểm tra 只 và 才 đang giới hạn phần nào; không tự thêm kiến thức ngoài tình huống đề bài.",
 ],
 frames: ["只要 P，就 Q", "只有 P，才 Q", "如果 P，就 Q", "除非 P，否则 Q"],
 competingNodeIds: [],
 markedCasesVi: [
  "Khi gặp 只要…才… hoặc 只有…就…, phải kiểm tra cách ngắt câu, chữ 要 mang nghĩa “cần”, phần bị lược và khả năng người nói đang tự sửa; không được kết luận chỉ bằng cách dò cặp từ.",
  "才 còn nhiều nghĩa khác ngoài việc đánh dấu điều kiện bắt buộc hoặc ngưỡng đạt được.",
  "“Chỉ cần” trong lời nói tự nhiên thường dựa trên giả định của người nói, không phải lúc nào cũng là bảo đảm tuyệt đối ngoài đời.",
 ],
 errorSubtypes: [
  "SUFFICIENT_NECESSARY_SUB",
  "JIU_CAI_PAIR_MISMATCH",
  "CLAUSE_SCOPE_ERROR",
  "CONDITION_RESULT_ORDER",
  "ONLY_SCOPE_ERROR",
  "ELLIPSIS_MISCLASSIFIED",
 ],
 minimalContrasts: [
  {
   id: "co-1",
   firstZh: "只要通过考试，就可以毕业。",
   secondZh: "只有通过考试，才可以毕业。",
   explanationVi:
    "Câu đầu khẳng định qua kỳ thi là đã đủ để tốt nghiệp; câu sau khẳng định đó là điều kiện bắt buộc.",
  },
  {
   id: "co-2",
   firstZh: "只要你努力，就会进步。",
   secondZh: "如果你努力，就会进步。",
   explanationVi: "只要 nhấn rằng điều kiện nêu ra đã đủ; 如果 chỉ đặt ra một điều kiện giả định.",
  },
 ],
 anticipatedQuestions: [
  {
   id: "co-q1",
   questionVi: "只有你努力，就会进步 luôn sai không?",
   answerVi:
    "Đây là cách ghép không điển hình trong mẫu cơ bản, nhưng vẫn phải kiểm tra cách ngắt câu và ý nghĩa người nói muốn diễn đạt trước khi kết luận.",
  },
  {
   id: "co-q2",
   questionVi: "只要 nói điều kiện đủ sao kết quả vẫn có thể không xảy ra?",
   answerVi:
    "Ngôn ngữ tự nhiên chứa sắc thái khả năng và giả định của người nói; lời khẳng định có thể có ngoại lệ chứ không phải định luật tuyệt đối.",
  },
  {
   id: "co-q3",
   questionVi: "Có thể bỏ 就/才 không?",
   answerVi:
    "Một số ngữ cảnh cho phép bỏ hoặc thay 就/才, nhưng mức nhấn và độ liên kết giữa hai vế sẽ đổi; đây không phải hai chữ bắt buộc trong mọi câu.",
  },
 ],
 diagnosticTasks: [
  { id: "co-m1", dimension: "M1", taskType: "choose", promptVi: "Phân loại điều kiện đủ và cần." },
  {
   id: "co-m2",
   dimension: "M2",
   taskType: "explain",
   promptVi: "Giải thích điều câu đang khẳng định và nêu trường hợp phản chứng.",
  },
  {
   id: "co-m3",
   dimension: "M3",
   taskType: "transform",
   promptVi: "Viết cùng một quy định theo hai cách khẳng định đủ và cần khác nhau.",
  },
  {
   id: "co-m4",
   dimension: "M4",
   taskType: "timed",
   promptVi: "Lập luận nhanh bằng ngưỡng điều kiện phù hợp.",
  },
  {
   id: "co-m5",
   dimension: "M5",
   taskType: "transfer",
   promptVi: "Dùng trong chủ đề mới không báo trước.",
  },
 ],
 opportunityRules: [
  {
   id: "condition-policy-v1",
   opportunityType: "TYPE_1",
   ruleVi:
    "Đề bài nêu rõ quy định hoặc quan hệ nguyên nhân để xác định P là điều kiện đủ hay điều kiện cần.",
   humanReviewed: true,
   version: "1.0.0",
  },
  {
   id: "condition-world-v1",
   opportunityType: "TYPE_3",
   ruleVi:
    "Câu tự do không cung cấp đủ kiến thức về tình huống để xác định điều người nói muốn khẳng định.",
   humanReviewed: true,
   version: "1.0.0",
  },
 ],
 claims: [
  {
   id: "co-c1",
   statementVi:
    "Trong mẫu cơ bản, 只要 biểu thị điều kiện đủ tối thiểu; 只有 biểu thị điều kiện bắt buộc.",
   sourceIds: ["research-pack-v1", "wimmer-2022"],
   confidence: "high",
  },
 ],
 sources: [researchPackSource, conditionalSource, ross2024Source, bccSource],
 researchGapsVi: [
  "Các cách ghép không điển hình chưa được rà xong trên ngữ liệu.",
  "Các biến thể theo ngữ cảnh chưa được hai người đánh giá độc lập.",
 ],
});
