export type AiConversationRelationshipBand = "new" | "familiar" | "friends" | "close";

export function deriveAiConversationRelationshipBand(
 score: number | null,
): AiConversationRelationshipBand {
 if (score === null || score < 0.2) return "new";
 if (score < 0.5) return "familiar";
 if (score < 0.8) return "friends";
 return "close";
}
