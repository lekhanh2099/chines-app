/**
 * Ruby Pinyin is selectable on its own. A press that starts on Pinyin switches the
 * page to "Pinyin selection": only Pinyin can be selected and copied, like plain
 * text. A press anywhere else switches back, so selecting Hanzi never includes the
 * pronunciation layer and every Hanzi selection feature works as before.
 */
export const selectablePinyinAttribute = { "data-pinyin-selectable": "" };
const selectablePinyinSelector = "rt[data-pinyin-selectable]";

function modeRoot() {
 return document.documentElement;
}

/** True while the current selection belongs to the Pinyin layer, not the source text. */
export function isPinyinSelectionActive() {
 return typeof document !== "undefined" && modeRoot().dataset.pinyinSelection === "true";
}

function selectedPinyin(selection: Selection) {
 if (selection.isCollapsed || selection.rangeCount === 0) return "";
 const range = selection.getRangeAt(0);
 const lines: string[][] = [];
 const previous: { line: Element | null }[] = [];
 for (const pinyin of document.querySelectorAll<HTMLElement>(selectablePinyinSelector)) {
  if (!range.intersectsNode(pinyin)) continue;
  const part = document.createRange();
  part.selectNodeContents(pinyin);
  if (part.compareBoundaryPoints(Range.START_TO_START, range) < 0) {
   part.setStart(range.startContainer, range.startOffset);
  }
  if (part.compareBoundaryPoints(Range.END_TO_END, range) > 0) {
   part.setEnd(range.endContainer, range.endOffset);
  }
  const text = part.toString().trim();
  if (!text) continue;
  const line = pinyin.closest("p, li, div");
  if (previous.length === 0 || previous[0]?.line !== line) lines.push([]);
  previous[0] = { line };
  lines.at(-1)?.push(text);
 }
 return lines.map((line) => line.join(" ")).join("\n");
}

/** Installs the page-level Pinyin selection behaviour; returns its cleanup. */
export function installPinyinSelection() {
 const handlePointerDown = (event: PointerEvent) => {
  const onPinyin =
   event.target instanceof Element && event.target.closest(selectablePinyinSelector);
  if (onPinyin) modeRoot().dataset.pinyinSelection = "true";
  else delete modeRoot().dataset.pinyinSelection;
 };
 const handleCopy = (event: ClipboardEvent) => {
  if (!isPinyinSelectionActive() || !event.clipboardData) return;
  const selection = document.getSelection();
  const text = selection ? selectedPinyin(selection) : "";
  if (!text) return;
  event.preventDefault();
  event.stopPropagation();
  event.clipboardData.setData("text/plain", text);
 };
 document.addEventListener("pointerdown", handlePointerDown, true);
 document.addEventListener("copy", handleCopy, true);
 return () => {
  document.removeEventListener("pointerdown", handlePointerDown, true);
  document.removeEventListener("copy", handleCopy, true);
  delete modeRoot().dataset.pinyinSelection;
 };
}
