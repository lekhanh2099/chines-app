import type {
 ListeningRuntimeItem,
 ListeningRuntimeOption,
 ListeningMatchingSide,
} from "./listening.types";

export function splitListeningStress(text: string, stress: ListeningRuntimeOption["stress"]) {
 const markers = (stress ?? [])
  .filter(Boolean)
  .toSorted((left, right) => right.length - left.length);
 if (!markers.length) return [{ text, stressed: false }];
 const pattern = new RegExp(
  `(${markers.map((item) => item.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")).join("|")})`,
  "gu",
 );
 return text.split(pattern).map((part) => ({ text: part, stressed: markers.includes(part) }));
}

export function isListeningBlankCorrect(item: ListeningRuntimeItem, answer: string) {
 return (item.metadata.acceptedAnswers ?? []).includes(answer.trim());
}

export function isListeningChoiceCorrect(item: ListeningRuntimeItem, selection: string) {
 return item.answer?.type === "choice" && selection === item.answer.value;
}

export function isListeningBooleanCorrect(item: ListeningRuntimeItem, selection: string) {
 return item.answer?.type === "boolean" && selection === String(item.answer.value);
}

export function groupListeningShadowingItems(items: ListeningRuntimeItem[]) {
 const grouped = new Map<string, ListeningRuntimeItem[]>();
 for (const item of items) {
  const key = item.metadata.groupId ?? "shadowing";
  const group = grouped.get(key);
  if (group) group.push(item);
  else grouped.set(key, [item]);
 }
 return [...grouped.entries()];
}

export function isListeningMatchingCorrect(
 item: ListeningRuntimeItem,
 assignments: Readonly<Record<ListeningMatchingSide["id"], string>>,
) {
 if (item.answer?.type !== "matching") return false;
 const expected = new Map(item.answer.pairs.map((pair) => [pair.right, pair.left]));
 const right = item.metadata.right ?? [];
 return (
  right.length > 0 &&
  right.every((entry) => expected.has(entry.id) && assignments[entry.id] === expected.get(entry.id))
 );
}
