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

function replaceRequired(source, search, replacement, label) {
 if (!source.includes(search)) throw new Error(`Missing marker: ${label}`);
 return source.replace(search, replacement);
}

function replaceSection(source, startMarker, endMarker, replacement, label) {
 const start = source.indexOf(startMarker);
 const end = source.indexOf(endMarker, start + startMarker.length);
 if (start < 0 || end < 0) throw new Error(`Missing section: ${label}`);
 return `${source.slice(0, start)}${replacement}${source.slice(end)}`;
}

function remediateToolbar() {
 const file = "src/components/editor/plugins/ToolbarPlugin.tsx";
 let source = read(file);

 source = replaceRequired(
  source,
  'import { Button } from "@/components/ui/button";\nimport { Input } from "@/components/ui/input";\n',
  'import { Button } from "@/components/ui/button";\nimport { Card } from "@/components/ui/card";\nimport {\n Dialog,\n DialogBody,\n DialogContent,\n DialogDescription,\n DialogFooter,\n DialogHeader,\n DialogTitle,\n} from "@/components/ui/dialog";\nimport {\n DropdownMenu,\n DropdownMenuContent,\n DropdownMenuItem,\n DropdownMenuRadioGroup,\n DropdownMenuRadioItem,\n DropdownMenuTrigger,\n} from "@/components/ui/dropdown-menu";\nimport { Input } from "@/components/ui/input";\nimport { Separator } from "@/components/ui/separator";\n',
  "toolbar canonical imports",
 );
 source = source.replace(
  'import { Typography } from "@/components/ui/typography";\nimport { useCallback, useEffect, useRef, useState } from "react";',
  'import { useCallback, useEffect, useState } from "react";',
 );
 source = source.replace(/,\n X,\n} from "lucide-react";/u, ',\n} from "lucide-react";');
 source = source.replace(
  'import { FONT_FAMILIES, QUICK_HANZI_FONT_FAMILIES } from "../toolbar-options";',
  'import { FONT_FAMILIES } from "../toolbar-options";',
 );

 const toolbarHelpers = `function ToolbarButton({\n active,\n disabled,\n onClick,\n title,\n children,\n}: {\n active?: boolean;\n disabled?: boolean;\n onClick: () => void;\n title: string;\n children: React.ReactNode;\n}) {\n return (\n  <Button\n   type="button"\n   variant={active ? "active" : "ghost"}\n   size="icon-toolbar"\n   disabled={disabled}\n   onMouseDown={pf}\n   onClick={onClick}\n   title={title}\n   aria-label={title}\n   aria-pressed={active === undefined ? undefined : active}\n  >\n   {children}\n  </Button>\n );\n}\n\nfunction Divider() {\n return <Separator orientation="vertical" />;\n}\n\n`;
 source = replaceSection(
  source,
  "function ToolbarButton({",
  "/* ── Dropdown ── */",
  toolbarHelpers,
  "ToolbarButton helpers",
 );

 const dropdownHelpers = `/* ── Dropdown ── */\n\nfunction Dropdown({\n buttonLabel,\n buttonIcon,\n buttonTitle,\n disabled,\n children,\n}: {\n buttonLabel: string;\n buttonIcon?: React.ReactNode;\n buttonTitle?: string;\n disabled?: boolean;\n children: React.ReactNode;\n}) {\n return (\n  <DropdownMenu>\n   <DropdownMenuTrigger asChild>\n    <Button\n     type="button"\n     disabled={disabled}\n     onMouseDown={pf}\n     variant="ghost"\n     size="toolbar"\n     title={buttonTitle || buttonLabel}\n    >\n     {buttonIcon}\n     <span className="max-w-24 truncate">{buttonLabel}</span>\n     <ChevronDown data-icon="inline-end" />\n    </Button>\n   </DropdownMenuTrigger>\n   <DropdownMenuContent align="start">{children}</DropdownMenuContent>\n  </DropdownMenu>\n );\n}\n\nfunction DropdownItem({\n active,\n onClick,\n children,\n style,\n}: {\n active?: boolean;\n onClick: () => void;\n children: React.ReactNode;\n style?: React.CSSProperties;\n}) {\n return (\n  <DropdownMenuItem tone={active ? "accent" : "default"} onSelect={onClick} style={style}>\n   {children}\n  </DropdownMenuItem>\n );\n}\n\n`;
 source = replaceSection(
  source,
  "/* ── Dropdown ── */",
  "/* ── Font Size Control (Playground-style +/- input) ── */",
  dropdownHelpers,
  "custom dropdown helpers",
 );

 source = source.replace(
  '    variant="ghost"\n    size="compact"\n    className="toolbar-font-size-btn"\n    title="Decrease font size"',
  '    variant="ghost"\n    size="icon-toolbar"\n    aria-label="Giảm cỡ chữ"\n    title="Giảm cỡ chữ"',
 );
 source = source.replace(
  '    variant="ghost"\n    size="compact"\n    className="toolbar-font-size-btn"\n    title="Increase font size"',
  '    variant="ghost"\n    size="icon-toolbar"\n    aria-label="Tăng cỡ chữ"\n    title="Tăng cỡ chữ"',
 );

 const colorPicker = `/* ── Color Picker ── */\n\nfunction ColorPicker({\n colors,\n activeColor,\n onSelect,\n icon,\n label,\n disabled,\n}: {\n colors: { label: string; value: string }[];\n activeColor: string;\n onSelect: (color: string) => void;\n icon: React.ReactNode;\n label: string;\n disabled?: boolean;\n}) {\n return (\n  <DropdownMenu>\n   <DropdownMenuTrigger asChild>\n    <Button\n     type="button"\n     disabled={disabled}\n     onMouseDown={pf}\n     variant="ghost"\n     size="icon-toolbar"\n     title={label}\n     aria-label={label}\n    >\n     <span className="grid gap-0.5">\n      {icon}\n      <span\n       aria-hidden="true"\n       className="h-1 w-4 rounded-full border border-border-default"\n       style={{\n        backgroundColor:\n         activeColor || (label === "Text Color" ? "var(--text-primary)" : "transparent"),\n       }}\n      />\n     </span>\n    </Button>\n   </DropdownMenuTrigger>\n   <DropdownMenuContent align="start">\n    <DropdownMenuRadioGroup value={activeColor} onValueChange={onSelect}>\n     {colors.map((color) => (\n      <DropdownMenuRadioItem key={color.value || "default"} value={color.value}>\n       <span\n        aria-hidden="true"\n        className="size-4 rounded-full border border-border-default"\n        style={{\n         backgroundColor:\n          color.value || (label === "Text Color" ? "var(--text-primary)" : "transparent"),\n        }}\n       />\n       {color.label}\n      </DropdownMenuRadioItem>\n     ))}\n    </DropdownMenuRadioGroup>\n   </DropdownMenuContent>\n  </DropdownMenu>\n );\n}\n\n`;
 source = replaceSection(
  source,
  "/* ── Color Picker ── */",
  "/* ════════════════════════════════════════════════════════\n   Block Format Helpers",
  colorPicker,
  "custom color picker",
 );

 const insertSection = `/* ── Insert Table Dialog ── */\n\nfunction InsertTableDialog({ editor, onClose }: { editor: LexicalEditor; onClose: () => void }) {\n const [rows, setRows] = useState("5");\n const [columns, setColumns] = useState("5");\n\n const handleConfirm = () => {\n  const rowCount = parseInt(rows, 10);\n  const columnCount = parseInt(columns, 10);\n  if (\n   isNaN(rowCount) ||\n   isNaN(columnCount) ||\n   rowCount < 1 ||\n   columnCount < 1 ||\n   rowCount > 500 ||\n   columnCount > 50\n  )\n   return;\n  editor.dispatchCommand(INSERT_TABLE_COMMAND, {\n   columns: String(columnCount),\n   rows: String(rowCount),\n   includeHeaders: true,\n  });\n  onClose();\n };\n\n return (\n  <Dialog\n   open\n   onOpenChange={(open) => {\n    if (!open) onClose();\n   }}\n  >\n   <DialogContent size="sm">\n    <DialogHeader>\n     <DialogTitle>Chèn bảng</DialogTitle>\n     <DialogDescription>Chọn số hàng và cột cho bảng mới.</DialogDescription>\n    </DialogHeader>\n    <DialogBody>\n     <Label variant="label" className="grid gap-1.5">\n      <span>Số hàng</span>\n      <Input\n       type="number"\n       min={1}\n       max={500}\n       value={rows}\n       onChange={(event) => setRows(event.target.value)}\n      />\n     </Label>\n     <Label variant="label" className="grid gap-1.5">\n      <span>Số cột</span>\n      <Input\n       type="number"\n       min={1}\n       max={50}\n       value={columns}\n       onChange={(event) => setColumns(event.target.value)}\n       onKeyDown={(event) => {\n        if (event.key === "Enter") handleConfirm();\n       }}\n      />\n     </Label>\n    </DialogBody>\n    <DialogFooter>\n     <Button type="button" variant="outline" onClick={onClose}>\n      Hủy\n     </Button>\n     <Button type="button" onClick={handleConfirm}>\n      Chèn bảng\n     </Button>\n    </DialogFooter>\n   </DialogContent>\n  </Dialog>\n );\n}\n\n/* ── + Insert Dropdown ── */\n\nfunction InsertDropdown({ editor, isEditable }: { editor: LexicalEditor; isEditable: boolean }) {\n const [showTableDialog, setShowTableDialog] = useState(false);\n\n return (\n  <>\n   <DropdownMenu>\n    <DropdownMenuTrigger asChild>\n     <Button\n      type="button"\n      disabled={!isEditable}\n      onMouseDown={pf}\n      variant="ghost"\n      size="toolbar"\n      title="Chèn nội dung"\n     >\n      <Plus data-icon="inline-start" />\n      Chèn\n      <ChevronDown data-icon="inline-end" />\n     </Button>\n    </DropdownMenuTrigger>\n    <DropdownMenuContent align="start">\n     <DropdownMenuItem\n      onSelect={() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)}\n     >\n      <SeparatorHorizontal />\n      Đường phân cách\n     </DropdownMenuItem>\n     <DropdownMenuItem onSelect={() => setShowTableDialog(true)}>\n      <Table />\n      Bảng\n     </DropdownMenuItem>\n    </DropdownMenuContent>\n   </DropdownMenu>\n   {showTableDialog ? (\n    <InsertTableDialog editor={editor} onClose={() => setShowTableDialog(false)} />\n   ) : null}\n  </>\n );\n}\n\n`;
 source = replaceSection(
  source,
  "/* ── Insert Table Dialog (Playground-style) ── */",
  "/* ════════════════════════════════════════════════════════\n   Main Plugin",
  insertSection,
  "custom insert dialog and dropdown",
 );

 const quickFontsStart = '    <div className="grid grid-cols-3 gap-1 border-b border-border-default p-1">';
 const quickFontsEnd = "    {FONT_FAMILIES.map(([value, label]) => (";
 const quickStartIndex = source.indexOf(quickFontsStart);
 const quickEndIndex = source.indexOf(quickFontsEnd, quickStartIndex);
 if (quickStartIndex < 0 || quickEndIndex < 0) throw new Error("Missing quick font grid");
 source = `${source.slice(0, quickStartIndex)}${source.slice(quickEndIndex)}`;

 source = source.replaceAll(' className="w-4 h-4"', "");
 source = source.replaceAll(' className="w-3 h-3"', "");
 source = source.replaceAll(' className="w-3.5 h-3.5"', "");
 source = source.replaceAll(' className="size-4 shrink-0"', "");

 source = replaceRequired(
  source,
  '  <div className="toolbar" onMouseDown={pf}>',
  '  <Card\n   role="toolbar"\n   aria-label="Công cụ định dạng ghi chú"\n   variant="section"\n   padding="sm"\n   className="flex flex-nowrap items-center gap-1 overflow-x-auto md:flex-wrap"\n   onMouseDown={pf}\n  >',
  "toolbar root",
 );
 const closingIndex = source.lastIndexOf("  </div>\n );\n}");
 if (closingIndex < 0) throw new Error("Missing toolbar closing root");
 source = `${source.slice(0, closingIndex)}  </Card>\n );\n}${source.slice(closingIndex + "  </div>\n );\n}".length)}`;

 write(file, source);
}

