import { useSyncExternalStore } from "react";

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
const profileChangedEvent = "hanzihome:ai-conversation-profile-changed";
let cachedRawValue: string | null | undefined;
let cachedProfile = DEFAULT_AI_CONVERSATION_PROFILE;

function getProfileSnapshot(): AiConversationProfile {
 const storage = getBrowserStorage();
 if (!storage) return DEFAULT_AI_CONVERSATION_PROFILE;

 const rawValue = storage.getItem(profileStorageConfig.key);
 if (rawValue === cachedRawValue) return cachedProfile;

 cachedRawValue = rawValue;
 cachedProfile = readVersionedStorage(storage, profileStorageConfig);
 return cachedProfile;
}

function getProfileServerSnapshot(): AiConversationProfile {
 return DEFAULT_AI_CONVERSATION_PROFILE;
}

function subscribeToProfile(listener: () => void) {
 if (typeof window === "undefined") return () => undefined;

 const handleStorage = (event: StorageEvent) => {
  if (event.key !== profileStorageConfig.key) return;
  cachedRawValue = undefined;
  listener();
 };
 const handleLocalChange = () => listener();
 window.addEventListener("storage", handleStorage);
 window.addEventListener(profileChangedEvent, handleLocalChange);
 return () => {
  window.removeEventListener("storage", handleStorage);
  window.removeEventListener(profileChangedEvent, handleLocalChange);
 };
}

export function useAiConversationProfile(): AiConversationProfile {
 return useSyncExternalStore(subscribeToProfile, getProfileSnapshot, getProfileServerSnapshot);
}

export function saveAiConversationProfile(profile: AiConversationProfile): AiConversationProfile {
 const parsed = aiConversationProfileSchema.parse(profile);
 const storage = getBrowserStorage();
 writeVersionedStorage(storage, profileStorageConfig, parsed);
 cachedProfile = parsed;
 cachedRawValue = storage?.getItem(profileStorageConfig.key);
 if (typeof window !== "undefined") window.dispatchEvent(new Event(profileChangedEvent));
 return parsed;
}
