import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const changed = new Set();

function read(relativePath) {
 return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

function write(relativePath, source) {
 const absolutePath = path.join(ROOT, relativePath);
 const current = fs.readFileSync(absolutePath, "utf8");
 if (current === source) return;
 fs.writeFileSync(absolutePath, source);
 changed.add(relativePath);
}

function requireReplace(source, search, replacement, label) {
 if (!source.includes(search)) throw new Error(`Missing cleanup marker: ${label}`);
 return source.replace(search, replacement);
}

function replaceSection(source, startMarker, endMarker, replacement, label) {
 const start = source.indexOf(startMarker);
 const end = source.indexOf(endMarker, start + startMarker.length);
 if (start < 0 || end < 0) throw new Error(`Missing cleanup section: ${label}`);
 return `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

function cleanupDraggableBlockMenu() {
 const file = "src/components/editor/plugins/DraggableBlockPlugin.tsx";
 let source = read(file);

 source = requireReplace(
  source,
  'import { Button } from "@/components/ui/button";\nimport { Input } from "@/components/ui/input";\n',
  'import { Button } from "@/components/ui/button";\nimport {\n DropdownMenu,\n DropdownMenuContent,\n DropdownMenuItem,\n DropdownMenuTrigger,\n} from "@/components/ui/dropdown-menu";\n',
  "dropdown imports",
 );
 source = requireReplace(
  source,
  ' const blockMenuRef = useRef<HTMLDivElement>(null);\n const [visible, setVisible] = useState(false);\n const [pos, setPos] = useState({ top: 0, left: 0 });\n const [showBlockMenu, setShowBlockMenu] = useState(false);\n const [filterText, setFilterText] = useState("");\n',
  ' const [visible, setVisible] = useState(false);\n const [pos, setPos] = useState({ top: 0, left: 0 });\n const [insertOpen, setInsertOpen] = useState(false);\n',
  "insert menu state",
 );

 source = replaceSection(
  source,
  " // Close block menu on outside click\n",
  " // Track mouse movement over editor container (includes padding area for handles)\n",
  "",
  "custom outside-click effect",
 );
 source = source.replace(
  '   // Don\'t change when hovering the menu itself or blockMenu\n   if (menuRef.current?.contains(target)) return;\n   if (blockMenuRef.current?.contains(target)) return;\n',
  '   // Do not change the active block while interacting with the local controls.\n   if (menuRef.current?.contains(target)) return;\n',
 );
 source = source.replace(
  '   } else if (!showBlockMenu) {\n    hideMenu();\n   }',
  '   } else if (!insertOpen) {\n    hideMenu();\n   }',
 );
 source = source.replace(
  '  const onMouseLeave = () => {\n   if (!showBlockMenu) hideMenu();\n  };',
  '  const onMouseLeave = () => {\n   if (!insertOpen) hideMenu();\n  };',
 );
 source = source.replace(
  " }, [editor, showMenu, hideMenu, showBlockMenu]);",
  " }, [editor, showMenu, hideMenu, insertOpen]);",
 );
 source = source.replace(
  '   setShowBlockMenu(false);\n   setFilterText("");\n',
  '   setInsertOpen(false);\n',
 );
 source = source.replace(
  ' const filteredOptions = filterText\n  ? BLOCK_INSERT_OPTIONS.filter((o) => o.label.toLowerCase().includes(filterText.toLowerCase()))\n  : BLOCK_INSERT_OPTIONS;\n\n',
  "",
 );

 const renderStart = `    <Button\n     type="button"\n     variant="ghost"\n     className="draggable-block-add"`;
 const renderEnd = `   {/* ── Drop Indicator Line ── */}`;
 const replacement = `    <DropdownMenu open={insertOpen} onOpenChange={setInsertOpen}>\n     <DropdownMenuTrigger asChild>\n      <Button\n       type="button"\n       variant="ghost"\n       size="icon-toolbar"\n       aria-label="Chèn khối"\n       title="Chèn khối"\n       onMouseDown={(event) => event.preventDefault()}\n      >\n       <Plus />\n      </Button>\n     </DropdownMenuTrigger>\n     <DropdownMenuContent align="start" side="right">\n      {BLOCK_INSERT_OPTIONS.map((option) => {\n       const Icon = option.icon;\n       return (\n        <DropdownMenuItem key={option.key} onSelect={() => handleInsertBlock(option.key)}>\n         <Icon />\n         {option.label}\n        </DropdownMenuItem>\n       );\n      })}\n     </DropdownMenuContent>\n    </DropdownMenu>\n    <Button\n     type="button"\n     variant="ghost"\n     size="icon-toolbar"\n     aria-label="Di chuyển khối lên"\n     title="Di chuyển khối lên"\n     onMouseDown={(event) => event.preventDefault()}\n     onClick={() => moveHoveredBlock("up")}\n    >\n     <ArrowUp />\n    </Button>\n    <Button\n     type="button"\n     variant="ghost"\n     size="icon-toolbar"\n     aria-label="Di chuyển khối xuống"\n     title="Di chuyển khối xuống"\n     onMouseDown={(event) => event.preventDefault()}\n     onClick={() => moveHoveredBlock("down")}\n    >\n     <ArrowDown />\n    </Button>\n    <Button\n     type="button"\n     variant="ghost"\n     size="icon-toolbar"\n     draggable\n     onDragStart={handleDragStart}\n     aria-label="Kéo để sắp xếp khối"\n     title="Kéo để sắp xếp khối"\n    >\n     <GripVertical />\n    </Button>\n   </div>\n\n`;
 source = replaceSection(source, renderStart, renderEnd, replacement, "draggable controls and insert menu");
 write(file, source);
}

function cleanupToolbarSemantics() {
 const file = "src/components/editor/plugins/ToolbarPlugin.tsx";
 let source = read(file);
 source = requireReplace(
  source,
  '   role="toolbar"\n   aria-label="Công cụ định dạng ghi chú"',
  '   role="group"\n   aria-label="Công cụ định dạng ghi chú"',
  "toolbar grouping semantics",
 );
 source = source.replace(
  /\n   \{\/\* <Input[\s\S]*?<\/Input> \*\/\}/u,
  "",
 );
 write(file, source);
}

function tightenRuntimeTargetAudit() {
 const file = "scripts/audit-ui-runtime.mjs";
 let source = read(file);
 const old = `  if (slot === "chip") threshold = coarsePointer ? 44 : 0;\n  else if (size === "compact") threshold = coarsePointer ? 44 : 32;\n  if (size === "menu") threshold = 40;\n  else if (["toolbar", "icon-toolbar", "tab"].includes(size) || element.closest('[role="toolbar"],[role="tablist"]')) threshold = 36;\n  else if (["touch", "sm", "lg", "icon", "icon-sm", "icon-lg", "icon-round"].includes(size)) threshold = 44;`;
 const next = `  if (slot === "chip") threshold = coarsePointer ? 44 : 0;\n  else if (size === "compact") threshold = coarsePointer ? 44 : 32;\n  else if (size === "menu") threshold = 40;\n  else if (["toolbar", "icon-toolbar", "tab"].includes(size) || element.closest('[role="toolbar"],[role="tablist"]')) threshold = 36;\n  else if (["touch", "sm", "lg", "icon", "icon-sm", "icon-lg", "icon-round"].includes(size)) threshold = 44;`;
 source = requireReplace(source, old, next, "target threshold precedence");
 write(file, source);
}

cleanupDraggableBlockMenu();
cleanupToolbarSemantics();
tightenRuntimeTargetAudit();

console.log(`Drag/editor cleanup changed ${changed.size} files:`);
for (const file of [...changed].toSorted()) console.log(`- ${file}`);