function addDragAlternatives() {
 const file = "src/components/editor/plugins/DraggableBlockPlugin.tsx";
 let source = read(file);
 source = source.replace(
  " AlignLeft,\n GripVertical,",
  " AlignLeft,\n ArrowDown,\n ArrowUp,\n GripVertical,",
 );
 const dragStartMarker = " const handleDragStart = useCallback(";
 const dragStartIndex = source.indexOf(dragStartMarker);
 if (dragStartIndex < 0) throw new Error("Missing draggable block drag start marker");
 const moveHelper = ` const moveHoveredBlock = useCallback(\n  (direction: "up" | "down") => {\n   const blockElement = hoveredBlockRef.current;\n   if (!blockElement) return;\n\n   editor.update(() => {\n    const node = $getNearestNodeFromDOMNode(blockElement);\n    if (!node) return;\n    const sibling = direction === "up" ? node.getPreviousSibling() : node.getNextSibling();\n    if (!sibling) return;\n    if (direction === "up") sibling.insertBefore(node);\n    else sibling.insertAfter(node);\n   });\n  },\n  [editor],\n );\n\n`;
 source = `${source.slice(0, dragStartIndex)}${moveHelper}${source.slice(dragStartIndex)}`;

 const handleMarker = `    <div\n     className="draggable-block-handle"`;
 const handleIndex = source.indexOf(handleMarker);
 if (handleIndex < 0) throw new Error("Missing draggable block handle");
 const alternatives = `    <Button\n     type="button"\n     variant="ghost"\n     size="icon-toolbar"\n     aria-label="Di chuyển khối lên"\n     title="Di chuyển khối lên"\n     onMouseDown={(event) => event.preventDefault()}\n     onClick={() => moveHoveredBlock("up")}\n    >\n     <ArrowUp />\n    </Button>\n    <Button\n     type="button"\n     variant="ghost"\n     size="icon-toolbar"\n     aria-label="Di chuyển khối xuống"\n     title="Di chuyển khối xuống"\n     onMouseDown={(event) => event.preventDefault()}\n     onClick={() => moveHoveredBlock("down")}\n    >\n     <ArrowDown />\n    </Button>\n`;
 source = `${source.slice(0, handleIndex)}${alternatives}${source.slice(handleIndex)}`;
 write(file, source);
}

