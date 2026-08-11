"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SoftDeleteConfirmDialog } from "@/features/hanzihome/editing/components/SoftDeleteConfirmDialog";

type LibraryCrudActionsMenuProps = {
 ariaLabel: string;
 itemType: string;
 itemLabel: string;
 disabled?: boolean;
 canMoveUp?: boolean;
 canMoveDown?: boolean;
 onEdit: () => void;
 onMoveUp: () => void;
 onMoveDown: () => void;
 onDelete: () => Promise<void>;
};

export function LibraryCrudActionsMenu({
 ariaLabel,
 itemType,
 itemLabel,
 disabled = false,
 canMoveUp = true,
 canMoveDown = true,
 onEdit,
 onMoveUp,
 onMoveDown,
 onDelete,
}: LibraryCrudActionsMenuProps) {
 const [deleteOpen, setDeleteOpen] = useState(false);

 return (
  <>
   <DropdownMenu>
    <DropdownMenuTrigger asChild>
     <Button
      type="button"
      variant="ghost"
      size="icon-toolbar"
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
     >
      <MoreHorizontal />
     </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" width="md">
     <DropdownMenuItem onSelect={onEdit}>
      <Pencil />
      Sửa
     </DropdownMenuItem>
     <DropdownMenuItem disabled={!canMoveUp} onSelect={onMoveUp}>
      <ArrowUp />
      Di chuyển lên
     </DropdownMenuItem>
     <DropdownMenuItem disabled={!canMoveDown} onSelect={onMoveDown}>
      <ArrowDown />
      Di chuyển xuống
     </DropdownMenuItem>
     <DropdownMenuSeparator />
     <DropdownMenuItem tone="destructive" onSelect={() => setDeleteOpen(true)}>
      <Trash2 />
      Xóa
     </DropdownMenuItem>
    </DropdownMenuContent>
   </DropdownMenu>

   <SoftDeleteConfirmDialog
    itemType={itemType}
    itemLabel={itemLabel}
    open={deleteOpen}
    onOpenChange={setDeleteOpen}
    onConfirm={onDelete}
   />
  </>
 );
}
