export const dictionaryInventoryFile = "scripts/api-inventory/dictionary.mjs";

function inventoryEntry(input) {
 return input;
}

export const dictionaryApiInventory = [
 inventoryEntry({
  currentPath: "/api/dictionary/srs",
  methods: ["POST"],
  source: "route",
  group: "Dictionary",
  exposure: "internal-only",
  v1Path: null,
  internalReason:
   "Authenticated browser save flow is routed through a server-owned canonical dictionary/SRS boundary.",
 }),
];