function improveRuntimeTouchAudit() {
 const file = "scripts/audit-ui-runtime.mjs";
 let source = read(file);
 const metricsMarker = ` await client.send("Emulation.setDeviceMetricsOverride", {\n  width: viewport.width,\n  height: viewport.height,\n  deviceScaleFactor: 1,\n  mobile: viewport.width <= 820,\n  screenWidth: viewport.width,\n  screenHeight: viewport.height,\n });`;
 source = replaceRequired(
  source,
  metricsMarker,
  `${metricsMarker}\n await client.send("Emulation.setTouchEmulationEnabled", {\n  enabled: viewport.width <= 820,\n  maxTouchPoints: viewport.width <= 820 ? 5 : 1,\n });`,
  "touch emulation",
 );
 const targetStart = ` const targetFailures = interactive.flatMap((element) => {\n  if (element.getAttribute("data-slot") !== "button") return [];\n  const size = element.getAttribute("data-size") || "";\n  let threshold = 0;`;
 const targetReplacement = ` const targetFailures = interactive.flatMap((element) => {\n  const slot = element.getAttribute("data-slot") || "";\n  if (slot !== "button" && slot !== "chip") return [];\n  const size = element.getAttribute("data-size") || "";\n  const coarsePointer = matchMedia("(pointer: coarse)").matches;\n  let threshold = 0;\n  if (slot === "chip") threshold = coarsePointer ? 44 : 0;\n  else if (size === "compact") threshold = coarsePointer ? 44 : 32;`;
 source = replaceRequired(source, targetStart, targetReplacement, "runtime compact/chip targets");
 write(file, source);
}

remediateToolbar();
addDragAlternatives();
improveRuntimeTouchAudit();

console.log(`Editor/UI follow-up changed ${changed.size} files:`);
for (const file of [...changed].toSorted()) console.log(`- ${file}`);
