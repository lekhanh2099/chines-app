import {
 getBrowserStorage,
 readVersionedStorage,
 writeVersionedStorage,
} from "@/lib/versioned-storage";

import {
 aiConversationProfileSchema,
 DEFAULT_AI_CONVERSATION_PROFILE,
 type AiConversationProfile,
} from "./ai-conversation.schemas";

const profileStorageConfig = {
 key: "hanzihome.ai-conversation.profile",
 version: 1,
 schema: aiConversationProfileSchema,
 fallback: DEFAULT_AI_CONVERSATION_PROFILE,
};

export function loadAiConversationProfile(): AiConversationProfile {
 return readVersionedStorage(getBrowserStorage(), profileStorageConfig);
}

export function saveAiConversationProfile(profile: AiConversationProfile): AiConversationProfile {
 const parsed = aiConversationProfileSchema.parse(profile);
 writeVersionedStorage(getBrowserStorage(), profileStorageConfig, parsed);
 return parsed;
}
