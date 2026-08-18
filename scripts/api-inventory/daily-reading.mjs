export const dailyReadingInventoryFile = "scripts/api-inventory/daily-reading.mjs";

function inventoryEntry(input) {
 return input;
}

export const dailyReadingApiInventory = [
 inventoryEntry({
  currentPath: "/api/hanzihome/reader/daily-reading/generate",
  methods: ["POST"],
  source: "route",
  group: "HanziHome Daily Reading",
  exposure: "internal-only",
  v1Path: null,
  internalReason:
   "Browser-session Daily Reading generation uses authenticated AI runtime and local device persistence.",
 }),
 inventoryEntry({
  currentPath: "/api/hanzihome/reader/daily-reading/source",
  methods: ["POST"],
  source: "route",
  group: "HanziHome Daily Reading",
  exposure: "internal-only",
  v1Path: null,
  internalReason:
   "Learner-only source discovery testing is tied to the authenticated Daily Reading browser workflow.",
 }),
];
