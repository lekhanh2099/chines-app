import { $createParagraphNode, $createTextNode, $getRoot, createEditor } from "lexical";
import { $createListItemNode, $createListNode, ListItemNode, ListNode } from "@lexical/list";
import {
 $createTableNodeWithDimensions,
 TableCellNode,
 TableNode,
 TableRowNode,
} from "@lexical/table";
import { describe, expect, it } from "vitest";

import { JsonObjectSchema } from "@/types/json";

describe("Lexical JSON persistence", () => {
 it("accepts optional fields emitted by registered Lexical nodes", () => {
  const editor = createEditor({
   nodes: [ListNode, ListItemNode, TableNode, TableRowNode, TableCellNode],
  });

  editor.update(
   () => {
    const listItem = $createListItemNode();
    listItem.append($createParagraphNode().append($createTextNode("Nội dung")));
    $getRoot().append(
     $createListNode("bullet").append(listItem),
     $createTableNodeWithDimensions(1, 1, false),
    );
   },
   { discrete: true },
  );

  const serializedEditorState = editor.getEditorState().toJSON();

  expect(JsonObjectSchema.safeParse(serializedEditorState).success).toBe(true);
 });
});
