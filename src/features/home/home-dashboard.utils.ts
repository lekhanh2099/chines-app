import type { UserLearningState } from "@/features/hanzihome/types";
import type { HomeRecentActivityItem } from "@/features/home/types";

const fallbackLabelByType: Record<UserLearningState["reviewHistory"][number]["type"], string> = {
 vocab: "Từ vựng đã ôn",
 grammar: "Điểm ngữ pháp đã ôn",
 radical: "Bộ thủ đã ôn",
};

const kindLabelByType: Record<UserLearningState["reviewHistory"][number]["type"], string> = {
 vocab: "Từ vựng",
 grammar: "Ngữ pháp",
 radical: "Bộ thủ",
};

export function buildHomeRecentActivity(
 reviewHistory: UserLearningState["reviewHistory"],
): HomeRecentActivityItem[] {
 return reviewHistory
  .slice(-4)
  .reverse()
  .map((item, index) => ({
   key: `${item.type}:${item.id}:${item.answeredAt}:${index}`,
   label: item.label?.trim() || fallbackLabelByType[item.type],
   kindLabel: kindLabelByType[item.type],
   result: item.result,
   answeredAt: item.answeredAt,
  }));
}
