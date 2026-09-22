import {
 $createParagraphNode,
 $createTextNode,
 $getRoot,
 $isElementNode,
 createEditor,
} from "lexical";
import { describe, expect, it } from "vitest";

import { $isPinyinNode, PinyinNode } from "../nodes/PinyinNode";
import {
 autoDetectPinyinInDocument,
 generatePinyinForChinese,
 removeAllPinyinFromDocument,
} from "./pinyin-editor-actions";

describe("pinyin-editor-actions", () => {
 it("generates correct space-separated pinyin with tone marks for Chinese", () => {
  expect(generatePinyinForChinese("宣布")).toBe("xuān bù");
  expect(generatePinyinForChinese("希望工程")).toBe("xī wàng gōng chéng");
  expect(generatePinyinForChinese("生词解释")).toBe("shēng cí jiě shì");
 });

 it("auto-detects Chinese in document and wraps only Chinese into PinyinNode", () => {
  const editor = createEditor({
   nodes: [PinyinNode],
  });

  editor.update(
   () => {
    const p = $createParagraphNode();
    p.append($createTextNode("1. 宣布 (động từ) - tuyên bố, công bố"));
    $getRoot().append(p);
   },
   { discrete: true },
  );

  // Run auto detect
  const count = autoDetectPinyinInDocument(editor);
  expect(count).toBe(1); // 1 Chinese run "宣布"

  editor.getEditorState().read(() => {
   const p = $getRoot().getFirstChild();
   expect(p).not.toBeNull();
   expect($isElementNode(p)).toBe(true);
   if (!$isElementNode(p)) return;
   const children = p.getChildren();

   // Expected:
   // 1. "1. " (TextNode)
   // 2. "宣布" (PinyinNode with pinyin "xuān bù")
   // 3. " (động từ) - tuyên bố, công bố" (TextNode)
   expect(children.length).toBe(3);

   expect(children[0].getTextContent()).toBe("1. ");
   expect($isPinyinNode(children[0])).toBe(false);

   expect($isPinyinNode(children[1])).toBe(true);
   if ($isPinyinNode(children[1])) {
    expect(children[1].getChinese()).toBe("宣布");
    expect(children[1].getPinyin()).toBe("xuān bù");
   }

   expect(children[2].getTextContent()).toBe(" (động từ) - tuyên bố, công bố");
   expect($isPinyinNode(children[2])).toBe(false);
  });
 });

 it("does not alter pure Vietnamese, English, or numerical paragraphs", () => {
  const editor = createEditor({
   nodes: [PinyinNode],
  });

  const vietnameseText = "Trọng tâm môn Dịch: từ vựng-collocation, cấu trúc câu dài.";

  editor.update(
   () => {
    const p = $createParagraphNode();
    p.append($createTextNode(vietnameseText));
    $getRoot().append(p);
   },
   { discrete: true },
  );

  const count = autoDetectPinyinInDocument(editor);
  expect(count).toBe(0);

  editor.getEditorState().read(() => {
   const p = $getRoot().getFirstChild();
   expect(p?.getTextContent()).toBe(vietnameseText);
   expect($isElementNode(p)).toBe(true);
   if (!$isElementNode(p)) return;
   const children = p.getChildren();
   expect(children.length).toBe(1);
   expect($isPinyinNode(children[0])).toBe(false);
  });
 });

 it("removes all PinyinNodes and restores plain Chinese text", () => {
  const editor = createEditor({
   nodes: [PinyinNode],
  });

  editor.update(
   () => {
    const p = $createParagraphNode();
    p.append($createTextNode("生词: 宣布"));
    $getRoot().append(p);
   },
   { discrete: true },
  );

  // Convert to pinyin
  autoDetectPinyinInDocument(editor);

  // Now remove all
  const removed = removeAllPinyinFromDocument(editor);
  expect(removed).toBe(2); // "生词" and "宣布"

  editor.getEditorState().read(() => {
   const p = $getRoot().getFirstChild();
   expect(p?.getTextContent()).toBe("生词: 宣布");
   expect($isElementNode(p)).toBe(true);
   if (!$isElementNode(p)) return;
   const children = p.getChildren();
   // All nodes should now be plain TextNodes
   for (const child of children) {
    expect($isPinyinNode(child)).toBe(false);
   }
  });
 });
});
