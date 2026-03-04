/**
 * DraggableBlockPlugin — Playground-style drag handle for block reordering.
 *
 * Shows a ⋮⋮ grip handle and a + button on the left of each block
 * when hovered. The + button opens a block-type menu (Paragraph, H1-H3,
 * Bullet, Numbered, Check, Quote, Code). The grip handle supports
 * native drag-and-drop reordering with a drop indicator line.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
 $getNodeByKey,
 $getNearestNodeFromDOMNode,
 $createParagraphNode,
 type LexicalEditor,
 type NodeKey,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
 $createHeadingNode,
 $createQuoteNode,
 type HeadingTagType,
} from "@lexical/rich-text";
import { $createCodeNode } from "@lexical/code";
import {
 INSERT_ORDERED_LIST_COMMAND,
 INSERT_UNORDERED_LIST_COMMAND,
 INSERT_CHECK_LIST_COMMAND,
} from "@lexical/list";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import {
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

const DRAG_DATA_FORMAT = "application/x-lexical-drag-block";

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
] as const;

function getBlockElemFromTarget(
 target: HTMLElement,
 editor: LexicalEditor,
): HTMLElement | null {
 const root = editor.getRootElement();
 if (!root) return null;
 let elem: HTMLElement | null = target;
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
function getBlockElemByY(y: number, editor: LexicalEditor): HTMLElement | null {
 const root = editor.getRootElement();
 if (!root) return null;
 const children = root.children;
 let closest: HTMLElement | null = null;
 let closestDist = Infinity;
 for (let i = 0; i < children.length; i++) {
  const child = children[i] as HTMLElement;
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
 const blockMenuRef = useRef<HTMLDivElement>(null);
 const [visible, setVisible] = useState(false);
 const [pos, setPos] = useState({ top: 0, left: 0 });
 const [showBlockMenu, setShowBlockMenu] = useState(false);
 const [filterText, setFilterText] = useState("");

 // We store the hovered block element directly — no position matching
 const hoveredBlockRef = useRef<HTMLElement | null>(null);
 const draggedKeyRef = useRef<NodeKey | null>(null);
 const dropTargetRef = useRef<HTMLElement | null>(null);

 const showMenu = useCallback(
  (blockElem: HTMLElement) => {
   const root = editor.getRootElement();
   if (!root) return;
   // Position relative to .editor-container (the positioned parent)
   const container = root.closest(".editor-container") as HTMLElement;
   if (!container) return;
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

 // Close block menu on outside click
 useEffect(() => {
  if (!showBlockMenu) return;
  const close = (e: MouseEvent) => {
   if (
    blockMenuRef.current &&
    !blockMenuRef.current.contains(e.target as Node)
   ) {
    setShowBlockMenu(false);
    setFilterText("");
   }
  };
  document.addEventListener("mousedown", close);
  return () => document.removeEventListener("mousedown", close);
 }, [showBlockMenu]);

 // Track mouse movement over editor container (includes padding area for handles)
 useEffect(() => {
  const root = editor.getRootElement();
  if (!root) return;
  const container = root.closest(".editor-container") as HTMLElement;
  if (!container) return;

  const onMouseMove = (e: MouseEvent) => {
   const target = e.target as HTMLElement;
   // Don't change when hovering the menu itself or blockMenu
   if (menuRef.current?.contains(target)) return;
   if (blockMenuRef.current?.contains(target)) return;

   // Try direct DOM ancestry first
   let block = getBlockElemFromTarget(target, editor);
   // Fallback: find nearest block by Y (for when mouse is in padding area)
   if (!block) {
    block = getBlockElemByY(e.clientY, editor);
   }
   if (block) {
    showMenu(block);
   } else if (!showBlockMenu) {
    hideMenu();
   }
  };

  const onMouseLeave = () => {
   if (!showBlockMenu) hideMenu();
  };

  container.addEventListener("mousemove", onMouseMove);
  container.addEventListener("mouseleave", onMouseLeave);
  return () => {
   container.removeEventListener("mousemove", onMouseMove);
   container.removeEventListener("mouseleave", onMouseLeave);
  };
 }, [editor, showMenu, hideMenu, showBlockMenu]);

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
      newNode = $createHeadingNode(type as HeadingTagType);
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

   setShowBlockMenu(false);
   setFilterText("");
  },
  [editor],
 );

 // Drag start: resolve the hovered block to a Lexical node key
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

   // Invisible drag image
   const ghost = document.createElement("div");
   ghost.style.cssText = "position:absolute;top:-9999px;opacity:0";
   document.body.appendChild(ghost);
   e.dataTransfer.setDragImage(ghost, 0, 0);
   requestAnimationFrame(() => ghost.remove());
  },
  [editor],
 );

 // Native dragover + drop on the container (more reliable than Lexical commands)
 useEffect(() => {
  const root = editor.getRootElement();
  if (!root) return;
  const container = root.closest(".editor-container") as HTMLElement;
  if (!container) return;

  const onDragOver = (e: DragEvent) => {
   if (!e.dataTransfer?.types.includes(DRAG_DATA_FORMAT)) return;
   // Capture phase: stop Lexical's internal handlers from interfering
   e.preventDefault();
   e.stopPropagation();
   e.dataTransfer.dropEffect = "move";

   // Find the block under the cursor
   const target = e.target as HTMLElement;
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

 const filteredOptions = filterText
  ? BLOCK_INSERT_OPTIONS.filter((o) =>
     o.label.toLowerCase().includes(filterText.toLowerCase()),
    )
  : BLOCK_INSERT_OPTIONS;

 return (
  <>
   {/* ── Block Menu (+ button and grip handle) ── */}
   <div
    ref={menuRef}
    className={`draggable-block-menu ${visible ? "visible" : ""}`}
    style={{ top: pos.top, left: pos.left }}
   >
    <button
     type="button"
     className="draggable-block-add"
     onClick={() => {
      setShowBlockMenu(!showBlockMenu);
      setFilterText("");
     }}
     title="Click to add below"
    >
     <Plus className="w-3.5 h-3.5" />
    </button>
    <div
     className="draggable-block-handle"
     draggable
     onDragStart={handleDragStart}
     title="Drag to reorder"
    >
     <GripVertical className="w-3.5 h-3.5" />
    </div>
   </div>

   {/* ── Block Type Insert Menu ── */}
   {showBlockMenu && visible && (
    <div
     ref={blockMenuRef}
     className="draggable-block-insert-menu"
     style={{ top: pos.top + 28, left: pos.left }}
    >
     <input
      type="text"
      className="draggable-block-insert-filter"
      placeholder="Filter blocks..."
      value={filterText}
      onChange={(e) => setFilterText(e.target.value)}
      autoFocus
     />
     <div className="draggable-block-insert-list">
      {filteredOptions.map((opt) => {
       const Icon = opt.icon;
       return (
        <button
         key={opt.key}
         type="button"
         className="draggable-block-insert-item"
         onClick={() => handleInsertBlock(opt.key)}
        >
         <Icon className="w-4 h-4" />
         <span>{opt.label}</span>
        </button>
       );
      })}
      {filteredOptions.length === 0 && (
       <div className="draggable-block-insert-empty">No results</div>
      )}
     </div>
    </div>
   )}

   {/* ── Drop Indicator Line ── */}
   <div
    ref={dropLineRef}
    className="draggable-block-dropline"
    style={{ display: "none" }}
   />
  </>
 );
}

export default function DraggableBlockPlugin() {
 const [editor] = useLexicalComposerContext();
 return <DragBlockMenu editor={editor} />;
}
