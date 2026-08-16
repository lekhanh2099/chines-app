"use client";

import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
/**
 * DraggableBlockPlugin — Playground-style drag handle for block reordering.
 *
 * Shows a ⋮⋮ grip handle and a + button on the left of each block
 * when hovered. The + button opens a block-type menu (Paragraph, H1-H3,
 * Bullet, Numbered, Check, Quote, Code). The grip handle supports
 * native drag-and-drop reordering with a drop indicator line.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
 $getNodeByKey,
 $getNearestNodeFromDOMNode,
 $createParagraphNode,
 type LexicalEditor,
 type NodeKey,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { $createCodeNode } from "@lexical/code";
import {
 INSERT_ORDERED_LIST_COMMAND,
 INSERT_UNORDERED_LIST_COMMAND,
 INSERT_CHECK_LIST_COMMAND,
} from "@lexical/list";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import {
 ArrowDown,
 ArrowUp,
 GripVertical,
 Plus,
 AlignLeft,
 Heading1,
 Heading2,
 Heading3,
 List,
 ListOrdered,
 ListChecks,
 Quote,
 Code,
 Table,
} from "lucide-react";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";

const DRAG_DATA_FORMAT = "application/x-lexical-drag-block";
type NullableHTMLElement = ReturnType<Document["getElementById"]>;

const BLOCK_INSERT_OPTIONS = [
 { key: "paragraph", label: "Paragraph", icon: AlignLeft },
 { key: "h1", label: "Heading 1", icon: Heading1 },
 { key: "h2", label: "Heading 2", icon: Heading2 },
 { key: "h3", label: "Heading 3", icon: Heading3 },
 { key: "bullet", label: "Bullet List", icon: List },
 { key: "number", label: "Numbered List", icon: ListOrdered },
 { key: "check", label: "Check List", icon: ListChecks },
 { key: "quote", label: "Quote", icon: Quote },
 { key: "code", label: "Code Block", icon: Code },
 { key: "table", label: "Table", icon: Table },
];

function getBlockElemFromTarget(target: HTMLElement, editor: LexicalEditor): NullableHTMLElement {
 const root = editor.getRootElement();
 if (!root) return null;
 let elem: NullableHTMLElement = target;
 while (elem && elem !== root) {
  if (elem.parentElement === root) return elem;
  elem = elem.parentElement;
 }
 return null;
}

/**
 * Find the nearest block element by Y-coordinate.
 * Used when mouse is in the container padding (not directly on a block).
 */
function getBlockElemByY(y: number, editor: LexicalEditor): NullableHTMLElement {
 const root = editor.getRootElement();
 if (!root) return null;
 const children = root.children;
 let closest: NullableHTMLElement = null;
 let closestDist = Infinity;
 for (let i = 0; i < children.length; i++) {
  const child = children[i];
  if (!(child instanceof HTMLElement)) continue;
  const rect = child.getBoundingClientRect();
  // Check if y is within the block's vertical range
  if (y >= rect.top && y <= rect.bottom) return child;
  // Otherwise find the closest block
  const dist = Math.min(Math.abs(y - rect.top), Math.abs(y - rect.bottom));
  if (dist < closestDist) {
   closestDist = dist;
   closest = child;
  }
 }
 return closest;
}

