import type { ReviewDeckMode } from "@/features/hanzihome/hooks/useVocabReviewSession";

export const deckModeOptions: Array<{ value: ReviewDeckMode; label: string }> = [
 { value: "all", label: "Tất cả" },
 { value: "vocab", label: "Từ vựng" },
 { value: "grammar", label: "Ngữ pháp" },
 { value: "hard", label: "Còn khó" },
 { value: "due", label: "Đến hạn" },
];
