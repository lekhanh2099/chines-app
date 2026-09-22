"use client";

import {
 $createTextNode,
 $getRoot,
 $getSelection,
 $isElementNode,
 $isRangeSelection,
 type LexicalEditor,
 type LexicalNode,
} from "lexical";
import { pinyin } from "pinyin-pro";
import { toast } from "sonner";

import { containsChinese } from "@/lib/chinese-utils";
import { $createPinyinNode, $isPinyinNode, type PinyinNode } from "../nodes/PinyinNode";

export const CHINESE_RUN_REGEX = /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+)/g;

/**
 * Generate space-separated pinyin with tone marks for pure Chinese text.
 */
export function generatePinyinForChinese(chinese: string): string {
 return pinyin(chinese, { toneType: "symbol", separator: " " });
}

/**
 * Check if the current selection contains or is inside a PinyinNode.
 */
export function $isSelectionInsidePinyin(): boolean {
 const selection = $getSelection();
 if (!$isRangeSelection(selection)) return false;

 const nodes = selection.getNodes();
 if (nodes.some((node) => $isPinyinNode(node))) return true;

 const anchorNode = selection.anchor.getNode();
 if ($isPinyinNode(anchorNode) || $isPinyinNode(anchorNode.getParent())) return true;

 const focusNode = selection.focus.getNode();
 if ($isPinyinNode(focusNode) || $isPinyinNode(focusNode.getParent())) return true;

 return false;
}

/**
 * Apply or unwrap Pinyin for the current selection in the editor.
 */
export function applyPinyinToSelection(editor: LexicalEditor): void {
 editor.update(() => {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return;

  // Case 1: Selection is inside or covers a PinyinNode → Unwrap back to plain text
  const selectedNodes = selection.getNodes();
  const pinyinNode = selectedNodes.find((node): node is PinyinNode => $isPinyinNode(node));

  if (pinyinNode && pinyinNode.isAttached()) {
   const textNode = $createTextNode(pinyinNode.getChinese());
   pinyinNode.replace(textNode);
   toast.success("Đã gỡ bỏ Pinyin");
   return;
  }

  const anchorNode = selection.anchor.getNode();
  const parentPinyin = $isPinyinNode(anchorNode)
   ? anchorNode
   : $isPinyinNode(anchorNode.getParent())
     ? anchorNode.getParent()
     : null;

  if (parentPinyin && $isPinyinNode(parentPinyin) && parentPinyin.isAttached()) {
   const textNode = $createTextNode(parentPinyin.getChinese());
   parentPinyin.replace(textNode);
   toast.success("Đã gỡ bỏ Pinyin");
   return;
  }

  // Case 2: Selected text contains Chinese → Wrap into PinyinNode
  const text = selection.getTextContent();
  if (!text.trim()) return;

  if (!containsChinese(text)) {
   toast.info("Chỉ áp dụng Pinyin cho chữ Hán (tiếng Trung)");
   return;
  }

  // If selection is pure Chinese, wrap directly
  const parts = text.split(CHINESE_RUN_REGEX).filter(Boolean);
  if (parts.length === 1 && containsChinese(parts[0])) {
   const chinese = parts[0];
   const py = generatePinyinForChinese(chinese);
   selection.removeText();
   selection.insertNodes([$createPinyinNode(chinese, py, false)]);
   toast.success(`Đã gắn Pinyin: ${py}`);
   return;
  }

  // Mixed selection: replace only Chinese parts with PinyinNode
  const nodesToInsert: LexicalNode[] = [];
  for (const part of parts) {
   if (containsChinese(part)) {
    const py = generatePinyinForChinese(part);
    nodesToInsert.push($createPinyinNode(part, py, false));
   } else {
    nodesToInsert.push($createTextNode(part));
   }
  }

  selection.removeText();
  selection.insertNodes(nodesToInsert);
  toast.success("Đã gắn Pinyin cho chữ Hán");
 });
}

/**
 * Scan the entire editor document, find Chinese text runs in TextNodes,
 * and convert them into PinyinNodes while leaving all other languages,
 * numbers, and symbols completely untouched.
 */
export function autoDetectPinyinInDocument(editor: LexicalEditor): number {
 let convertedCount = 0;

 editor.update(
  () => {
   const root = $getRoot();
   const textNodes = root.getAllTextNodes();

   for (const textNode of textNodes) {
    if (!textNode.isAttached()) continue;

    // Skip if already inside a PinyinNode
    const parent = textNode.getParent();
    if (parent && $isPinyinNode(parent)) continue;

    const text = textNode.getTextContent();
    if (!containsChinese(text)) continue;

    const parts = text.split(CHINESE_RUN_REGEX);
    if (parts.length <= 1 && !containsChinese(text)) continue;

    const replacementNodes: LexicalNode[] = [];

    for (const part of parts) {
     if (!part) continue;
     if (containsChinese(part)) {
      const py = generatePinyinForChinese(part);
      replacementNodes.push($createPinyinNode(part, py, false));
      convertedCount++;
     } else {
      const plainTextNode = $createTextNode(part);
      plainTextNode.setFormat(textNode.getFormat());
      plainTextNode.setStyle(textNode.getStyle());
      replacementNodes.push(plainTextNode);
     }
    }

    if (replacementNodes.length > 0) {
     for (const rep of replacementNodes) {
      textNode.insertBefore(rep);
     }
     textNode.remove();
    }
   }
  },
  { discrete: true },
 );

 if (convertedCount > 0) {
  toast.success(`Đã tự động tạo Pinyin cho ${convertedCount} từ tiếng Trung`);
 } else {
  toast.info("Không tìm thấy chữ Hán mới cần gắn Pinyin");
 }

 return convertedCount;
}

/**
 * Toggle global pinyin visibility via CSS class .global-pinyin-hidden on the editor root.
 */
export function toggleGlobalPinyinVisibility(editor: LexicalEditor): boolean {
 const rootElement = editor.getRootElement();
 if (!rootElement) return true;

 const isHidden = rootElement.classList.toggle("global-pinyin-hidden");
 if (isHidden) {
  toast.info("Đã ẩn Pinyin toàn bài");
 } else {
  toast.info("Đã hiện Pinyin toàn bài");
 }
 return !isHidden;
}

/**
 * Remove all PinyinNodes across the entire document, turning them back into plain text.
 */
export function removeAllPinyinFromDocument(editor: LexicalEditor): number {
 let removedCount = 0;

 editor.update(
  () => {
   const root = $getRoot();

   function traverse(node: LexicalNode) {
    const children = $isElementNode(node) ? node.getChildren() : [];
    for (const child of children) {
     if ($isPinyinNode(child) && child.isAttached()) {
      const textNode = $createTextNode(child.getChinese());
      child.replace(textNode);
      removedCount++;
     } else {
      traverse(child);
     }
    }
   }

   traverse(root);
  },
  { discrete: true },
 );

 if (removedCount > 0) {
  toast.success(`Đã gỡ bỏ ${removedCount} từ Pinyin về chữ thường`);
 } else {
  toast.info("Không có từ Pinyin nào trong bài");
 }

 return removedCount;
}
