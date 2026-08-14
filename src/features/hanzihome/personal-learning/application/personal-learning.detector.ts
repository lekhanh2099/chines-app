import {
 errorHypothesisSchema,
 type ErrorHypothesis,
 type KnowledgeNodeId,
} from "../domain/personal-learning.schemas";

type DetectionRule = {
 knowledgeNodeId: KnowledgeNodeId;
 proposedSubtype: string;
 pattern: RegExp;
 explanationVi: string;
 intentQuestionVi: string;
};

const rules: readonly DetectionRule[] = [
 {
  knowledgeNodeId: "de-di-de",
  proposedSubtype: "DE_COMPLEMENT_SUB",
  pattern: /[说写做跑走看听]的(?:很|太|不|特别)/u,
  explanationVi:
   "Chuỗi này có thể đang dùng 的 sai ở vị trí bổ ngữ sau vị ngữ. Tuy vậy, vẫn cần kiểm tra xem đây có phải là cụm có 的 với danh từ trung tâm được lược bỏ hay không.",
  intentQuestionVi: "Bạn muốn đánh giá hành động sau động từ hay đang nói “cái/điều mà…”?",
 },
 {
  knowledgeNodeId: "result-potential",
  proposedSubtype: "RESULT_NEG_BU",
  pattern: /(?:昨天|刚才|最后|终于).*?(?:不听懂|不看懂|不做完|不找到)/u,
  explanationVi:
   "Câu có dấu hiệu kể một sự việc cụ thể nhưng lại dùng dạng phủ định khả năng; cần xác nhận người viết muốn nói kết quả thực tế hay giới hạn khả năng.",
  intentQuestionVi:
   "Bạn đang kể một lần đã thử nhưng không đạt kết quả hay nói rằng trong điều kiện đó vốn không thể đạt?",
 },
 {
  knowledgeNodeId: "aspect",
  proposedSubtype: "ZHE_PROGRESSIVE_SUB",
  pattern: /正在.{0,8}着/u,
  explanationVi:
   "正在 và 着 có thể đang bị dùng lẫn giữa quá trình đang diễn ra và trạng thái đang duy trì; một số ngữ cảnh đặc biệt vẫn có thể chấp nhận nên cần hỏi lại ý định.",
  intentQuestionVi: "Bạn muốn nhấn quá trình đang diễn ra hay trạng thái đang duy trì?",
 },
 {
  knowledgeNodeId: "ba-bei",
  proposedSubtype: "BA_WEAK_PREDICATE",
  pattern: /把[^，。！？]{1,12}(?:看|吃|写|做)(?:[，。！？]|$)/u,
  explanationVi:
   "Phần vị ngữ sau 把 có vẻ chưa nói rõ tân ngữ được xử lý hoặc biến đổi thế nào; một ngữ cảnh đối lập rõ ràng đôi khi vẫn có thể làm câu chấp nhận được.",
  intentQuestionVi:
   "Bạn muốn nhấn kết quả, hướng, vị trí, số lượng hay một thay đổi cụ thể của đối tượng?",
 },
 {
  knowledgeNodeId: "conditionals",
  proposedSubtype: "JIU_CAI_PAIR_MISMATCH",
  pattern: /(?:只要[^，。！？]{1,24}才|只有[^，。！？]{1,24}就)/u,
  explanationVi:
   "Cặp liên từ này thường không phù hợp với mẫu điều kiện cơ bản. Tuy vậy, vẫn cần kiểm tra cách ngắt câu, vai trò của 要, thành phần bị lược và khả năng người viết đang tự sửa giữa câu.",
  intentQuestionVi: "Điều kiện P được xem là điều kiện đủ tối thiểu hay điều kiện bắt buộc?",
 },
];

export function detectPersonalLearningHypotheses(
 attemptId: string,
 text: string,
 createdAt: string,
 createId: () => string,
): ErrorHypothesis[] {
 return rules.flatMap((rule) => {
  const match = rule.pattern.exec(text);
  if (match === null || match.index === undefined) return [];
  return [
   errorHypothesisSchema.parse({
    id: createId(),
    attemptId,
    spanStart: match.index,
    spanEnd: match.index + match[0].length,
    knowledgeNodeId: rule.knowledgeNodeId,
    proposedSubtype: rule.proposedSubtype,
    confidence: 0.62,
    explanationVi: rule.explanationVi,
    intentQuestionVi: rule.intentQuestionVi,
    candidateRevisionIds: [],
    detector: "rule",
    detectorVersion: "conservative-rules-v1.0.0",
    status: "needs-intent",
    createdAt,
   }),
  ];
 });
}
