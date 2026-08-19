export const aiRuntimeDailyReadingV2InventoryFile =
 "scripts/api-inventory/ai-runtime-daily-reading-v2.mjs";

function inventoryEntry(input) {
 return input;
}

export const aiRuntimeDailyReadingV2ApiInventory = [
 inventoryEntry({
  currentPath: "/api/ai/runtime",
  methods: ["GET"],
  source: "route",
  group: "AI",
  exposure: "internal-only",
  v1Path: null,
  internalReason:
   "AI runtime readiness exposes authenticated personal-BYOK metadata only inside the signed-in app.",
 }),
 inventoryEntry({
  currentPath: "/api/ai/conversation/stream",
  methods: ["POST"],
  source: "route",
  group: "AI",
  exposure: "internal-only",
  v1Path: null,
  internalReason:
   "Persisted conversation streaming is authenticated, user-BYOK-only, and not exposed to integration keys.",
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/reader/daily-reading/capture",
  methods: ["POST"],
  source: "route",
  group: "HanziHome Daily Reading",
  exposure: "internal-only",
  v1Path: null,
  internalReason:
   "Daily Reading source capture belongs to the authenticated local-first learner workflow.",
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/reader/daily-reading/enrich",
  methods: ["POST"],
  source: "route",
  group: "HanziHome Daily Reading",
  exposure: "internal-only",
  v1Path: null,
  internalReason:
   "Daily Reading enrichment uses authenticated personal BYOK and local article persistence.",
 }),
];
