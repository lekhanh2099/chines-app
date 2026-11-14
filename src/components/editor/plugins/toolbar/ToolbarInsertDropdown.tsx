"use client";

import { useState } from "react";
import type { LexicalEditor } from "lexical";
import { INSERT_TABLE_COMMAND } from "@lexical/table";
import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode";
import { ChevronDown, Plus, SeparatorHorizontal, Table } from "lucide-react";

import { Label } from "@/components/ui/forms/label";
import { Button } from "@/components/ui/actions/button";
import {
 Dialog,
 DialogBody,
 DialogContent,
 DialogDescription,
 DialogFooter,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/overlays/dialog";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from "@/components/ui/overlays/dropdown-menu";
import { Input } from "@/components/ui/forms/input";
import { pf } from "./ToolbarControls";

/* ── Insert Table Dialog ── */

function InsertTableDialog({ editor, onClose }: { editor: LexicalEditor; onClose: () => void }) {
 const [rows, setRows] = useState("5");
 const [columns, setColumns] = useState("5");

 const handleConfirm = () => {
  const rowCount = parseInt(rows, 10);
  const columnCount = parseInt(columns, 10);
  if (
   isNaN(rowCount) ||
   isNaN(columnCount) ||
   rowCount < 1 ||
   columnCount < 1 ||
   rowCount > 500 ||
   columnCount > 50
  )
   return;
  editor.dispatchCommand(INSERT_TABLE_COMMAND, {
   columns: String(columnCount),
   rows: String(rowCount),
   includeHeaders: true,
  });
  onClose();
 };

 return (
  <Dialog
   open
   onOpenChange={(open) => {
    if (!open) onClose();
   }}
  >
   <DialogContent size="sm">
    <DialogHeader>
     <DialogTitle>Chèn bảng</DialogTitle>
     <DialogDescription>Chọn số hàng và cột cho bảng mới.</DialogDescription>
    </DialogHeader>
    <DialogBody>
     <Label variant="label" className="grid gap-1.5">
      <span>Số hàng</span>
      <Input
       type="number"
       min={1}
       max={500}
       value={rows}
       onChange={(event) => setRows(event.target.value)}
      />
     </Label>
     <Label variant="label" className="grid gap-1.5">
      <span>Số cột</span>
      <Input
       type="number"
       min={1}
       max={50}
       value={columns}
       onChange={(event) => setColumns(event.target.value)}
       onKeyDown={(event) => {
        if (event.key === "Enter") handleConfirm();
       }}
      />
     </Label>
    </DialogBody>
    <DialogFooter>
     <Button type="button" variant="outline" onClick={onClose}>
      Hủy
     </Button>
     <Button type="button" onClick={handleConfirm}>
      Chèn bảng
     </Button>
    </DialogFooter>
   </DialogContent>
  </Dialog>
 );
}

/* ── + Insert Dropdown ── */

export function InsertDropdown({
 editor,
 isEditable,
}: {
 editor: LexicalEditor;
 isEditable: boolean;
}) {
 const [showTableDialog, setShowTableDialog] = useState(false);

 return (
  <>
   <DropdownMenu>
    <DropdownMenuTrigger asChild>
     <Button
      type="button"
      disabled={!isEditable}
      onMouseDown={pf}
      variant="ghost"
      size="toolbar"
      title="Chèn nội dung"
     >
      <Plus data-icon="inline-start" />
      Chèn
      <ChevronDown data-icon="inline-end" />
     </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
     <DropdownMenuItem
      onSelect={() => editor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)}
     >
      <SeparatorHorizontal />
      Đường phân cách
     </DropdownMenuItem>
     <DropdownMenuItem onSelect={() => setShowTableDialog(true)}>
      <Table />
      Bảng
     </DropdownMenuItem>
    </DropdownMenuContent>
   </DropdownMenu>
   {showTableDialog ? (
    <InsertTableDialog editor={editor} onClose={() => setShowTableDialog(false)} />
   ) : null}
  </>
 );
}