function DragBlockMenu({ editor }: { editor: LexicalEditor }) {
 const menuRef = useRef<HTMLDivElement>(null);
 const dropLineRef = useRef<HTMLDivElement>(null);
 const [visible, setVisible] = useState(false);
 const [pos, setPos] = useState({ top: 0, left: 0 });
 const [insertOpen, setInsertOpen] = useState(false);

 // We store the hovered block element directly — no position matching
 const hoveredBlockRef = useRef<HTMLElement>(null);
 const draggedKeyRef = useRef<NodeKey>(null);
 const dropTargetRef = useRef<HTMLElement>(null);

 const showMenu = useCallback(
  (blockElem: HTMLElement) => {
   const root = editor.getRootElement();
   if (!root) return;
   // Position relative to .editor-container (the positioned parent)
   const container = root.closest(".editor-container");
   if (!(container instanceof HTMLElement)) return;
   const containerRect = container.getBoundingClientRect();
   const blockRect = blockElem.getBoundingClientRect();

   hoveredBlockRef.current = blockElem;
   setPos({
    top: blockRect.top - containerRect.top,
    left: 4, // in the left padding of .editor-container
   });
   setVisible(true);
  },
  [editor],
 );

 const hideMenu = useCallback(() => {
  setVisible(false);
  hoveredBlockRef.current = null;
 }, []);

 // Track mouse movement over editor container (includes padding area for handles)
 useEffect(() => {
  const root = editor.getRootElement();
  if (!root) return;
  const container = root.closest(".editor-container");
  if (!(container instanceof HTMLElement)) return;

  const onMouseMove = (e: MouseEvent) => {
   if (!(e.target instanceof HTMLElement)) return;
   const target = e.target;
   // Do not change the active block while interacting with the local controls.
   if (menuRef.current?.contains(target)) return;

   // Try direct DOM ancestry first
   let block = getBlockElemFromTarget(target, editor);
   // Fallback: find nearest block by Y (for when mouse is in padding area)
   if (!block) {
    block = getBlockElemByY(e.clientY, editor);
   }
   if (block) {
    showMenu(block);
   } else if (!insertOpen) {
    hideMenu();
   }
  };

  const onMouseLeave = () => {
   if (!insertOpen) hideMenu();
  };

  container.addEventListener("mousemove", onMouseMove);
  container.addEventListener("mouseleave", onMouseLeave);
  return () => {
   container.removeEventListener("mousemove", onMouseMove);
   container.removeEventListener("mouseleave", onMouseLeave);
  };
 }, [editor, showMenu, hideMenu, insertOpen]);

 // Insert a block of given type before the hovered block
 const handleInsertBlock = useCallback(
  (type: string) => {
   const block = hoveredBlockRef.current;
   if (!block) return;

   if (type === "bullet") {
    // Focus before hovered, then dispatch list command
    editor.update(() => {
     const node = $getNearestNodeFromDOMNode(block);
     if (!node) return;
     const newP = $createParagraphNode();
     node.insertBefore(newP);
     newP.selectEnd();
    });
    // Slight delay to let selection settle, then convert
    setTimeout(() => {
     editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }, 0);
   } else if (type === "number") {
    editor.update(() => {
     const node = $getNearestNodeFromDOMNode(block);
     if (!node) return;
     const newP = $createParagraphNode();
     node.insertBefore(newP);
     newP.selectEnd();
    });
    setTimeout(() => {
     editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }, 0);
   } else if (type === "check") {
    editor.update(() => {
     const node = $getNearestNodeFromDOMNode(block);
     if (!node) return;
     const newP = $createParagraphNode();
     node.insertBefore(newP);
     newP.selectEnd();
    });
    setTimeout(() => {
     editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
    }, 0);
   } else if (type === "table") {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
     columns: "3",
     rows: "3",
     includeHeaders: true,
    });
   } else {
    editor.update(() => {
     const node = $getNearestNodeFromDOMNode(block);
     if (!node) return;

     let newNode;
     if (type === "h1" || type === "h2" || type === "h3") {
      newNode = $createHeadingNode(type);
     } else if (type === "quote") {
      newNode = $createQuoteNode();
     } else if (type === "code") {
      newNode = $createCodeNode();
     } else {
      newNode = $createParagraphNode();
     }

     node.insertBefore(newNode);
     newNode.selectEnd();
    });
   }

   setInsertOpen(false);
  },
  [editor],
 );

 // Drag start: resolve the hovered block to a Lexical node key
 const moveHoveredBlock = useCallback(
  (direction: "up" | "down") => {
   const blockElement = hoveredBlockRef.current;
   if (!blockElement) return;

   editor.update(() => {
    const node = $getNearestNodeFromDOMNode(blockElement);
    if (!node) return;
    const sibling = direction === "up" ? node.getPreviousSibling() : node.getNextSibling();
    if (!sibling) return;
    if (direction === "up") sibling.insertBefore(node);
    else sibling.insertAfter(node);
   });
  },
  [editor],
 );

 const handleDragStart = useCallback(
  (e: React.DragEvent) => {
   const block = hoveredBlockRef.current;
   if (!block) return;

   editor.read(() => {
    const node = $getNearestNodeFromDOMNode(block);
    if (node) draggedKeyRef.current = node.getKey();
   });

   if (!draggedKeyRef.current) return;

   e.dataTransfer.setData(DRAG_DATA_FORMAT, "true");
   e.dataTransfer.effectAllowed = "move";

   // Invisible drag image — must stay in DOM until drag ends
   const ghost = document.createElement("div");
   ghost.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0.01;pointer-events:none";
   document.body.appendChild(ghost);
   e.dataTransfer.setDragImage(ghost, 0, 0);
   const cleanup = () => {
    ghost.remove();
    document.removeEventListener("dragend", cleanup);
   };
   document.addEventListener("dragend", cleanup);
  },
  [editor],
 );

 // Native dragover + drop on the container (more reliable than Lexical commands)
 useEffect(() => {
  const root = editor.getRootElement();
  if (!root) return;
  const container = root.closest(".editor-container");
  if (!(container instanceof HTMLElement)) return;

  const onDragOver = (e: DragEvent) => {
   if (!e.dataTransfer?.types.includes(DRAG_DATA_FORMAT)) return;
   // Capture phase: stop Lexical's internal handlers from interfering
   e.preventDefault();
   e.stopPropagation();
   e.dataTransfer.dropEffect = "move";

   // Find the block under the cursor
   if (!(e.target instanceof HTMLElement)) return;
   const target = e.target;
   let block = getBlockElemFromTarget(target, editor);
   if (!block) block = getBlockElemByY(e.clientY, editor);
   if (block && dropLineRef.current) {
    dropTargetRef.current = block;
    const containerRect = container.getBoundingClientRect();
    const blockRect = block.getBoundingClientRect();
    const midY = blockRect.top + blockRect.height / 2;
    const isBelow = e.clientY > midY;

    dropLineRef.current.style.display = "block";
    dropLineRef.current.style.top = `${(isBelow ? blockRect.bottom : blockRect.top) - containerRect.top}px`;
   }
  };

  const onDrop = (e: DragEvent) => {
   if (!e.dataTransfer?.types.includes(DRAG_DATA_FORMAT)) return;
   e.preventDefault();
   e.stopPropagation();

   const draggedKey = draggedKeyRef.current;
   const target = dropTargetRef.current;
   if (!draggedKey || !target) return;

   const blockRect = target.getBoundingClientRect();
   const midY = blockRect.top + blockRect.height / 2;
   const isBelow = e.clientY > midY;

   editor.update(() => {
    const draggedNode = $getNodeByKey(draggedKey);
    const targetNode = $getNearestNodeFromDOMNode(target);
    if (!draggedNode || !targetNode || draggedNode === targetNode) return;

    draggedNode.remove();
    if (isBelow) {
     targetNode.insertAfter(draggedNode);
    } else {
     targetNode.insertBefore(draggedNode);
    }
   });

   // Cleanup
   draggedKeyRef.current = null;
   dropTargetRef.current = null;
   if (dropLineRef.current) dropLineRef.current.style.display = "none";
  };

  // Use capture phase so our handlers run before Lexical's internal handlers
  container.addEventListener("dragover", onDragOver, true);
  container.addEventListener("drop", onDrop, true);
  return () => {
   container.removeEventListener("dragover", onDragOver, true);
   container.removeEventListener("drop", onDrop, true);
  };
 }, [editor]);

 // Hide drop indicator on drag end
 useEffect(() => {
  const onDragEnd = () => {
   if (dropLineRef.current) dropLineRef.current.style.display = "none";
   draggedKeyRef.current = null;
   dropTargetRef.current = null;
  };
  document.addEventListener("dragend", onDragEnd);
  return () => document.removeEventListener("dragend", onDragEnd);
 }, []);

 if (!editor.getRootElement()) return null;

 return (
  <>
   {/* ── Block Menu (+ button and grip handle) ── */}
   <div
    ref={menuRef}
    className={`draggable-block-menu ${visible ? "visible" : ""}`}
    style={{ top: pos.top, left: pos.left }}
   >
    <DropdownMenu open={insertOpen} onOpenChange={setInsertOpen}>
     <DropdownMenuTrigger asChild>
      <Button
       type="button"
       variant="ghost"
       size="icon-toolbar"
       aria-label="Chèn khối"
       title="Chèn khối"
       onMouseDown={(event) => event.preventDefault()}
      >
       <Plus />
      </Button>
     </DropdownMenuTrigger>
     <DropdownMenuContent align="start" side="right">
      {BLOCK_INSERT_OPTIONS.map((option) => {
       const Icon = option.icon;
       return (
        <DropdownMenuItem key={option.key} onSelect={() => handleInsertBlock(option.key)}>
         <Icon />
         {option.label}
        </DropdownMenuItem>
       );
      })}
     </DropdownMenuContent>
    </DropdownMenu>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     aria-label="Di chuyển khối lên"
     title="Di chuyển khối lên"
     onMouseDown={(event) => event.preventDefault()}
     onClick={() => moveHoveredBlock("up")}
    >
     <ArrowUp />
    </Button>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     aria-label="Di chuyển khối xuống"
     title="Di chuyển khối xuống"
     onMouseDown={(event) => event.preventDefault()}
     onClick={() => moveHoveredBlock("down")}
    >
     <ArrowDown />
    </Button>
    <Button
     type="button"
     variant="ghost"
     size="icon-toolbar"
     draggable
     onDragStart={handleDragStart}
     aria-label="Kéo để sắp xếp khối"
     title="Kéo để sắp xếp khối"
    >
     <GripVertical />
    </Button>
   </div>

   {/* ── Drop Indicator Line ── */}
   <div ref={dropLineRef} className="draggable-block-dropline" style={{ display: "none" }} />
  </>
 );
}

export default function DraggableBlockPlugin() {
 const [editor] = useLexicalComposerContext();
 const isCoarsePointer = useCoarsePointer();
 if (isCoarsePointer) return null;
 return <DragBlockMenu editor={editor} />;
}
